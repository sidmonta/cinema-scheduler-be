import { registerBodySchema, loginBodySchema } from '../schemas/auth.schema.js';
import type { AuthService } from '../services/auth.service.js';
import type { Request, Response } from 'express';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register = async (req: Request, res: Response): Promise<Response> => {
    const parseResult = registerBodySchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, errors: parseResult.error.format() });
    }

    const result = await this.authService.register(parseResult.data);
    if (!result.success) {
      return res
        .status(result.error.statusCode)
        .json({ success: false, message: result.error.message });
    }

    return res.status(201).json({ success: true, data: result.data });
  };

  login = async (req: Request, res: Response): Promise<Response> => {
    const parseResult = loginBodySchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ success: false, errors: parseResult.error.format() });
    }

    const result = await this.authService.login(parseResult.data);
    if (!result.success) {
      return res
        .status(result.error.statusCode)
        .json({ success: false, message: result.error.message });
    }

    return res.status(200).json({ success: true, data: result.data });
  };
}
