// src/storage/storage.interface.ts

import { FileStorage } from '@/constants/file';

export interface IStorage {
  save(file: Buffer, filepath: string): Promise<string>;
  get(filepath: string): Promise<Buffer>;
  delete(filepath: string): Promise<void>;
  exists(filepath: string): Promise<boolean>;
}

export interface StorageConfig {
  type: FileStorage;
  local?: {
    basePath: string;
  };
  s3?: {
    region: string;
    bucket: string;
    accessKeyId: string;
    secretAccessKey: string;
  };
  nas?: {
    host: string;
    port: number;
    username: string;
    password: string;
    basePath: string;
  };
}
