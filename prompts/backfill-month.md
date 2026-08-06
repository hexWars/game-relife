# 任务：回填一个月的滴答已完成任务（{{START}} ~ {{END}}）

你负责：拉取本月的已完成任务并按规则判定属性，只写入一个文件。

## 0. 先 Read prompts/classify-rules.md 了解属性判定规则。

## 1. 拉取
用 dida365 MCP 的 `list_completed_tasks_by_date`：
```
search = { "startDate": "{{START}}", "endDate": "{{END}}" }
```

## 2. 写原始结果
把返回结果**原样**（不筛选、不改写）写入 `{{OUTFILE}}`（JSON 数组，空则写 `[]`）。

## 3. 判定
Read `{{OUTFILE}}`。按 classify-rules.md 的规则，为每条任务判定 `effects` 和 `reason`，
把**完整记录数组**写回 `{{OUTFILE}}`：
```
[{ "taskId": "...", "completedAt": "...", "title": "...", "effects": {"charm":0,"intelligence":0,"stamina":0,"spirit":0}, "reason": "..." }]
```
（`taskId` 用 id，`completedAt` 用 completedTime 原样保留；`title` 原样保留）

## 4. 校验
Bash 执行 `node -e "JSON.parse(require('fs').readFileSync('{{OUTFILE}}','utf8'))"`。

只允许写 `{{OUTFILE}}` 这一个文件。**严禁编造任务或属性；拉取失败时如实报告并保留原样。**
