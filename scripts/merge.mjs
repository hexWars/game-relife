/**
 * 把 AI 分类结果合并进 data/tasks.json（按 taskId 去重，保留已存在的）。
 * 更新 updatedAt 为北京时间 ISO。
 *
 * 用法：
 *   node scripts/merge.mjs --classified <path> [--tasks data/tasks.json]
 */
import { readFileSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const pick = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
};

const classifiedPath = pick('--classified');
const tasksPath = pick('--tasks') || 'data/tasks.json';
if (!classifiedPath) {
  console.error('❌ 必须指定 --classified <path>');
  process.exit(1);
}

const KEYS = ['charm', 'intelligence', 'stamina', 'spirit'];

let classified = [];
try {
  classified = JSON.parse(readFileSync(classifiedPath, 'utf8'));
} catch {
  console.error(`❌ 读取 ${classifiedPath} 失败（文件不存在或非法）`);
  process.exit(1);
}
if (!Array.isArray(classified)) {
  console.error(`❌ ${classifiedPath} 不是数组`);
  process.exit(1);
}

let tasks = { version: 2, updatedAt: '', tasks: [] };
try {
  tasks = JSON.parse(readFileSync(tasksPath, 'utf8'));
} catch {
  /* 不存在则新建 */
}
if (!Array.isArray(tasks.tasks)) tasks.tasks = [];

const known = new Set(tasks.tasks.map((t) => t.taskId));
let added = 0;

for (const c of classified) {
  if (!c || !c.taskId || known.has(c.taskId)) continue;
  const effects = {};
  for (const k of KEYS) {
    const v = Number(c.effects?.[k] ?? 0);
    effects[k] = Number.isFinite(v) ? Math.max(-1, Math.min(1, v)) : 0;
  }
  tasks.tasks.push({
    taskId: c.taskId,
    completedAt: c.completedAt || '',
    title: c.title || '',
    effects,
    reason: c.reason || '',
  });
  known.add(c.taskId);
  added++;
}

tasks.updatedAt = new Date(Date.now() + 8 * 3600 * 1000).toISOString().replace('Z', '+08:00');
tasks.tasks.sort((a, b) => (a.completedAt < b.completedAt ? -1 : 1));
writeFileSync(tasksPath, JSON.stringify(tasks, null, 2));

console.log(`合并完成：新增 ${added} 条，tasks.json 现有 ${tasks.tasks.length} 条`);
