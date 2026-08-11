import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ConflictError, UnauthorizedError } from '../config/app-error.js';
import { err, ok } from '../config/result.type.js';
import type { AuthRepository } from '../repositories/auth.repository.js';
import type { RegisterInput, LoginInput } from '../schemas/auth.schema.js';

const JWT_SECRET = process.env.JWT_SECRET || 'secrettokenjwt';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ? Number(process.env.JWT_EXPIRES_IN) : 3600;
const SALT_ROUNDS = 10;
export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}

  async register(input: RegisterInput) {
    // 1. Verifichiamo se l'email esiste già
    const utenteEsistente = await this.authRepository.findByEmail(input.email);
    if (utenteEsistente) {
      return err(new ConflictError('Email già registrata.'));
    }

    // 2. Hash della password
    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    // 3. Creazione utente su DB
    const nuovoUtente = await this.authRepository.create({
      email: input.email,
      password: passwordHash,
      nome: input.nome,
      cognome: input.cognome,
      ruolo: input.ruolo,
    });

    // 4. Omettiamo la password prima di restituire i dati
    const { password: _password, ...utenteSenzaPassword } = nuovoUtente;
    return ok(utenteSenzaPassword);
  }

  async login(input: LoginInput) {
    // 1. Verifica esistenza utente
    const utente = await this.authRepository.findByEmail(input.email);
    if (!utente || utente.eliminata) {
      return err(new UnauthorizedError('Credenziali non valide.'));
    }

    // 2. Verifica hash password
    const passwordValida = await bcrypt.compare(input.password, utente.password);
    if (!passwordValida) {
      return err(new UnauthorizedError('Credenziali non valide.'));
    }

    // 3. Generazione Token JWT
    const accessToken = jwt.sign(
      {
        sub: utente.id,
        email: utente.email,
        ruolo: utente.ruolo,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
    );

    return ok({
      accessToken,
      user: {
        id: utente.id,
        email: utente.email,
        nome: utente.nome,
        cognome: utente.cognome,
        ruolo: utente.ruolo,
      },
    });
  }
}
