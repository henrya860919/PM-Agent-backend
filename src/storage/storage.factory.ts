// src/storage/storage.factory.ts
import { FILE_STORAGE_TYPE } from '@/constants/file';

import { LocalStorage } from './local.storage';
import { IStorage, StorageConfig } from './storage.interface';

export class StorageFactory {
  static create(config: StorageConfig): IStorage {
    switch (config.type) {
      case FILE_STORAGE_TYPE.LOCAL:
        if (!config.local) throw new Error('Local storage config is required');
        return new LocalStorage(config.local.basePath);

      case FILE_STORAGE_TYPE.S3:
        if (!config.s3) throw new Error('S3 storage config is required');
        throw new Error('S3 storage not implemented yet');

      case FILE_STORAGE_TYPE.NAS:
        if (!config.nas) throw new Error('NAS storage config is required');
        throw new Error('NAS storage not implemented yet');

      default:
        throw new Error(`Unknown storage type: ${config.type}`);
    }
  }
}
