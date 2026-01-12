import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: any;
}

export interface TokenPayload {
  userId: string;
  iat?: number;
  exp?: number;
}
