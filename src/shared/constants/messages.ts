// src/shared/constants/messages.ts

/**
 * 統一的錯誤訊息常量
 */
export const ERROR_MESSAGES = {
  // 使用者相關
  USER_NOT_FOUND: '使用者不存在',
  USER_ALREADY_EXISTS: '帳號已存在',
  MISSING_USER_INFO: '缺少使用者資訊',

  // 認證相關
  INVALID_CREDENTIALS: '帳號或密碼錯誤',
  UNAUTHORIZED: '未授權',
} as const;
