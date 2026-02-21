// src/config/storage.config.ts
import { env } from '@/_env';
import { StorageConfig } from '@/storage/storage.interface';

export const storageConfig: StorageConfig = {
  type: env.STORAGE_TYPE as any,

  local: {
    basePath: env.UPLOAD_BASE_DIR,
  },

  s3: {
    region: env.S3_REGION,
    bucket: env.S3_BUCKET,
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  },

  nas: {
    host: env.NAS_HOST,
    port: env.NAS_PORT,
    username: env.NAS_USERNAME,
    password: env.NAS_PASSWORD,
    basePath: env.NAS_BASE_PATH,
  },
};
