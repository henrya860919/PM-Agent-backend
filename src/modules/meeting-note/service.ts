// 會議記錄服務：從 Intake 一鍵生成（規格 IA-4.1、MN-1）

import { meetingNoteRepository } from '@/modules/meeting-note/meeting-note.repository';
import { intakeRepository } from '@/modules/intake/intake.repository';
import type { MeetingNoteDto, MeetingNoteType } from '@/modules/meeting-note/type';
import { NotFoundError } from '@/shared/types/errors.type';

/** 依模板產生會議記錄初稿區塊標題（規格 MN-1.2 初版） */
const TEMPLATE_SECTIONS: Record<string, string[]> = {
  general: ['與會人', '討論摘要', '結論', '待辦事項', '下次會議'],
  requirement_discussion: ['與會人', '需求範圍', '共識與結論', '待確認項目', '下次討論'],
  contract_review: ['與會人', '合約要點', '待釐清條款', '後續行動'],
  sprint_retro: ['與會人', '做得好的', '待改進', '行動項'],
};

export const meetingNoteService = {
  /**
   * 從 Intake 一鍵生成會議記錄（規格 IA-4.1）
   * 初稿以 Intake 摘要＋逐字稿前段組合成區塊，可再編輯
   */
  async createFromIntake(
    userId: string,
    intakeId: string,
    template: string = 'general',
  ): Promise<MeetingNoteDto> {
    const intake = await intakeRepository.findByUuid(intakeId);
    if (!intake) throw new NotFoundError('找不到該筆 Intake');

    const title = `會議記錄：${intake.title.slice(0, 80)}${intake.title.length > 80 ? '…' : ''}`;
    const sections = TEMPLATE_SECTIONS[template] ?? TEMPLATE_SECTIONS.general;
    const summaryBlock = intake.analysisSummary
      ? `## 摘要\n${intake.analysisSummary}\n\n`
      : '';
    const transcriptPreview = intake.transcript
      ? `## 逐字稿（節錄）\n${intake.transcript.slice(0, 2000)}${intake.transcript.length > 2000 ? '\n…' : ''}\n\n`
      : '';
    const sectionBlocks = sections
      .map((s) => `## ${s}\n（請依會議內容填寫）\n`)
      .join('\n');
    const content = summaryBlock + transcriptPreview + sectionBlocks;

    return meetingNoteRepository.create({
      type: 'meeting_note',
      title,
      content,
      projectId: intake.projectId,
      sourceIntakeId: intakeId,
      createdById: userId,
    });
  },

  /** 手動建立空白會議記錄或備忘錄（規格 MN-1.1、MN-2.1） */
  async createBlank(
    userId: string,
    data: { type: MeetingNoteType; title: string; content?: string; projectId?: string | null },
  ): Promise<MeetingNoteDto> {
    return meetingNoteRepository.create({
      type: data.type,
      title: data.title,
      content: data.content ?? '',
      projectId: data.projectId ?? null,
      sourceIntakeId: null,
      createdById: userId,
    });
  },

  async getById(_userId: string, uuid: string): Promise<MeetingNoteDto> {
    const note = await meetingNoteRepository.findByUuid(uuid);
    if (!note) throw new NotFoundError('找不到該筆會議記錄');
    return note;
  },

  async list(
    _userId: string,
    query: { projectId?: string; type?: MeetingNoteType; sourceIntakeId?: string; search?: string; page: number; limit: number },
  ) {
    return meetingNoteRepository.findMany({
      projectId: query.projectId,
      type: query.type,
      sourceIntakeId: query.sourceIntakeId,
      search: query.search,
      page: query.page,
      limit: query.limit,
    });
  },

  async update(
    _userId: string,
    uuid: string,
    data: { title?: string; content?: string },
  ): Promise<MeetingNoteDto> {
    const updated = await meetingNoteRepository.update(uuid, data);
    if (!updated) throw new NotFoundError('找不到該筆會議記錄');
    return updated;
  },

  async delete(_userId: string, uuid: string): Promise<void> {
    const note = await meetingNoteRepository.findByUuid(uuid);
    if (!note) throw new NotFoundError('找不到該筆會議記錄');
    await meetingNoteRepository.delete(uuid);
  },
};
