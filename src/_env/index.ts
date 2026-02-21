// src/_env/index.ts
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ quiet: true });

const envSchema = z.object({
  // ================================
  // 🏗️ 應用基礎設定
  // ================================
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development')
    .describe('應用執行環境'),
  PORT: z.coerce
    .number()
    .min(1, 'Port must be at least 1')
    .max(65535, 'Port must be at most 65535')
    .default(3000)
    .describe('應用監聽 Port'),
  HOST: z
    .string()
    .refine(
      (val) => {
        // 允许 0.0.0.0 或有效的 IP 地址
        if (val === '0.0.0.0' || val === 'localhost') return true;
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!ipRegex.test(val)) return false;
        const parts = val.split('.').map(Number);
        return parts.every((part) => part >= 0 && part <= 255);
      },
      { message: 'HOST must be a valid IP address or 0.0.0.0' },
    )
    .default('0.0.0.0')
    .describe('應用監聽 Host'),

  // ================================
  // 🌐 CORS 設定
  // ================================
  CORS_ORIGIN: z
    .string()
    .default('http://localhost:5173')
    .describe('CORS 允許的來源 (逗號分隔), * 代表允許所有'),
  CORS_CREDENTIALS: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .default('true')
    .describe('CORS 是否允許傳送 Credentials'),
  CORS_METHODS: z
    .string()
    .default('GET,POST,PUT,DELETE,PATCH,OPTIONS')
    .describe('CORS 允許的 HTTP 方法'),
  CORS_HEADERS: z
    .string()
    .default('Content-Type,Authorization,x-user-id')
    .describe('CORS 允許的自訂標頭'),

  // ================================
  // 🐘 PostgreSQL 設定
  // ================================
  DATABASE_URL: z
    .string()
    .url('DATABASE_URL must be a valid URL')
    .startsWith('postgresql://', 'Only PostgreSQL is supported')
    .describe(
      'PostgreSQL 連線字串 (必填) ex: postgresql://postgres:password@localhost:5432/pm_agent_db',
    ),

  DB_HOST: z.string().default('localhost').describe('PostgreSQL 主機位址'),
  DB_PORT: z.coerce
    .number()
    .min(1, 'DB_PORT must be at least 1')
    .max(65535, 'DB_PORT must be at most 65535')
    .default(5432)
    .describe('PostgreSQL 連接埠'),
  DB_NAME: z
    .string()
    .min(1, 'DB_NAME cannot be empty')
    .default('pm_agent_db')
    .describe('資料庫名稱'),
  DB_USER: z
    .string()
    .min(1, 'DB_USER cannot be empty')
    .default('postgres')
    .describe('資料庫使用者'),
  DB_PASSWORD: z
    .string()
    .min(1, 'DB_PASSWORD cannot be empty')
    .default('postgres')
    .describe('資料庫密碼'),

  // 連接池配置
  DB_CONNECTION_LIMIT: z.coerce
    .number()
    .min(1, 'DB_CONNECTION_LIMIT must be at least 1')
    .max(100, 'DB_CONNECTION_LIMIT should not exceed 100')
    .default(50)
    .describe('資料庫連接池最大連接數'),
  DB_POOL_TIMEOUT: z.coerce
    .number()
    .min(1, 'DB_POOL_TIMEOUT must be at least 1')
    .max(120, 'DB_POOL_TIMEOUT should not exceed 300 seconds')
    .default(60)
    .describe('資料庫連接池超時時間（秒）'),
  DB_CONNECT_TIMEOUT: z.coerce
    .number()
    .min(1, 'DB_CONNECT_TIMEOUT must be at least 1')
    .max(15, 'DB_CONNECT_TIMEOUT should not exceed 60 seconds')
    .default(10)
    .describe('資料庫連接超時時間（秒）'),

  // ================================
  // 🖼️ 上傳設定
  // ================================
  STORAGE_TYPE: z.enum(['local', 's3', 'nas']).default('local').describe('檔案儲存類型'),
  UPLOAD_MAX_FILE_SIZE: z.coerce
    .number()
    .min(1 * 1024 * 1024, 'Max file size must be at least 1MB')
    .max(100 * 1024 * 1024, 'Max file size should not exceed 100MB')
    .default(30 * 1024 * 1024) // 30 MB
    .describe('單一檔案上傳最大限制 (位元組)'),
  // Local Storage 設定
  UPLOAD_BASE_DIR: z.string().default('uploads').describe('檔案上傳基礎目錄'),
  // S3 Storage 設定
  S3_REGION: z.string().default('ap-northeast-1').describe('AWS S3 區域'),
  S3_BUCKET: z.string().default('').describe('AWS S3 儲存桶名稱'),
  S3_ACCESS_KEY_ID: z.string().default('').describe('AWS S3 存取金鑰 ID'),
  S3_SECRET_ACCESS_KEY: z.string().default('').describe('AWS S3 秘密存取金鑰'),
  // NAS Storage 設定
  NAS_HOST: z.string().default('').describe('NAS 主機位址'),
  NAS_PORT: z.coerce.number().default(22).describe('NAS 連接埠'),
  NAS_USERNAME: z.string().default('').describe('NAS 帳號'),
  NAS_PASSWORD: z.string().default('').describe('NAS 密碼'),
  NAS_BASE_PATH: z.string().default('/uploads').describe('NAS 基礎路徑'),
});

let env: z.infer<typeof envSchema>;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Environment variable validation failed:');
    error.errors.forEach((err) => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
    process.exit(1);
  }
  throw error;
}

export { env };
