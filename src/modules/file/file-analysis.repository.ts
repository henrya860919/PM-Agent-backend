// src/modules/file/file-analysis.repository.ts
import { prisma } from '@/lib/prisma';
import { FileAnalysisDto } from '@/modules/file/type';
import { Prisma } from '@prisma/client';

const select = {
  uuid: true,
  fileId: true,
  summary: true,
  keyDecisions: true,
  risks: true,
  dependencies: true,
  logicFlags: true,
  claudeModel: true,
  status: true,
  errorMessage: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const fileAnalysisRepository = {
  async create(
    fileId: string,
    data: {
      status?: string;
      errorMessage?: string | null;
    },
  ): Promise<FileAnalysisDto> {
    const row = await (prisma as any).fileAnalysis.create({
      data: {
        fileId,
        status: data.status ?? 'processing',
        errorMessage: data.errorMessage ?? null,
      },
      select,
    });
    return this.toDto(row);
  },

  async findByFileId(fileId: string): Promise<FileAnalysisDto | null> {
    const row = await (prisma as any).fileAnalysis.findUnique({
      where: { fileId },
      select,
    });
    return row ? this.toDto(row) : null;
  },

  async updateByFileId(
    fileId: string,
    data: {
      summary?: string | null;
      keyDecisions?: Prisma.InputJsonValue;
      risks?: Prisma.InputJsonValue;
      dependencies?: Prisma.InputJsonValue;
      logicFlags?: Prisma.InputJsonValue;
      claudeModel?: string | null;
      status?: string;
      errorMessage?: string | null;
    },
  ): Promise<FileAnalysisDto> {
    const row = await (prisma as any).fileAnalysis.update({
      where: { fileId },
      data: {
        ...(data.summary !== undefined && { summary: data.summary }),
        ...(data.keyDecisions !== undefined && { keyDecisions: data.keyDecisions }),
        ...(data.risks !== undefined && { risks: data.risks }),
        ...(data.dependencies !== undefined && { dependencies: data.dependencies }),
        ...(data.logicFlags !== undefined && { logicFlags: data.logicFlags }),
        ...(data.claudeModel !== undefined && { claudeModel: data.claudeModel }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.errorMessage !== undefined && { errorMessage: data.errorMessage }),
      },
      select,
    });
    return this.toDto(row);
  },

  toDto(row: {
    uuid: string;
    fileId: string;
    summary: string | null;
    keyDecisions: unknown;
    risks: unknown;
    dependencies: unknown;
    logicFlags: unknown;
    claudeModel: string | null;
    status: string;
    errorMessage: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): FileAnalysisDto {
    return {
      id: row.uuid,
      fileId: row.fileId,
      summary: row.summary,
      keyDecisions: row.keyDecisions as FileAnalysisDto['keyDecisions'],
      risks: row.risks as FileAnalysisDto['risks'],
      dependencies: row.dependencies as FileAnalysisDto['dependencies'],
      logicFlags: row.logicFlags as FileAnalysisDto['logicFlags'],
      claudeModel: row.claudeModel,
      status: row.status,
      errorMessage: row.errorMessage,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  },
};
