import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';

const prisma = new PrismaClient();
export const authRouter = Router();

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).optional(),
});

function setRefreshCookie(res: any, token: string) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: 24 * 60 * 60 * 1000,
    path: '/api/auth/refresh'
  });
}

authRouter.post('/register', async (req, res) => {
  const parse = credentialsSchema.safeParse(req.body);
  if (!parse.success || !parse.data.name) {
    return res.status(400).json({ message: 'Invalid data' });
  }
  const { email, password, name } = parse.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ message: 'Email already registered' });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, name, passwordHash, role: 'developer' },
  });
  const payload = { sub: user.id, email: user.email, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  setRefreshCookie(res, refreshToken);
  return res.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role, level: user.level, points: user.points },
    accessToken,
  });
});

authRouter.post('/login', async (req, res) => {
  const parse = credentialsSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: 'Invalid data' });
  }
  const { email, password } = parse.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ message: 'Invalid credentials' });
  const payload = { sub: user.id, email: user.email, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  setRefreshCookie(res, refreshToken);
  return res.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role, level: user.level, points: user.points },
    accessToken,
  });
});

authRouter.post('/refresh', async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!token) return res.status(401).json({ message: 'Missing refresh token' });
  try {
    const payload = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return res.status(401).json({ message: 'Invalid token' });
    const newAccess = signAccessToken({ sub: user.id, email: user.email, role: user.role });
    const newRefresh = signRefreshToken({ sub: user.id, email: user.email, role: user.role });
    setRefreshCookie(res, newRefresh);
    return res.json({ accessToken: newAccess });
  } catch (e) {
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
});

authRouter.post('/logout', (req, res) => {
  res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
  return res.json({ ok: true });
});

