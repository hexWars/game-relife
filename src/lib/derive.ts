import type { AttributeKey, DayRecord, StatsFile, TasksFile, AttributeStat } from './types';
import { getLevelInfo } from './levels';
import { ATTRIBUTES } from './attributes';

/** 滴答 completedTime（UTC ISO）→ 北京时间 YYYY-MM-DD */
export function beijingDate(utcIso: string): string {
  const d = new Date(utcIso);
  if (Number.isNaN(d.getTime())) return '';
  return new Date(d.getTime() + 8 * 3600 * 1000).toISOString().slice(0, 10);
}

const EMPTY: Record<AttributeKey, number> = { charm: 0, intelligence: 0, stamina: 0, spirit: 0 };

/** 由 tasks.json（AI 判定的每任务影响）汇总出面板展示结构 */
export function deriveStats(tasks: TasksFile): StatsFile {
  const cumulative: Record<AttributeKey, number> = { ...EMPTY };
  const dayMap = new Map<string, Record<AttributeKey, number>>();

  for (const t of tasks.tasks ?? []) {
    const date = beijingDate(t.completedAt);
    for (const a of ATTRIBUTES) {
      const v = t.effects?.[a.key] ?? 0;
      cumulative[a.key] += v;
      if (date) {
        if (!dayMap.has(date)) dayMap.set(date, { ...EMPTY });
        dayMap.get(date)![a.key] += v;
      }
    }
  }

  const attributes = {} as Record<AttributeKey, AttributeStat>;
  for (const a of ATTRIBUTES) {
    const points = cumulative[a.key];
    attributes[a.key] = { label: a.label, points, level: getLevelInfo(points).level };
  }

  const history: DayRecord[] = [...dayMap.entries()]
    .sort(([x], [y]) => (x < y ? -1 : 1))
    .map(([date, vals]) => ({ date, ...vals }));

  return {
    version: tasks.version ?? 2,
    updatedAt: tasks.updatedAt ?? '',
    attributes,
    history,
  };
}
