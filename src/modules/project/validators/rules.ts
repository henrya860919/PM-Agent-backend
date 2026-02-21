// src/modules/project/validators/rules.ts

import { PROJECT_STATUS } from '@/constants/project';
import { projectRepository } from '@/modules/project/repository';
import { ProjectEntity } from '@/modules/project/type';
import { BadRequestError, ConflictError, NotFoundError } from '@/shared/types/errors.type';

// [R-P01] 專案代碼不能重複
export const validateUniqueProjectCode = async (
  code: string,
  excludeCode?: string,
): Promise<void> => {
  const project = await projectRepository.findByCode(code, excludeCode);
  if (project) throw new ConflictError('此已存在相同代號的專案');
};

/**
 * [R-P03] 驗證專案狀態是否為進行中
 * 規則：只有進行中的專案可以進行 add、update、delete 操作
 * @param project 專案實體
 * @throws NotFoundError 如果專案不存在
 * @throws BadRequestError 如果專案狀態不是 IN_PROGRESS
 */
export const validateProjectStatusInProgress = (project: ProjectEntity | null): void => {
  if (!project) {
    throw new NotFoundError('找不到該專案');
  }
  if (project.status !== PROJECT_STATUS.IN_PROGRESS) {
    throw new BadRequestError('只有進行中的專案可以進行此操作');
  }
};
