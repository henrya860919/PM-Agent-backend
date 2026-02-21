// src/routes/file.routes.ts
import { requireAuthenticated } from '@/middleware/auth';
import { uploadSingleFile } from '@/middleware/upload';
import { fileController } from '@/modules/file/controller';
import { Router } from 'express';

const router = Router();

router.use(requireAuthenticated);

// 上傳檔案
router.post('/upload', uploadSingleFile('file'), fileController.uploadFile);

// 取得檔案列表
router.get('/', fileController.getFiles);

// 處理狀態、轉錄、分析（須在 /:fileId 之前，避免被當成 fileId）
router.get('/:fileId/processing-status', fileController.getProcessingStatus);
router.get('/:fileId/transcript', fileController.getTranscript);
router.get('/:fileId/analysis', fileController.getAnalysis);
router.post('/:fileId/process', fileController.triggerProcess);

// 統一的檔案端點（下載/預覽）
router.get('/:fileId', fileController.getFile);

// 刪除檔案
router.delete('/:fileId', fileController.deleteFile);

export default router;
