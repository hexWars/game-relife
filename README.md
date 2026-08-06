# 人生系统面板 · Life System

游戏化生活面板：每天从滴答清单同步「魅力 / 智力 / 体力 / 精神」四个标签的完成数，
按线性等级（第 N 级需 N 分）推算等级，构建成静态网页。

## 技术栈

- [Astro](https://astro.build) —— 静态构建
- React —— 面板组件
- Tailwind CSS v4 —— 样式
- Claude Code + 滴答官方 MCP —— 每日数据同步

## 本地开发

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # 构建到 dist/
npm run sync     # 本地跑一次数据同步（需先配置令牌，见下）
```

本地构建使用 `data/stats.json`。仓库里这份是**测试数据**，真实数据由
`npm run sync` 或 CI（每天 03:00 北京时间）用 Claude Code + 滴答官方 MCP 写入。

> 同步原理：`claude -p` 无头模式不会自动挂载 MCP 工具（`.mcp.json` 里的
> `${env:...}` 插值在无头模式不生效）。`scripts/sync.mjs` 会先按令牌生成
> 临时配置 `.mcp.generated.json`，再用 `--mcp-config` + `--strict-mcp-config`
> 显式加载，跑完自动清理。令牌来源：环境变量 `DIDA_MCP_TOKEN` 或
> `.claude/settings.local.json` 的 `env.DIDA_MCP_TOKEN`。

## 数据流

```
滴答清单（标签：魅力/智力/体力/精神）
   └─ 完成任务 = 该属性 +1 分
GitHub Actions（每天 19:00 UTC = 北京 03:00）
   ├─ Claude Code 无头：查昨日 4 标签完成数 → 合并进 data/stats.json
   ├─ git 提交数据 → npm run build
   └─ 部署 GitHub Pages
```

## 等级规则

升到 N 级需要累计 `1 + 2 + ... + N = N(N+1)/2` 分。

| 累计点数 | 0 | 1 | 3 | 6 | 10 | 15 | 55 | 210 |
|--------|---|---|---|---|----|----|----|-----|
| 等级     | 0 | 1 | 2 | 3 | 4  | 5  | 10 | 20  |

计算实现在 `src/lib/levels.ts`。

## 一次性初始化

1. **滴答 API 口令**：网页版 → 右上角头像 → 设置 → 账户与安全 → API 口令 → 创建并复制。
2. **本地令牌**：把真实口令填进 `.claude/settings.local.json` 的 `env.DIDA_MCP_TOKEN`（该文件已 gitignore）。
   `.mcp.json` 会自动用环境变量 `DIDA_MCP_TOKEN` 注入 Bearer 头。
3. **GitHub 仓库 Secrets**（Settings → Secrets and variables → Actions）：
   - `DIDA_MCP_TOKEN` = 上面的 API 口令
   - `ANTHROPIC_API_KEY` = 在 https://console.anthropic.com/settings/keys 创建
4. **开启 GitHub Pages**：仓库 Settings → Pages → Source 选 **GitHub Actions**。
5. **确认滴答里已有 4 个标签**：`魅力` `智力` `体力` `精神`（一字不差）。
6. 手动触发一次：Actions → Nightly Build → Run workflow，验证全链路。

## 目录结构

```
.github/workflows/nightly-build.yml   # 定时构建 + 部署
.mcp.json                             # 滴答官方 MCP 配置（令牌走环境变量）
prompts/sync-stats.md                 # Claude Code 无头执行的提示词
data/stats.json                       # 等级数据（构建输入，必须提交）
src/                                  # Astro 站点源码
```

## 说明与注意

- GitHub Actions 的 `schedule` 用 UTC，`0 19 * * *` = 北京时间次日 03:00。
- 面板里「最近同步时间」能直观看出数据是否新鲜；同步失败时页面照常构建（显示旧数据）。
- 每跑一次 CI 会消耗少量 Anthropic API 用量（约 $0.05–0.3）。
