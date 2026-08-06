/**
 * 线性等级系统：升到 N 级需要累计 1+2+...+N = N(N+1)/2 分。
 * 例：1 分 → Lv.1；累计 3 分 → Lv.2；累计 6 分 → Lv.3……
 */

/** 升到第 n 级所需的累计点数 */
export function levelThreshold(n: number): number {
  return (n * (n + 1)) / 2;
}

/** 由累计点数推算当前等级（可解析解，等价于循环 while (threshold(n+1) <= p) n++） */
export function levelFromPoints(points: number): number {
  if (points <= 0) return 0;
  return Math.floor((Math.sqrt(8 * points + 1) - 1) / 2);
}

export interface LevelInfo {
  level: number;
  currentThreshold: number;
  nextThreshold: number;
  /** 本级内进度 0..1 */
  progress: number;
}

export function getLevelInfo(points: number): LevelInfo {
  const level = levelFromPoints(points);
  const currentThreshold = levelThreshold(level);
  const nextThreshold = levelThreshold(level + 1);
  const progress =
    nextThreshold === currentThreshold
      ? 0
      : Math.min(1, Math.max(0, (points - currentThreshold) / (nextThreshold - currentThreshold)));
  return { level, currentThreshold, nextThreshold, progress };
}
