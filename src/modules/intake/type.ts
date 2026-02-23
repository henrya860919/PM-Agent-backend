// src/modules/intake/type.ts
// Intake 模組 DTO 與型別（規格 3.3 資料欄位）

import { IntakeStatus } from '@/constants/intake';

export type IntakeListDto = {
  id: string;
  title: string;
  sourceFileName: string | null;
  status: IntakeStatus | string;
  summaryOneLine: string | null;
  completedAt: Date | null;
  createdAt: Date;
};

/** 由此 Intake 一鍵產出的會議記錄／備忘錄（規格 IA-2.5） */
export type IntakeMeetingNoteRef = {
  id: string;
  title: string;
  type: string;
  updatedAt: Date;
};

export type IntakeDetailDto = IntakeListDto & {
  sourceFileId: string | null;
  projectId: string | null;
  transcriptId: string | null;
  analysisId: string | null;
  transcript: string | null;
  analysisSummary: string | null;
  keyDecisions: unknown[] | null;
  risks: unknown[] | null;
  dependencies: unknown[] | null;
  logicFlags: unknown[] | null;
  sourceFileDeleted: boolean;
  meetingNotes: IntakeMeetingNoteRef[];
};
