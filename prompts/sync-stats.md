# 任务：同步滴答清单「昨日标签完成数」到 data/stats.json

你是「人生系统面板」的数据同步脚本。当前 UTC 时间即系统时间。
**只允许修改 `data/stats.json` 这一个文件**，其余文件一律只读。

## 0. 属性与标签映射
- 魅力 → attributes.charm
- 智力 → attributes.intelligence
- 体力 → attributes.stamina
- 精神 → attributes.spirit

## 1. 计算「昨日」（北京时间）
用 Bash 执行 `TZ=Asia/Shanghai date +%F` 得到今天（北京时间），
昨天 = 今天往前 1 个自然日。例如今天是 2026-08-06，则昨天是 2026-08-05。

## 2. 读取现状
用 Read 读取 `data/stats.json`。若不存在，按结构初始化：
attributes 四键 points=0、history=[]。

## 3. 统计昨日各标签完成数
对 4 个标签逐一调用 dida365 MCP 的 `filter_tasks`：
```
filter = { "status": [2], "tag": ["<标签名>"] }
```
该调用返回「历史上所有已完成且带该标签的任务」，每项含 `completedTime`（UTC ISO 8601 字符串）。

对每个返回项：
1. 把 `completedTime` 换算为北京时间（UTC+8）；
2. 若换算后的**北京日期 == 昨天**，则该标签昨日计数 +1。

要点：
- 一个任务带多个标签 → 各标签查询时各计 1。
- 只统计已完成（status==2）的普通任务；忽略 checklist 子项与笔记（kind 非 TEXT 的忽略）。
- 若某标签查询报错或返回异常，按 0 处理并如实报告，**严禁编造数字**。

## 4. 更新 history
history 中：昨天日期已存在 → 覆盖为该日新计数；不存在 → 追加。
若中间有缺失日期（某天没跑成功），缺失日期的 4 项补 0。

## 5. 重算累计与等级
对每个属性：
```
points = 该属性 history 所有日期的和
level  = 满足 threshold(level) <= points 的最大整数，threshold(n) = n(n+1)/2
```
写入 attributes.<key>.points 与 attributes.<key>.level。

## 6. 写回
- updatedAt = 当前北京时间 ISO 字符串（如 "2026-08-06T03:00:00+08:00"）。
- 原子写回：先写 `data/stats.json.tmp` 再改名覆盖，保证 JSON 时刻合法。
- 保持 2 空格缩进、中文 label 不变。

## 7. 校验
用 Bash 执行：
`node -e "JSON.parse(require('fs').readFileSync('data/stats.json','utf8'))"`
确认可解析。失败则报告并保持文件为上一个合法版本。

## 8. 输出摘要
Markdown 四行，每行：`- 魅力：昨日完成 X 项，累计 Y 分，Lv.Z`。
若某标签在滴答清单中不存在或 MCP 报错，明确说明。
