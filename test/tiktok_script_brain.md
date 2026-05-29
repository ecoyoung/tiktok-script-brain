# TikTok Script Brain v2

> 定位：面向团队内部协作的 TikTok 内容生产系统
> 目标市场：美国 TikTok
> 模型约束：统一调用 `DeepSeek v4`
> 核心目标：稳定产出、标准协作、资产沉淀、持续迭代

---

## 一、系统定义

TikTok Script Brain 不是一个“帮人写脚本的 Prompt”，而是一个团队内容生产中台。

它解决的是四个问题：

1. 不同成员写出来的脚本风格不稳定
2. 用户洞察和竞手分析无法沉淀复用
3. 脚本生成后缺少统一评审标准
4. 跑出好结果之后，经验无法回流到系统

因此，这个系统必须同时具备：

- 标准化输入
- 可控生成
- 自动评审
- 修订闭环
- 历史归档
- 团队协作边界

---

## 二、系统目标

### 1. 对团队的目标

- 让不同运营成员都能产出接近水准的脚本
- 让内容负责人可以统一管控风格和质量
- 让投手、编导、选品、文案之间协作有清晰边界

### 2. 对产出的目标

- 生成的不是广告文案，而是符合美国 TikTok 语境的原生短视频脚本
- 每条脚本都必须具备明确 Hook、情绪弧线、场景感和软性 CTA
- 生成结果需要经过统一评审，低分项必须可修订

### 3. 对系统的目标

- 输入资产可以长期维护
- 每次生成都可追溯使用了哪些素材和配置
- 高表现脚本可以持续回流到风格库和知识库

---

## 三、双层架构

系统分为两层：知识资产层 + 任务执行层。

### A. 知识资产层

这层不应被视为一次性输入，而是团队共享资产。

1. `product_brief`
   定义产品是什么、卖点是什么、不能说什么。

2. `audience_insight`
   定义用户是谁、怎么说话、在抱怨什么、在为什么买单。

3. `style_guide_us`
   定义美国 TikTok 语感、平台习惯、禁用表达、内容节奏。

4. `competitor_processed`
   定义竞手已经说了什么、没说什么、我们切哪里更有优势。

### B. 任务执行层

这层用于每次具体的产出任务。

1. `script_parameters`
   决定长度、数量、角色视角、情绪方向、特殊要求。

2. `generate`
   调用 `DeepSeek v4` 生成脚本矩阵。

3. `review`
   从本地化语感、开头 3 秒、真实感、情绪共鸣、平台合规五个维度评分。

4. `revise`
   根据评审结果进行定向修订，不是推倒重来。

5. `finalize`
   输出最终版本并归档。

---

## 四、团队协作角色

为了让系统稳定运行，必须明确谁维护哪类输入。

### 1. 选品/产品侧

负责：

- 填写 `product_brief`
- 提供价格、规格、卖点、品牌禁区

不负责：

- 写美区口语化表达
- 决定最终内容风格

### 2. 内容运营

负责：

- 填写和更新 `audience_insight`
- 收集 TikTok、Amazon、竞手评论中的用户原话
- 提供痛点、正向反馈、意外使用场景

### 3. 创意负责人

负责：

- 维护 `style_guide_us`
- 审核脚本是否符合平台语境
- 维护高表现 Hook 库

### 4. 投手/编导

负责：

- 收集竞手脚本
- 完成 `competitor_processed`
- 结合投放经验补充差异化切角

### 5. 执行成员

负责：

- 填写 `script_parameters`
- 运行任务
- 查看评审结果
- 选择最终拍摄版本

---

## 五、输入模块规范

### 模块 1：产品信息档案

来源：产品侧  
更新频率：产品变动时更新  
文件：`products/[product_slug]/product_brief.md`

```markdown
## PRODUCT BRIEF

**Category:**

**Product Name:**

**Core Hook:**
> 用一句话说明这个产品为什么值得被注意。

**Key Specs:**
- 
- 
- 

**Social Proof:**
- Rating / Sales:
- Media / KOL:
- Certification / Award:

**Price & Positioning:**
- Price:
- Competitor Range:
- Positioning:

**Do NOT Say:**
- Unsupported claims:
- Restricted words:
- Brand tone taboos:
```

### 模块 2：消费者洞察

来源：评论、论坛、竞手评论区、平台反馈  
更新频率：每周或每个投放周期  
文件：`products/[product_slug]/audience_insight.md`

```markdown
## AUDIENCE INSIGHT

**Who They Are:**

**Gold Quotes: Positive**
- "..."
- "..."
- "..."

**Gold Quotes: Pain**
- "..."
- "..."
- "..."

**Competitor Weakness**
- "..."
- "..."

**Unexpected Use Cases**
- 
- 
```

### 模块 3：美区风格库

来源：创意负责人维护  
更新频率：长期滚动更新  
文件：`knowledge/style_guide_us.md`

作用：

- 统一语言风格
- 统一平台禁区
- 沉淀高表现 Hook 和 CTA
- 约束模型输出边界

### 模块 4：竞手分析

来源：投手/编导  
更新频率：有新竞手素材时  
文件：

- 原始素材：`inputs/competitor_raw_template.md`
- 处理结果：`products/[product_slug]/competitor_processed.md`

要求：

- 不做简单模仿
- 必须指出竞手空白
- 必须给出差异化切入方向

### 模块 5：脚本控制参数

来源：执行成员  
更新频率：每次任务都填写  
文件：`inputs/script_parameters_template.md` 或独立任务文件

---

## 六、生成与评审闭环

统一流程为：

1. `generate`
   生成脚本矩阵

2. `review`
   对每条脚本打分并指出问题

3. `revise`
   只针对低分项修订

4. `finalize`
   输出最终可拍摄版本

这里最关键的是：评审不只用于看报告，而是必须进入修订环节。

建议规则：

- 任一脚本总分低于 18/25，进入修订
- `Localization` 或 `Hook Power` 小于 4 分，强制重写
- `Compliance` 小于 5 分，禁止进入最终产出

---

## 七、模型与配置原则

统一使用 `DeepSeek v4`，但工程上不要把模型写死在业务逻辑中。

配置层必须支持：

- `DEEPSEEK_API_KEY`
- `DEEPSEEK_BASE_URL`
- `DEEPSEEK_MODEL`
- `DEEPSEEK_TEMPERATURE`
- `DEEPSEEK_MAX_TOKENS`

原因：

1. 方便切换环境
2. 方便后续做不同模型 AB test
3. 方便团队统一调参

---

## 八、推荐目录结构

```text
TikTok Script Brain/
├── README.md
├── .env.example
├── run.js
├── tiktok_script_brain.md
│
├── core/
│   ├── main_prompt.md
│   ├── review_prompt.md
│   ├── revise_prompt.md
│   └── competitor_preprocess.md
│
├── knowledge/
│   └── style_guide_us.md
│
├── inputs/
│   ├── product_brief_template.md
│   ├── audience_insight_template.md
│   ├── competitor_raw_template.md
│   ├── competitor_processed_template.md
│   └── script_parameters_template.md
│
├── products/
│   └── example_product/
│       ├── product_brief.md
│       ├── audience_insight.md
│       └── competitor_processed.md
│
├── outputs/
│   ├── index.json
│   └── index.md
│
└── archives/
    └── high_performers/
        ├── index.json
        ├── index.md
        └── packages/
```

---

## 九、SOP

### 第一步：初始化产品资产

- 创建 `products/[product_slug]/`
- 填写 `product_brief.md`
- 填写 `audience_insight.md`
- 如有需要，补充 `competitor_processed.md`

### 第二步：准备本次任务

- 复制一份 `script_parameters_template.md`
- 明确本次长度、数量、视角、情绪方向、特殊要求

### 第三步：运行脚本生成

```bash
node run.js --product example_product --params inputs/script_parameters_template.md
```

如包含竞手分析：

```bash
node run.js --product example_product --params inputs/script_parameters_template.md --competitor products/example_product/competitor_processed.md
```

也可以把任务写入 JSON 配置文件：

```bash
node run.js --task tasks/example_task.json
```

如需团队排产或批量出稿：

```bash
node run.js --batch tasks/example_batch.json
```

### 第四步：查看结果

输出文件会包含：

- 原始生成脚本
- 评审报告
- 修订后终稿
- 输出元数据

同时系统会自动维护：

- `outputs/index.json` 作为结构化任务索引
- `outputs/index.md` 作为团队可读的任务台账

### 第五步：复盘与沉淀

- 把高表现 Hook 追加到 `knowledge/style_guide_us.md`
- 把实战反馈补进 `audience_insight.md`
- 把高表现成品整理进 `archives/`

如果某次结果值得沉淀，可以在任务配置中启用 `archive: true`，系统会把该次结果整理进高表现归档包。

---

## 十、任务配置建议

为了适应团队协作，建议把“本次要跑什么任务”单独做成配置文件，而不是每次手打命令。

单任务配置建议字段：

- `label`
- `product`
- `params`
- `competitor`
- `output`
- `archive`
- `archiveNotes`
- `archiveTags`

批量任务配置建议结构：

- `tasks: []`

适用场景：

- 同一产品压不同情绪基调
- 同一参数跑多个产品
- 同一天排量产脚本任务

这样执行成员不需要理解完整命令，只需要维护任务清单即可。

---

## 十一、输出索引与高表现归档

### 1. 输出索引

`outputs/` 不只是保存 Markdown 结果，还应该承担任务追溯功能。

建议默认维护：

- `outputs/index.json`
- `outputs/index.md`

记录字段包括：

- 生成时间
- 任务标签
- 产品名
- 模型名
- 参数文件
- 竞手文件
- 输出文件路径
- 是否已归档
- 当前表现状态

这样团队可以快速回答这些问题：

- 某天跑了哪些任务
- 某个产品最近用了什么参数
- 哪些任务已经被选为高表现资产

### 2. 高表现归档

`archives/high_performers/` 用来沉淀“值得长期复用”的资产，而不是保存所有运行结果。

建议一个任务只有在以下情况才归档：

- 创意负责人主观判断质量很高
- 投放后数据确认表现优秀
- 某条 Hook / POV / 情绪线值得复用

归档包建议包含：

- 最终脚本
- 当时的评审结果
- 为什么归档
- 使用了哪些输入资产
- 后续补录的真实投放表现

建议额外维护一份 `metadata/*.json`，让后续表现更新不需要手改 Markdown。

这样归档的价值不只是“存起来”，而是成为未来创意训练样本。

### 3. 表现回填

高表现资产归档后，系统还应该支持后续补录真实投放数据。

建议支持的字段：

- `archiveSlug`
- `status`
- `views`
- `holdRate3s`
- `completionRate`
- `ctr`
- `cvr`
- `commentSignals`
- `creativeTakeaway`

回填动作完成后，应该同步更新：

- 归档元数据
- 归档 Markdown 包
- 高表现索引
- 输出索引里的表现状态

这样团队后续就能回答：

- 哪些是主观上觉得好，哪些是真正被数据验证过
- 某类 Hook 到底是不是稳定有效
- 哪种 POV 在某个品类更容易跑赢

### 4. 复盘报告

除了索引页，系统还应该支持一键生成复盘报告。

建议支持：

- 全量报告
- 按产品过滤
- 按时间范围过滤

报告中至少汇总：

- 任务总量
- 已归档数量
- 表现状态分布
- 各产品任务分布
- 高表现资产分布
- 最近沉淀下来的创意结论

这样内容负责人不需要手动翻索引，就能快速看系统最近学到了什么。

## 十二、下一阶段扩展方向

### 1. 数据反馈闭环

后续建议加入字段：

- 播放量
- 3 秒停留率
- 完播率
- CTR
- CVR
- 评论关键词

### 2. 历史脚本检索

建立高表现 Hook 索引，便于同品类复用。

### 3. 多市场扩展

通过新增 `style_guide_[market].md` 支持英国、加拿大、澳洲等市场。

### 4. 半自动化洞察采集

后续可接入评论抓取或人工录入表单，把模块 2 做成结构化资产。

---

## 十三、当前版本判断

这个系统的 v1 目标不是“最聪明”，而是“最稳定”。

优先级顺序应该是：

1. 输入标准化
2. 输出稳定性
3. 团队协作清晰度
4. 历史沉淀能力
5. 高级自动化

只要这五项打牢，后面无论继续用 `DeepSeek v4`，还是引入更多模型、评分体系、投放反馈，这个底座都不会推翻重来。
