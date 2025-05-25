import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Внутренняя ошибка сервера';

  // Zod validation errors
  if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Ошибка валидации данных';
    return res.status(statusCode).json({
      success: false,
      error: message,
      details: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
    });
  }

  // Prisma errors
  if (err.message.includes('Unique constraint')) {
    statusCode = 409;
    message = 'Данные уже существуют';
  }

  if (err.message.includes('Record to update not found')) {
    statusCode = 404;
    message = 'Запись не найдена';
  }

  // JWT errors
  if (err.message.includes('jwt')) {
    statusCode = 401;
    message = 'Недействительный токен';
  }

  // Log errors in development
  if (process.env.NODE_ENV === 'development') {
    console.error(`❌ Error ${statusCode}: ${message}`);
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export const createError = (message: string, statusCode: number = 500): ApiError => {
  const error: ApiError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
}; 