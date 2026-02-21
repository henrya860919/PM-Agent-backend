// src/modules/file/validators/schemas.ts

import { FILE_BUSINESS_TYPE } from '@/constants/file';
import { createPaginationWithSearchSchema } from '@/shared/validators/rules/pagination.rules';
import { z } from 'zod';

// 檔案查詢參數
export const getFileQuerySchema = z.object({
  download: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  thumbnail: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
});

export type GetFileQuery = z.infer<typeof getFileQuerySchema>;

export const fileIdParamSchema = z.object({
  fileId: z.string().uuid('檔案 ID 格式錯誤'),
});

export type FileIdParam = z.infer<typeof fileIdParamSchema>;

// 檔案列表查詢參數
export const getFilesQuerySchema = createPaginationWithSearchSchema('1', '10', 100, 100).extend({
  projectId: z.string().uuid('專案 ID 格式錯誤').optional(),
  businessType: z
    .nativeEnum(FILE_BUSINESS_TYPE)
    .optional()
    .describe('業務類型篩選'),
  type: z
    .enum(['all', 'audio', 'transcript', 'document', 'image'])
    .optional()
    .default('all')
    .describe('檔案類型篩選'),
});

export type GetFilesQuery = z.infer<typeof getFilesQuerySchema>;

// 檔案上傳請求體
export const uploadFileSchema = z.object({
  businessType: z.nativeEnum(FILE_BUSINESS_TYPE),
  businessId: z.string().optional(),
  projectId: z.string().uuid('專案 ID 格式錯誤').optional(),
});

export type UploadFileInput = z.infer<typeof uploadFileSchema>;
