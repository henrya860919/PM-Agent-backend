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
      // 標記是否已處理檔案、是否已在 file 階段報錯（避免 finish 時重複 next）
      let fileProcessed = false;
      let filePhaseError = false;
      // 初始化 req.body
      if (!req.body) {
        req.body = {};
      }

      // 處理表單字段
      busboy.on('field', (fieldname, value) => {
        console.log(`📝 Field: ${fieldname} = ${value}`);
        (req.body as any)[fieldname] = value;
      });

      // 處理檔案上傳事件（大檔只寫入暫存檔，不組裝記憶體 buffer，避免截斷或損壞）
      busboy.on('file', (fieldname, file, info) => {
        if (fieldname !== fieldName) {
          file.resume();
          return;
        }
        if (fileProcessed) {
          file.resume();
          return;
        }
        const { filename, mimeType } = info;
        const decodedOriginalFilename = Buffer.from(filename, 'latin1').toString('utf8');

        if (!uploadConfig.allowedMimeTypes.includes(mimeType)) {
          file.resume();
          return next(
            new BadRequestError(
              `不支援的檔案類型：${mimeType}。允許的類型：${uploadConfig.allowedMimeTypes.join(', ')}`,
            ),
          );
        }
        fileProcessed = true;
        const uniqueFilename = generateUniqueFilename(decodedOriginalFilename);
        const tempDir = path.join(storageConfig.local?.basePath || 'uploads', 'temp');
        const filepath = path.join(tempDir, uniqueFilename);
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        const writeStream = fs.createWriteStream(filepath);
        let fileSize = 0;

        file.on('data', (chunk: Buffer) => {
          fileSize += chunk.length;
          writeStream.write(chunk);
        });
        file.on('limit', () => {
          writeStream.end();
          fs.unlinkSync(filepath);
          return next(
            new BadRequestError(`檔案大小超過限制 ${env.UPLOAD_MAX_FILE_SIZE / 1024 / 1024}MB`),
          );
        });
        file.on('end', () => {
          writeStream.end();
        });
        file.on('error', (err) => {
          writeStream.end();
          if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
          filePhaseError = true;
          return next(err);
        });

        // 等寫入完成後從磁碟讀出並呼叫 next()（大檔時 writeStream 比 busboy 晚 finish，必須由此處 next）
        writeStream.on('finish', () => {
          try {
            const buffer = fs.readFileSync(filepath);
            if (buffer.length !== fileSize) {
              console.error(
                `Upload file size mismatch: on-disk=${buffer.length} counted=${fileSize}`,
              );
              filePhaseError = true;
              fs.unlinkSync(filepath);
              return next(
                new BadRequestError(
                  '檔案接收不完整，請重試（若檔案較大請稍候再試）',
                ),
              );
            }
            // 若 request 標明要傳大檔但實際只收到很少 → 多半是 proxy/網路截斷，拒絕並提示
            const contentLength = parseInt(req.headers['content-length'] || '0', 10);
            if (contentLength > 1024 * 1024 && fileSize < 1024) {
              filePhaseError = true;
              fs.unlinkSync(filepath);
              console.error(
                `Upload truncated: Content-Length=${contentLength} received=${fileSize}. Check proxy (e.g. nginx client_max_body_size).`,
              );
              return next(
                new BadRequestError(
                  '檔案被截斷（僅收到 ' +
                    fileSize +
                    ' bytes）。若經 Nginx 等代理，請設定 client_max_body_size 50m 以上後重試。',
                ),
              );
            }
            req.file = {
              fieldname,
              originalFilename: decodedOriginalFilename,
              filename: uniqueFilename,
              filepath,
              mimeType,
              size: fileSize,
              buffer,
            };
            console.log(
              `📁 Upload ready: ${decodedOriginalFilename} size=${(fileSize / 1024 / 1024).toFixed(2)} MB`,
            );
            next();
          } catch (err) {
            filePhaseError = true;
            if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
            return next(err instanceof Error ? err : new Error(String(err)));
          }
        });
        writeStream.on('error', (err) => {
          filePhaseError = true;
          if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
          return next(err);
        });
      });
      // 有檔案時由 writeStream.on('finish') 負責 next()；無檔案時由此處報錯
      busboy.on('finish', () => {
        console.log('📦 Busboy finish event, fileProcessed:', fileProcessed);
        console.log('📋 Request body after parsing:', req.body);
        if (!fileProcessed) {
          return next(new BadRequestError('未找到上傳檔案'));
        }
        // fileProcessed === true 時不在此呼叫 next()，由 writeStream.on('finish') 呼叫
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
