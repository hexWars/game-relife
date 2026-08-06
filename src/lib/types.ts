export type AttributeKey = 'charm' | 'intelligence' | 'stamina' | 'spirit';

export interface AttributeStat {
  label: string;
  points: number;
  level: number;
}

export interface DayRecord {
  date: string;
  charm: number;
  intelligence: number;
  stamina: number;
  spirit: number;
  [key: string]: string | number;
}

/** 面板展示用的统计结构（由 tasks.json 派生，见 lib/derive.ts） */
export interface StatsFile {
  version: number;
  updatedAt: string;
  attributes: Record<AttributeKey, AttributeStat>;
  history: DayRecord[];
}

/** 单个已完成任务的 AI 判定结果 */
export interface TaskRecord {
  taskId: string;
  /** 完成时间，UTC ISO（滴答返回的 completedTime 原样） */
  completedAt: string;
  title: string;
  effects: Record<AttributeKey, number>;
  reason?: string;
}

/** data/tasks.json 的结构（主数据，AI 分类的唯一事实来源） */
export interface TasksFile {
  version: number;
  updatedAt: string;
  tasks: TaskRecord[];
}
