// src/modules/file/service.ts
import { env } from '@/_env';
import { storageConfig } from '@/config/storage.config';
import { FILE_BUSINESS_TYPE } from '@/constants/file';
import { prisma } from '@/lib/prisma';
import { UploadedFile } from '@/middleware/upload';
import { INTAKE_STATUS } from '@/constants/intake';
import { fileAnalysisRepository } from '@/modules/file/file-analysis.repository';
import { fileTranscriptRepository } from '@/modules/file/file-transcript.repository';
import { fileRepository } from '@/modules/file/repository';
import { intakeRepository } from '@/modules/intake/intake.repository';
import {
  FileAnalysisDto,
  FileListDto,
  FileProcessingStatusDto,
  FileTranscriptDto,
  FileUploadDto,
} from '@/modules/file/type';
import { NotFoundError } from '@/shared/types/errors.type';
import { getMockAudioEnabled } from '@/lib/dev-mock-audio';
import { getStorage } from '@/storage';
import { analyzeTranscriptWithClaude } from '@/services/claude.service';
import { transcribeWithWhisper } from '@/services/whisper.service';
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
      // 一律覆寫實體檔，避免舊的損壞/截斷檔被新記錄沿用
      await storage.save(file.buffer, existingFile.storagePath);

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

      const dto = this._transformToUploadDto(newFile);
      if (newFile.mimeType.startsWith('audio/')) {
        setImmediate(() => {
          this.processFile(currentUserId, newFile.id).catch((err) => {
            console.error('Background audio process error:', err);
          });
        });
      }
      return dto;
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

    const dto = this._transformToUploadDto(createdFile);
    // 僅音檔自動觸發轉錄與分析（非同步，不阻塞回應）
    if (createdFile.mimeType.startsWith('audio/')) {
      setImmediate(() => {
        this.processFile(currentUserId, createdFile.id).catch((err) => {
          console.error('Background audio process error:', err);
        });
      });
    }
    return dto;
    } catch (error) {
      console.error('File upload service error:', error);
      throw error;
    }
  },

  // 取得檔案列表（規格 FR-1、FR-2：排序、篩選、已分析標記）
  async getFiles(
    _userId: string,
    query: {
      projectId?: string;
      businessType?: string;
      type?: 'all' | 'audio' | 'transcript' | 'document' | 'image';
      search?: string;
      sortBy?: 'createdAt' | 'originalFilename' | 'fileSize' | 'mimeType';
      sortOrder?: 'asc' | 'desc';
      hasAnalyzed?: 'all' | 'yes' | 'no';
      page: number;
      limit: number;
    },
  ): Promise<{ files: FileListDto[]; total: number; page: number; limit: number }> {
    const result = await fileRepository.findMany({
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

    // 從儲存取得檔案（以實際讀取長度為準，避免 DB 與實體檔不一致時回傳錯誤大小）
    const buffer = await storage.get(file.storagePath);
    const stream = Readable.from(buffer);
    const actualSize = buffer.length;

    return {
      stream,
      originalFilename: file.originalFilename,
      mimeType: file.mimeType,
      fileSize: actualSize,
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

  // ---------- 轉錄與分析（僅音檔） ----------

  async getProcessingStatus(
    userId: string,
    fileId: string,
  ): Promise<FileProcessingStatusDto> {
    const file = await fileRepository.findByUuid(fileId);
    if (!file) throw new NotFoundError('找不到檔案');

    const transcript = await fileTranscriptRepository.findByFileId(fileId);
    const analysis = await fileAnalysisRepository.findByFileId(fileId);

    const toTs = (
      s: string | undefined,
    ): FileProcessingStatusDto['transcriptStatus'] =>
      s === 'completed' ? 'completed' : s === 'failed' ? 'failed' : 'processing';
    const toAs = (
      s: string | undefined,
    ): FileProcessingStatusDto['analysisStatus'] =>
      s === 'completed' ? 'completed' : s === 'failed' ? 'failed' : 'processing';

    const transcriptStatus = !transcript ? 'not_started' : toTs(transcript.status);
    const analysisStatus = !analysis ? 'not_started' : toAs(analysis.status);

    let overall: FileProcessingStatusDto['overall'] = 'not_started';
    if (transcriptStatus === 'failed' || analysisStatus === 'failed') {
      overall = 'failed';
    } else if (
      transcriptStatus === 'processing' ||
      analysisStatus === 'processing'
    ) {
      overall = 'processing';
    } else if (transcriptStatus === 'completed' && analysisStatus === 'completed') {
      overall = 'completed';
    } else if (transcriptStatus === 'completed') {
      overall = analysisStatus === 'not_started' ? 'processing' : 'processing';
    } else if (transcriptStatus !== 'not_started') {
      overall = 'processing';
    }

    return {
      fileId,
      transcriptStatus,
      analysisStatus,
      overall,
      transcriptErrorMessage: transcript?.errorMessage ?? null,
      analysisErrorMessage: analysis?.errorMessage ?? null,
    };
  },

  async getTranscript(
    userId: string,
    fileId: string,
  ): Promise<FileTranscriptDto | null> {
    const file = await fileRepository.findByUuid(fileId);
    if (!file) throw new NotFoundError('找不到檔案');
    return fileTranscriptRepository.findByFileId(fileId);
  },

  async getAnalysis(
    userId: string,
    fileId: string,
  ): Promise<FileAnalysisDto | null> {
    const file = await fileRepository.findByUuid(fileId);
    if (!file) throw new NotFoundError('找不到檔案');
    return fileAnalysisRepository.findByFileId(fileId);
  },

  /**
   * 僅支援音檔：Whisper 轉錄 → Claude 分析，寫入 FileTranscript / FileAnalysis。
   * 若未設定 API keys 則略過並將狀態設為 failed。
   */
  async processFile(userId: string, fileId: string): Promise<void> {
    const file = await fileRepository.findByUuid(fileId);
    if (!file) throw new NotFoundError('找不到檔案');
    if (!file.mimeType.startsWith('audio/')) {
      return; // 非音檔不處理
    }

    console.log(`🎤 [音檔處理] 開始: ${file.originalFilename} (${fileId})`);
    const storage = getStorage();
    const buffer = await storage.get(file.storagePath);

    // 1. Transcript
    let transcriptRow = await fileTranscriptRepository.findByFileId(fileId);
    if (!transcriptRow) {
      transcriptRow = await fileTranscriptRepository.create(fileId, {
        status: 'processing',
      });
    } else if (transcriptRow.status === 'completed') {
      // 已有轉錄，直接做分析（若尚未完成）
      const analysisRow = await fileAnalysisRepository.findByFileId(fileId);
      if (analysisRow?.status === 'completed') {
        console.log(`✅ [音檔處理] 已完成: ${file.originalFilename}`);
        await this._ensureIntakeForFile(fileId, userId);
        return;
      }
      const transcript = transcriptRow.transcript;
      await this._runAnalysis(fileId, transcript, file.originalFilename);
      await this._ensureIntakeForFile(fileId, userId);
      return;
    }

    try {
      const useMock = env.MOCK_AUDIO_PROCESSING || getMockAudioEnabled();
      if (useMock) {
        const mockText = `[模擬] 此為開發測試用假轉錄，未呼叫 OpenAI Whisper。檔案: ${file.originalFilename}`;
        await fileTranscriptRepository.updateByFileId(fileId, {
          transcript: mockText,
          language: 'zh',
          duration: null,
          wordCount: mockText.split(/\s+/).filter(Boolean).length,
          whisperModel: 'mock',
          status: 'completed',
          errorMessage: null,
        });
        console.log(`🧪 [音檔處理] 模擬轉錄完成: ${file.originalFilename}`);
      } else {
        if (!env.OPENAI_API_KEY) {
          console.log(`❌ [音檔處理] 轉錄失敗: OPENAI_API_KEY 未設定`);
          await fileTranscriptRepository.updateByFileId(fileId, {
            status: 'failed',
            errorMessage: 'OPENAI_API_KEY not configured',
          });
          return;
        }
        console.log(`🔄 [音檔處理] Whisper 轉錄中: ${file.originalFilename}`);
        const whisperResult = await transcribeWithWhisper(buffer, file.mimeType);
        const wordCount = whisperResult.text.trim().split(/\s+/).filter(Boolean).length;
        await fileTranscriptRepository.updateByFileId(fileId, {
          transcript: whisperResult.text,
          language: whisperResult.language ?? null,
          duration: whisperResult.duration ?? null,
          wordCount,
          whisperModel: env.WHISPER_MODEL,
          status: 'completed',
          errorMessage: null,
        });
        console.log(`✅ [音檔處理] 轉錄完成: ${file.originalFilename} (${wordCount} 字)`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`❌ [音檔處理] 轉錄失敗: ${file.originalFilename}`, message);
      await fileTranscriptRepository.updateByFileId(fileId, {
        status: 'failed',
        errorMessage: message,
      });
      await this._ensureIntakeForFile(fileId, userId);
      return;
    }

    const updated = await fileTranscriptRepository.findByFileId(fileId);
    const transcript = updated?.transcript ?? '';
    await this._runAnalysis(fileId, transcript, file.originalFilename);
    await this._ensureIntakeForFile(fileId, userId);
  },

  /**
   * 音檔處理完成後建立或更新 Intake（規格 IA-3.1：從上傳建立 Intake）
   * 同一 File 僅保留一筆 Intake，依轉錄/分析狀態寫入 status
   */
  async _ensureIntakeForFile(fileId: string, userId: string): Promise<void> {
    const file = await fileRepository.findByUuid(fileId);
    if (!file || !file.mimeType.startsWith('audio/')) return;

    const transcript = await fileTranscriptRepository.findByFileId(fileId);
    const analysis = await fileAnalysisRepository.findByFileId(fileId);

    let status: string = INTAKE_STATUS.PROCESSING;
    if (transcript?.status === 'failed') {
      status = INTAKE_STATUS.FAILED;
    } else if (analysis?.status === 'failed') {
      status = INTAKE_STATUS.TRANSCRIPT_OK_ANALYSIS_FAILED;
    } else if (transcript?.status === 'completed' && analysis?.status === 'completed') {
      status = INTAKE_STATUS.COMPLETED;
    }

    const title = file.originalFilename.slice(0, 500);
    const projectId = file.projectId ?? null;
    const existing = await intakeRepository.findBySourceFileId(fileId);
    if (existing) {
      await intakeRepository.updateStatus(existing.uuid, status);
    } else {
      await intakeRepository.create({
        sourceFileId: fileId,
        projectId,
        title,
        status,
        createdById: userId,
      });
    }
  },

  async _runAnalysis(
    fileId: string,
    transcript: string,
    sourceLabel: string,
  ): Promise<void> {
    let analysisRow = await fileAnalysisRepository.findByFileId(fileId);
    if (!analysisRow) {
      analysisRow = await fileAnalysisRepository.create(fileId, {
        status: 'processing',
      });
    }

    try {
      const useMock = env.MOCK_AUDIO_PROCESSING || getMockAudioEnabled();
      if (useMock) {
        const mockResult = {
          summary: '[模擬] 開發測試用摘要，未呼叫 Claude。',
          keyDecisions: [{ title: '模擬決策', description: '用於測試流程' }],
          risks: [{ title: '模擬風險', severity: 'info' as const, description: '測試用' }],
          dependencies: [{ name: '模擬依賴', description: '測試用' }],
          logicFlags: [
            {
              id: 'mock-1',
              category: 'data-flow' as const,
              severity: 'info' as const,
              message: '此為模擬 logic flag，未呼叫 Claude',
              source: sourceLabel,
            },
          ],
        };
        await fileAnalysisRepository.updateByFileId(fileId, {
          summary: mockResult.summary,
          keyDecisions: mockResult.keyDecisions,
          risks: mockResult.risks,
          dependencies: mockResult.dependencies,
          logicFlags: mockResult.logicFlags,
          claudeModel: 'mock',
          status: 'completed',
          errorMessage: null,
        });
        console.log(`🧪 [音檔處理] 模擬分析完成: ${sourceLabel}`);
      } else {
        if (!env.ANTHROPIC_API_KEY) {
          console.log(`❌ [音檔處理] 分析失敗: ANTHROPIC_API_KEY 未設定`);
          await fileAnalysisRepository.updateByFileId(fileId, {
            status: 'failed',
            errorMessage: 'ANTHROPIC_API_KEY not configured',
          });
          return;
        }
        console.log(`🔄 [音檔處理] Claude 分析中: ${sourceLabel}`);
        const result = await analyzeTranscriptWithClaude(transcript, sourceLabel);
        await fileAnalysisRepository.updateByFileId(fileId, {
          summary: result.summary,
          keyDecisions: result.keyDecisions,
          risks: result.risks,
          dependencies: result.dependencies,
          logicFlags: result.logicFlags,
          claudeModel: env.CLAUDE_MODEL,
          status: 'completed',
          errorMessage: null,
        });
        console.log(`✅ [音檔處理] 分析完成: ${sourceLabel} (${result.logicFlags?.length ?? 0} 個 logic flags)`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`❌ [音檔處理] 分析失敗: ${sourceLabel}`, message);
      await fileAnalysisRepository.updateByFileId(fileId, {
        status: 'failed',
        errorMessage: message,
      });
    }
  },

  /**
   * 手動觸發處理（例如重試或僅音檔）。若已有轉錄/分析會覆寫。
   */
  async triggerProcess(userId: string, fileId: string): Promise<void> {
    const file = await fileRepository.findByUuid(fileId);
    if (!file) throw new NotFoundError('找不到檔案');
    if (!file.mimeType.startsWith('audio/')) {
      return;
    }
    await this.processFile(userId, fileId);
  },
};
