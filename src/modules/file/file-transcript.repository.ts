// src/modules/file/file-transcript.repository.ts
import { prisma } from '@/lib/prisma';
import { FileTranscriptDto, TranscriptSegmentDto } from '@/modules/file/type';

const select = {
  uuid: true,
  fileId: true,
  transcript: true,
  segments: true,
  language: true,
  duration: true,
  wordCount: true,
  whisperModel: true,
  status: true,
  errorMessage: true,
  createdAt: true,
  updatedAt: true,
} as const;

function parseSegments(raw: unknown): TranscriptSegmentDto[] | null {
  if (!Array.isArray(raw)) return null;
  const out: TranscriptSegmentDto[] = [];
  for (const item of raw) {
    if (item && typeof item === 'object' && 'start' in item && 'end' in item && 'text' in item) {
      out.push({
        start: Number((item as any).start),
        end: Number((item as any).end),
        text: String((item as any).text ?? ''),
      });
    }
  }
  return out.length ? out : null;
}

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
      segments?: TranscriptSegmentDto[] | null;
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
        ...(data.segments !== undefined && { segments: data.segments as any }),
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
    segments: unknown;
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
      segments: parseSegments(row.segments),
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
