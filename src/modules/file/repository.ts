// src/modules/file/repository.ts
import { prisma } from '@/lib/prisma';
import { FileDto, FileListDto } from '@/modules/file/type';
import { Prisma } from '@prisma/client';

const fileSelect = {
  uuid: true,
  projectId: true,
  originalFilename: true,
  filename: true,
  fileSize: true,
  mimeType: true,
  extension: true,
  storagePath: true,
  storageType: true,
  fileHash: true,
  businessType: true,
  businessId: true,
  isPublic: true,
  metadata: true,
  tags: true,
  createdAt: true,
  updatedAt: true,
  uploadedBy: {
    select: {
      uuid: true,
      username: true,
      displayName: true,
    },
  },
} satisfies Prisma.FileSelect;

export const fileRepository = {
  // 建立檔案記錄
  async create(data: {
    projectId?: string | null;
    originalFilename: string;
    filename: string;
    fileSize: number;
    mimeType: string;
    extension?: string | null;
    storagePath: string;
    storageType: string;
    fileHash: string;
    businessType: string;
    businessId?: string | null;
    isPublic?: boolean;
    metadata?: Prisma.InputJsonValue;
    tags?: Prisma.InputJsonValue;
    uploadedById: string;
  }): Promise<FileDto> {
    const file = await prisma.file.create({
      data: {
        projectId: data.projectId ?? null,
        originalFilename: data.originalFilename,
        filename: data.filename,
        fileSize: BigInt(data.fileSize),
        mimeType: data.mimeType,
        extension: data.extension ?? null,
        storagePath: data.storagePath,
        storageType: data.storageType,
        fileHash: data.fileHash,
        businessType: data.businessType,
        businessId: data.businessId ?? null,
        isPublic: data.isPublic ?? false,
        metadata: data.metadata ?? Prisma.JsonNull,
        tags: data.tags ?? Prisma.JsonNull,
        uploadedById: data.uploadedById,
      },
      select: fileSelect,
    });

    return this.transformToDto(file);
  },

  // 查詢單一檔案
  async findByUuid(fileId: string): Promise<FileDto | null> {
    const file = await prisma.file.findFirst({
      where: {
        uuid: fileId,
        deletedAt: null,
      },
      select: fileSelect,
    });

    if (!file) return null;

    return this.transformToDto(file);
  },

  // 透過 hash 查找檔案（去重）
  async findByHash(fileHash: string, projectId?: string): Promise<FileDto | null> {
    const file = await prisma.file.findFirst({
      where: {
        fileHash,
        projectId: projectId ?? undefined,
        deletedAt: null,
      },
      select: fileSelect,
    });

    if (!file) return null;

    return this.transformToDto(file);
  },

  // 查詢檔案列表（規格 FR-1.4 排序、FR-2.3 是否已分析篩選）
  async findMany(options: {
    projectId?: string;
    businessType?: string;
    type?: 'all' | 'audio' | 'transcript' | 'document' | 'image';
    search?: string;
    sortBy?: 'createdAt' | 'originalFilename' | 'fileSize' | 'mimeType';
    sortOrder?: 'asc' | 'desc';
    hasAnalyzed?: 'all' | 'yes' | 'no';
    page: number;
    limit: number;
  }): Promise<{ files: FileListDto[]; total: number }> {
    const { projectId, businessType, type, search, sortBy = 'createdAt', sortOrder = 'desc', hasAnalyzed = 'all', page, limit } = options;
    const skip = (page - 1) * limit;

    // 構建 MIME type 篩選條件
    let mimeTypeFilter: { startsWith?: string; in?: string[] } | undefined;
    if (type && type !== 'all') {
      switch (type) {
        case 'audio':
          mimeTypeFilter = { startsWith: 'audio/' };
          break;
        case 'image':
          mimeTypeFilter = { startsWith: 'image/' };
          break;
        case 'document':
          mimeTypeFilter = {
            in: [
              'application/pdf',
              'text/plain',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'application/vnd.ms-excel',
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              'application/vnd.ms-powerpoint',
              'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            ],
          };
          break;
        case 'transcript':
          mimeTypeFilter = { startsWith: 'text/' };
          break;
      }
    }

    const where: Prisma.FileWhereInput = {
      deletedAt: null,
      ...(projectId && { projectId }),
      ...(businessType && { businessType }),
      ...(mimeTypeFilter && { mimeType: mimeTypeFilter }),
      ...(search && {
        originalFilename: {
          contains: search,
          mode: 'insensitive',
        },
      }),
      ...(hasAnalyzed === 'yes' && { intakes: { some: {} } }),
      ...(hasAnalyzed === 'no' && { intakes: { none: {} } }),
    };

    const orderByKey = sortBy === 'fileSize' ? 'fileSize' : sortBy;
    const orderBy = { [orderByKey]: sortOrder } as Prisma.FileOrderByWithRelationInput;

    const listSelectWithIntakes = {
      ...fileSelect,
      intakes: { take: 1, select: { uuid: true } },
    } satisfies Prisma.FileSelect;

    const [files, total] = await Promise.all([
      prisma.file.findMany({
        where,
        select: listSelectWithIntakes,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.file.count({ where }),
    ]);

    return {
      files: files.map((file) => this.transformToListDto(file)),
      total,
    };
  },

  // 軟刪除檔案
  async delete(fileId: string, deletedById: string): Promise<void> {
    await prisma.file.update({
      where: {
        uuid: fileId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
        deletedById,
      },
    });
  },

  // 將 Prisma 結果轉換為 DTO
  transformToDto(file: Prisma.FileGetPayload<{ select: typeof fileSelect }>): FileDto {
    return {
      id: file.uuid,
      projectId: file.projectId,
      originalFilename: file.originalFilename,
      filename: file.filename,
      fileSize: Number(file.fileSize),
      mimeType: file.mimeType,
      extension: file.extension,
      storagePath: file.storagePath,
      storageType: file.storageType as any,
      fileHash: file.fileHash,
      businessType: file.businessType as any,
      businessId: file.businessId,
      isPublic: file.isPublic,
      metadata: file.metadata as any,
      tags: file.tags as any,
      uploadedBy: {
        id: file.uploadedBy.uuid,
        username: file.uploadedBy.username,
        displayName: file.uploadedBy.displayName,
      },
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
    };
  },

  // 將 Prisma 結果轉換為列表 DTO（支援含 intakes 的 list 查詢結果，用於 hasAnalyzed）
  transformToListDto(
    file: Prisma.FileGetPayload<{ select: typeof fileSelect }> & { intakes?: { uuid: string }[] },
  ): FileListDto {
    const metadata = file.metadata as { thumbnail?: string } | null;
    return {
      id: file.uuid,
      originalFilename: file.originalFilename,
      fileSize: Number(file.fileSize),
      mimeType: file.mimeType,
      extension: file.extension,
      businessType: file.businessType as any,
      uploadedBy: {
        id: file.uploadedBy.uuid,
        username: file.uploadedBy.username,
        displayName: file.uploadedBy.displayName,
      },
      createdAt: file.createdAt,
      url: `/api/files/${file.uuid}`,
      ...(metadata?.thumbnail && {
        thumbnailUrl: `/api/files/${file.uuid}?thumbnail=true`,
      }),
      hasAnalyzed: file.intakes != null && file.intakes.length > 0,
    };
  },
};
