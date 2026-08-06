/**
 * 每日增量同步：把「昨日」完成的滴答任务，经 AI 判定属性后加入 data/tasks.json。
 * 只拉近 7 天（容错窗口），但只把昨天（北京时间）的数据并入总账。
 *
 * 用法（在项目根目录运行）：
 *   node scripts/sync.mjs            # 令牌来自 .claude/settings.local.json（本地）
 *   DIDA_MCP_TOKEN=xxx node scripts/sync.mjs   # 或环境变量（CI 由 Secret 注入）
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { runClaude } from './lib/run-claude.mjs';

const ROOT = process.cwd();

// 确保缓存目录存在
const { mkdirSync } = await import('node:fs');
mkdirSync(path.join(ROOT, 'data', '.cache'), { recursive: true });

const prompt = readFileSync(path.join(ROOT, 'prompts', 'sync-week.md'), 'utf8');
runClaude(prompt);
console.log('✓ 每日同步流程结束');
