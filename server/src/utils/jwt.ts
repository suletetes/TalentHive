import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongoose';

interface TokenPayload {
  userId: ObjectId;
  email: string;
  role: string;
}

export const generateTokens = (payload: TokenPayload) => {
  const accessToken = jwt.sign(
    payload,
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRE || '15m' }
  );

  const refreshToken = jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );

  return { accessToken, refreshToken };
};

export const verifyToken = (token: string, isRefresh = false): TokenPayload => {
  const secret = isRefresh ? process.env.JWT_REFRESH_SECRET! : process.env.JWT_SECRET!;
  return jwt.verify(token, secret) as TokenPayload;
};

export const decodeToken = (token: string) => {
  return jwt.decode(token);
};