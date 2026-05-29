import { competitorCardHasContent, filterCompetitorCards } from "./competitor";
import {
  AudienceInsight,
  CompetitorProcessed,
  ProductBrief,
  ScriptCard,
} from "./types";

function matchSingle(content: string, pattern: RegExp): string {
  const match = content.match(pattern);
  return match?.[1]?.trim() ?? "";
}

function matchBlock(content: string, pattern: RegExp): string {
  const match = content.match(pattern);
  return match?.[1]?.trim() ?? "";
}

function lines(value: string): string[] {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseBullets(block: string): string[] {
  return block
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim())
    .filter(Boolean);
}

export function parseProductBrief(content: string): ProductBrief {
  return {
    category: matchSingle(content, /\*\*Category（产品类目）:\*\*\s*(.*)/),
    productName: matchSingle(content, /\*\*Product Name（产品名称）:\*\*\s*(.*)/),
    coreHook: matchBlock(content, /\*\*Core Hook（核心钩子）:\*\*\s*>\s*([\s\S]*?)(?=\n\*\*|\n##|\Z)/),
    keySpecs: parseBullets(matchBlock(content, /\*\*Key Specs（关键卖点参数）:\*\*\s*([\s\S]*?)(?=\n\*\*|\n##|\Z)/)),
    ratingSales: matchSingle(content, /- Rating \/ Sales（评分 \/ 销量）:\s*(.*)/),
    mediaKol: matchSingle(content, /- Media \/ KOL（媒体 \/ 达人背书）:\s*(.*)/),
    certificationAward: matchSingle(content, /- Certification \/ Award（认证 \/ 奖项）:\s*(.*)/),
    price: matchSingle(content, /- Price（售价）:\s*(.*)/),
    competitorRange: matchSingle(content, /- Competitor Range（竞品价格区间）:\s*(.*)/),
    positioning: matchSingle(content, /- Positioning（定位）:\s*(.*)/),
    unsupportedClaims: matchSingle(content, /- Unsupported claims（不能承诺的效果）:\s*(.*)/),
    restrictedWords: matchSingle(content, /- Restricted words（限制词 \/ 违规词）:\s*(.*)/),
    toneTaboos: matchSingle(content, /- Brand tone taboos（品牌语气禁区）:\s*(.*)/),
  };
}

export function renderProductBrief(data: ProductBrief): string {
  const keySpecs = data.keySpecs.map((item) => `- ${item}`).join("\n") || "- ";
  return `## PRODUCT BRIEF（产品信息档案）

**Category（产品类目）:** ${data.category}

**Product Name（产品名称）:** ${data.productName}

**Core Hook（核心钩子）:**
> ${data.coreHook}

**Key Specs（关键卖点参数）:**
${keySpecs}

**Social Proof（社交证明）:**
- Rating / Sales（评分 / 销量）: ${data.ratingSales}
- Media / KOL（媒体 / 达人背书）: ${data.mediaKol}
- Certification / Award（认证 / 奖项）: ${data.certificationAward}

**Price & Positioning（价格与定位）:**
- Price（售价）: ${data.price}
- Competitor Range（竞品价格区间）: ${data.competitorRange}
- Positioning（定位）: ${data.positioning}

**Do NOT Say（禁止表达）:**
- Unsupported claims（不能承诺的效果）: ${data.unsupportedClaims}
- Restricted words（限制词 / 违规词）: ${data.restrictedWords}
- Brand tone taboos（品牌语气禁区）: ${data.toneTaboos}
`;
}

export function parseAudienceInsight(content: string): AudienceInsight {
  return {
    ageRange: matchSingle(content, /\*\*年龄段:\*\*\s*(.*)/),
    lifeStage: matchSingle(content, /\*\*人生阶段:\*\*\s*(.*)/),
    persona: matchSingle(content, /\*\*用户画像:\*\*\s*(.*)/),
    typicalDailyScene: matchSingle(content, /\*\*典型日常场景:\*\*\s*(.*)/),
    whyProblemMatters: matchSingle(content, /\*\*为什么这个问题对他们重要:\*\*\s*(.*)/),
    positiveQuotes: parseBullets(matchBlock(content, /\*\*用户正向原话\*\*\s*([\s\S]*?)(?=\n\*\*|\n##|$)/)),
    painQuotes: parseBullets(matchBlock(content, /\*\*用户痛点原话\*\*\s*([\s\S]*?)(?=\n\*\*|\n##|$)/)),
    competitorWeakness: parseBullets(matchBlock(content, /\*\*竞手弱点\*\*\s*([\s\S]*?)(?=\n\*\*|\n##|$)/)),
    unexpectedUseCases: parseBullets(matchBlock(content, /\*\*意外使用场景\*\*\s*([\s\S]*?)(?=\n\*\*|\n##|$)/)),
    purchaseTriggers: lines(matchSingle(content, /\*\*购买触发点:\*\*\s*(.*)/)),
    confidenceBuilders: lines(matchSingle(content, /\*\*建立信任的证据:\*\*\s*(.*)/)),
    scrollAwayReasons: lines(matchSingle(content, /\*\*为什么会划走:\*\*\s*(.*)/)),
    trustIssues: lines(matchSingle(content, /\*\*为什么不信任:\*\*\s*(.*)/)),
    naturalWords: lines(matchSingle(content, /\*\*用户自然表达:\*\*\s*(.*)/)),
  };
}

export function renderAudienceInsight(data: AudienceInsight): string {
  const bullets = (items: string[]) => items.map((item) => `- ${item}`).join("\n") || "- ";
  const first = (items: string[]) => items.join("；");
  return `## AUDIENCE INSIGHT（消费者洞察）

**年龄段:** ${data.ageRange}
**人生阶段:** ${data.lifeStage}
**用户画像:** ${data.persona}
**典型日常场景:** ${data.typicalDailyScene}
**为什么这个问题对他们重要:** ${data.whyProblemMatters}

**用户正向原话**
${bullets(data.positiveQuotes)}

**用户痛点原话**
${bullets(data.painQuotes)}

**竞手弱点**
${bullets(data.competitorWeakness)}

**意外使用场景**
${bullets(data.unexpectedUseCases)}

**购买触发点:** ${first(data.purchaseTriggers)}
**建立信任的证据:** ${first(data.confidenceBuilders)}

**为什么会划走:** ${first(data.scrollAwayReasons)}
**为什么不信任:** ${first(data.trustIssues)}

**用户自然表达:** ${first(data.naturalWords)}
`;
}

export function parseCompetitorProcessed(content: string): CompetitorProcessed {
  const cards = [...content.matchAll(/\*\*Script\s+(\d+)\s+Analysis Card（脚本\s+\d+\s+分析卡）\*\*\s*([\s\S]*?)(?=\n\*\*Script\s+\d+\s+Analysis Card|\n\*\*Cross-Competitor Pattern Summary|\Z)/g)].map((match) => {
    const block = match[2];
    return {
      povSummary: matchSingle(block, /- POV Summary（POV 概要）:\s*(.*)/),
      hookStructure: matchSingle(block, /- Hook Structure（钩子结构）:\s*(.*)/),
      conversionLogic: matchSingle(block, /- Conversion Logic（转化逻辑）:\s*(.*)/),
      visualPattern: matchSingle(block, /- Visual Pattern（画面模式）:\s*(.*)/),
      audienceTrigger: matchSingle(block, /- Audience Trigger（用户触发点）:\s*(.*)/),
      weakness: matchSingle(block, /- Weakness（弱点）:\s*(.*)/),
      gap: matchSingle(block, /- Gap \/ Differentiation Opportunity（空白 \/ 差异化机会）:\s*(.*)/),
    };
  });

  if (cards.length === 0) {
    const povLine =
      matchSingle(content, /\*\*POV:\*\*\s*([\s\S]*?)(?=\n\| Shot |\n\*\*\[Competitor Gap Analysis\]|\Z)/) ||
      matchSingle(content, /POV:\s*([\s\S]*?)(?=\n\| Shot |\n\[Competitor Gap Analysis\]|\Z)/);
    const gapBlock =
      matchBlock(content, /\[Competitor Gap Analysis\]\s*([\s\S]*?)$/) ||
      matchBlock(content, /\*\*\[Competitor Gap Analysis\]\*\*\s*([\s\S]*?)$/);
    const uncoveredAngle = matchSingle(gapBlock, /- \*\*?Uncovered angle:?\*\*?\s*(.*)/) || matchSingle(gapBlock, /- Uncovered angle:\s*(.*)/);
    const emotionalGap = matchSingle(gapBlock, /- \*\*?Emotional gap:?\*\*?\s*(.*)/) || matchSingle(gapBlock, /- Emotional gap:\s*(.*)/);
    const differentiationOpportunity =
      matchSingle(gapBlock, /- \*\*?Differentiation opportunity:?\*\*?\s*(.*)/) ||
      matchSingle(gapBlock, /- Differentiation opportunity:\s*(.*)/);

    const rows = [...content.matchAll(/\|\s*(\d+)\s*\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|/g)]
      .map((match) => ({
        shot: match[1].trim(),
        original: match[2].trim(),
        translation: match[3].trim(),
        role: match[4].trim().replace(/\*\*/g, ""),
        notes: match[5].trim(),
      }))
      .filter((row) => row.original !== "Original Script");

    const fallbackCards = [
      {
        povSummary: povLine,
        hookStructure: rows.slice(0, 2).map((row) => `#${row.shot} ${row.role}`).join("；"),
        conversionLogic: rows.slice(2).map((row) => `#${row.shot} ${row.role}`).join("；"),
        visualPattern: rows.slice(0, 3).map((row) => row.translation).join("；"),
        audienceTrigger: rows.map((row) => row.notes).slice(0, 3).join("；"),
        weakness: uncoveredAngle || emotionalGap,
        gap: differentiationOpportunity,
      },
      {
        povSummary: emotionalGap,
        hookStructure: matchSingle(content, /\*\*Category:\*\*\s*(.*)/) || matchSingle(content, /\*\*Category（类目）:\*\*\s*(.*)/),
        conversionLogic: rows.map((row) => row.role).join("；"),
        visualPattern: rows.slice(3, 6).map((row) => row.translation).join("；"),
        audienceTrigger: rows.map((row) => row.notes).slice(3, 6).join("；"),
        weakness: emotionalGap,
        gap: differentiationOpportunity,
      },
    ];
    cards.push(...fallbackCards.filter(competitorCardHasContent));
  }

  return {
    brand:
      matchSingle(content, /\*\*Competitor Brand \/ Account（竞手品牌 \/ 账号）:\*\*\s*(.*)/) ||
      matchSingle(content, /\*\*Competitor Brand \/ Account:\*\*\s*(.*)/),
    category:
      matchSingle(content, /\*\*Category（类目）:\*\*\s*(.*)/) ||
      matchSingle(content, /\*\*Category:\*\*\s*(.*)/),
    source:
      matchSingle(content, /\*\*Link \/ Source（链接 \/ 来源）:\*\*\s*(.*)/) ||
      matchSingle(content, /\*\*Link \/ Source:\*\*\s*(.*)/),
    cards: filterCompetitorCards(cards),
    repeatedOpenings: matchSingle(content, /- Repeated opening styles（重复出现的开头方式）:\s*(.*)/),
    repeatedClaims: matchSingle(content, /- Repeated claims（重复出现的卖点表达）:\s*(.*)/),
    emotionalRedOcean: matchSingle(content, /- Emotional territory everyone is competing in（大家都在争夺的情绪区间）:\s*(.*)/),
    emotionalWhiteSpace: matchSingle(content, /- Emotional territory nobody is owning（没人真正占住的情绪区间）:\s*(.*)/),
    avoidAngles: matchSingle(content, /- Angles to avoid（应该避开的角度）:\s*(.*)/),
    attackAngles: matchSingle(content, /- Angles to attack（应该主攻的角度）:\s*(.*)/),
    bestPov:
      matchSingle(content, /- Best POV for differentiation（最适合差异化的 POV）:\s*(.*)/) ||
      matchSingle(content, /- Differentiation opportunity:\s*(.*)/),
  };
}

export function renderCompetitorProcessed(data: CompetitorProcessed): string {
  const renderCard = (card: CompetitorProcessed["cards"][number], index: number) => `**Script ${index + 1} Analysis Card（脚本 ${index + 1} 分析卡）**
- POV Summary（POV 概要）: ${card.povSummary}
- Hook Structure（钩子结构）: ${card.hookStructure}
- Conversion Logic（转化逻辑）: ${card.conversionLogic}
- Visual Pattern（画面模式）: ${card.visualPattern}
- Audience Trigger（用户触发点）: ${card.audienceTrigger}
- Weakness（弱点）: ${card.weakness}
- Gap / Differentiation Opportunity（空白 / 差异化机会）: ${card.gap}`;

  const cardSection =
    data.cards.length > 0
      ? `${data.cards.map((card, index) => renderCard(card, index)).join("\n\n")}\n\n`
      : "";

  return `## COMPETITOR SCRIPTS（竞手脚本分析）

**Competitor Brand / Account（竞手品牌 / 账号）:** ${data.brand}
**Category（类目）:** ${data.category}
**Link / Source（链接 / 来源）:** ${data.source}

${cardSection}**Cross-Competitor Pattern Summary（跨竞手共性总结）**
- Repeated opening styles（重复出现的开头方式）: ${data.repeatedOpenings}
- Repeated claims（重复出现的卖点表达）: ${data.repeatedClaims}
- Emotional territory everyone is competing in（大家都在争夺的情绪区间）: ${data.emotionalRedOcean}
- Emotional territory nobody is owning（没人真正占住的情绪区间）: ${data.emotionalWhiteSpace}

**Our Strategic Angle（我们的策略角度）**
- Angles to avoid（应该避开的角度）: ${data.avoidAngles}
- Angles to attack（应该主攻的角度）: ${data.attackAngles}
- Best POV for differentiation（最适合差异化的 POV）: ${data.bestPov}
`;
}

export function parseOutputSections(content: string): { generated: string; review: string; final: string } {
  const extract = (heading: string) =>
    matchBlock(content, new RegExp(`## ${heading}\\n([\\s\\S]*?)(?=\\n## |$)`));
  return {
    generated: extract("Generated Scripts"),
    review: extract("Review Report"),
    final: extract("Final Scripts"),
  };
}

export function parseScriptCards(section: string): ScriptCard[] {
  return [...section.matchAll(/\*\*(?:Final\s+)?Script\s*#?\[?(\d+)\]?\*\*\s*([\s\S]*?)(?=\n---\n|\n\*\*(?:Final\s+)?Script\s*#?\[?\d+\]?\*\*|$)/g)].map((match) => {
    const block = match[2];
    return {
      index: match[1],
      rawMarkdown: `**Script ${match[1]}**\n${block.trim()}`,
      hookType: matchSingle(block, /\*\*Hook Type:\*\*\s*([\s\S]*?)(?=\n\*\*|\Z)/),
      emotionalArc: matchSingle(block, /\*\*Emotional Arc:\*\*\s*([\s\S]*?)(?=\n\*\*|\Z)/),
      bestUseScene: matchSingle(block, /\*\*Best Use Scene:\*\*\s*([\s\S]*?)(?=\n\*\*|\Z)/),
      whatWasFixed: matchSingle(block, /\*\*What Was Fixed:\*\*\s*([\s\S]*?)(?=\n\*\*|\Z)/),
      scriptBody: matchSingle(block, /\*\*Script Body:\*\*\s*([\s\S]*?)(?=\n\*\*|\Z)/),
      visualNotes: matchSingle(block, /\*\*Visual Notes:\*\*\s*([\s\S]*?)(?=\n\*\*|\Z)/),
      alternateHooks: matchSingle(block, /\*\*Alternate Hooks:\*\*\s*([\s\S]*?)(?=\n\*\*|\Z)/),
    };
  });
}
