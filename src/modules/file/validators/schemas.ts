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

// 檔案列表查詢參數（規格 FR-1.4 排序、FR-2.3 是否已分析篩選）
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
  sortBy: z
    .enum(['createdAt', 'originalFilename', 'fileSize', 'mimeType'])
    .optional()
    .default('createdAt')
    .describe('排序欄位'),
  sortOrder: z
    .enum(['asc', 'desc'])
    .optional()
    .default('desc')
    .describe('排序方向'),
  hasAnalyzed: z
    .enum(['all', 'yes', 'no'])
    .optional()
    .default('all')
    .describe('是否已有 Intake 分析'),
});

export type GetFilesQuery = z.infer<typeof getFilesQuerySchema>;

// 檔案上傳請求體
export const uploadFileSchema = z.object({
  businessType: z.nativeEnum(FILE_BUSINESS_TYPE),
  businessId: z.string().optional(),
  projectId: z.string().uuid('專案 ID 格式錯誤').optional(),
});

export type UploadFileInput = z.infer<typeof uploadFileSchema>;
