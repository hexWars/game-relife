/**
 * 从原始已完成任务里筛出「新任务」。
 * - 按北京时间完成日期过滤（--yesterday 精确匹配某天 / --before 严格早于某天）
 * - 与 data/tasks.json 按 taskId 去重
 * 结果写到 --out（默认 data/.cache/new.json），并打印数量。
 *
 * 用法：
 *   node scripts/filter-new.mjs --yesterday 2026-08-05        # 每日增量
 *   node scripts/filter-new.mjs --before 2026-08-05           # 回填（不含该日及之后）
 */
import { readFileSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const pick = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
};

const rawPath = pick('--raw') || 'data/.cache/raw-week.json';
const outPath = pick('--out') || 'data/.cache/new.json';
const tasksPath = pick('--tasks') || 'data/tasks.json';
const yesterday = pick('--yesterday');
const before = pick('--before');

if (!yesterday && !before) {
  console.error('❌ 必须指定 --yesterday <YYYY-MM-DD> 或 --before <YYYY-MM-DD>');
  process.exit(1);
}

/** 滴答 completedTime（UTC ISO）→ 北京时间 YYYY-MM-DD */
function beijingDate(utcIso) {
  const d = new Date(utcIso);
  if (Number.isNaN(d.getTime())) return '';
  return new Date(d.getTime() + 8 * 3600 * 1000).toISOString().slice(0, 10);
}

let raw = [];
try {
  raw = JSON.parse(readFileSync(rawPath, 'utf8'));
} catch {
  console.error(`❌ 读取 ${rawPath} 失败（文件不存在或非法）`);
  process.exit(1);
}
if (!Array.isArray(raw)) {
  console.error(`❌ ${rawPath} 不是数组`);
  process.exit(1);
}

let knownIds = new Set();
try {
  const tasks = JSON.parse(readFileSync(tasksPath, 'utf8'));
  knownIds = new Set((tasks.tasks || []).map((t) => t.taskId));
} catch {
  /* tasks.json 不存在则视为空库 */
}

const kept = raw.filter((t) => {
  if (!t || !t.id) return false;
  const date = beijingDate(t.completedTime);
  if (yesterday && date !== yesterday) return false;
  if (before && date >= before) return false;
  return !knownIds.has(t.id);
});

const out = kept.map((t) => ({
  taskId: t.id,
  completedAt: t.completedTime,
  title: t.title || '',
  content: t.content || '',
}));

writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log(`新任务 ${out.length} 个 → ${outPath}`);
