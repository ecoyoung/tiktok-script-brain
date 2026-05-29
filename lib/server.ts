import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import {
  parseAudienceInsight,
  parseCompetitorProcessed,
  parseOutputSections,
  parseProductBrief,
  parseScriptCards,
  renderAudienceInsight,
  renderCompetitorProcessed,
  renderProductBrief,
} from "./markdown";
import {
  ArchiveEntry,
  AudienceInsight,
  BootstrapData,
  CompetitorProcessed,
  OutputDetail,
  OutputEntry,
  ProductBrief,
  ProductWorkspace,
  ReportFile,
  ReviewDecisions,
} from "./types";
import type { ScriptCard } from "./types";

const execFileAsync = promisify(execFile);

export const ROOT_DIR = process.cwd();
const OUTPUT_INDEX_PATH = path.join(ROOT_DIR, "outputs", "index.json");
const ARCHIVE_INDEX_PATH = path.join(ROOT_DIR, "archives", "high_performers", "index.json");
const REVIEW_DECISIONS_PATH = path.join(ROOT_DIR, "outputs", "review_decisions.json");
const REPORTS_DIR = path.join(ROOT_DIR, "reports");
const PRODUCTS_DIR = path.join(ROOT_DIR, "products");
const TMP_DIR = path.join(ROOT_DIR, ".next_tmp");

function readText(filePath: string): string {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
}

function readJson<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function writeText(filePath: string, content: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content.trimEnd() + "\n", "utf8");
}

function writeJson(filePath: string, data: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function getProductPaths(slug: string) {
  const dir = path.join(PRODUCTS_DIR, slug);
  return {
    dir,
    brief: path.join(dir, "product_brief.md"),
    audience: path.join(dir, "audience_insight.md"),
    competitor: path.join(dir, "competitor_processed.md"),
    competitorRaw: path.join(dir, "competitor_raw.md"),
    params: path.join(dir, "web_script_parameters.md"),
  };
}

function relative(filePath: string): string {
  return path.relative(ROOT_DIR, filePath);
}

export function listProducts(): string[] {
  if (!fs.existsSync(PRODUCTS_DIR)) {
    return [];
  }
  return fs
    .readdirSync(PRODUCTS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

export function loadProductWorkspace(slug: string): ProductWorkspace {
  const paths = getProductPaths(slug);
  return {
    slug,
    brief: parseProductBrief(readText(paths.brief)),
    audience: parseAudienceInsight(readText(paths.audience)),
    competitor: parseCompetitorProcessed(readText(paths.competitor)),
  };
}

export function saveProductWorkspace(slug: string, payload: {
  brief?: ProductBrief;
  audience?: AudienceInsight;
  competitor?: CompetitorProcessed;
}): void {
  const paths = getProductPaths(slug);
  fs.mkdirSync(paths.dir, { recursive: true });
  if (payload.brief) {
    writeText(paths.brief, renderProductBrief(payload.brief));
  }
  if (payload.audience) {
    writeText(paths.audience, renderAudienceInsight(payload.audience));
  }
  if (payload.competitor) {
    writeText(paths.competitor, renderCompetitorProcessed(payload.competitor));
  }
}

export function createProduct(slug: string): ProductWorkspace {
  const safeSlug = slug.trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, "");
  const paths = getProductPaths(safeSlug);
  fs.mkdirSync(paths.dir, { recursive: true });
  const briefTemplate = parseProductBrief(readText(path.join(ROOT_DIR, "inputs", "product_brief_template.md")));
  const audienceTemplate = parseAudienceInsight(readText(path.join(ROOT_DIR, "inputs", "audience_insight_template.md")));
  const competitorTemplate = parseCompetitorProcessed(readText(path.join(ROOT_DIR, "inputs", "competitor_processed_template.md")));
  writeText(paths.brief, renderProductBrief(briefTemplate));
  writeText(paths.audience, renderAudienceInsight(audienceTemplate));
  writeText(paths.competitor, renderCompetitorProcessed(competitorTemplate));
  return loadProductWorkspace(safeSlug);
}

export function getOutputs(): OutputEntry[] {
  return readJson<{ entries: OutputEntry[] }>(OUTPUT_INDEX_PATH, { entries: [] }).entries ?? [];
}

export function getArchives(): ArchiveEntry[] {
  return readJson<{ entries: ArchiveEntry[] }>(ARCHIVE_INDEX_PATH, { entries: [] }).entries ?? [];
}

export function getReviewDecisions(): ReviewDecisions {
  return readJson<{ decisions: ReviewDecisions }>(REVIEW_DECISIONS_PATH, { decisions: {} }).decisions ?? {};
}

export function saveReviewDecisions(decisions: ReviewDecisions): void {
  writeJson(REVIEW_DECISIONS_PATH, { decisions });
}

export function getReports(): ReportFile[] {
  if (!fs.existsSync(REPORTS_DIR)) {
    return [];
  }
  return fs
    .readdirSync(REPORTS_DIR)
    .filter((name) => name.endsWith(".md"))
    .sort()
    .reverse()
    .map((name) => ({ name, path: path.join(REPORTS_DIR, name) }));
}

export function getBootstrapData(): BootstrapData {
  return {
    products: listProducts(),
    outputs: getOutputs(),
    archives: getArchives(),
    reviewDecisions: getReviewDecisions(),
    reports: getReports(),
  };
}

export function getOutputDetail(relativePath: string): OutputDetail {
  const outputs = getOutputs();
  const entry = outputs.find((item) => item.outputFile === relativePath);
  if (!entry) {
    throw new Error(`Output not found: ${relativePath}`);
  }
  const content = readText(path.join(ROOT_DIR, relativePath));
  const sections = parseOutputSections(content);
  return {
    entry,
    generated: sections.generated,
    review: sections.review,
    final: sections.final,
    generatedCards: parseScriptCards(sections.generated),
    finalCards: parseScriptCards(sections.final),
  };
}

async function runNodeScript(args: string[]) {
  const { stdout, stderr } = await execFileAsync("node", args, {
    cwd: ROOT_DIR,
    env: process.env,
    maxBuffer: 10 * 1024 * 1024,
  });
  return {
    ok: true,
    output: [stdout, stderr].filter(Boolean).join("\n").trim() || "命令执行完成，没有额外输出。",
  };
}

function writeTempJson(prefix: string, payload: unknown): string {
  fs.mkdirSync(TMP_DIR, { recursive: true });
  const tempPath = path.join(TMP_DIR, `${prefix}_${Date.now()}.json`);
  writeJson(tempPath, payload);
  return tempPath;
}

export async function runTask(payload: {
  label: string;
  product: string;
  videoLength: string;
  outputCount: number;
  rolePerspective: string;
  emotionalTone: string;
  hookStrategy: string;
  proofStyle: string;
  ctaStrength: string;
  specialRequirements: string;
  archive?: boolean;
  archiveNotes?: string;
  archiveTags?: string[];
  output?: string;
  useCompetitor?: boolean;
}) {
  const rolePerspectiveMap: Record<string, { label: string; instruction: string }> = {
    real_user_share: {
      label: "真实用户分享",
      instruction: "Sound like a real user casually sharing a change in daily life after using the product.",
    },
    friend_recommendation: {
      label: "朋友安利",
      instruction: "Frame the script like a low-pressure recommendation from a friend who already tested it.",
    },
    skeptical_turnaround: {
      label: "踩坑后反转",
      instruction: "Start from skepticism or disappointment, then earn the turnaround with believable details.",
    },
    comparison_review: {
      label: "测评对比",
      instruction: "Use a comparison-led point of view with clear tradeoffs instead of generic hype.",
    },
    daily_frustration_rant: {
      label: "日常吐槽",
      instruction: "Open from a relatable daily annoyance and let the product appear as the practical relief.",
    },
  };

  const emotionalToneMap: Record<string, { label: string; instruction: string }> = {
    authentic_resonance: {
      label: "真实共鸣",
      instruction: "Keep the voice grounded, candid, and emotionally close to how a creator would actually talk.",
    },
    light_frustration: {
      label: "轻松吐槽",
      instruction: "Use mild frustration and self-aware humor without sounding negative for too long.",
    },
    soft_recommendation: {
      label: "低调种草",
      instruction: "Stay understated and calm, with soft persuasion instead of hard selling.",
    },
    high_retention_hook: {
      label: "强钩子冲击",
      instruction: "Prioritize front-loaded surprise, specificity, and retention pressure in the first lines.",
    },
    calm_review: {
      label: "冷静测评",
      instruction: "Use measured language, more proof, less emotional spike, and clearer evaluation logic.",
    },
  };

  const hookStrategyMap: Record<string, { label: string; instruction: string }> = {
    pain_first: {
      label: "痛点先行",
      instruction: "Lead with a concrete frustration or annoying moment before introducing the product.",
    },
    surprising_confession: {
      label: "意外自白",
      instruction: "Open with an honest admission or mildly embarrassing truth that creates curiosity.",
    },
    before_after: {
      label: "前后反差",
      instruction: "Structure the hook around a before/after contrast that is instantly legible.",
    },
    identity_callout: {
      label: "人群点名",
      instruction: "Directly call out a specific user type so the right audience self-selects quickly.",
    },
  };

  const proofStyleMap: Record<string, { label: string; instruction: string }> = {
    demo_detail: {
      label: "细节演示",
      instruction: "Ground claims in tactile demo details, not generic praise.",
    },
    social_proof: {
      label: "社会证明",
      instruction: "Lean on believable signals like repeat use, creator habits, or repeated recommendations.",
    },
    comparison_proof: {
      label: "对比证明",
      instruction: "Use side-by-side logic or direct comparison points to justify the recommendation.",
    },
    routine_fit: {
      label: "日常融入",
      instruction: "Prove value by showing how naturally the product fits into an existing routine.",
    },
  };

  const ctaStrengthMap: Record<string, { label: string; instruction: string }> = {
    soft: {
      label: "弱 CTA",
      instruction: "End with a soft, non-pushy recommendation that still feels native to TikTok.",
    },
    medium: {
      label: "中 CTA",
      instruction: "End with a clear recommendation and a light nudge to try or check it out.",
    },
    strong: {
      label: "强 CTA",
      instruction: "End with a stronger conversion push while still avoiding obvious ad language.",
    },
  };

  const rolePerspective = rolePerspectiveMap[payload.rolePerspective] ?? {
    label: payload.rolePerspective,
    instruction: payload.rolePerspective,
  };
  const emotionalTone = emotionalToneMap[payload.emotionalTone] ?? {
    label: payload.emotionalTone,
    instruction: payload.emotionalTone,
  };
  const hookStrategy = hookStrategyMap[payload.hookStrategy] ?? {
    label: payload.hookStrategy,
    instruction: payload.hookStrategy,
  };
  const proofStyle = proofStyleMap[payload.proofStyle] ?? {
    label: payload.proofStyle,
    instruction: payload.proofStyle,
  };
  const ctaStrength = ctaStrengthMap[payload.ctaStrength] ?? {
    label: payload.ctaStrength,
    instruction: payload.ctaStrength,
  };
  const outputCount = Math.max(2, Number(payload.outputCount) || 2);

  const paths = getProductPaths(payload.product);
  const paramsContent = `## SCRIPT PARAMETERS（脚本控制参数）

**Video Length（视频时长）:**
- ${payload.videoLength}

**Output Count（输出数量）:**
- ${outputCount}

**Role Perspective（角色视角）:**
- ${rolePerspective.label}
- ${rolePerspective.instruction}

**Emotional Tone（情绪基调）:**
- ${emotionalTone.label}
- ${emotionalTone.instruction}

**Hook Strategy（钩子策略）:**
- ${hookStrategy.label}
- ${hookStrategy.instruction}

**Proof Style（证明方式）:**
- ${proofStyle.label}
- ${proofStyle.instruction}

**CTA Strength（转化强度）:**
- ${ctaStrength.label}
- ${ctaStrength.instruction}

**Special Requirements（特殊要求）:**
- ${payload.specialRequirements}
`;
  writeText(paths.params, paramsContent);

  const taskConfig: Record<string, unknown> = {
    label: payload.label,
    product: payload.product,
    params: relative(paths.params),
    archive: Boolean(payload.archive),
    archiveNotes: payload.archiveNotes ?? "",
    archiveTags: payload.archiveTags ?? [],
  };
  if (payload.output) {
    taskConfig.output = payload.output;
  }
  if (payload.useCompetitor && fs.existsSync(paths.competitor)) {
    taskConfig.competitor = relative(paths.competitor);
  }

  const taskPath = writeTempJson("task", taskConfig);
  return runNodeScript(["run.js", "--task", relative(taskPath)]);
}

export async function preprocessCompetitor(payload: {
  product: string;
  brand: string;
  category: string;
  source: string;
  rawScript: string;
  output?: string;
}) {
  const paths = getProductPaths(payload.product);
  const rawContent = `## COMPETITOR RAW SCRIPT（竞手原始脚本）

**Competitor Brand / Account（竞手品牌 / 账号）:**
${payload.brand}

**Category（类目）:**
${payload.category}

**Link / Source（链接 / 来源）:**
${payload.source}

**Raw Script（原始脚本）:**
${payload.rawScript}
`;
  writeText(paths.competitorRaw, rawContent);
  return runNodeScript([
    "run.js",
    "--preprocessCompetitor",
    relative(paths.competitorRaw),
    "--output",
    payload.output || relative(paths.competitor),
  ]);
}

export async function generateReport(payload: {
  product?: string;
  dateFrom?: string;
  dateTo?: string;
  output?: string;
}) {
  const args = ["report.js"];
  if (payload.product) {
    args.push("--product", payload.product);
  }
  if (payload.dateFrom) {
    args.push("--dateFrom", payload.dateFrom);
  }
  if (payload.dateTo) {
    args.push("--dateTo", payload.dateTo);
  }
  if (payload.output) {
    args.push("--output", payload.output);
  }
  return runNodeScript(args);
}

export async function updateMetrics(payload: Record<string, string>) {
  const tempPath = writeTempJson("metrics", payload);
  return runNodeScript(["run.js", "--updateMetrics", relative(tempPath)]);
}

export function readReport(relativeOrName: string): ReportFile {
  const filePath = relativeOrName.includes(path.sep)
    ? path.join(ROOT_DIR, relativeOrName)
    : path.join(REPORTS_DIR, relativeOrName);
  return {
    name: path.basename(filePath),
    path: relative(filePath),
    content: readText(filePath),
  };
}

async function callDeepSeek(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
  const model = process.env.DEEPSEEK_MODEL || "deepseek-v4";

  if (!apiKey) {
    throw new Error("Missing DEEPSEEK_API_KEY.");
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      max_tokens: 4000,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("DeepSeek API returned no content.");
  }
  return content.trim();
}

function parseAudienceJson(raw: string): AudienceInsight {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("AI did not return valid JSON.");
  }
  const parsed = JSON.parse(jsonMatch[0]);
  return {
    ageRange: parsed.ageRange || "",
    lifeStage: parsed.lifeStage || "",
    persona: parsed.persona || "",
    typicalDailyScene: parsed.typicalDailyScene || "",
    whyProblemMatters: parsed.whyProblemMatters || "",
    positiveQuotes: Array.isArray(parsed.positiveQuotes) ? parsed.positiveQuotes : [],
    painQuotes: Array.isArray(parsed.painQuotes) ? parsed.painQuotes : [],
    competitorWeakness: Array.isArray(parsed.competitorWeakness) ? parsed.competitorWeakness : [],
    unexpectedUseCases: Array.isArray(parsed.unexpectedUseCases) ? parsed.unexpectedUseCases : [],
    purchaseTriggers: Array.isArray(parsed.purchaseTriggers) ? parsed.purchaseTriggers : [],
    confidenceBuilders: Array.isArray(parsed.confidenceBuilders) ? parsed.confidenceBuilders : [],
    scrollAwayReasons: Array.isArray(parsed.scrollAwayReasons) ? parsed.scrollAwayReasons : [],
    trustIssues: Array.isArray(parsed.trustIssues) ? parsed.trustIssues : [],
    naturalWords: Array.isArray(parsed.naturalWords) ? parsed.naturalWords : [],
  };
}

export async function extractAudienceFromRaw(productSlug: string, rawMaterial: string): Promise<AudienceInsight> {
  const paths = getProductPaths(productSlug);
  const brief = parseProductBrief(readText(paths.brief));
  const promptTemplate = readText(path.join(ROOT_DIR, "core", "audience_extract_prompt.md"));
  const userPrompt = promptTemplate
    .replace("{{PRODUCT_NAME}}", brief.productName)
    .replace("{{PRODUCT_CATEGORY}}", brief.category)
    .replace("{{RAW_MATERIAL}}", rawMaterial);
  const raw = await callDeepSeek("You are a precise JSON-outputting assistant. Return only valid JSON.", userPrompt);
  return parseAudienceJson(raw);
}

export async function inferAudienceFromContext(productSlug: string): Promise<AudienceInsight> {
  const paths = getProductPaths(productSlug);
  const briefText = readText(paths.brief);
  const competitorText = readText(paths.competitor);
  const promptTemplate = readText(path.join(ROOT_DIR, "core", "audience_infer_prompt.md"));
  const userPrompt = promptTemplate
    .replace("{{PRODUCT_BRIEF}}", briefText)
    .replace("{{COMPETITOR_INFO}}", competitorText || "No competitor analysis available yet.");
  const raw = await callDeepSeek("You are a precise JSON-outputting assistant. Return only valid JSON.", userPrompt);
  return parseAudienceJson(raw);
}
