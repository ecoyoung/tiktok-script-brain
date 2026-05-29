# TikTok Script Brain 操作手册

这份文档是给正式使用这套系统的团队成员准备的。

目标只有一个：让你不需要懂代码，也能按步骤完成一次脚本生产任务。

如果你是第一次使用，建议从头到尾看一遍。
如果你已经开始用了，可以直接跳到你需要的章节。

---

## 1. 这套系统是干什么的

TikTok Script Brain 是一个团队内部使用的内容生产系统。

它的作用不是“随便生成几条文案”，而是把下面这件事流程化：

1. 整理产品信息
2. 整理用户洞察
3. 整理竞手分析
4. 生成 TikTok 脚本
5. 自动评审
6. 修订成最终版本
7. 归档优秀内容
8. 回填真实投放数据
9. 生成复盘报告

你可以把它理解成一个“脚本工厂”。

---

## 2. 谁需要看这份文档

这份文档主要给这几类人使用：

- 内容运营：负责整理用户洞察、发起任务、查看结果
- 编导/投手：负责竞手分析、筛选强脚本、归档优秀内容
- 创意负责人：负责判断哪些脚本值得沉淀，做复盘
- 新同事：需要快速学会这套系统怎么跑

---

## 3. 正式使用前，你需要准备什么 What You Need Before Starting

开始前，请确认以下内容已经准备好。

### 3.1 必备文件 Required Files

你至少要准备这 4 类内容：

1. `products/[产品名]/product_brief.md`
2. `products/[产品名]/audience_insight.md`
3. `inputs/script_parameters_template.md` 或单独任务参数文件
4. `.env`

如果你这次还要参考竞手，那么再准备：

5. `products/[产品名]/competitor_processed.md`

### 3.2 必备环境 Required Environment

你需要确认：

- 当前项目已经在本地打开
- 终端可以运行 `node`
- `.env` 里已经填写真实的 `DEEPSEEK_API_KEY`

`.env` 中至少要有这一项：

```env
DEEPSEEK_API_KEY=你的真实key
```

如果没有填这个 key，系统无法调用模型。

---

## 4. 先认识项目目录 Project Structure

你正式使用时，最常接触的是这些目录和文件。

### 4.1 你最常操作的目录 Frequently Used Folders

- `products/`
  存放每个产品的资料

- `inputs/`
  存放通用模板

- `tasks/`
  存放任务配置文件

- `outputs/`
  存放每次生成结果

- `archives/high_performers/`
  存放被选中的优秀内容资产

- `reports/`
  存放复盘报告

### 4.2 你最常打开的文件 Frequently Used Files

- [products/example_product/product_brief.md]
- [products/example_product/audience_insight.md]
- [products/example_product/competitor_processed.md]
- [inputs/script_parameters_template.md]
- [tasks/example_task.json]
- [outputs/index.md]
- [archives/high_performers/index.md]
---

## 5. 一次完整任务的标准流程 Standard Workflow

正式使用时，建议你按照下面的顺序操作。

1. 准备产品资料
2. 准备用户洞察
3. 准备竞手分析
4. 设置本次脚本参数
5. 运行任务
6. 查看输出结果
7. 选择是否归档
8. 投放后回填数据
9. 生成复盘报告

下面我会按这个顺序详细说明。

---

## 6. 第一步：填写产品资料 Fill Product Brief

文件位置：
[products/example_product/product_brief.md](/Volumes/Ethank/TikTok%20Script%20Brain/products/example_product/product_brief.md)

这是系统判断“你卖的到底是什么”的基础文件。

### 6.1 每一项该怎么理解

`Category`

- 写产品所属类目
- 例如：home organization、beauty tool、pet supplies

`Product Name`

- 写产品名称

`Core Hook`

- 用一句话说明：这个产品为什么值得拍
- 不要写参数说明
- 要写用户为什么会在意它

错误示例：

- foldable organizer with breathable sides

更好的写法：

- a closet organizer that stops messy shelves from collapsing every time you grab one sweater

`Key Specs`

- 最多写 3 条
- 只写用户能感知到的点
- 不要堆技术参数

`Social Proof`

- 写评分、销量、达人背书、媒体背书
- 没有就留空，不要编

`Price & Positioning`

- 写价格、竞手价格区间、你的定位

`Do NOT Say`

- 这一部分非常重要
- 所有不能说的话都写在这里
- 例如：保证效果、违规词、品牌不允许的表达

### 6.2 填写原则

- 写消费者听得懂的内容
- 不要写老板视角和品牌自嗨表达
- 不确定的事实不要写
- 不要把这里写成产品详情页

---

## 7. 第二步：填写用户洞察 Fill Audience Insight

文件位置：
[products/example_product/audience_insight.md]
这是最影响脚本质量的文件之一。

如果这一份写得好，生成结果会自然很多。
如果这一份写得空，脚本就容易假。

### 7.1 重点先抓什么

优先抓这几类信息：

1. 用户真实原话
2. 用户最烦的痛点
3. 用户为什么愿意买
4. 用户为什么不信
5. 用户平时怎么说话

### 7.2 什么是“好的用户原话”

好的用户原话通常有这几个特点：

- 很口语
- 很具体
- 有情绪
- 一看就像评论区里会出现的话

例如：

- "every time I grab one sweater the whole pile falls"
- "okay wait this actually helps me keep things folded"

### 7.3 什么不是好的用户原话

- 你自己总结出来的标准句
- 太像营销文案的话
- 中文翻译后的美化句子

例如下面这种就不够好：

- this product effectively solves closet organization problems

### 7.4 填写建议

`Who They Are`

- 写清楚人群是谁
- 他们在什么生活场景下会遇到这个问题

`Gold Quotes: Positive`

- 填用户喜欢这个产品时会说的话

`Gold Quotes: Pain`

- 填用户在抱怨这个问题时会说的话

`Competitor Weakness`

- 填竞手差评里最有价值的话

`Purchase Triggers`

- 填用户为什么会下单

`Objections / Resistance`

- 填用户为什么会不信、不想买、会划走

`Language Notes`

- 填这个人群平时会用什么词
- 也可以写哪些词听起来很假

---

## 8. 第三步：填写竞手分析 Fill Competitor Analysis

文件位置：
[products/example_product/competitor_processed.md]

这一步不是必须，但强烈建议做。

因为它可以帮助系统避开“大家都在说的话”，去找差异化切角。

### 8.1 这一步要解决什么问题

它要回答这几个问题：

- 竞手怎么开头
- 竞手怎么卖
- 竞手靠什么情绪在转化
- 竞手忽略了什么
- 我们应该从哪里切进去

### 8.2 填写时最重要的部分

最重要的不是抄竞手结构，而是写清楚：

- `Weakness`
- `Gap / Differentiation Opportunity`
- `Our Strategic Angle`

也就是：

- 他们哪里弱
- 他们没说什么
- 我们应该抢什么位置

### 8.3 填写原则

- 不要只写“这条视频挺好”
- 不要只写“有 demo、有 CTA”
- 要写对创作真的有帮助的信息

例如：

- 大多数竞手都在卖“收纳后很整齐”，但没人抓“每次拿一件衣服整堆都塌”的真实烦躁感

这种就是有效洞察。

### 8.4 如果你拿到的是原始竞手脚本怎么办

很多时候你手里不是整理好的分析卡，而是一段原始英文或西语脚本。

这时不要手动硬整理，直接走系统预处理。

原始输入文件示例：
[test/inputs/competitor_raw_template.md](/Volumes/Ethank/TikTok%20Script%20Brain/test/inputs/competitor_raw_template.md)

先把原始脚本粘进去，然后运行：

```bash
node run.js --preprocessCompetitor inputs/competitor_raw_template.md --output products/example_product/competitor_processed_from_raw.md
```

这条命令会做三件事：

1. 读取原始竞手脚本
2. 读取你在 raw 文件里填写的竞手品牌 / 类目 / 链接等元信息
3. 调用 LLM 按预处理 Prompt 结构化整理
4. 输出成系统可直接使用的竞手分析文件

输出文件示例：
[test/products/example_product/competitor_processed_from_raw.md](/Volumes/Ethank/TikTok%20Script%20Brain/test/products/example_product/competitor_processed_from_raw.md)

后面正式生成脚本时，直接把 `competitor` 指向这份文件就行。

补充说明：

- `competitor_raw_template.md` 是日常填写入口
- `competitor_processed_template.md` 不是日常填写入口
- `competitor_processed_template.md` 主要用于看标准格式，或特殊情况下人工补写 / 修正

---

## 9. 第四步：设置本次任务参数 Set Script Parameters

文件位置：
[inputs/script_parameters_template.md]

这是你在告诉系统：“这一次我想生成什么样的脚本”。

你现在的模板大概长这样：

```md
## SCRIPT PARAMETERS

**Video Length:**
- 60 seconds

**Output Count:**
- 3

**Role Perspective:**
- real user share

**Emotional Tone:**
- authentic resonance

**Special Requirements:**
- Make the hooks feel native to US TikTok
```

### 9.1 每一项怎么填

`Video Length`

- 写本次要做几秒的视频
- 常见写法：15 seconds、30 seconds、60 seconds

`Output Count`

- 写本次要生成几条
- 建议先从 3 条开始
- 如果你只是测不同开头，也可以写 5 到 10 条

`Role Perspective`

- 写视频的说话视角
- 例如：
  `real user share`
  `friend recommendation`
  `POV immersive`
  `voiceover explainer`

`Emotional Tone`

- 写这次想要的情绪方向
- 例如：
  `authentic resonance`
  `surprised discovery`
  `light humor`
  `practical trust`

`Special Requirements`

- 写这一次最特别的要求
- 例如：
  让前 3 秒更强
  避开太广告的表达
  多用评论区原话

### 9.2 参数文件要不要每次新建

建议：

- 临时小测试可以直接改模板
- 正式任务建议单独复制一份参数文件

例如你可以新建：

- `inputs/params_home_org_30s_test.md`
- `inputs/params_pet_hair_15s_hook_test.md`

这样以后好追溯。

---

## 10. 第五步：选择运行方式 Choose How To Run

你有三种常用运行方式。

---

### 10.1 方式一：直接命令运行

适合：

- 你只想临时跑一次
- 你已经知道产品目录和参数文件

命令：

```bash
node run.js --product example_product --params inputs/script_parameters_template.md
```

这条命令的意思是：

- 用 `products/example_product/` 里的产品资料
- 用 `inputs/script_parameters_template.md` 作为本次任务参数
- 调用 DeepSeek v4 生成、评审、修订

如果你还想带上竞手分析并自定义输出文件：

```bash
node run.js \
  --product example_product \
  --params inputs/script_parameters_template.md \
  --competitor products/example_product/competitor_processed.md \
  --output outputs/example_custom_result.md
```

如果你希望这次结果直接进入高表现归档：

```bash
node run.js \
  --product example_product \
  --params inputs/script_parameters_template.md \
  --archive
```

---

### 10.2 方式二：任务文件运行

适合：

- 团队正式协作
- 希望把一次任务固定下来
- 希望别人能直接复跑同一个任务

文件位置示例：
[tasks/example_task.json]

示例：

```json
{
  "label": "Example Product - 30s Native Hooks",
  "product": "example_product",
  "params": "inputs/script_parameters_template.md",
  "competitor": "products/example_product/competitor_processed.md",
  "output": "outputs/example_product_single_task.md",
  "archive": true,
  "archiveNotes": "Strong baseline example for native-sounding US closet organization hooks.",
  "archiveTags": ["baseline", "home_org", "native_hook"]
}
```

运行命令：

```bash
node run.js --task tasks/example_task.json
```

这是最推荐的正式使用方式。

因为它有几个好处：

- 任务更清晰
- 别人容易接手
- 输出更可追溯
- 便于归档和复盘

如果这次任务要接入“原始竞手脚本 -> LLM 预处理”后的结果，记得把任务里的 `competitor` 路径改成处理后的文件，比如：

```json
"competitor": "products/example_product/competitor_processed_from_raw.md"
```

---

### 10.3 方式三：批量任务运行

适合：

- 一次跑多个产品
- 同一个产品跑多个方向
- 团队集中出稿

文件位置示例：
[tasks/example_batch.json]
运行命令：

```bash
node run.js --batch tasks/example_batch.json
```

建议在这些场景用：

- 同一产品测试 3 套不同情绪方向
- 同一批产品一天统一出初稿
- 周期性批量生成内容池

---

## 11. 第六步：怎么看输出结果 Read Outputs

每跑完一次任务，系统会生成一个输出文件。

位置通常在：

- `outputs/某个结果文件.md`

### 11.1 输出文件里有什么

输出通常包含三部分：

1. `Generated Scripts`
   模型第一次生成的脚本，使用 Markdown 表格分镜格式

2. `Review Report`
   系统自动评审结果

3. `Final Scripts`
   根据评审修订后的最终版本，依然保持 Markdown 表格分镜格式

### 11.1.1 现在的标准脚本格式是什么

从现在开始，脚本结果不是一整段口播文案，而是标准化分镜表。

每条脚本都会包含这些列：

- `分镜序号`
- `脚本原文`
- `中文翻译`
- `视频结构`

其中：

- `分镜序号`：按视频逻辑顺序排列
- `脚本原文`：英文或西语原始口播/旁白
- `中文翻译`：语义准确、口语化、有网感的中文
- `视频结构`：该分镜所属营销模块，例如 `Hook`、`Pain`、`Social Proof`、`Product Demo`、`CTA`

### 11.2 你最应该先看哪里

建议先看：

1. `Review Report`
2. `Final Scripts`

原因很简单：

- 初稿可能有亮点，但也可能有问题
- 修订稿更接近可拍版本

### 11.3 怎样判断这次结果好不好

重点看这几件事：

- 开头 3 秒有没有停留感
- 是不像广告，像不像真人
- 有没有用到真实用户语言
- 情绪是不是成立
- 有没有合规风险

如果某条脚本满足下面几个条件，通常值得重点考虑：

- 开头够快
- 原话自然
- 场景真实
- 不硬卖
- 不假、不翻译腔

---

## 12. 第七步：怎么看任务总表 Read Output Index

文件位置：
[outputs/index.md]

这个文件像任务台账。

它会记录：

- 什么时候跑的
- 跑的是哪个产品
- 任务标签是什么
- 用的是哪个模型
- 输出文件在哪里
- 是否归档
- 当前表现状态

### 12.1 什么时候看它

这些时候最有用：

- 你忘了昨天跑过什么
- 你要找某个产品的历史结果
- 你要确认一条任务有没有归档
- 你要准备周会汇报

---

## 13. 第八步：什么时候归档高表现脚本 Archive High Performers

不是每次结果都应该归档。

归档的意思是：

“这次结果值得长期沉淀，以后还要参考。”

### 13.1 适合归档的情况

建议满足下面任一情况再归档：

- 创意负责人认为这次质量明显高于平均
- 某条 Hook 很有复用价值
- 某条 POV 或情绪线很有代表性
- 投放结果验证它确实有效

### 13.2 如何归档

有两种方式。

方式一：命令直接加 `--archive`

```bash
node run.js --product example_product --params inputs/script_parameters_template.md --archive
```

方式二：在任务文件里写：

```json
"archive": true
```

### 13.3 归档后会发生什么

系统会更新这些内容：

- `archives/high_performers/index.json`
- `archives/high_performers/index.md`
- `archives/high_performers/packages/*.md`
- `archives/high_performers/metadata/*.json`

### 13.4 归档包是干什么的

归档包里会保留：

- 最终脚本
- 评审快照
- 归档说明
- 表现回填区域

它的意义是：

- 以后做相似产品时可以参考
- 周会复盘时能快速翻
- 高表现经验可以沉淀下来

---

## 14. 第九步：投放后怎么回填表现数据 Update Performance Metrics

当一条已经归档的内容完成投放后，你可以把真实数据补回系统。

这样系统以后就不只是“主观觉得这条好”，而是知道“这条真的跑出来了”。

### 14.1 用什么文件回填

示例文件：
[tasks/example_metrics.json]

示例内容：

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

### 14.2 `archiveSlug` 是什么

它是系统给某个归档任务生成的唯一标识。

你可以在这里找到它：

- 高表现归档包文件里
- `archives/high_performers/index.json`
- `archives/high_performers/index.md`

### 14.3 回填命令怎么跑

```bash
node run.js --updateMetrics tasks/example_metrics.json
```

### 14.4 回填后会更新哪些地方

系统会同步更新：

- 归档元数据
- 归档包 Markdown
- 高表现索引
- 输出索引里的表现状态

### 14.5 `status` 怎么写比较合适

建议团队内部统一几个状态，避免每个人乱写。

例如：

- `pending_manual_update`
- `early_signal_good`
- `validated_winner`
- `average`
- `weak`

这样后面统计会更清晰。

---

## 15. 第十步：怎么生成复盘报告 Generate Reports

文件脚本：
[report.js]

报告输出目录：
[reports/README.md]

### 15.1 全量报告

```bash
node report.js
```

适合：

- 日报
- 周报
- 整体项目复盘

### 15.2 按产品过滤

```bash
node report.js --product example_product
```

适合：

- 单品专项复盘
- 某产品连续测试回顾

### 15.3 按时间过滤

```bash
node report.js --dateFrom 2026-05-01 --dateTo 2026-05-31
```

适合：

- 月度复盘
- 某个投放周期复盘

### 15.4 报告里会有什么

报告会汇总这些信息：

- 任务总数
- 已归档数量
- 未归档数量
- 表现状态分布
- 各产品任务数量
- 高表现资产数量
- 最近高表现创意结论

---

## 16. 推荐的团队使用方式 Recommended Team Workflow

如果你们准备正式使用，我建议按下面的协作方式落地。

### 16.1 推荐分工

产品侧负责：

- `product_brief.md`

内容运营负责：

- `audience_insight.md`
- `script parameters`
- 发起任务

投手/编导负责：

- `competitor_processed.md`
- 归档判断建议

创意负责人负责：

- 最终判断哪些脚本值得进入高表现资产
- 看复盘报告
- 更新风格库

### 16.2 推荐工作节奏

日常节奏可以这样安排：

1. 先补产品资料和用户洞察
2. 每天或每周统一跑任务
3. 挑出最强脚本进入归档
4. 投放后补回数据
5. 周会前跑一次复盘报告

---

## 17. 最推荐的新手使用路径 Best First Run Path

如果你是第一次正式跑，建议按这个顺序来。

### 第一步

先检查：

- [.env]
- [product_brief.md]
- [audience_insight.md]
- [competitor_processed.md]
- [script_parameters_template.md]

### 第二步

跑这条命令：

```bash
node run.js --task tasks/example_task.json
```

### 第三步

打开：

- `outputs/生成结果文件.md`
- [outputs/index.md]

### 第四步

如果结果不错，确认任务配置中有：

```json
"archive": true
```

### 第五步

投放后再运行：

```bash
node run.js --updateMetrics tasks/example_metrics.json
```

### 第六步

最后运行：

```bash
node report.js
```

---

## 18. 常见问题 FAQ

### Q1：运行时报 `Missing DEEPSEEK_API_KEY`

原因：

- `.env` 没填
- `.env` 填错了
- key 无效

先检查：

- [ .env ](/Volumes/Ethank/TikTok%20Script%20Brain/.env)

确认至少有：

```env
DEEPSEEK_API_KEY=你的真实key
```

### Q2：为什么生成出来的脚本很假

通常先检查这三件事：

1. `audience_insight.md` 里有没有真实原话
2. `product_brief.md` 有没有写成产品详情页
3. `Special Requirements` 有没有明确要求“像美国 TikTok 真人口播”

### Q3：为什么竞手输入了，但结果差异化不明显

通常原因是：

- 竞手分析写得太表面
- 没写清楚 gap
- 没写清楚我们应该抢哪个角度

### Q4：归档后回填报 `Archive slug not found`

原因通常是：

- 这条任务其实还没归档
- `archiveSlug` 填错了
- 你回填的是示例文件，不是真实归档生成出来的 slug

### Q5：什么时候该用 `--task`，什么时候直接命令跑

建议：

- 正式团队协作：优先 `--task`
- 临时测试：可以直接命令跑
- 批量任务：用 `--batch`

---

## 19. 一句话总结正式使用方法 One-Line Summary

正式使用时，你只要记住这 6 步：

1. 填 `.env`
2. 填 `product_brief`
3. 填 `audience_insight`
4. 填 `script parameters`
5. 跑 `node run.js --task ...`
6. 看输出、归档、回填、复盘

---

## 20. 你现在最应该做什么 What To Do Next

如果你要立刻开始正式使用，建议你现在就按这个顺序操作：

1. 把 [products/example_product/product_brief.md](/Volumes/Ethank/TikTok%20Script%20Brain/products/example_product/product_brief.md) 改成真实产品内容
2. 把 [products/example_product/audience_insight.md](/Volumes/Ethank/TikTok%20Script%20Brain/products/example_product/audience_insight.md) 改成真实用户洞察
3. 把 [products/example_product/competitor_processed.md](/Volumes/Ethank/TikTok%20Script%20Brain/products/example_product/competitor_processed.md) 改成真实竞手分析
4. 检查 [inputs/script_parameters_template.md](/Volumes/Ethank/TikTok%20Script%20Brain/inputs/script_parameters_template.md)
5. 确认 [.env](/Volumes/Ethank/TikTok%20Script%20Brain/.env) 已填 `DEEPSEEK_API_KEY`
6. 运行：

```bash
node run.js --task tasks/example_task.json
```

如果你愿意，下一步我可以继续帮你做一份更偏“团队培训版”的文档，例如：

- 运营填写示例版
- 编导/投手填写示例版
- 新员工上手检查清单
