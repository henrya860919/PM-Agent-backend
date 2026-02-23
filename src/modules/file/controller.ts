// src/modules/file/controller.ts
import { fileService } from '@/modules/file/service';
import {
  fileIdParamSchema,
  getFileQuerySchema,
  getFilesQuerySchema,
  uploadFileSchema,
} from '@/modules/file/validators/schemas';
import { NextFunction, Request, Response } from 'express';

export const fileController = {
  // 上傳檔案
  async uploadFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      console.log('📤 File upload request received');
      console.log('Request body:', req.body);
      console.log('Request file:', req.file ? { name: req.file.originalFilename, size: req.file.size } : 'null');

      if (!req.file) {
        console.error('❌ No file found in request');
        return next(new Error('未找到上傳檔案'));
      }

      const body = uploadFileSchema.parse(req.body);
      console.log('✅ Request body validated:', body);
      
      const currentUserId = req.user.id;
      console.log('👤 Current user ID:', currentUserId);

      const result = await fileService.uploadFile(req.file, currentUserId, {
        businessType: body.businessType,
        businessId: body.businessId,
        projectId: body.projectId,
      });

      console.log('✅ File uploaded successfully:', result.id);
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('❌ File upload error:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      next(error);
    }
  },

  // 取得檔案列表
  async getFiles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = getFilesQuerySchema.parse(req.query);
      const currentUserId = req.user.id;

      const result = await fileService.getFiles(currentUserId, {
        projectId: query.projectId,
        businessType: query.businessType,
        type: query.type,
        search: query.search,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        hasAnalyzed: query.hasAnalyzed,
        page: query.page,
        limit: query.limit,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // 取得檔案（統一 endpoint）
  async getFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = fileIdParamSchema.parse(req.params);
      const query = getFileQuerySchema.parse(req.query);
      const currentUserId = req.user.id;

      let fileInfo;

      // 根據 query 參數決定要取得什麼
      if (query.thumbnail) {
        fileInfo = await fileService.getThumbnailForDownload(currentUserId, params.fileId);
      } else {
        fileInfo = await fileService.getFileForDownload(currentUserId, params.fileId);
      }

      // 設定回應 headers
      res.setHeader('Content-Type', fileInfo.mimeType);
      res.setHeader('Content-Length', fileInfo.fileSize.toString());
      res.setHeader('Accept-Ranges', 'bytes');

      // 根據 download 參數決定 Content-Disposition
      if (query.download) {
        const filename = query.thumbnail
          ? `thumb_${fileInfo.originalFilename}`
          : fileInfo.originalFilename;
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${encodeURIComponent(filename)}"`,
        );
      } else {
        res.setHeader(
          'Content-Disposition',
          `inline; filename="${encodeURIComponent(fileInfo.originalFilename)}"`,
        );
      }

      // Stream 回傳
      fileInfo.stream.pipe(res);
    } catch (error) {
      next(error);
    }
  },

  // 刪除檔案
  async deleteFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = fileIdParamSchema.parse(req.params);
      const currentUserId = req.user.id;

      await fileService.deleteFile(params.fileId, currentUserId);

      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  },

  // 取得處理狀態（轉錄/分析）
  async getProcessingStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = fileIdParamSchema.parse(req.params);
      const currentUserId = req.user.id;
      const status = await fileService.getProcessingStatus(currentUserId, params.fileId);
      res.status(200).json({ success: true, data: status });
    } catch (error) {
      next(error);
    }
  },

  // 取得轉錄
  async getTranscript(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = fileIdParamSchema.parse(req.params);
      const currentUserId = req.user.id;
      const transcript = await fileService.getTranscript(currentUserId, params.fileId);
      if (!transcript) {
        res.status(404).json({ success: false, message: '尚無轉錄' });
        return;
      }
      res.status(200).json({ success: true, data: transcript });
    } catch (error) {
      next(error);
    }
  },

  // 取得分析
  async getAnalysis(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = fileIdParamSchema.parse(req.params);
      const currentUserId = req.user.id;
      const analysis = await fileService.getAnalysis(currentUserId, params.fileId);
      if (!analysis) {
        res.status(404).json({ success: false, message: '尚無分析' });
        return;
      }
      res.status(200).json({ success: true, data: analysis });
    } catch (error) {
      next(error);
    }
  },

  // 手動觸發處理（僅音檔）
  async triggerProcess(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = fileIdParamSchema.parse(req.params);
      const currentUserId = req.user.id;
      await fileService.triggerProcess(currentUserId, params.fileId);
      res.status(202).json({
        success: true,
        message: '已排入處理，請輪詢 processing-status 查詢進度',
      });
    } catch (error) {
      next(error);
    }
  },
};
