/**
 * 七日无成长扣分（确定性规则，AI 不参与）。
 *
 * 规则：对每个属性维度独立判定——若某个自然日往前数 7 个自然日（含当天）
 * 该维度没有任何正分（effects > 0），则当天该维度 -1。
 * 窗口会回看生效起始日之前的数据；起始日之前不产生扣分。
 *
 * 结果以合成任务记录写入 tasks.json（taskId 以 "penalty-" 开头）。
 * 每次运行会移除旧的合成记录并按最新数据重算，幂等。
 *
 * 用法（项目根目录）：
 *   node scripts/penalty.mjs                       # 重算到北京时间昨天
 *   node scripts/penalty.mjs --through 2026-10-31  # 重算到指定日期（含）
 *   node scripts/penalty.mjs --from 2026-10-01     # 覆盖生效起始日（调试）
 *   node scripts/penalty.mjs --tasks data/x.json   # 指定数据文件（调试）
 */
import { readFileSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const pick = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
};

const tasksPath = pick('--tasks') || 'data/tasks.json';
const START = pick('--from') || '2026-10-23';
const WINDOW = 7;
const KEYS = ['charm', 'intelligence', 'stamina', 'spirit'];
const LABELS = { charm: '魅力', intelligence: '智力', stamina: '体力', spirit: '精神' };
const ID_PREFIX = 'penalty-';
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const fail = (msg) => {
  console.error(`❌ ${msg}`);
  process.exit(1);
};

if (!DATE_RE.test(START)) fail('--from 格式应为 YYYY-MM-DD');

/** 北京时间今天（YYYY-MM-DD） */
function beijingToday() {
  return new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);
}

function addDays(date, n) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** 滴答 completedTime（UTC ISO）→ 北京时间 YYYY-MM-DD */
function beijingDate(utcIso) {
  const d = new Date(utcIso);
  if (Number.isNaN(d.getTime())) return '';
  return new Date(d.getTime() + 8 * 3600 * 1000).toISOString().slice(0, 10);
}

const END = pick('--through') || addDays(beijingToday(), -1);
if (!DATE_RE.test(END)) fail('--through 格式应为 YYYY-MM-DD');

if (END < START) {
  console.log(`七日无成长：评估区间为空（起始 ${START}，已到 ${END}），无需扣分`);
  process.exit(0);
}

let file;
try {
  file = JSON.parse(readFileSync(tasksPath, 'utf8'));
} catch {
  fail(`读取 ${tasksPath} 失败（文件不存在或非法）`);
}
if (!Array.isArray(file.tasks)) file.tasks = [];

// 真实的已完成任务（排除历史扣分记录）
const realTasks = file.tasks.filter((t) => !String(t.taskId || '').startsWith(ID_PREFIX));

// 每个维度有正分的自然日
const positiveDays = Object.fromEntries(KEYS.map((k) => [k, new Set()]));
for (const t of realTasks) {
  const date = beijingDate(t.completedAt);
  if (!date) continue;
  for (const k of KEYS) {
    if (Number(t.effects?.[k] ?? 0) > 0) positiveDays[k].add(date);
  }
}

// 逐日判定：窗口 [D-6, D] 内该维度没有任何正分 → D 当日 -1
const penaltyDays = new Map();
const totals = Object.fromEntries(KEYS.map((k) => [k, 0]));
for (let d = START; d <= END; d = addDays(d, 1)) {
  const windowStart = addDays(d, -(WINDOW - 1));
  const effects = {};
  const hit = [];
  for (const k of KEYS) {
    let hasPositive = false;
    for (let x = windowStart; x <= d; x = addDays(x, 1)) {
      if (positiveDays[k].has(x)) {
        hasPositive = true;
        break;
      }
    }
    if (hasPositive) {
      effects[k] = 0;
    } else {
      effects[k] = -1;
      hit.push(LABELS[k]);
      totals[k]--;
    }
  }
  if (hit.length > 0) penaltyDays.set(d, { effects, hit });
}

const penaltyRecords = [...penaltyDays.entries()].map(([date, { effects, hit }]) => ({
  taskId: `${ID_PREFIX}${date}`,
  // +0000 与滴答返回格式一致，午间完成时间确保换算成北京时间仍是当天
  completedAt: `${date}T12:00:00+0000`,
  title: `七日无成长：${hit.join('、')}`,
  effects,
  reason: `截至 ${date}，${hit.join('、')}连续 7 天没有加分，当日 -1`,
}));

const oldPenalty = file.tasks.filter((t) => String(t.taskId || '').startsWith(ID_PREFIX));
const byId = (a, b) => (a.taskId < b.taskId ? -1 : a.taskId > b.taskId ? 1 : 0);
const changed = JSON.stringify([...oldPenalty].sort(byId)) !== JSON.stringify([...penaltyRecords].sort(byId));

if (changed) {
  file.tasks = [...realTasks, ...penaltyRecords].sort((a, b) =>
    a.completedAt < b.completedAt ? -1 : a.completedAt > b.completedAt ? 1 : 0,
  );
  file.updatedAt = new Date(Date.now() + 8 * 3600 * 1000).toISOString().replace('Z', '+08:00');
  writeFileSync(tasksPath, JSON.stringify(file, null, 2));
}

const summary = KEYS.map((k) => `${LABELS[k]} ${totals[k]}`).join(' / ');
console.log(`七日无成长：评估 ${START} ~ ${END}，扣分 ${penaltyDays.size} 天（${summary}）`);
console.log(`${changed ? '已更新' : '无变化'} → ${tasksPath}`);
