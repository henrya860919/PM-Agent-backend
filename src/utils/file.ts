// src/utils/file.ts
import { uploadConfig } from '@/config/upload.config';
import crypto from 'crypto';
import path from 'path';
import sharp from 'sharp';

// 計算檔案 hash
export function calculateFileHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

// 生成唯一檔名
export function generateUniqueFilename(originalFilename: string): string {
  const ext = path.extname(originalFilename);
  const uuid = crypto.randomUUID();
  return `${uuid}${ext}`;
}

// 生成圖片縮圖
export async function generateImageThumbnail(buffer: Buffer): Promise<Buffer> {
  return await sharp(buffer)
    .resize(uploadConfig.thumbnail.width, uploadConfig.thumbnail.height, {
      fit: 'cover',
    })
    .toBuffer();
}

// 生成 PDF 縮圖
export async function generatePdfThumbnail(buffer: Buffer): Promise<Buffer> {
  // 給空的縮圖
  return sharp({
    create: {
      width: uploadConfig.thumbnail.width,
      height: uploadConfig.thumbnail.height,
      channels: 3,
      background: { r: 240, g: 240, b: 240 },
    },
  })
    .jpeg({ quality: 85 })
    .toBuffer();
}

// 統一的縮圖生成函數
export async function generateThumbnail(buffer: Buffer, mimeType: string): Promise<Buffer> {
  if (mimeType === 'application/pdf') {
    return await generatePdfThumbnail(buffer);
  } else if (isImage(mimeType)) {
    return await generateImageThumbnail(buffer);
  } else {
    throw new Error('不支援的檔案類型');
  }
}

// 判斷是否為圖片類型
export function isImage(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

// 判斷是否為 PDF 類型
export function isPdf(mimeType: string): boolean {
  return mimeType === 'application/pdf';
}

// 取得上傳路徑
export function getUploadPath(businessType: string, isThumbnail = false): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  const base = isThumbnail ? `thumbnails/${businessType}` : businessType;

  return `${base}/${year}/${month}/${day}`;
}
