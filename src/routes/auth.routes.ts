import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { AuthRepository } from '../repositories/auth.repository.js';
import { AuthService } from '../services/auth.service.js';
import { validate } from '../middlewares/validate.middleware.js';
import { loginSchema, registerSchema } from '../schemas/auth.schema.js';

const authRepository = new AuthRepository();
const authService = new AuthService(authRepository);
const authController = new AuthController(authService);

const router = Router();

router.post('/login', validate(loginSchema), authController.login);
router.post('/register', validate(registerSchema), authController.register);

export default router;
