// 會議記錄／備忘錄 DTO（規格 4.3）

export type MeetingNoteType = 'meeting_note' | 'memo';

export type MeetingNoteDto = {
  id: string;
  type: MeetingNoteType;
  title: string;
  content: string;
  projectId: string | null;
  sourceIntakeId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type MeetingNoteListDto = {
  id: string;
  type: MeetingNoteType;
  title: string;
  sourceIntakeTitle: string | null;
  createdAt: Date;
  updatedAt: Date;
};
