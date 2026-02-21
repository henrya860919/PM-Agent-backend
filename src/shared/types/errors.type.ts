// src/shared/types/errors.type.ts
// 基礎 AppError 類別
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode?: string;

  constructor(message: string, statusCode: number = 500, errorCode?: string) {
    super(message);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;

    // 確保 stack trace 正確
    Error.captureStackTrace(this, this.constructor);
  }
}

// 400 - 驗證錯誤
export class ValidationError extends AppError {
  constructor(message: string, errorCode?: string) {
    super(message, 400, errorCode || 'VALIDATION_ERROR');
  }
}

// 401 - 未授權
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', errorCode: string = 'UNAUTHORIZED') {
    super(message, 401, errorCode);
  }
}

// 403 - 禁止存取
export class ForbiddenError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
  }
}

// 404 - 資源不存在
export class NotFoundError extends AppError {
  constructor(message: string, resourceType?: string) {
    const errorCode = resourceType ? `${resourceType.toUpperCase()}_NOT_FOUND` : 'NOT_FOUND';
    super(message, 404, errorCode);
  }
}

// 409 - 衝突錯誤
export class ConflictError extends AppError {
  constructor(message: string, conflictType?: string) {
    const errorCode = conflictType ? `${conflictType.toUpperCase()}_CONFLICT` : 'CONFLICT';
    super(message, 409, errorCode);
  }
}

// 422 - 資料處理錯誤
export class UnprocessableEntityError extends AppError {
  constructor(message: string) {
    super(message, 422, 'UNPROCESSABLE_ENTITY');
  }
}

// 429 - 請求過於頻繁
export class TooManyRequestsError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'TOO_MANY_REQUESTS');
  }
}

// 500 - 內部伺服器錯誤
export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(message, 500, 'INTERNAL_SERVER_ERROR');
  }
}

// 503 - 服務不可用
export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service temporarily unavailable') {
    super(message, 503, 'SERVICE_UNAVAILABLE');
  }
}

// 特定業務錯誤
export class EmailAlreadyExistsError extends ConflictError {
  constructor(email: string) {
    super(`Email '${email}' is already in use`, 'EMAIL');
  }
}
export class UsernameAlreadyExistsError extends ConflictError {
  constructor(username: string) {
    super(`Username '${username}' is already in use`, 'USERNAME');
  }
}

export class InvalidCredentialsError extends UnauthorizedError {
  constructor(message: string = 'Invalid credentials') {
    super(message, 'INVALID_CREDENTIALS');
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, errorCode?: string) {
    super(message, 400, errorCode || 'BAD_REQUEST');
  }
}
