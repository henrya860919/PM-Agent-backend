// src/modules/intake/intake.repository.ts
// Intake 資料存取層：列表、詳情、建立、更新狀態（規格 3. Intake & Analysis）

import { prisma } from '@/lib/prisma';
import { INTAKE_STATUS } from '@/constants/intake';
import type { IntakeListDto, IntakeDetailDto } from '@/modules/intake/type';
import type { IntakeStatus } from '@/constants/intake';
import { Prisma } from '@prisma/client';

const listSelect = {
  uuid: true,
  title: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  sourceFileId: true,
  sourceFile: {
    select: {
      uuid: true,
      originalFilename: true,
      deletedAt: true,
      transcript: { select: { uuid: true, transcript: true, status: true } },
      analysis: { select: { uuid: true, summary: true, status: true } },
    },
  },
} as const;

export const intakeRepository = {
  /**
   * 列表查詢：分頁、依專案/狀態篩選、依時間排序（規格 IA-1）
   */
  async findMany(options: {
    projectId?: string;
    status?: IntakeStatus | string;
    page: number;
    limit: number;
  }): Promise<{ items: IntakeListDto[]; total: number }> {
    const { projectId, status, page, limit } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.IntakeWhereInput = {};
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;

    const [rows, total] = await Promise.all([
      prisma.intake.findMany({
        where,
        select: listSelect,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.intake.count({ where }),
    ]);

    const items: IntakeListDto[] = rows.map((r) => {
      const summary =
        r.sourceFile?.analysis?.summary?.slice(0, 100) ?? null;
      return {
        id: r.uuid,
        title: r.title,
        sourceFileName: r.sourceFile?.originalFilename ?? null,
        status: r.status,
        summaryOneLine: summary,
        completedAt: r.status === INTAKE_STATUS.COMPLETED || r.status === INTAKE_STATUS.TRANSCRIPT_OK_ANALYSIS_FAILED ? r.updatedAt : null,
        createdAt: r.createdAt,
      };
    });

    return { items, total };
  },

  /**
   * 依 uuid 取得單筆 Intake 詳情（含來源檔、轉錄、分析；規格 IA-2）
   */
  async findByUuid(uuid: string): Promise<IntakeDetailDto | null> {
    const row = await prisma.intake.findUnique({
      where: { uuid },
      select: {
        ...listSelect,
        sourceFileId: true,
        projectId: true,
        meetingNotes: {
          select: { uuid: true, title: true, type: true, updatedAt: true },
          orderBy: { updatedAt: 'desc' },
        },
        sourceFile: {
          select: {
            uuid: true,
            originalFilename: true,
            createdAt: true,
            deletedAt: true,
            transcript: { select: { uuid: true, transcript: true, status: true } },
            analysis: {
              select: {
                uuid: true,
                summary: true,
                keyDecisions: true,
                risks: true,
                dependencies: true,
                logicFlags: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!row) return null;

    const f = row.sourceFile;
    const transcript = f?.transcript;
    const analysis = f?.analysis;

    return {
      id: row.uuid,
      title: row.title,
      sourceFileName: f?.originalFilename ?? null,
      status: row.status,
      summaryOneLine: analysis?.summary?.slice(0, 100) ?? null,
      completedAt: row.status === INTAKE_STATUS.COMPLETED || row.status === INTAKE_STATUS.TRANSCRIPT_OK_ANALYSIS_FAILED ? row.updatedAt : null,
      createdAt: row.createdAt,
      sourceFileId: row.sourceFileId,
      projectId: row.projectId,
      transcriptId: transcript?.uuid ?? null,
      analysisId: analysis?.uuid ?? null,
      transcript: transcript?.transcript ?? null,
      analysisSummary: analysis?.summary ?? null,
      keyDecisions: analysis?.keyDecisions as unknown[] | null ?? null,
      risks: analysis?.risks as unknown[] | null ?? null,
      dependencies: analysis?.dependencies as unknown[] | null ?? null,
      logicFlags: analysis?.logicFlags as unknown[] | null ?? null,
      sourceFileDeleted: !!f?.deletedAt,
      meetingNotes: ((row as { meetingNotes?: { uuid: string; title: string; type: string; updatedAt: Date }[] }).meetingNotes ?? []).map((mn) => ({
        id: mn.uuid,
        title: mn.title,
        type: mn.type,
        updatedAt: mn.updatedAt,
      })),
    };
  },

  /**
   * 建立 Intake（來源檔、標題、狀態；規格 IA-3）
   */
  async create(data: {
    sourceFileId: string | null;
    projectId: string | null;
    title: string;
    status: string;
    createdById: string | null;
  }): Promise<{ uuid: string }> {
    const created = await prisma.intake.create({
      data: {
        sourceFileId: data.sourceFileId,
        projectId: data.projectId,
        title: data.title,
        status: data.status,
        createdById: data.createdById,
      },
      select: { uuid: true },
    });
    return { uuid: created.uuid };
  },

  /**
   * 更新 Intake 狀態（處理完成／失敗時）
   */
  async updateStatus(uuid: string, status: string): Promise<void> {
    await prisma.intake.update({
      where: { uuid },
      data: { status },
    });
  },

  /**
   * 依 sourceFileId 查詢是否已有 Intake（同一 File 僅保留一筆時使用）
   */
  async findBySourceFileId(sourceFileId: string): Promise<{ uuid: string } | null> {
    const row = await prisma.intake.findFirst({
      where: { sourceFileId },
      select: { uuid: true },
      orderBy: { updatedAt: 'desc' },
    });
    return row;
  },
};
