// src/modules/intake/service.ts
// Intake 業務邏輯：列表、詳情（規格 3. Intake & Analysis）
// 後續動作如「一鍵生成會議記錄／加入 QA」於 Phase 2 實作，此處僅提供列表與詳情

import { intakeRepository } from '@/modules/intake/intake.repository';
import type { IntakeListDto, IntakeDetailDto } from '@/modules/intake/type';
import type { IntakeStatus } from '@/constants/intake';
import { NotFoundError } from '@/shared/types/errors.type';

export const intakeService = {
  /**
   * 取得 Intake 列表：分頁、專案/狀態篩選（規格 IA-1）
   */
  async getIntakes(_userId: string, query: {
    projectId?: string;
    status?: IntakeStatus | string;
    page: number;
    limit: number;
  }): Promise<{ items: IntakeListDto[]; total: number; page: number; limit: number }> {
    const { items, total } = await intakeRepository.findMany({
      projectId: query.projectId,
      status: query.status,
      page: query.page,
      limit: query.limit,
    });
    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
    };
  },

  /**
   * 取得單筆 Intake 詳情（含逐字稿、分析結果、來源檔；規格 IA-2）
   */
  async getIntakeById(_userId: string, intakeId: string): Promise<IntakeDetailDto> {
    const intake = await intakeRepository.findByUuid(intakeId);
    if (!intake) {
      throw new NotFoundError('找不到該筆 Intake');
    }
    return intake;
  },
};
