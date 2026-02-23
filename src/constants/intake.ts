// src/constants/intake.ts
// Intake 狀態與規格對照：規格書 11. 附錄

export const INTAKE_STATUS = {
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  TRANSCRIPT_OK_ANALYSIS_FAILED: 'transcript_ok_analysis_failed',
  FAILED: 'failed',
} as const;

export type IntakeStatus = (typeof INTAKE_STATUS)[keyof typeof INTAKE_STATUS];
