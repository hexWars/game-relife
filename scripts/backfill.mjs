/**
 * 一次性回填：把历史所有已完成任务（不含昨天）按月分块，逐块让 AI 判定属性，
 * 合并进 data/tasks.json。可断点续跑（已生成的块文件会跳过）。
 *
 * 用法（在项目根目录运行）：
 *   node scripts/backfill.mjs --from 2019-01   # 从 2019-01 开始（默认）
 *   node scripts/backfill.mjs --from 2026-07   # 只回填最近几个月（试跑用）
 */
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { runClaude } from './lib/run-claude.mjs';

const ROOT = process.cwd();

const args = process.argv.slice(2);
const pick = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
};
const fromArg = pick('--from') || '2019-01';
const [fromY, fromM] = fromArg.split('-').map(Number);
if (!fromY || !fromM) {
  console.error('❌ --from 格式应为 YYYY-MM，如 --from 2019-01');
  process.exit(1);
}

// ---------- 北京时间今天的日期 ----------
// 回填「不含昨天」：最后包含日是「昨天」的前一天
const shifted = new Date(Date.now() + 8 * 3600 * 1000);
const today = new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()));
const beforeYesterday = new Date(today.getTime() - 2 * 86400000);
const todayStr = today.toISOString().slice(0, 10);
const cutoffStr = beforeYesterday.toISOString().slice(0, 10); // 最后包含日（北京时间）

mkdirSync(path.join(ROOT, 'data', '.cache', 'backfill'), { recursive: true });

console.log(`开始回填：${fromArg} ~ ${cutoffStr}（不含昨天）\n`);

let y = fromY;
let m = fromM;
let processed = 0;

while (y < today.getUTCFullYear() || (y === today.getUTCFullYear() && m <= today.getUTCMonth() + 1)) {
  const monthKey = `${y}-${String(m).padStart(2, '0')}`;
  const startStr = `${monthKey}-01`;

  // 本月最后一天与 cutoff 取较小者；保证不含昨天
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const monthLast = `${monthKey}-${String(lastDay).padStart(2, '0')}`;
  const endStr = monthLast <= cutoffStr ? monthLast : cutoffStr;
  if (startStr > endStr) {
    // 本月起始已晚于 cutoff（例如 1 号跑回填），跳过本块
    m++;
    if (m > 12) { m = 1; y++; }
    continue;
  }

  const outfile = path.join('data', '.cache', 'backfill', `${monthKey}.json`).replaceAll('\\', '/');

  if (existsSync(path.join(ROOT, outfile))) {
    console.log(`· 跳过已有 ${monthKey}`);
  } else {
    console.log(`· 处理 ${monthKey}（${startStr}T00:00:00 ~ ${endStr}T23:59:59）`);
    const template = readFileSync(path.join(ROOT, 'prompts', 'backfill-month.md'), 'utf8');
    const prompt = template
      .replaceAll('{{START}}', `${startStr}T00:00:00`)
      .replaceAll('{{END}}', `${endStr}T23:59:59`)
      .replaceAll('{{OUTFILE}}', outfile);
    runClaude(prompt);
    execSync(`node scripts/merge.mjs --classified ${outfile}`, { stdio: 'inherit', cwd: ROOT });
    processed++;
  }

  m++;
  if (m > 12) {
    m = 1;
    y++;
  }
}

console.log(`\n回填完成，共处理 ${processed} 个块。`);
const tasks = JSON.parse(readFileSync(path.join(ROOT, 'data', 'tasks.json'), 'utf8'));
console.log(`data/tasks.json 现有 ${tasks.tasks.length} 条任务记录。`);
