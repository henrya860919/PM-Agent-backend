// src/middleware/errorHandler.ts
import { AppError } from '@/shared/types/errors.type';
import { NextFunction, Request, Response } from 'express';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // 如果是 AppError，使用其 statusCode 和 errorCode
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        message: err.message,
        code: err.errorCode,
      },
    });
    return;
  }

  // 如果是 Zod 驗證錯誤
  if (err.name === 'ZodError') {
    res.status(400).json({
      error: {
        message: '驗證錯誤',
        code: 'VALIDATION_ERROR',
        details: (err as any).errors,
      },
    });
    return;
  }

  // 其他錯誤
  console.error('Unhandled error:', err);
  console.error('Error stack:', err.stack);
  res.status(500).json({
    error: {
      message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
      code: 'INTERNAL_SERVER_ERROR',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};
