// src/storage/local.storage.ts

import { NotFoundError } from '@/shared/types/errors.type';
import fs from 'fs/promises';
import path from 'path';
import { IStorage } from './storage.interface';

export class LocalStorage implements IStorage {
  constructor(private basePath: string) {}

  // 儲存檔案
  async save(file: Buffer, filepath: string): Promise<string> {
    const fullPath = path.join(this.basePath, filepath);
    const dir = path.dirname(fullPath);

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, file);

    return filepath;
  }

  // 取得檔案
  async get(filepath: string): Promise<Buffer> {
    try {
      const fullPath = path.join(this.basePath, filepath);
      return await fs.readFile(fullPath);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new NotFoundError('找不到檔案');
      }
      throw error;
    }
  }

  // 刪除檔案
  async delete(filepath: string): Promise<void> {
    const fullPath = path.join(this.basePath, filepath);
    try {
      await fs.unlink(fullPath);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  // 檢查檔案是否存在
  async exists(filepath: string): Promise<boolean> {
    const fullPath = path.join(this.basePath, filepath);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  // 取得檔案完整路徑
  getFullPath(filepath: string): string {
    return path.join(this.basePath, filepath);
  }
}
