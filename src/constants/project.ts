// src/constants/project.ts
// 專案相關常量

export const PROJECT_STATUS = {
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  ON_HOLD: 'on_hold',
  ARCHIVED: 'archived',
} as const;

export type ProjectStatus = (typeof PROJECT_STATUS)[keyof typeof PROJECT_STATUS];

/**
 * Project 可排序的字段
 * 對應 DTO 中的字段名稱
 */
export const PROJECT_SORT_FIELDS = {
  NAME: 'name',
  CODE: 'code',
  STATUS: 'status',
  OWNER_DISPLAY_NAME: 'ownerDisplayName',
} as const;

export type ProjectSortField = (typeof PROJECT_SORT_FIELDS)[keyof typeof PROJECT_SORT_FIELDS];

/**
 * Project 排序字段白名單
 */
export const ALLOWED_PROJECT_SORT_FIELDS = Object.values(PROJECT_SORT_FIELDS) as [
  ProjectSortField,
  ...ProjectSortField[],
];
