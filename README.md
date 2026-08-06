# 人生系统面板 · Life System

游戏化生活面板：把滴答清单里**每一个已完成的任务**交给 AI 判定对
「魅力 / 智力 / 体力 / 精神」四属性的影响（加分或扣分），按线性等级
（第 N 级需 N 分）推算等级，构建成静态网页。

## 技术栈

- [Astro](https://astro.build) —— 静态构建
- React —— 面板组件
- Tailwind CSS v4 —— 样式
- Claude Code + 滴答官方 MCP + DeepSeek —— 数据同步与 AI 判定

## 本地开发

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # 构建到 dist/
npm run backfill   # 【一次性】回填全部历史（不含昨天），本地运行
npm run sync       # 每日增量：把「昨天」完成的任务 AI 判定后并入
```

面板数据来源是 `data/tasks.json`（AI 判定的每任务属性影响），构建时派生点数/等级。

> 无头模式原理：`claude -p` 不会自动挂载 MCP（`.mcp.json` 的 `${env:...}` 插值
> 在无头模式不生效）。`scripts/lib/run-claude.mjs` 先生成带真实令牌的临时配置
> `.mcp.generated.json`，再用 `--mcp-config` + `--strict-mcp-config` 显式加载，
> 跑完自动清理。令牌来源：环境变量 `DIDA_MCP_TOKEN` 或
> `.claude/settings.local.json` 的 `env.DIDA_MCP_TOKEN`。

## 数据流

```
【回填 · 一次性 · 本地跑】
  node scripts/backfill.mjs --from 2019-01
    → 按月分块拉历史已完成任务 → 每块 AI 判定属性 → 并入 data/tasks.json
    → 可断点续跑（已处理的月份自动跳过）；不含昨天

【增量 · 每天 · 本地或 CI】
  node scripts/sync.mjs
    → 拉近 7 天已完成任务（容错窗口）
    → 只保留「昨天」完成且 tasks.json 里还没有的（按 taskId 去重）
    → AI 判定属性 → 并入 data/tasks.json

面板 ← deriveStats(tasks.json)  ← 汇总每任务 effects → 点数 / 等级 / 每日记录
```

AI 判定规则见 `prompts/classify-rules.md`：每任务最多影响 2 个属性、每个 ±1、
明显负面行为（熬夜/拖延等）扣分、拿不准给 0（宁缺毋滥）。

## 等级规则

升到 N 级需要累计 `1 + 2 + ... + N = N(N+1)/2` 分。

| 累计点数 | 0 | 1 | 3 | 6 | 10 | 15 | 55 | 210 |
|--------|---|---|---|---|----|----|----|-----|
| 等级     | 0 | 1 | 2 | 3 | 4  | 5  | 10 | 20  |

计算实现在 `src/lib/levels.ts`。

## 一次性初始化

1. **滴答 API 口令**：网页版 → 右上角头像 → 设置 → 账户与安全 → API 口令 → 创建并复制。
2. **本地令牌**：把真实口令填进 `.claude/settings.local.json` 的 `env.DIDA_MCP_TOKEN`（已 gitignore）。
3. **GitHub 仓库 Secrets**（Settings → Secrets and variables → Actions）：
   - `DIDA_MCP_TOKEN` = 上面的 API 口令
   - `DEEPSEEK_API_KEY` = 在 https://platform.deepseek.com/api_keys 创建。
     Claude Code 走 DeepSeek 的 Anthropic 兼容端点
     （`https://api.deepseek.com/anthropic`，模型 `deepseek-v4-flash`），
     workflow 已配好；想换模型只改 workflow 的 `ANTHROPIC_MODEL`。
4. **开启 GitHub Pages**：仓库 Settings → Pages → Source 选 **GitHub Actions**。
5. **本地回填历史**：`npm run backfill -- --from <你开始用滴答的年份>-01`
   （如 `--from 2019-01`）。会按月份块跑，耗时较长（数据量大的月份每块几分钟），
   建议在后台/睡前跑一次，可随时中断重跑续传。
6. 手动触发一次：Actions → Nightly Build → Run workflow，验证全链路。

## 目录结构

```
.github/workflows/nightly-build.yml   # 定时(push/每日)同步 + 构建 + 部署
.mcp.json                             # 滴答官方 MCP 配置（令牌走环境变量）
prompts/
  classify-rules.md                   # AI 属性判定规则（唯一事实来源）
  sync-week.md                        # 每日增量同步提示词
  backfill-month.md                   # 回填单月块的提示词模板
scripts/
  sync.mjs                            # 每日增量入口
  backfill.mjs                        # 一次性回填入口
  filter-new.mjs                      # 筛选(昨日)+去重（确定性部分）
  merge.mjs                           # 合并分类结果进 tasks.json
  lib/run-claude.mjs                  # 生成临时 MCP 配置并跑 claude -p
data/
  tasks.json                          # 主数据：AI 判定的每任务影响（必须提交）
  .cache/                             # 同步/回填中间缓存（gitignore）
src/                                  # Astro 站点源码
```

## 说明与注意

- GitHub Actions 的 `schedule` 用 UTC，`0 19 * * *` = 北京时间次日 03:00；
  push 到 main 时也会同步+部署（`data/**` 的改动不会重复触发）。
- **增量只并入「昨天」**：若连续多天没跑（如 CI 停摆），中间几天的数据不会自动补，
  重新跑一次 `npm run backfill` 即可恢复。
- 面板里「最近记录」日期能看出数据是否新鲜；同步失败时页面照常构建（显示旧数据）。
- 每次 CI 消耗少量 DeepSeek API 用量（每日增量通常不到 1 分钱人民币）。
