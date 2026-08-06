/**
 * 数据同步入口：连接滴答官方 MCP，按标签统计昨日完成数，写回 data/stats.json。
 *
 * 为什么需要这份脚本：
 *   claude -p 无头模式不会自动加载 .mcp.json 里的 `${env:...}` 插值，
 *   也不会自动挂载 MCP 工具。因此这里先由 Node 生成一份「带真实令牌」的
 *   临时配置 .mcp.generated.json，再用 --mcp-config 显式加载。
 *
 * 用法（在项目根目录运行）：
 *   node scripts/sync.mjs
 *     → 令牌从 .claude/settings.local.json 读取（本地）
 *   DIDA_MCP_TOKEN=xxx node scripts/sync.mjs
 *     → 令牌从环境变量读取（CI 中由 Secret 注入）
 */
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const GENERATED_CONFIG = '.mcp.generated.json';

// ---------- 1. 获取令牌 ----------
let token = process.env.DIDA_MCP_TOKEN || '';
if (!token) {
  try {
    const settings = JSON.parse(
      readFileSync(path.join(ROOT, '.claude', 'settings.local.json'), 'utf8'),
    );
    token = settings.env?.DIDA_MCP_TOKEN || '';
  } catch {
    /* 文件不存在或解析失败，走下面的报错 */
  }
}
if (!token) {
  console.error('❌ 缺少 DIDA_MCP_TOKEN：请设置环境变量或在 .claude/settings.local.json 中配置');
  process.exit(1);
}

// ---------- 2. 生成临时 MCP 配置（真实令牌，不提交） ----------
const configPath = path.join(ROOT, GENERATED_CONFIG);
writeFileSync(
  configPath,
  JSON.stringify(
    {
      mcpServers: {
        'dida365-mcp': {
          type: 'http',
          url: 'https://mcp.dida365.com',
          headers: { Authorization: `Bearer ${token}` },
        },
      },
    },
    null,
    2,
  ),
);
console.log(`✓ 已生成临时配置 ${GENERATED_CONFIG}`);

// ---------- 3. 运行 Claude Code 无头同步 ----------
// 提示词走 stdin（避免命令行转义问题），shell:true 兼容 Windows 的 claude.cmd
const prompt = readFileSync(path.join(ROOT, 'prompts', 'sync-stats.md'), 'utf8');
const claudeArgs = [
  '-p',
  '--mcp-config',
  GENERATED_CONFIG,
  '--strict-mcp-config',
  '--permission-mode',
  'bypassPermissions',
];

try {
  execSync(`claude ${claudeArgs.join(' ')}`, {
    input: prompt,
    stdio: ['pipe', 'inherit', 'inherit'],
    shell: true,
    cwd: ROOT,
  });
} finally {
  rmSync(configPath, { force: true });
  console.log('✓ 已清理临时配置');
}
