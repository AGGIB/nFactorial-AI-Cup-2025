import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../index';
import { generateToken } from '../utils/jwt';
import { registerSchema, loginSchema } from '../utils/validation';
import { createError } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name } = registerSchema.parse(req.body);

    // Проверяем, существует ли пользователь
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw createError('Пользователь с таким email уже существует', 409);
    }

    // Хешируем пароль
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Создаем пользователя
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    });

    // Генерируем токен
    const token = generateToken({ id: user.id, email: user.email });

    res.status(201).json({
      success: true,
      message: 'Пользователь успешно зарегистрирован',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Находим пользователя
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw createError('Неверный email или пароль', 401);
    }

    // Проверяем пароль
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw createError('Неверный email или пароль', 401);
    }

    // Генерируем токен
    const token = generateToken({ id: user.id, email: user.email });

    res.json({
      success: true,
      message: 'Успешный вход в систему',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        agents: {
          select: {
            id: true,
            name: true,
            isActive: true,
            createdAt: true
          }
        }
      }
    });

    if (!user) {
      throw createError('Пользователь не найден', 404);
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
});

export default router; 