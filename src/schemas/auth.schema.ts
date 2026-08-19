import z from 'zod';
import { registry } from '../docs/openapi.registry.js';

export const RuoloEnum = z.enum(['ADMIN', 'USER']).openapi({
  description: "Ruolo dell'utente nel sistema",
  example: 'USER',
});
export type Ruolo = z.infer<typeof RuoloEnum>;

export const registerBodySchema = registry.register(
  'Auth',
  z.object({
    email: z.string().email('Email non valida').openapi({ example: 'mario.rossi@example.com' }),
    password: z
      .string()
      .min(8, 'La password deve contenere almeno 8 caratteri')
      .openapi({ example: 'PasswordSegreta123!' }),
    nome: z.string().min(1, 'Il nome è obbligatorio').openapi({ example: 'Mario' }),
    cognome: z.string().min(1, 'Il cognome è obbligatorio').openapi({ example: 'Rossi' }),
    ruolo: z.enum(['ADMIN', 'USER']).optional().default('USER'),
  }),
);

export const loginBodySchema = z.object({
  email: z.string().email('Email non valida').openapi({ example: 'alessio.petrosino@example.com' }),
  password: z
    .string()
    .min(8, 'La password deve contenere almeno 8 caratteri')
    .openapi({ example: 'password' }),
});

export const registerSchema = z.object({
  body: registerBodySchema,
});

export const loginSchema = z.object({
  body: loginBodySchema,
});

export type RegisterInput = z.infer<typeof registerBodySchema>;
export type LoginInput = z.infer<typeof loginBodySchema>;
