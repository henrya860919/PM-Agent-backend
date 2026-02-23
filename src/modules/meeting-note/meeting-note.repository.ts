// 會議記錄 CRUD 與「從 Intake 建立」（規格 4、IA-4.1）

import { prisma } from '@/lib/prisma';
import type { MeetingNoteDto, MeetingNoteListDto } from '@/modules/meeting-note/type';
import type { MeetingNoteType } from '@/modules/meeting-note/type';
import { Prisma } from '@prisma/client';

const select = {
  uuid: true,
  type: true,
  title: true,
  content: true,
  projectId: true,
  sourceIntakeId: true,
  createdAt: true,
  updatedAt: true,
  sourceIntake: { select: { title: true } },
} as const;

export const meetingNoteRepository = {
  async create(data: {
    type: MeetingNoteType;
    title: string;
    content: string;
    projectId?: string | null;
    sourceIntakeId?: string | null;
    createdById?: string | null;
  }): Promise<MeetingNoteDto> {
    const row = await prisma.meetingNote.create({
      data: {
        type: data.type,
        title: data.title,
        content: data.content,
        projectId: data.projectId ?? null,
        sourceIntakeId: data.sourceIntakeId ?? null,
        createdById: data.createdById ?? null,
      },
      select,
    });
    return {
      id: row.uuid,
      type: row.type as MeetingNoteType,
      title: row.title,
      content: row.content,
      projectId: row.projectId,
      sourceIntakeId: row.sourceIntakeId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  },

  async findByUuid(uuid: string): Promise<MeetingNoteDto | null> {
    const row = await prisma.meetingNote.findUnique({
      where: { uuid },
      select,
    });
    if (!row) return null;
    return {
      id: row.uuid,
      type: row.type as MeetingNoteType,
      title: row.title,
      content: row.content,
      projectId: row.projectId,
      sourceIntakeId: row.sourceIntakeId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  },

  async findMany(options: {
    projectId?: string;
    type?: MeetingNoteType;
    sourceIntakeId?: string;
    search?: string;
    page: number;
    limit: number;
  }): Promise<{ items: MeetingNoteListDto[]; total: number }> {
    const { projectId, type, sourceIntakeId, search, page, limit } = options;
    const skip = (page - 1) * limit;
    const where: Prisma.MeetingNoteWhereInput = {};
    if (projectId) where.projectId = projectId;
    if (type) where.type = type;
    if (sourceIntakeId) where.sourceIntakeId = sourceIntakeId;
    if (search?.trim()) {
      where.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { content: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const [rows, total] = await Promise.all([
      prisma.meetingNote.findMany({
        where,
        select,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.meetingNote.count({ where }),
    ]);

    const items: MeetingNoteListDto[] = rows.map((r) => ({
      id: r.uuid,
      type: r.type as MeetingNoteType,
      title: r.title,
      sourceIntakeTitle: r.sourceIntake?.title ?? null,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
    return { items, total };
  },

  async update(uuid: string, data: { title?: string; content?: string }): Promise<MeetingNoteDto | null> {
    const row = await prisma.meetingNote.update({
      where: { uuid },
      data: { title: data.title, content: data.content },
      select,
    });
    return {
      id: row.uuid,
      type: row.type as MeetingNoteType,
      title: row.title,
      content: row.content,
      projectId: row.projectId,
      sourceIntakeId: row.sourceIntakeId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  },

  async delete(uuid: string): Promise<void> {
    await prisma.meetingNote.delete({ where: { uuid } });
  },
};
