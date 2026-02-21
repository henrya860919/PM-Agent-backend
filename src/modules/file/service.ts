// src/modules/file/service.ts
import { storageConfig } from '@/config/storage.config';
import { FILE_BUSINESS_TYPE } from '@/constants/file';
import { prisma } from '@/lib/prisma';
import { UploadedFile } from '@/middleware/upload';
import { fileRepository } from '@/modules/file/repository';
import { FileListDto, FileUploadDto } from '@/modules/file/type';
import { NotFoundError } from '@/shared/types/errors.type';
import { getStorage } from '@/storage';
import {
  calculateFileHash,
  generateThumbnail,
  generateUniqueFilename,
  getUploadPath,
  isImage,
  isPdf,
} from '@/utils/file';
import { Prisma } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import { Readable } from 'stream';

export const fileService = {
  /**
   * 刪除臨時檔案（安全處理，忽略錯誤）
   */
  _cleanupTempFile(filepath: string): void {
    fs.unlink(filepath).catch((error) => {
      console.error('Failed to delete temp file:', error);
    });
  },

  /**
   * 將 FileDto 轉換為 FileUploadDto
   */
  _transformToUploadDto(file: {
    id: string;
    originalFilename: string;
    fileSize: number;
    mimeType: string;
    metadata: { thumbnail?: string } | null;
  }): FileUploadDto {
    return {
      id: file.id,
      originalFilename: file.originalFilename,
      fileSize: file.fileSize,
      mimeType: file.mimeType,
      url: `/api/files/${file.id}`,
      thumbnailUrl: file.metadata?.thumbnail ? `/api/files/${file.id}?thumbnail=true` : undefined,
    };
  },

  /**
   * 處理縮圖生成
   */
  async _generateThumbnailIfNeeded(
    file: UploadedFile,
    businessType: string,
    uniqueFilename: string,
  ): Promise<Record<string, any>> {
    if (!isImage(file.mimeType) && !isPdf(file.mimeType)) {
      return {};
    }

    try {
      const thumbnailPath = getUploadPath(businessType, true);
      const thumbnailFilename = `thumb_${uniqueFilename}`;
      const thumbnailFilepath = `${thumbnailPath}/${thumbnailFilename}`;

      const storage = getStorage();
      const thumbnailBuffer = await generateThumbnail(file.buffer, file.mimeType);
      await storage.save(thumbnailBuffer, thumbnailFilepath);

      return {
        thumbnail: thumbnailFilepath,
        thumbnailSize: thumbnailBuffer.length,
      };
    } catch (error) {
      console.error('Failed to generate thumbnail:', error);
      return {};
    }
  },

  // 上傳檔案
  async uploadFile(
    file: UploadedFile,
    currentUserId: string,
    options: {
      businessType: (typeof FILE_BUSINESS_TYPE)[keyof typeof FILE_BUSINESS_TYPE];
      businessId?: string | null;
      projectId?: string | null;
    },
  ): Promise<FileUploadDto> {
    try {
      console.log('🔍 Checking user existence:', currentUserId);
      // 驗證用戶是否存在
      const user = await prisma.user.findFirst({
        where: { uuid: currentUserId, deletedAt: null },
      });
      if (!user) {
        console.error('❌ User not found:', currentUserId);
        throw new NotFoundError(`找不到用戶: ${currentUserId}`);
      }
      console.log('✅ User found:', user.username);

      console.log('💾 Getting storage instance...');
      const storage = getStorage();
      const fileHash = calculateFileHash(file.buffer);

    // 檢查是否已存在（去重）
    const existingFile = await fileRepository.findByHash(fileHash, options.projectId ?? undefined);

    // 如果已存在相同檔案，重用現有檔案
    if (existingFile) {
      // 確保實體檔案存在
      if (!(await storage.exists(existingFile.storagePath))) {
        await storage.save(file.buffer, existingFile.storagePath);
      }

      this._cleanupTempFile(file.filepath);

      // 截斷字段以符合資料庫限制
      const originalFilename = existingFile.originalFilename.slice(0, 255);
      const filename = existingFile.filename.slice(0, 255);
      const mimeType = existingFile.mimeType.slice(0, 100);
      const extension = existingFile.extension ? existingFile.extension.slice(0, 10) : null;

      // 建立新的檔案記錄
      const newFile = await fileRepository.create({
        projectId: options.projectId ?? null,
        originalFilename,
        filename,
        fileSize: existingFile.fileSize,
        mimeType,
        extension,
        storagePath: existingFile.storagePath,
        storageType: existingFile.storageType,
        fileHash: existingFile.fileHash,
        businessType: options.businessType,
        businessId: options.businessId ?? null,
        metadata: existingFile.metadata as Prisma.InputJsonValue | undefined,
        tags: existingFile.tags as Prisma.InputJsonValue | undefined,
        uploadedById: currentUserId,
      });

      return this._transformToUploadDto(newFile);
    }

    // 新檔案：生成路徑並儲存
    const businessType = options.businessType;
    const uploadPath = getUploadPath(businessType);
    const uniqueFilename = generateUniqueFilename(file.originalFilename);
    const filepath = `${uploadPath}/${uniqueFilename}`;

    // 儲存原檔案
    await storage.save(file.buffer, filepath);

    // 處理縮圖
    const metadata = await this._generateThumbnailIfNeeded(file, businessType, uniqueFilename);

    // 清理臨時檔案
    this._cleanupTempFile(file.filepath);

    // 截斷字段以符合資料庫限制
    const originalFilename = file.originalFilename.slice(0, 255);
    const filename = uniqueFilename.slice(0, 255);
    const mimeType = file.mimeType.slice(0, 100);
    const extension = path.extname(file.originalFilename) || null;
    const truncatedExtension = extension ? extension.slice(0, 10) : null;
    const storageType = storageConfig.type.slice(0, 20);

    // 建立檔案記錄
    const createdFile = await fileRepository.create({
      projectId: options.projectId ?? null,
      originalFilename,
      filename,
      fileSize: file.size,
      mimeType,
      extension: truncatedExtension,
      storagePath: filepath,
      storageType,
      fileHash,
      businessType: businessType,
      businessId: options.businessId ?? null,
      metadata,
      uploadedById: currentUserId,
    });

    return this._transformToUploadDto(createdFile);
    } catch (error) {
      console.error('File upload service error:', error);
      throw error;
    }
  },

  // 取得檔案列表
  async getFiles(
    userId: string,
    query: {
      projectId?: string;
      businessType?: string;
      type?: 'all' | 'audio' | 'transcript' | 'document' | 'image';
      search?: string;
      page: number;
      limit: number;
    },
  ): Promise<{ files: FileListDto[]; total: number; page: number; limit: number }> {
    // 簡單的權限檢查：只能查看自己專案的檔案或沒有專案的檔案
    const result = await fileRepository.findMany({
      projectId: query.projectId,
      businessType: query.businessType,
      type: query.type,
      search: query.search,
      page: query.page,
      limit: query.limit,
    });

    return {
      ...result,
      page: query.page,
      limit: query.limit,
    };
  },

  // 通用檔案下載
  async getFileForDownload(
    userId: string,
    fileId: string,
  ): Promise<{
    stream: Readable;
    originalFilename: string;
    mimeType: string;
    fileSize: number;
  }> {
    const storage = getStorage();
    const file = await fileRepository.findByUuid(fileId);

    if (!file) {
      throw new NotFoundError('找不到檔案');
    }

    // 簡單的權限檢查：只能下載自己上傳的檔案或專案檔案
    // 這裡可以根據需求擴展權限檢查邏輯

    // 從儲存取得檔案
    const buffer = await storage.get(file.storagePath);
    const stream = Readable.from(buffer);

    return {
      stream,
      originalFilename: file.originalFilename,
      mimeType: file.mimeType,
      fileSize: file.fileSize,
    };
  },

  // 通用縮圖下載
  async getThumbnailForDownload(
    userId: string,
    fileId: string,
  ): Promise<{
    stream: Readable;
    originalFilename: string;
    mimeType: string;
    fileSize: number;
  }> {
    const storage = getStorage();
    const file = await fileRepository.findByUuid(fileId);

    if (!file) {
      throw new NotFoundError('找不到檔案');
    }

    const metadata = file.metadata as { thumbnail?: string; thumbnailSize?: number } | null;
    if (!metadata?.thumbnail) {
      throw new NotFoundError('沒有縮圖');
    }

    // 從儲存取得縮圖
    const buffer = await storage.get(metadata.thumbnail);
    const stream = Readable.from(buffer);

    return {
      stream,
      originalFilename: file.originalFilename,
      mimeType: file.mimeType,
      fileSize: metadata.thumbnailSize || buffer.length,
    };
  },

  // 刪除檔案
  async deleteFile(fileId: string, currentUserId: string): Promise<void> {
    const file = await fileRepository.findByUuid(fileId);

    if (!file) {
      throw new NotFoundError('找不到檔案');
    }

    // 軟刪除資料庫記錄
    await fileRepository.delete(fileId, currentUserId);
  },
};
