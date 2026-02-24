// src/modules/file/type.ts

import { FileBusiness, FileStorage } from '@/constants/file';

export type FileMetadata = {
  thumbnail?: string; // 縮圖路徑
  thumbnailSize?: number; // 縮圖大小
  width?: number; // 原圖寬度
  height?: number; // 原圖高度
  duration?: number; // 影片長度
  variants?: {
    // 其他變體
    small?: string;
    medium?: string;
    large?: string;
  };
};

// 檔案資料傳輸物件
export type FileDto = {
  id: string;
  projectId: string | null;
  originalFilename: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  extension: string | null;
  storagePath: string;
  storageType: FileStorage;
  fileHash: string;
  businessType: FileBusiness;
  businessId: string | null;
  isPublic: boolean;
  metadata: FileMetadata | null;
  tags: string[] | null;
  uploadedBy: {
    id: string;
    username: string;
    displayName: string;
  };
  createdAt: Date;
  updatedAt: Date;
};

// 上傳後回傳的檔案資訊
export type FileUploadDto = {
  id: string;
  originalFilename: string;
  fileSize: number;
  mimeType: string;
  url: string; // 原圖 URL
  thumbnailUrl?: string; // 縮圖 URL
};

// 檔案列表查詢結果（規格 FR-1.2：已分析標記）
export type FileListDto = {
  id: string;
  originalFilename: string;
  fileSize: number;
  mimeType: string;
  extension: string | null;
  businessType: FileBusiness;
  uploadedBy: {
    id: string;
    username: string;
    displayName: string;
  };
  createdAt: Date;
  url: string;
  thumbnailUrl?: string;
  /** 是否有關聯的 Intake（已分析）；規格 FR-1.2 */
  hasAnalyzed?: boolean;
};

// 轉錄狀態與前端對齊的 logic flag
export type LogicFlagCategory =
  | 'permissions'
  | 'import-export'
  | 'hierarchy'
  | 'data-flow';
export type LogicFlagSeverity = 'warning' | 'critical' | 'info';
export type LogicFlagDto = {
  id: string;
  category: LogicFlagCategory;
  severity: LogicFlagSeverity;
  message: string;
  source: string;
};

/** 轉錄時間軸區間：開始/結束秒數與該段文字 */
export type TranscriptSegmentDto = {
  start: number;
  end: number;
  text: string;
};

export type FileTranscriptDto = {
  id: string;
  fileId: string;
  transcript: string;
  /** 時間軸區間列表，供前端列出與跳轉 */
  segments: TranscriptSegmentDto[] | null;
  language: string | null;
  duration: number | null;
  wordCount: number | null;
  whisperModel: string | null;
  status: string;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type FileAnalysisDto = {
  id: string;
  fileId: string;
  summary: string | null;
  keyDecisions: unknown[] | null;
  risks: unknown[] | null;
  dependencies: unknown[] | null;
  logicFlags: LogicFlagDto[] | null;
  claudeModel: string | null;
  status: string;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type FileProcessingStatusDto = {
  fileId: string;
  transcriptStatus: 'not_started' | 'processing' | 'completed' | 'failed';
  analysisStatus: 'not_started' | 'processing' | 'completed' | 'failed';
  overall: 'not_started' | 'processing' | 'completed' | 'failed';
  transcriptErrorMessage?: string | null;
  analysisErrorMessage?: string | null;
};
