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

/** data/stats.json 的结构 */
export interface StatsFile {
  version: number;
  updatedAt: string;
  attributes: Record<AttributeKey, AttributeStat>;
  history: DayRecord[];
}
