// src/middleware/upload.ts
import { env } from '@/_env';
import { storageConfig } from '@/config/storage.config';
import { uploadConfig } from '@/config/upload.config';
import { BadRequestError } from '@/shared/types/errors.type';
import { generateUniqueFilename } from '@/utils/file';
import Busboy from 'busboy';
import { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

export interface UploadedFile {
  fieldname: string;
  originalFilename: string;
  filename: string;
  filepath: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
}

declare global {
  namespace Express {
    interface Request {
      file?: UploadedFile;
      files?: UploadedFile[];
    }
  }
}

// 單檔上傳中介軟體
export const uploadSingleFile = (fieldName: string = 'file') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 初始化 Busboy
      const busboy = Busboy({
        headers: req.headers,
        limits: {
          fileSize: env.UPLOAD_MAX_FILE_SIZE,
          files: 1,
        },
      });
      // 標記是否已處理檔案
      let fileProcessed = false;
      // 用於緩存檔案數據的緩衝區陣列
      const chunks: Buffer[] = [];
      // 初始化 req.body
      if (!req.body) {
        req.body = {};
      }

      // 處理表單字段
      busboy.on('field', (fieldname, value) => {
        console.log(`📝 Field: ${fieldname} = ${value}`);
        (req.body as any)[fieldname] = value;
      });

      // 處理檔案上傳事件
      busboy.on('file', (fieldname, file, info) => {
        // 只處理指定欄位的檔案
        if (fieldname !== fieldName) {
          file.resume();
          return;
        }
        // 如果已經處理過檔案，則跳過
        if (fileProcessed) {
          file.resume();
          return;
        }
        // 解析檔案資訊
        const { filename, mimeType } = info;

        // 將檔名轉換為 UTF-8
        const decodedOriginalFilename = Buffer.from(filename, 'latin1').toString('utf8');

        // 驗證 MIME type
        if (!uploadConfig.allowedMimeTypes.includes(mimeType)) {
          file.resume();
          return next(
            new BadRequestError(
              `不支援的檔案類型：${mimeType}。允許的類型：${uploadConfig.allowedMimeTypes.join(', ')}`,
            ),
          );
        }
        // 標記已處理檔案
        fileProcessed = true;
        // 生成唯一檔名
        const uniqueFilename = generateUniqueFilename(decodedOriginalFilename);
        // 臨時目錄
        const tempDir = path.join(storageConfig.local?.basePath || 'uploads', 'temp');
        // 構建檔案儲存路徑
        const filepath = path.join(tempDir, uniqueFilename);
        // 確保目錄存在
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        // 建立寫入串流
        const writeStream = fs.createWriteStream(filepath);
        // 寫入檔案並緩存數據
        let fileSize = 0;
        // 監聽資料事件
        file.on('data', (chunk: Buffer) => {
          fileSize += chunk.length;
          chunks.push(chunk);
          writeStream.write(chunk);
        });
        // 監聽檔案大小限制事件
        file.on('limit', () => {
          writeStream.end();
          fs.unlinkSync(filepath);
          return next(
            new BadRequestError(`檔案大小超過限制 ${env.UPLOAD_MAX_FILE_SIZE / 1024 / 1024}MB`),
          );
        });
        // 監聽結束事件
        file.on('end', () => {
          writeStream.end();
          req.file = {
            fieldname,
            originalFilename: decodedOriginalFilename,
            filename: uniqueFilename,
            filepath,
            mimeType,
            size: fileSize,
            buffer: Buffer.concat(chunks),
          };
        });
        // 監聽錯誤事件
        file.on('error', (err) => {
          writeStream.end();
          if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
          }
          return next(err);
        });
      });
      // 監聽完成事件
      busboy.on('finish', () => {
        console.log('📦 Busboy finish event, fileProcessed:', fileProcessed);
        console.log('📋 Request body after parsing:', req.body);
        if (!fileProcessed) {
          return next(new BadRequestError('未找到上傳檔案'));
        }
        next();
      });
      // 監聽錯誤事件
      busboy.on('error', (err) => {
        return next(err);
      });

      // 將請求流導入 Busboy
      req.pipe(busboy);
    } catch (error) {
      next(error);
    }
  };
};
