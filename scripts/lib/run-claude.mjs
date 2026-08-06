/**
 * 共享：生成带真实令牌的临时 MCP 配置并运行 claude -p 无头会话。
 *
 * 为什么需要：claude -p 无头模式不会自动加载 .mcp.json 里的 ${env:...} 插值，
 * 也不会自动挂载 MCP 工具。必须显式 --mcp-config <带令牌配置> --strict-mcp-config。
 * 提示词走 stdin，shell:true 兼容 Windows 的 claude.cmd。
 */
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const GENERATED_CONFIG = '.mcp.generated.json';

export function getToken() {
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
    throw new Error('❌ 缺少 DIDA_MCP_TOKEN：请设置环境变量或在 .claude/settings.local.json 中配置');
  }
  return token;
}

export function runClaude(prompt) {
  const configPath = path.join(ROOT, GENERATED_CONFIG);
  writeFileSync(
    configPath,
    JSON.stringify(
      {
        mcpServers: {
          'dida365-mcp': {
            type: 'http',
            url: 'https://mcp.dida365.com',
            headers: { Authorization: `Bearer ${getToken()}` },
          },
        },
      },
      null,
      2,
    ),
  );
  try {
    const args = [
      '-p',
      '--mcp-config',
      GENERATED_CONFIG,
      '--strict-mcp-config',
      '--permission-mode',
      'bypassPermissions',
    ];
    execSync(`claude ${args.join(' ')}`, {
      input: prompt,
      stdio: ['pipe', 'inherit', 'inherit'],
      shell: true,
      cwd: ROOT,
    });
  } finally {
    rmSync(configPath, { force: true });
  }
}
