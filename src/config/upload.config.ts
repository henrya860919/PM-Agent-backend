// src/config/upload.config.ts

import { env } from '@/_env';

export const uploadConfig = {
  // 允許的 MIME types
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'application/pdf',
    'text/plain',
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip',
  ],

  // 縮圖設定
  thumbnail: {
    width: 200,
    height: 200,
  },

  maxAttachments: 10,

  allowedAttachmentMimeTypes: [
    'image/jpeg',
    'image/png',
    'application/pdf',
    'text/plain',
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip',
  ],

  maxAttachmentSize: env.UPLOAD_MAX_FILE_SIZE, // 使用環境變數統一配置
};
