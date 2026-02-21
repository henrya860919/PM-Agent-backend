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

// 統一的檔案端點（下載/預覽）
router.get('/:fileId', fileController.getFile);

// 刪除檔案
router.delete('/:fileId', fileController.deleteFile);

export default router;
