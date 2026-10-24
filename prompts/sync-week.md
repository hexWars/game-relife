# 任务：每日增量同步（把「昨日」完成的滴答任务加入 data/tasks.json）

你负责：拉取数据、判定属性、执行脚本。数据的筛选 / 合并由脚本完成。
**只允许修改 data/tasks.json 和 data/.cache/ 下的临时文件。**

## 0. 先 Read prompts/classify-rules.md 了解属性判定规则。

## 1. 计算日期（北京时间）
用 Bash 执行 `TZ=Asia/Shanghai date +%F` 得到今天。
- 昨天 = 今天往前 1 个自然日
- 窗口起点 = 今天往前 7 个自然日

## 2. 拉取近 7 天已完成任务
用 dida365 MCP 的 `list_completed_tasks_by_date`：
```
search = { "startDate": "<窗口起点> 00:00:00", "endDate": "<今天> 23:59:59" }
```
把返回结果**原样**（不筛选、不改写）写入 `data/.cache/raw-week.json`（JSON 数组，空则写 `[]`）。

## 3. 筛选与去重（脚本完成）
Bash 执行：
```
node scripts/filter-new.mjs --yesterday <昨天>
```
脚本会：只保留 `completedTime` 换算成北京时间后 == 昨天的任务；再与 `data/tasks.json`
的 taskId 去重；把「新任务」写到 `data/.cache/new.json`，并打印数量。把数量报告给我。

## 4. 判定新任务
Read `data/.cache/new.json`。
- 若为空：跳过判定，直接到第 6 步。
- 否则：按 classify-rules.md 的规则，为每个新任务判定 `effects` 和 `reason`，
  写成数组写入 `data/.cache/classified.json`：
  ```
  [{ "taskId": "...", "completedAt": "...", "title": "...", "effects": {"charm":0,"intelligence":0,"stamina":0,"spirit":0}, "reason": "..." }]
  ```
  （`taskId` 用 id，`completedAt` 用 completedTime 原样保留；`title` 原样保留）

## 5. 合并（脚本完成）
Bash 执行：
```
node scripts/merge.mjs --classified data/.cache/classified.json
```
脚本会把结果合并进 `data/tasks.json`（按 taskId 去重，`updatedAt` 更新为北京时间 ISO）。

## 6. 七日无成长扣分（脚本完成）
Bash 执行：
```
node scripts/penalty.mjs
```
脚本按「任一属性连续 7 个自然日没有任何加分 → 当日该属性 -1」的规则重算，
写入 taskId 以 `penalty-` 开头的合成记录，评估到北京时间昨天。规则是确定性的，
**禁止 AI 自行添加扣分记录**。

## 7. 校验
Bash 执行：
```
node -e "JSON.parse(require('fs').readFileSync('data/tasks.json','utf8'))"
```

## 8. 输出摘要
- 昨日新增任务 N 个
- 七日无成长扣分：脚本输出的扣分天数与各属性合计
- 各属性当前累计点数（魅力 / 智力 / 体力 / 精神）
- 拉取或脚本报错时如实说明，**严禁编造**。
