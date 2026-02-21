// src/constants/file.ts
// 文件相關常量

export const FILE_STORAGE_TYPE = {
  LOCAL: 'local',
  S3: 's3',
  NAS: 'nas',
} as const;

export type FileStorage = (typeof FILE_STORAGE_TYPE)[keyof typeof FILE_STORAGE_TYPE];

export const FILE_BUSINESS_TYPE = {
  PROJECT_DOCUMENT: 'project_document',
} as const;

export type FileBusiness = (typeof FILE_BUSINESS_TYPE)[keyof typeof FILE_BUSINESS_TYPE];
