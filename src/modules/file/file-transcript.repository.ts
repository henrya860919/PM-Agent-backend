// src/modules/file/file-transcript.repository.ts
import { prisma } from '@/lib/prisma';
import { FileTranscriptDto } from '@/modules/file/type';

const select = {
  uuid: true,
  fileId: true,
  transcript: true,
  language: true,
  duration: true,
  wordCount: true,
  whisperModel: true,
  status: true,
  errorMessage: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const fileTranscriptRepository = {
  async create(
    fileId: string,
    data: {
      status?: string;
      errorMessage?: string | null;
    },
  ): Promise<FileTranscriptDto> {
    const row = await (prisma as any).fileTranscript.create({
      data: {
        fileId,
        transcript: '',
        status: data.status ?? 'processing',
        errorMessage: data.errorMessage ?? null,
      },
      select,
    });
    return this.toDto(row);
  },

  async findByFileId(fileId: string): Promise<FileTranscriptDto | null> {
    const row = await (prisma as any).fileTranscript.findUnique({
      where: { fileId },
      select,
    });
    return row ? this.toDto(row) : null;
  },

  async updateByFileId(
    fileId: string,
    data: {
      transcript?: string;
      language?: string | null;
      duration?: number | null;
      wordCount?: number | null;
      whisperModel?: string | null;
      status?: string;
      errorMessage?: string | null;
    },
  ): Promise<FileTranscriptDto> {
    const row = await (prisma as any).fileTranscript.update({
      where: { fileId },
      data: {
        ...(data.transcript !== undefined && { transcript: data.transcript }),
        ...(data.language !== undefined && { language: data.language }),
        ...(data.duration !== undefined && { duration: data.duration }),
        ...(data.wordCount !== undefined && { wordCount: data.wordCount }),
        ...(data.whisperModel !== undefined && { whisperModel: data.whisperModel }),
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
    transcript: string;
    language: string | null;
    duration: number | null;
    wordCount: number | null;
    whisperModel: string | null;
    status: string;
    errorMessage: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): FileTranscriptDto {
    return {
      id: row.uuid,
      fileId: row.fileId,
      transcript: row.transcript,
      language: row.language,
      duration: row.duration,
      wordCount: row.wordCount,
      whisperModel: row.whisperModel,
      status: row.status,
      errorMessage: row.errorMessage,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  },
};
