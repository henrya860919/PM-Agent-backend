// src/storage/index.ts
import { storageConfig } from '@/config/storage.config';
import { StorageFactory } from './storage.factory';
import { IStorage } from './storage.interface';

let storageInstance: IStorage | null = null;

export function getStorage(): IStorage {
  if (!storageInstance) {
    storageInstance = StorageFactory.create(storageConfig);
  }
  return storageInstance;
}

export * from './storage.interface';
