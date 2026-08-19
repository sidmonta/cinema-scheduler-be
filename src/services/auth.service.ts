import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppError, ConflictError, UnauthorizedError } from '../config/app-error.js';
import { err, ok, type Result } from '../config/result.type.js';
import type { AuthRepository } from '../repositories/auth.repository.js';
import type { LoginInput, RegisterInput } from '../schemas/auth.schema.js';

// Estraiamo il tipo effettivo restituito dal repository (senza password)
export type UserResponse = Omit<Awaited<ReturnType<AuthRepository['create']>>, 'password'>;

export interface LoginResponse {
  accessToken: string;
  user: UserResponse;
}

const JWT_SECRET = process.env.JWT_SECRET || 'secrettokenjwt';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ? Number(process.env.JWT_EXPIRES_IN) : 3600;
const SALT_ROUNDS = 10;

export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}

  async register(input: RegisterInput): Promise<Result<UserResponse, AppError>> {
    const utenteEsistente = await this.authRepository.findByEmail(input.email);
    if (utenteEsistente) {
      return err(new ConflictError('Email già registrata.'));
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    const nuovoUtente = await this.authRepository.create({
      email: input.email,
      password: passwordHash,
      nome: input.nome,
      cognome: input.cognome,
      ruolo: input.ruolo,
    });

    const { password: _password, ...utenteSenzaPassword } = nuovoUtente;
    return ok(utenteSenzaPassword);
  }

  async login(input: LoginInput): Promise<Result<LoginResponse, AppError>> {
    const utente = await this.authRepository.findByEmail(input.email);
    if (!utente || utente.eliminata) {
      return err(new UnauthorizedError('Credenziali non valide.'));
    }

    const passwordValida = await bcrypt.compare(input.password, utente.password);
    if (!passwordValida) {
      return err(new UnauthorizedError('Credenziali non valide.'));
    }

    const accessToken = jwt.sign(
      {
        sub: utente.id,
        email: utente.email,
        ruolo: utente.ruolo,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
    );

    const { password: _password, ...utenteSenzaPassword } = utente;

    return ok({
      accessToken,
      user: utenteSenzaPassword,
    });
  }
}
