# TikTok Script Brain

面向团队内部协作的 TikTok 内容生产系统，默认服务于美国 TikTok 市场，统一调用 `DeepSeek v4`。

详细操作说明见 [OPERATION_GUIDE.md](/Volumes/Ethank/TikTok%20Script%20Brain/OPERATION_GUIDE.md)。

## 目录

- `core/`: 生成、评审、修订、竞手预处理 Prompt
- `knowledge/`: 长期维护的风格库
- `inputs/`: 模板文件
- `products/`: 每个产品的知识资产
- `outputs/`: 每次任务的输出结果
- `archives/`: 历史高表现脚本与复盘

## 快速开始

1. 复制 `.env.example` 为 `.env` 并填写 `DEEPSEEK_API_KEY`
2. 在 `products/example_product/` 中准备产品资料
3. 检查 `inputs/script_parameters_template.md`
4. 运行：

```bash
node run.js --product example_product --params inputs/script_parameters_template.md
```

## 可选参数

```bash
node run.js \
  --product example_product \
  --params inputs/script_parameters_template.md \
  --competitor products/example_product/competitor_processed.md \
  --output outputs/custom_output.md \
  --archive
```

也支持任务配置文件：

```bash
node run.js --task tasks/example_task.json
```

也支持批量任务：

```bash
node run.js --batch tasks/example_batch.json
```

归档后的表现回填：

```bash
node run.js --updateMetrics tasks/example_metrics.json
```

生成复盘报告：

```bash
node report.js
```

## 任务配置

单任务配置示例：

```json
{
  "label": "Closet organizer - 30s test",
  "product": "example_product",
  "params": "inputs/script_parameters_template.md",
  "competitor": "products/example_product/competitor_processed.md",
  "output": "outputs/example_task_output.md",
  "archive": true,
  "archiveNotes": "Selected by creative lead for strong native hook quality.",
  "archiveTags": ["hook_test", "us_native", "home_org"]
}
```

批量配置示例：

```json
{
  "tasks": [
    {
      "label": "Task A",
      "product": "example_product",
      "params": "inputs/script_parameters_template.md"
    },
    {
      "label": "Task B",
      "product": "example_product",
      "params": "inputs/script_parameters_template.md",
      "output": "outputs/task_b.md"
    }
  ]
}
```

## 输出内容

每次运行会生成一个 Markdown 文件，包含：

- 任务元数据
- 原始生成脚本（Markdown 表格分镜格式）
- 评审报告
- 修订后终稿（Markdown 表格分镜格式）

额外会维护：

- `outputs/index.json`: 所有历史任务的结构化索引
- `outputs/index.md`: 方便团队直接查看的任务台账

如果任务启用了归档：

- `archives/high_performers/index.json`
- `archives/high_performers/index.md`
- `archives/high_performers/packages/*.md`
- `archives/high_performers/metadata/*.json`

## 高表现归档

当某次任务值得长期沉淀时，可以：

- 单命令模式加 `--archive`
- 在 `task` 或 `batch` 配置里设置 `"archive": true`

归档包会保留：

- 最终脚本
- 评审快照
- 归档说明
- 后续人工补录的投放表现字段

## 表现回填

归档后可以通过 JSON 文件补录投放结果，系统会同步更新：

- 归档元数据
- 归档包 Markdown
- 高表现索引
- 输出索引里的表现状态

示例：

```json
{
  "archiveSlug": "2026_05_11_example_product_example_product_30s_native_hooks",
  "status": "validated_winner",
  "views": "128000",
  "holdRate3s": "41%",
  "completionRate": "23%",
  "ctr": "2.8%",
  "cvr": "4.1%",
  "commentSignals": "People kept mentioning the first-line hook felt real.",
  "creativeTakeaway": "Pain-first hook with casual closet language beat aesthetic-first versions."
}
```

## 复盘报告

系统支持直接从索引生成复盘报告，适合团队周会、日会、单品复盘。

常见用法：

```bash
node report.js
node report.js --product example_product
node report.js --dateFrom 2026-05-01 --dateTo 2026-05-31
```

报告会汇总：

- 任务总数
- 归档数量
- 表现状态分布
- 各产品任务量
- 高表现资产数量
- 最近高表现创意结论

## 设计原则

- 知识资产和任务执行分层
- 团队协作角色清晰
- `generate -> review -> revise -> finalize` 闭环
- 模型配置和业务逻辑解耦

详细设计见 [tiktok_script_brain.md](/Volumes/Ethank/TikTok%20Script%20Brain/tiktok_script_brain.md)。
