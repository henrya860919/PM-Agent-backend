// src/middleware/auth.ts
// 暫時的簡化認證中間件，未來需要實作完整的認證系統
import { env } from '@/_env';
import { NextFunction, Request, Response } from 'express';

// 暫時的 UserContext 類型
export type UserContext = {
  id: string;
};

// 開發環境預設測試使用者 UUID
const DEFAULT_DEV_USER_ID = '00000000-0000-0000-0000-000000000001';

// 暫時的認證中間件（用於開發測試）
// TODO: 實作完整的認證系統
export const requireAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // 暫時從 header 取得 user id（用於開發測試）
  // 未來應該從 session 或 JWT token 取得
  let userId = req.headers['x-user-id'] as string;

  // 開發環境：如果沒有提供 user id，使用預設測試使用者
  if (!userId && env.NODE_ENV === 'development') {
    userId = DEFAULT_DEV_USER_ID;
    console.log('⚠️  開發模式：使用預設測試使用者', userId);
  }

  // 生產環境：必須提供 user id
  if (!userId) {
    // 在開發環境下，如果還是沒有，使用預設值
    if (env.NODE_ENV === 'development') {
      userId = DEFAULT_DEV_USER_ID;
    } else {
      // 生產環境才拋出錯誤
      throw new Error('請提供 x-user-id header 或實作完整的認證系統');
    }
  }

  // 將 user context 附加到 request
  (req as any).user = {
    id: userId,
  } as UserContext;

  next();
};
