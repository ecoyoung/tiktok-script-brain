"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  ArchiveEntry,
  AudienceInsight,
  BootstrapData,
  OutputDetail,
  ProductWorkspace,
  ReportFile,
  ReviewDecision,
  ReviewDecisions,
} from "@/lib/types";

const tabs = [
  { key: "overview", label: "总览" },
  { key: "products", label: "产品资料" },
  { key: "competitor", label: "竞手预处理" },
  { key: "tasks", label: "脚本设置" },
  { key: "outputs", label: "结果审稿" },
  { key: "metrics", label: "表现回填" },
  { key: "reports", label: "复盘报告" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

type TaskForm = {
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
  archive: boolean;
  archiveNotes: string;
  archiveTags: string;
  output: string;
  useCompetitor: boolean;
};

const videoLengthOptions = [
  { value: "15 seconds", label: "15 秒", note: "极短钩子测试，优先抢前 2 秒注意力" },
  { value: "30 seconds", label: "30 秒", note: "主流口播长度，适合完整讲清一个痛点" },
  { value: "45 seconds", label: "45 秒", note: "可容纳更完整的反转与证明" },
  { value: "60 seconds", label: "60 秒", note: "适合测评型、对比型、故事型脚本" },
] as const;

const rolePerspectiveOptions = [
  { value: "real_user_share", label: "真实用户分享", prompt: "Sound like a real user casually sharing what changed in daily life after using the product." },
  { value: "friend_recommendation", label: "朋友安利", prompt: "Frame the script like a low-pressure recommendation from a friend who already tested it." },
  { value: "skeptical_turnaround", label: "踩坑后反转", prompt: "Start from skepticism or disappointment, then earn the turnaround with believable details." },
  { value: "comparison_review", label: "测评对比", prompt: "Use a comparison-led point of view with clear tradeoffs, not hype." },
  { value: "daily_frustration_rant", label: "日常吐槽", prompt: "Open from a relatable daily annoyance and let the product appear as the practical relief." },
] as const;

const emotionalToneOptions = [
  { value: "authentic_resonance", label: "真实共鸣", prompt: "Keep the voice grounded, candid, and emotionally close to how a creator would actually talk." },
  { value: "light_frustration", label: "轻松吐槽", prompt: "Use mild frustration and self-aware humor without sounding negative for too long." },
  { value: "soft_recommendation", label: "低调种草", prompt: "Stay understated and calm, with soft persuasion instead of hard selling." },
  { value: "high_retention_hook", label: "强钩子冲击", prompt: "Prioritize front-loaded surprise, specificity, and retention pressure in the first lines." },
  { value: "calm_review", label: "冷静测评", prompt: "Use measured language, more proof, less emotional spike, and clearer evaluation logic." },
] as const;

const hookStrategyOptions = [
  { value: "pain_first", label: "痛点先行", prompt: "Lead with a concrete frustration or annoying moment before introducing the product." },
  { value: "surprising_confession", label: "意外自白", prompt: "Open with an honest admission or mildly embarrassing truth that creates curiosity." },
  { value: "before_after", label: "前后反差", prompt: "Structure the hook around a before/after contrast that is instantly legible." },
  { value: "identity_callout", label: "人群点名", prompt: "Directly call out a specific user type so the right audience self-selects quickly." },
] as const;

const proofStyleOptions = [
  { value: "demo_detail", label: "细节演示", prompt: "Ground claims in tactile demo details, not generic praise." },
  { value: "social_proof", label: "社会证明", prompt: "Lean on believable signals like repeat use, creator habits, or repeated recommendations." },
  { value: "comparison_proof", label: "对比证明", prompt: "Use side-by-side logic or direct comparison points to justify the recommendation." },
  { value: "routine_fit", label: "日常融入", prompt: "Prove value by showing how naturally the product fits into an existing routine." },
] as const;

const ctaStrengthOptions = [
  { value: "soft", label: "弱 CTA", prompt: "End with a soft, non-pushy recommendation that still feels native to TikTok." },
  { value: "medium", label: "中 CTA", prompt: "End with a clear recommendation and a light nudge to try or check it out." },
  { value: "strong", label: "强 CTA", prompt: "End with a stronger conversion push while still avoiding obvious ad language." },
] as const;

type MetricsForm = {
  entryId: string;
  entryType: "archive" | "recommended";
  outputKey: string;
  scriptIndex: string;
  status: string;
  views: string;
  holdRate3s: string;
  completionRate: string;
  ctr: string;
  cvr: string;
  commentSignals: string;
  creativeTakeaway: string;
  updatedAt: string;
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const json = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(json.error || "Request failed");
  }
  return json;
}

function splitLines(value: string): string[] {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinLines(values: string[]): string {
  return values.join("\n");
}

function updateAudienceField(
  workspace: ProductWorkspace,
  field: keyof AudienceInsight,
  value: string[] | string
): ProductWorkspace {
  return { ...workspace, audience: { ...workspace.audience, [field]: value } };
}

type AudienceTextField = "ageRange" | "lifeStage" | "persona" | "typicalDailyScene" | "whyProblemMatters";

const audienceTextFields: Array<{ field: AudienceTextField; label: string }> = [
  { field: "ageRange", label: "年龄段" },
  { field: "lifeStage", label: "人生阶段" },
  { field: "persona", label: "用户画像" },
  { field: "typicalDailyScene", label: "典型日常场景" },
  { field: "whyProblemMatters", label: "为什么这个问题对他们重要" },
];

function makeOutputKey(outputFile: string, generatedAt?: string, label?: string) {
  return outputFile || `${generatedAt || ""}|${label || ""}`;
}

function statCard(label: string, value: string | number, note: string) {
  return (
    <div className="stat-card" key={label}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}

function statusTone(value?: string) {
  switch (value) {
    case "建议拍摄":
    case "validated_winner":
      return "good";
    case "继续修改":
    case "needs_iteration":
    case "testing":
      return "warn";
    case "淘汰":
    case "weak_result":
      return "bad";
    default:
      return "neutral";
  }
}

function productCompleteness(workspace: ProductWorkspace | null) {
  if (!workspace) {
    return 0;
  }
  const checks = [
    workspace.brief.category,
    workspace.brief.productName,
    workspace.brief.coreHook,
    workspace.brief.keySpecs.length > 0 ? "1" : "",
    workspace.audience.ageRange,
    workspace.audience.persona,
    workspace.audience.positiveQuotes.length > 0 ? "1" : "",
    workspace.audience.painQuotes.length > 0 ? "1" : "",
  ];
  const complete = checks.filter(Boolean).length;
  return Math.round((complete / checks.length) * 100);
}

function trimPreview(value: string, max = 160) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "";
  }
  return normalized.length > max ? `${normalized.slice(0, max)}...` : normalized;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function inlineMarkdown(value: string) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

function isTableLine(value: string) {
  const trimmed = value.trim();
  return trimmed.startsWith("|") && trimmed.endsWith("|");
}

function parseTableRow(line: string) {
  return line
    .trim()
    .slice(1, -1)
    .split("|")
    .map((cell) => cell.trim());
}

function isTableDivider(line: string) {
  return parseTableRow(line).every((cell) => /^:?-{3,}:?$/.test(cell));
}

function markdownToHtml(source: string) {
  const lines = source.replace(/\r/g, "").split("\n");
  const html: string[] = [];
  let paragraph: string[] = [];
  let listItems: string[] = [];
  let tableRows: string[] = [];

  const flushParagraph = () => {
    if (!paragraph.length) {
      return;
    }
    html.push(`<p>${inlineMarkdown(paragraph.join("<br />"))}</p>`);
    paragraph = [];
  };

  const flushList = () => {
    if (!listItems.length) {
      return;
    }
    html.push(`<ul>${listItems.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</ul>`);
    listItems = [];
  };

  const flushTable = () => {
    if (!tableRows.length) {
      return;
    }
    const rows = tableRows.map(parseTableRow);
    const header = rows[0] || [];
    const hasDivider = tableRows[1] ? isTableDivider(tableRows[1]) : false;
    const body = rows.slice(hasDivider ? 2 : 1);
    html.push(
      `<div class="table-scroll"><table><thead><tr>${header.map((cell) => `<th>${inlineMarkdown(cell)}</th>`).join("")}</tr></thead><tbody>${body
        .map((row) => `<tr>${row.map((cell) => `<td>${inlineMarkdown(cell)}</td>`).join("")}</tr>`)
        .join("")}</tbody></table></div>`
    );
    tableRows = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      flushList();
      flushTable();
      continue;
    }

    if (trimmed === "---") {
      flushParagraph();
      flushList();
      flushTable();
      html.push("<hr />");
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,4})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      flushTable();
      const level = Math.min(headingMatch[1].length, 4);
      html.push(`<h${level}>${inlineMarkdown(headingMatch[2])}</h${level}>`);
      continue;
    }

    if (isTableLine(trimmed)) {
      flushParagraph();
      flushList();
      tableRows.push(trimmed);
      continue;
    }

    if (trimmed.startsWith("- ")) {
      flushParagraph();
      flushTable();
      listItems.push(trimmed.slice(2));
      continue;
    }

    if (trimmed.startsWith("> ")) {
      flushParagraph();
      flushList();
      flushTable();
      html.push(`<blockquote>${inlineMarkdown(trimmed.slice(2))}</blockquote>`);
      continue;
    }

    flushList();
    flushTable();
    paragraph.push(trimmed);
  }

  flushParagraph();
  flushList();
  flushTable();
  return html.join("");
}

function MarkdownArticle({ content, className = "" }: { content: string; className?: string }) {
  return <div className={className ? `markdown-article ${className}` : "markdown-article"} dangerouslySetInnerHTML={{ __html: markdownToHtml(content || "") }} />;
}

function extractReviewBlocks(content: string) {
  const normalized = content.replace(/\r/g, "").trim();
  if (!normalized) {
    return { byScript: {} as Record<string, string>, overall: "" };
  }

  const byScript: Record<string, string> = {};
  const reviewMatches = normalized.matchAll(/##\s+Review for Script\s+#?(\d+)\s*\n([\s\S]*?)(?=\n##\s+Review for Script\s+#?\d+\s*\n|\n##\s+Overall Recommendation|\Z)/g);
  for (const match of reviewMatches) {
    byScript[match[1]] = `## Review for Script #${match[1]}\n${match[2].trim()}`;
  }

  const overallMatch = normalized.match(/##\s+Overall Recommendation\s*\n([\s\S]*?)$/);
  return {
    byScript,
    overall: overallMatch ? `## Overall Recommendation\n${overallMatch[1].trim()}` : "",
  };
}

function parseScoreRows(content: string) {
  return [...content.matchAll(/^- ([A-Za-z][A-Za-z /-]+):\s*(\d+)\/(\d+)\s*$/gm)].map((match) => ({
    label: match[1].trim(),
    score: Number(match[2]),
    max: Number(match[3]),
  }));
}

function stripScoreRows(content: string) {
  return content.replace(/^- ([A-Za-z][A-Za-z /-]+):\s*(\d+)\/(\d+)\s*$/gm, "").replace(/\n{3,}/g, "\n\n").trim();
}

function extractOverallRecommendation(content: string) {
  const block = content.match(/##\s+Overall Recommendation\s*\n([\s\S]*?)$/)?.[1] || "";
  return {
    best: block.match(/- Best script:\s*(.*)/)?.[1]?.trim() || "",
    weakest: block.match(/- Weakest script:\s*(.*)/)?.[1]?.trim() || "",
    onlyOne: block.match(/- If only one should be filmed:\s*(.*)/)?.[1]?.trim() || "",
    risks: block.match(/- Must-fix risks:\s*([\s\S]*)/)?.[1]?.trim() || "",
  };
}

function scoreTone(score: number, max: number) {
  const ratio = max ? score / max : 0;
  if (ratio >= 0.9) {
    return "good";
  }
  if (ratio >= 0.7) {
    return "warn";
  }
  return "bad";
}

function renderScriptMarkdown(content: string) {
  return content
    .replace(/^\*\*(?:Final\s+)?Script\s*#?\d+\*\*\s*\n?/m, "")
    .replace(/^\*\*(Hook Type|Emotional Arc|Best Use Scene|Visual Notes|Alternate Hooks|What Was Fixed):\*\*\s*.*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function ChipInput({ label, items, onAdd, onRemove }: {
  label: string;
  items: string[];
  onAdd: (value: string) => void;
  onRemove: (index: number) => void;
}) {
  const [draft, setDraft] = useState("");

  function handleAdd() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setDraft("");
  }

  return (
    <div className="chip-field">
      <span className="chip-label">{label}</span>
      <div className="chip-list">
        {items.map((item, i) => (
          <span key={i} className="chip">
            {item}
            <button type="button" className="chip-remove" onClick={() => onRemove(i)}>×</button>
          </span>
        ))}
      </div>
      <div className="chip-input-row">
        <input className="input chip-input" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`添加${label}…`} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAdd(); } }} />
        <button type="button" className="chip-add-btn" onClick={handleAdd} disabled={!draft.trim()}>+</button>
      </div>
    </div>
  );
}

export function Workbench() {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [bootstrap, setBootstrap] = useState<BootstrapData | null>(null);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [workspace, setWorkspace] = useState<ProductWorkspace | null>(null);
  const [selectedOutput, setSelectedOutput] = useState("");
  const [outputDetail, setOutputDetail] = useState<OutputDetail | null>(null);
  const [selectedReport, setSelectedReport] = useState("");
  const [reportContent, setReportContent] = useState("");
  const [selectedFinalIndex, setSelectedFinalIndex] = useState("");
  const [busy, setBusy] = useState<string>("");
  const [notice, setNotice] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [newProductSlug, setNewProductSlug] = useState("");

  const [taskForm, setTaskForm] = useState<TaskForm>({
    label: "",
    product: "",
    videoLength: "30 seconds",
    outputCount: 3,
    rolePerspective: "real_user_share",
    emotionalTone: "authentic_resonance",
    hookStrategy: "pain_first",
    proofStyle: "demo_detail",
    ctaStrength: "soft",
    specialRequirements: "让开头更像美国 TikTok 原生口语，避免硬广感。",
    archive: false,
    archiveNotes: "",
    archiveTags: "",
    output: "",
    useCompetitor: true,
  });

  const [competitorRaw, setCompetitorRaw] = useState({
    product: "",
    brand: "",
    category: "",
    source: "",
    rawScript: "",
    output: "",
  });

  const [metricsForm, setMetricsForm] = useState<MetricsForm>({
    entryId: "",
    entryType: "archive",
    outputKey: "",
    scriptIndex: "",
    status: "pending_manual_update",
    views: "",
    holdRate3s: "",
    completionRate: "",
    ctr: "",
    cvr: "",
    commentSignals: "",
    creativeTakeaway: "",
    updatedAt: "",
  });

  const [reportForm, setReportForm] = useState({
    product: "",
    dateFrom: "",
    dateTo: "",
    output: "",
  });

  const [audienceRawMaterial, setAudienceRawMaterial] = useState("");

  const reviewDecisions: ReviewDecisions = bootstrap?.reviewDecisions ?? {};

  const currentTaskSummary = useMemo(() => {
    const role = rolePerspectiveOptions.find((item) => item.value === taskForm.rolePerspective);
    const tone = emotionalToneOptions.find((item) => item.value === taskForm.emotionalTone);
    const hook = hookStrategyOptions.find((item) => item.value === taskForm.hookStrategy);
    const proof = proofStyleOptions.find((item) => item.value === taskForm.proofStyle);
    const cta = ctaStrengthOptions.find((item) => item.value === taskForm.ctaStrength);
    const length = videoLengthOptions.find((item) => item.value === taskForm.videoLength);
    return { role, tone, hook, proof, cta, length };
  }, [taskForm]);

  const selectedDecision = useMemo(() => {
    if (!outputDetail) {
      return null;
    }
    const key = makeOutputKey(outputDetail.entry.outputFile, outputDetail.entry.generatedAt, outputDetail.entry.label);
    return reviewDecisions[key] ?? null;
  }, [outputDetail, reviewDecisions]);

  const reviewSummary = useMemo(() => {
    const summary: Record<string, number> = {
      "待处理": 0,
      "建议拍摄": 0,
      "继续修改": 0,
      "淘汰": 0,
    };
    for (const output of bootstrap?.outputs ?? []) {
      const key = makeOutputKey(output.outputFile, output.generatedAt, output.label);
      summary[reviewDecisions[key]?.status || "待处理"] += 1;
    }
    return summary;
  }, [bootstrap?.outputs, reviewDecisions]);

  const shootableScripts = useMemo(() => {
    let total = 0;
    Object.values(reviewDecisions).forEach((decision) => {
      Object.values(decision.scripts ?? {}).forEach((script) => {
        if (script.status === "建议拍摄") {
          total += 1;
        }
      });
    });
    return total;
  }, [reviewDecisions]);

  async function loadBootstrap() {
    const data = await request<{ products: BootstrapData["products"]; outputs: BootstrapData["outputs"]; archives: BootstrapData["archives"]; reviewDecisions: BootstrapData["reviewDecisions"]; reports: BootstrapData["reports"] }>("/api/bootstrap");
    const nextBootstrap: BootstrapData = data;
    setBootstrap(nextBootstrap);

    if (!selectedProduct && nextBootstrap.products[0]) {
      setSelectedProduct(nextBootstrap.products[0]);
      setTaskForm((prev) => ({ ...prev, product: nextBootstrap.products[0], label: nextBootstrap.products[0] }));
      setCompetitorRaw((prev) => ({ ...prev, product: nextBootstrap.products[0], output: `products/${nextBootstrap.products[0]}/competitor_processed.md` }));
    }
    if (!selectedOutput && nextBootstrap.outputs[0]) {
      setSelectedOutput(nextBootstrap.outputs[0].outputFile);
    }
    if (!selectedReport && nextBootstrap.reports[0]) {
      setSelectedReport(nextBootstrap.reports[0].name);
    }
  }

  useEffect(() => {
    void loadBootstrap().catch((reason: Error) => setError(reason.message));
  }, []);

  useEffect(() => {
    if (!selectedProduct) {
      return;
    }
    void request<{ workspace: ProductWorkspace }>(`/api/products/${selectedProduct}`)
      .then((data) => {
        setWorkspace(data.workspace);
        setTaskForm((prev) => ({ ...prev, product: selectedProduct, label: prev.label || selectedProduct }));
        setCompetitorRaw((prev) => ({
          ...prev,
          product: selectedProduct,
          output: prev.output || `products/${selectedProduct}/competitor_processed.md`,
        }));
      })
      .catch((reason: Error) => setError(reason.message));
  }, [selectedProduct]);

  useEffect(() => {
    if (!selectedOutput) {
      return;
    }
    void request<{ detail: OutputDetail }>(`/api/outputs/${selectedOutput}`)
      .then((data) => setOutputDetail(data.detail))
      .catch((reason: Error) => setError(reason.message));
  }, [selectedOutput]);

  useEffect(() => {
    if (!selectedReport) {
      return;
    }
    void request<{ report: ReportFile }>(`/api/reports?name=${encodeURIComponent(selectedReport)}`)
      .then((data) => setReportContent(data.report.content || ""))
      .catch((reason: Error) => setError(reason.message));
  }, [selectedReport]);

  useEffect(() => {
    if (!outputDetail) {
      setSelectedFinalIndex("");
      return;
    }
    const bestIndex = reviewDecisions[makeOutputKey(outputDetail.entry.outputFile, outputDetail.entry.generatedAt, outputDetail.entry.label)]?.bestScriptIndex;
    const firstIndex = outputDetail.finalCards[0]?.index || outputDetail.generatedCards[0]?.index || "";
    setSelectedFinalIndex(bestIndex || firstIndex);
  }, [outputDetail, reviewDecisions]);

  async function saveWorkspace(kind: "brief" | "audience" | "competitor") {
    if (!workspace) {
      return;
    }
    setBusy(`save-${kind}`);
    setError("");
    setNotice("");
    try {
      const payload =
        kind === "brief"
          ? { brief: workspace.brief }
          : kind === "audience"
            ? { audience: workspace.audience }
            : { competitor: workspace.competitor };
      const data = await request<{ workspace: ProductWorkspace }>(`/api/products/${workspace.slug}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setWorkspace(data.workspace);
      setNotice("已保存。");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "保存失败");
    } finally {
      setBusy("");
    }
  }

  async function createProductAction() {
    if (!newProductSlug.trim()) {
      setError("请输入产品标识。");
      return;
    }
    setBusy("create-product");
    setError("");
    setNotice("");
    try {
      await request("/api/products", {
        method: "POST",
        body: JSON.stringify({ slug: newProductSlug }),
      });
      setNewProductSlug("");
      await loadBootstrap();
      setSelectedProduct(newProductSlug.trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_"));
      setNotice("产品目录已创建。");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "创建失败");
    } finally {
      setBusy("");
    }
  }

  async function runTaskAction() {
    setBusy("run-task");
    setError("");
    setNotice("");
    try {
      const result = await request<{ ok: boolean; output: string; error?: string }>("/api/tasks/run", {
        method: "POST",
        body: JSON.stringify({
          ...taskForm,
          archiveTags: splitLines(taskForm.archiveTags.replaceAll(",", "\n")),
        }),
      });
      setNotice(result.output);
      await loadBootstrap();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "执行失败");
    } finally {
      setBusy("");
    }
  }

  async function preprocessCompetitorAction() {
    setBusy("preprocess");
    setError("");
    setNotice("");
    try {
      const result = await request<{ ok: boolean; output: string }>("/api/competitors/preprocess", {
        method: "POST",
        body: JSON.stringify(competitorRaw),
      });
      setNotice(result.output);
      setSelectedProduct(competitorRaw.product);
      const data = await request<{ workspace: ProductWorkspace }>(`/api/products/${competitorRaw.product}`);
      setWorkspace(data.workspace);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "预处理失败");
    } finally {
      setBusy("");
    }
  }

  async function extractAudienceAction() {
    if (!selectedProduct || !audienceRawMaterial.trim()) {
      setError("请先粘贴用户原始素材。");
      return;
    }
    setBusy("audience-extract");
    setError("");
    setNotice("");
    try {
      const data = await request<{ ok: boolean; insight: AudienceInsight }>("/api/audience/extract", {
        method: "POST",
        body: JSON.stringify({ product: selectedProduct, rawMaterial: audienceRawMaterial }),
      });
      setWorkspace((prev) => prev ? { ...prev, audience: data.insight } : prev);
      setNotice("已从原始素材提取用户洞察，请检查并保存。");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "提取失败");
    } finally {
      setBusy("");
    }
  }

  async function inferAudienceAction() {
    if (!selectedProduct) {
      setError("请先选择产品。");
      return;
    }
    setBusy("audience-infer");
    setError("");
    setNotice("");
    try {
      const data = await request<{ ok: boolean; insight: AudienceInsight }>("/api/audience/infer", {
        method: "POST",
        body: JSON.stringify({ product: selectedProduct }),
      });
      setWorkspace((prev) => prev ? { ...prev, audience: data.insight } : prev);
      setNotice("已从产品资料推断用户洞察，请检查并保存。");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "推断失败");
    } finally {
      setBusy("");
    }
  }

  async function saveReviewDecision(nextDecision: ReviewDecision) {
    if (!outputDetail || !bootstrap) {
      return;
    }
    setBusy("review");
    setError("");
    setNotice("");
    try {
      const key = makeOutputKey(outputDetail.entry.outputFile, outputDetail.entry.generatedAt, outputDetail.entry.label);
      const next = { ...bootstrap.reviewDecisions, [key]: nextDecision };
      const data = await request<{ reviewDecisions: ReviewDecisions }>("/api/review-decisions", {
        method: "PUT",
        body: JSON.stringify({ reviewDecisions: next }),
      });
      setBootstrap((prev) => (prev ? { ...prev, reviewDecisions: data.reviewDecisions } : prev));
      setNotice("审稿决策已保存。");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "保存审稿失败");
    } finally {
      setBusy("");
    }
  }

  async function generateReportAction() {
    setBusy("report");
    setError("");
    setNotice("");
    try {
      const result = await request<{ ok: boolean; output: string }>("/api/reports", {
        method: "POST",
        body: JSON.stringify(reportForm),
      });
      setNotice(result.output);
      await loadBootstrap();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "生成报告失败");
    } finally {
      setBusy("");
    }
  }

  async function updateMetricsAction() {
    setBusy("metrics");
    setError("");
    setNotice("");
    try {
      if (metricsForm.entryType === "archive") {
        const result = await request<{ ok: boolean; output: string }>("/api/metrics", {
          method: "POST",
          body: JSON.stringify({
            archiveSlug: metricsForm.entryId,
            status: metricsForm.status,
            views: metricsForm.views,
            holdRate3s: metricsForm.holdRate3s,
            completionRate: metricsForm.completionRate,
            ctr: metricsForm.ctr,
            cvr: metricsForm.cvr,
            commentSignals: metricsForm.commentSignals,
            creativeTakeaway: metricsForm.creativeTakeaway,
          }),
        });
        setNotice(result.output);
      } else {
        const outputKey = metricsForm.outputKey;
        const scriptIndex = metricsForm.scriptIndex;
        if (!outputKey || !scriptIndex) {
          throw new Error("Missing output key or script index.");
        }
        const existing = bootstrap?.reviewDecisions[outputKey] ?? {};
        const now = new Date().toISOString();
        const next = {
          ...existing,
          scripts: {
            ...(existing.scripts ?? {}),
            [scriptIndex]: {
              ...(existing.scripts?.[scriptIndex] ?? {}),
              performance: {
                status: metricsForm.status,
                views: metricsForm.views,
                holdRate3s: metricsForm.holdRate3s,
                completionRate: metricsForm.completionRate,
                ctr: metricsForm.ctr,
                cvr: metricsForm.cvr,
                commentSignals: metricsForm.commentSignals,
                creativeTakeaway: metricsForm.creativeTakeaway,
                updatedAt: now,
              },
            },
          },
        };
        const data = await request<{ reviewDecisions: ReviewDecisions }>("/api/review-decisions", {
          method: "PUT",
          body: JSON.stringify({ reviewDecisions: { ...bootstrap?.reviewDecisions, [outputKey]: next } }),
        });
        setBootstrap((prev) => (prev ? { ...prev, reviewDecisions: data.reviewDecisions } : prev));
        setMetricsForm((prev) => ({ ...prev, updatedAt: now }));
        setNotice("终稿表现数据已保存。");
      }
      await loadBootstrap();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "更新失败");
    } finally {
      setBusy("");
    }
  }

  const bestRows = useMemo(() => {
    return Object.values(reviewDecisions)
      .filter((item) => item.bestScriptIndex)
      .sort((a, b) => (b.generatedAt || "").localeCompare(a.generatedAt || ""))
      .slice(0, 8);
  }, [reviewDecisions]);

  const activeFinalCard = useMemo(() => {
    if (!outputDetail) {
      return null;
    }
    return outputDetail.finalCards.find((card) => card.index === selectedFinalIndex) || outputDetail.finalCards[0] || null;
  }, [outputDetail, selectedFinalIndex]);

  const activeScriptDecision = useMemo(() => {
    if (!activeFinalCard) {
      return {};
    }
    return selectedDecision?.scripts?.[activeFinalCard.index] || {};
  }, [activeFinalCard, selectedDecision]);

  const activeGeneratedCard = useMemo(() => {
    if (!outputDetail) {
      return null;
    }
    return outputDetail.generatedCards.find((card) => card.index === selectedFinalIndex) || outputDetail.generatedCards[0] || null;
  }, [outputDetail, selectedFinalIndex]);

  const scriptIndexes = useMemo(() => {
    if (!outputDetail) {
      return [];
    }
    const indexes = new Set<string>();
    outputDetail.generatedCards.forEach((card) => indexes.add(card.index));
    outputDetail.finalCards.forEach((card) => indexes.add(card.index));
    return [...indexes].sort((a, b) => Number(a) - Number(b));
  }, [outputDetail]);

  const reviewBlocks = useMemo(() => {
    return extractReviewBlocks(outputDetail?.review || "");
  }, [outputDetail?.review]);

  const activeReviewMarkdown = useMemo(() => {
    if (!selectedFinalIndex) {
      return reviewBlocks.overall || outputDetail?.review || "";
    }
    return reviewBlocks.byScript[selectedFinalIndex] || reviewBlocks.overall || outputDetail?.review || "";
  }, [outputDetail?.review, reviewBlocks, selectedFinalIndex]);

  const activeReviewScores = useMemo(() => parseScoreRows(activeReviewMarkdown), [activeReviewMarkdown]);
  const activeReviewBody = useMemo(() => stripScoreRows(activeReviewMarkdown), [activeReviewMarkdown]);
  const overallRecommendation = useMemo(() => extractOverallRecommendation(outputDetail?.review || ""), [outputDetail?.review]);

  const workflowSteps = useMemo(() => {
    const productReady = productCompleteness(workspace) >= 55;
    const competitorReady = Boolean(
      workspace?.competitor.brand ||
      workspace?.competitor.source ||
      workspace?.competitor.cards.some((card) => card.povSummary || card.hookStructure || card.gap)
    );
    const taskReady = Boolean(taskForm.label && taskForm.product);
    const reviewReady = Boolean(bootstrap?.outputs.length);
    return [
      {
        key: "products" as TabKey,
        index: "01",
        title: "填写产品资料",
        desc: "先把产品卖点、用户洞察和基础信息补齐，后面所有生成都会依赖这层资产。",
        ready: productReady,
      },
      {
        key: "competitor" as TabKey,
        index: "02",
        title: "复制竞手脚本并预处理",
        desc: "把竞手原稿贴进来，转成结构化洞察，避免后面生成时只是模仿。",
        ready: competitorReady,
      },
      {
        key: "tasks" as TabKey,
        index: "03",
        title: "设置脚本任务",
        desc: "确定时长、视角、钩子、证明方式和 CTA，再发起这一轮生成。",
        ready: taskReady,
      },
      {
        key: "outputs" as TabKey,
        index: "04",
        title: "查看结果并审稿",
        desc: "在结果页看生成稿、终稿和审稿细节，做拍摄、修改、淘汰判断。",
        ready: reviewReady,
      },
    ];
  }, [workspace, taskForm.label, taskForm.product, bootstrap?.outputs.length]);

  const tabMeta = useMemo(
    () => ({
      overview: `${bootstrap?.outputs.length ?? 0} 条任务`,
      products: `${bootstrap?.products.length ?? 0} 个产品`,
      competitor: "预处理竞手稿",
      tasks: "脚本参数设置",
      outputs: `${reviewSummary["待处理"]} 条待审`,
      metrics: `${(bootstrap?.archives.length ?? 0) + Object.values(reviewDecisions).reduce((sum, d) => sum + Object.values(d.scripts ?? {}).filter((s) => s.status === "建议拍摄").length, 0)} 条待回填`,
      reports: `${bootstrap?.reports.length ?? 0} 份报告`,
    }),
    [bootstrap?.archives.length, bootstrap?.outputs.length, bootstrap?.products.length, bootstrap?.reports.length, reviewSummary]
  );

  const metricsEntries = useMemo(() => {
    const entries: Array<{
      id: string;
      type: "archive" | "recommended";
      label: string;
      product: string;
      scriptIndex?: string;
      outputKey?: string;
      performance: {
        status?: string;
        views?: string;
        holdRate3s?: string;
        completionRate?: string;
        ctr?: string;
        cvr?: string;
        commentSignals?: string;
        creativeTakeaway?: string;
        updatedAt?: string;
      };
    }> = [];

    for (const archive of bootstrap?.archives ?? []) {
      entries.push({
        id: archive.archiveSlug,
        type: "archive",
        label: archive.label,
        product: archive.product,
        performance: archive.performance ?? {},
      });
    }

    for (const [outputKey, decision] of Object.entries(reviewDecisions)) {
      for (const [scriptIndex, scriptDecision] of Object.entries(decision.scripts ?? {})) {
        if (scriptDecision.status === "建议拍摄") {
          entries.push({
            id: `rec:${outputKey}:${scriptIndex}`,
            type: "recommended",
            label: `${decision.label || outputKey} · 终稿 #${scriptIndex}`,
            product: decision.product || "",
            scriptIndex,
            outputKey,
            performance: scriptDecision.performance ?? {},
          });
        }
      }
    }

    return entries;
  }, [bootstrap?.archives, reviewDecisions]);

  if (!bootstrap) {
    return <main className="shell"><div className="loading-card">正在加载工作台…</div></main>;
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">TS</div>
          <div>
            <strong>TikTok Script Brain</strong>
            <span>Next.js 内容工作台</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={activeTab === tab.key ? "sidebar-tab active" : "sidebar-tab"}
              onClick={() => setActiveTab(tab.key)}
            >
              <div>
                <strong>{tab.label}</strong>
                <span>{tabMeta[tab.key]}</span>
              </div>
            </button>
          ))}
        </nav>
        <div className="sidebar-card">
          <p className="eyebrow">推荐流程</p>
          <ul className="sidebar-list">
            <li>产品资料填写</li>
            <li>竞手脚本预处理</li>
            <li>脚本任务设置</li>
            <li>结果审稿与细节判断</li>
          </ul>
        </div>
        <div className="sidebar-card">
          <p className="eyebrow">当前环境</p>
          <div className="mini-stat"><span>产品数</span><strong>{bootstrap.products.length}</strong></div>
          <div className="mini-stat"><span>历史任务</span><strong>{bootstrap.outputs.length}</strong></div>
          <div className="mini-stat"><span>高表现归档</span><strong>{bootstrap.archives.length}</strong></div>
        </div>
      </aside>

      <section className="main-pane">
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">TikTok 内容生产控制台</span>
            <h1>TikTok Script Brain</h1>
            <p>把产品资料、竞手洞察、脚本生成、审稿决策和复盘沉淀收进同一套 Next.js 工作台。前端已不再沿用 Streamlit，而是按内部内容团队控制台的交互节奏重做。</p>
            <div className="hero-tags">
              <span>产品资料</span>
              <span>竞手预处理</span>
              <span>脚本设置</span>
              <span>结果审稿</span>
            </div>
          </div>
          <div className="hero-media">
            <img src="/hero-dashboard.svg" alt="dashboard visual" />
          </div>
        </section>

        <section className="tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={activeTab === tab.key ? "tab active" : "tab"}
              onClick={() => setActiveTab(tab.key)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </section>

        {error ? <div className="alert error">{error}</div> : null}
        {notice ? <div className="alert success">{notice}</div> : null}

        {activeTab === "overview" && (
          <section className="stack">
            <section className="card">
              <div className="card-header">
                <div>
                  <p className="eyebrow">控制台首页</p>
                  <h2>标准工作流</h2>
                </div>
                <span className="helper">当前共有 {shootableScripts} 条终稿已被标记为建议拍摄。</span>
              </div>
              <div className="workflow-grid">
                {workflowSteps.map((step) => (
                  <button key={step.key} type="button" className="workflow-card" onClick={() => setActiveTab(step.key)}>
                    <div className="workflow-top">
                      <span className="workflow-index">{step.index}</span>
                      <span className={`status-pill ${step.ready ? "good" : "neutral"}`}>{step.ready ? "已准备" : "待处理"}</span>
                    </div>
                    <strong>{step.title}</strong>
                    <p>{step.desc}</p>
                  </button>
                ))}
              </div>
              <div className="stats-grid">
                {statCard("产品资产", bootstrap.products.length, "当前可复用的产品知识库数量")}
                {statCard("历史任务", bootstrap.outputs.length, "已经执行过的脚本任务总数")}
                {statCard("高表现归档", bootstrap.archives.length, "已沉淀进长期资产库的版本")}
                {statCard("待处理", reviewSummary["待处理"], "已经生成但还没有审稿结论")}
                {statCard("建议拍摄", reviewSummary["建议拍摄"], "任务级已经明确可进入拍摄")}
                {statCard("继续修改", reviewSummary["继续修改"], "需要继续收口语感或钩子")}
              </div>
            </section>

            <section className="dual-grid">
              <div className="card">
                <div className="card-header">
                  <div>
                    <p className="eyebrow">优先动作</p>
                    <h3>当前待办</h3>
                  </div>
                </div>
                <div className="todo-list">
                  {bootstrap.outputs
                    .filter((output) => {
                      const key = makeOutputKey(output.outputFile, output.generatedAt, output.label);
                      return (reviewDecisions[key]?.status || "待处理") === "待处理";
                    })
                    .slice(0, 5)
                    .map((output) => (
                      <div className="todo-item" key={output.outputFile}>
                        <strong>{output.label}</strong>
                        <span>{output.product}</span>
                        <small>{output.generatedAt}</small>
                      </div>
                    ))}
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <div>
                    <p className="eyebrow">最近主推</p>
                    <h3>已选主推版本</h3>
                  </div>
                </div>
                <div className="best-list">
                  {bestRows.length ? (
                    bestRows.map((item) => (
                      <div className="best-item" key={`${item.label}-${item.bestScriptIndex}`}>
                        <div>
                          <strong>{item.product}</strong>
                          <p>{item.label}</p>
                        </div>
                        <div>
                          <span>终稿 #{item.bestScriptIndex}</span>
                          <small>{item.bestScriptReason || "暂无主推理由"}</small>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty">还没有明确设置主推终稿。</div>
                  )}
                </div>
              </div>
            </section>

            <section className="card">
              <div className="card-header">
                <div>
                  <p className="eyebrow">最近任务</p>
                  <h3>最新输出动态</h3>
                </div>
              </div>
              <div className="activity-list">
                {bootstrap.outputs.slice(0, 6).map((output) => {
                  const key = makeOutputKey(output.outputFile, output.generatedAt, output.label);
                  const decision = reviewDecisions[key];
                  return (
                    <button
                      type="button"
                      key={output.outputFile}
                      className="activity-row"
                      onClick={() => {
                        setSelectedOutput(output.outputFile);
                        setActiveTab("outputs");
                      }}
                    >
                      <div>
                        <strong>{output.label}</strong>
                        <p>{output.product}</p>
                      </div>
                      <div className="activity-meta">
                        <span className={`status-pill ${statusTone(decision?.status)}`}>{decision?.status || "待处理"}</span>
                        <small>{output.generatedAt}</small>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          </section>
        )}

        {activeTab === "products" && workspace && (
          <section className="stack">
            <section className="card">
              <div className="row">
                <div className="grow">
                  <p className="eyebrow">产品资产</p>
                  <h2>产品资料工作台</h2>
                </div>
                <select value={selectedProduct} onChange={(event) => setSelectedProduct(event.target.value)} className="select">
                  {bootstrap.products.map((product) => (
                    <option key={product} value={product}>
                      {product}
                    </option>
                  ))}
                </select>
                <div className="inline-create">
                  <input
                    className="input"
                    value={newProductSlug}
                    onChange={(event) => setNewProductSlug(event.target.value)}
                    placeholder="新产品标识"
                  />
                  <button className="primary" onClick={createProductAction} disabled={busy === "create-product"}>
                    创建
                  </button>
                </div>
              </div>
              <div className="product-summary-bar">
                <div className="summary-pill">
                  <span>当前产品</span>
                  <strong>{workspace.slug}</strong>
                </div>
                <div className="summary-pill">
                  <span>资料完整度</span>
                  <strong>{productCompleteness(workspace)}%</strong>
                </div>
                <div className="summary-pill">
                  <span>关键卖点数</span>
                  <strong>{workspace.brief.keySpecs.length}</strong>
                </div>
                <div className="summary-pill">
                  <span>用户原话数</span>
                  <strong>{workspace.audience.positiveQuotes.length + workspace.audience.painQuotes.length}</strong>
                </div>
              </div>
            </section>

            <section className="three-tabs">
              <div className="card">
                <div className="card-header"><h3>产品信息</h3></div>
                <div className="form-grid">
                  <label><span>产品类目</span><input className="input" value={workspace.brief.category} onChange={(e) => setWorkspace({ ...workspace, brief: { ...workspace.brief, category: e.target.value } })} /></label>
                  <label><span>产品名称</span><input className="input" value={workspace.brief.productName} onChange={(e) => setWorkspace({ ...workspace, brief: { ...workspace.brief, productName: e.target.value } })} /></label>
                  <label className="full"><span>核心卖点一句话</span><textarea className="textarea" value={workspace.brief.coreHook} onChange={(e) => setWorkspace({ ...workspace, brief: { ...workspace.brief, coreHook: e.target.value } })} /></label>
                  <label className="full"><span>关键卖点</span><textarea className="textarea" value={joinLines(workspace.brief.keySpecs)} onChange={(e) => setWorkspace({ ...workspace, brief: { ...workspace.brief, keySpecs: splitLines(e.target.value) } })} /></label>
                  <label><span>评分 / 销量</span><input className="input" value={workspace.brief.ratingSales} onChange={(e) => setWorkspace({ ...workspace, brief: { ...workspace.brief, ratingSales: e.target.value } })} /></label>
                  <label><span>媒体 / 达人背书</span><input className="input" value={workspace.brief.mediaKol} onChange={(e) => setWorkspace({ ...workspace, brief: { ...workspace.brief, mediaKol: e.target.value } })} /></label>
                  <label><span>认证 / 奖项</span><input className="input" value={workspace.brief.certificationAward} onChange={(e) => setWorkspace({ ...workspace, brief: { ...workspace.brief, certificationAward: e.target.value } })} /></label>
                  <label><span>售价</span><input className="input" value={workspace.brief.price} onChange={(e) => setWorkspace({ ...workspace, brief: { ...workspace.brief, price: e.target.value } })} /></label>
                  <label><span>竞品价格区间</span><input className="input" value={workspace.brief.competitorRange} onChange={(e) => setWorkspace({ ...workspace, brief: { ...workspace.brief, competitorRange: e.target.value } })} /></label>
                  <label><span>产品定位</span><input className="input" value={workspace.brief.positioning} onChange={(e) => setWorkspace({ ...workspace, brief: { ...workspace.brief, positioning: e.target.value } })} /></label>
                  <label className="full"><span>不能承诺的效果</span><textarea className="textarea" value={workspace.brief.unsupportedClaims} onChange={(e) => setWorkspace({ ...workspace, brief: { ...workspace.brief, unsupportedClaims: e.target.value } })} /></label>
                  <label className="full"><span>限制词 / 违规词</span><textarea className="textarea" value={workspace.brief.restrictedWords} onChange={(e) => setWorkspace({ ...workspace, brief: { ...workspace.brief, restrictedWords: e.target.value } })} /></label>
                  <label className="full"><span>品牌语气禁区</span><textarea className="textarea" value={workspace.brief.toneTaboos} onChange={(e) => setWorkspace({ ...workspace, brief: { ...workspace.brief, toneTaboos: e.target.value } })} /></label>
                </div>
                <div className="card-actions"><button className="primary" onClick={() => saveWorkspace("brief")} disabled={busy === "save-brief"}>保存产品信息</button></div>
              </div>

              <div className="card">
                <div className="card-header"><h3>用户洞察</h3><span className="helper">粘贴原始素材让 AI 提取，或直接从产品资料推断，再微调确认。</span></div>
                <div className="ai-tool-bar">
                  <textarea className="textarea" placeholder="粘贴用户评论、客服记录、FAQ、Amazon review 等原始素材…" value={audienceRawMaterial} onChange={(e) => setAudienceRawMaterial(e.target.value)} />
                  <div className="ai-tool-actions">
                    <button className="secondary" onClick={extractAudienceAction} disabled={busy === "audience-extract" || !audienceRawMaterial.trim()}>粘贴素材 → AI 提取</button>
                    <button className="secondary" onClick={inferAudienceAction} disabled={busy === "audience-infer"}>从产品资料推断</button>
                  </div>
                </div>
                <div className="audience-form">
                  {audienceTextFields.map(({ field, label }) => (
                    <label key={field} className={field === "typicalDailyScene" || field === "whyProblemMatters" ? "full" : undefined}>
                      <span>{label}</span>
                      {field === "typicalDailyScene" || field === "whyProblemMatters" ? (
                        <textarea className="textarea" value={workspace.audience[field]} onChange={(e) => setWorkspace(updateAudienceField(workspace, field, e.target.value))} />
                      ) : (
                        <input className="input" value={workspace.audience[field]} onChange={(e) => setWorkspace(updateAudienceField(workspace, field, e.target.value))} />
                      )}
                    </label>
                  ))}
                  {([
                    ["positiveQuotes", "用户正向原话"],
                    ["painQuotes", "用户痛点原话"],
                    ["competitorWeakness", "竞手弱点"],
                    ["unexpectedUseCases", "意外使用场景"],
                    ["purchaseTriggers", "购买触发点"],
                    ["confidenceBuilders", "建立信任的证据"],
                    ["scrollAwayReasons", "为什么会划走"],
                    ["trustIssues", "为什么不信"],
                    ["naturalWords", "用户自然会说的话"],
                  ] as const).map(([field, label]) => (
                    <ChipInput
                      key={field}
                      label={label}
                      items={workspace.audience[field] as string[]}
                      onAdd={(value) => {
                        const current = workspace.audience[field] as string[];
                        setWorkspace(updateAudienceField(workspace, field, [...current, value]));
                      }}
                      onRemove={(index) => {
                        const current = workspace.audience[field] as string[];
                        setWorkspace(updateAudienceField(workspace, field, current.filter((_, i) => i !== index)));
                      }}
                    />
                  ))}
                </div>
                <div className="card-actions"><button className="primary" onClick={() => saveWorkspace("audience")} disabled={busy === "save-audience"}>保存用户洞察</button></div>
              </div>

            </section>
          </section>
        )}

        {activeTab === "tasks" && (
          <section className="stack">
            <div className="card">
              <div className="card-header"><div><p className="eyebrow">第 3 步</p><h2>设置脚本任务</h2></div></div>
              <div className="task-summary">
                <div className="summary-pill">
                  <span>时长策略</span>
                  <strong>{currentTaskSummary.length?.label || "未设置"}</strong>
                  <small>{currentTaskSummary.length?.note || "选择脚本时长。"}</small>
                </div>
                <div className="summary-pill">
                  <span>叙事视角</span>
                  <strong>{currentTaskSummary.role?.label || "未设置"}</strong>
                  <small>{currentTaskSummary.role?.prompt || "选择 POV。"}</small>
                </div>
                <div className="summary-pill">
                  <span>钩子打法</span>
                  <strong>{currentTaskSummary.hook?.label || "未设置"}</strong>
                  <small>{currentTaskSummary.hook?.prompt || "选择开头策略。"}</small>
                </div>
                <div className="summary-pill">
                  <span>证明方式</span>
                  <strong>{currentTaskSummary.proof?.label || "未设置"}</strong>
                  <small>{currentTaskSummary.proof?.prompt || "选择证明方式。"}</small>
                </div>
              </div>
              <div className="form-grid">
                <label><span>任务名称</span><input className="input" value={taskForm.label} onChange={(e) => setTaskForm({ ...taskForm, label: e.target.value })} /></label>
                <label><span>产品</span><select className="select" value={taskForm.product} onChange={(e) => setTaskForm({ ...taskForm, product: e.target.value })}>{bootstrap.products.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
                <label><span>输出文件路径</span><input className="input" value={taskForm.output} onChange={(e) => setTaskForm({ ...taskForm, output: e.target.value })} placeholder="留空自动生成" /></label>
                <label><span>视频时长</span><select className="select" value={taskForm.videoLength} onChange={(e) => setTaskForm({ ...taskForm, videoLength: e.target.value })}>{videoLengthOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
                <label><span>输出条数</span><select className="select" value={String(taskForm.outputCount)} onChange={(e) => setTaskForm({ ...taskForm, outputCount: Number(e.target.value) })}>{[2, 3, 4, 5].map((item) => <option key={item} value={item}>{item} 条</option>)}</select></label>
                <label><span>角色视角</span><select className="select" value={taskForm.rolePerspective} onChange={(e) => setTaskForm({ ...taskForm, rolePerspective: e.target.value })}>{rolePerspectiveOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
                <label><span>情绪基调</span><select className="select" value={taskForm.emotionalTone} onChange={(e) => setTaskForm({ ...taskForm, emotionalTone: e.target.value })}>{emotionalToneOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
                <label><span>钩子策略</span><select className="select" value={taskForm.hookStrategy} onChange={(e) => setTaskForm({ ...taskForm, hookStrategy: e.target.value })}>{hookStrategyOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
                <label><span>证明方式</span><select className="select" value={taskForm.proofStyle} onChange={(e) => setTaskForm({ ...taskForm, proofStyle: e.target.value })}>{proofStyleOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
                <label><span>CTA 强度</span><select className="select" value={taskForm.ctaStrength} onChange={(e) => setTaskForm({ ...taskForm, ctaStrength: e.target.value })}>{ctaStrengthOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
                <label className="full"><span>特殊要求</span><textarea className="textarea" value={taskForm.specialRequirements} onChange={(e) => setTaskForm({ ...taskForm, specialRequirements: e.target.value })} /></label>
              </div>
              <div className="inline-options">
                <label className="check"><input type="checkbox" checked={taskForm.useCompetitor} onChange={(e) => setTaskForm({ ...taskForm, useCompetitor: e.target.checked })} />使用已预处理的竞手分析</label>
                <label className="check"><input type="checkbox" checked={taskForm.archive} onChange={(e) => setTaskForm({ ...taskForm, archive: e.target.checked })} />同时归档到高表现库</label>
              </div>
              {taskForm.archive ? (
                <div className="form-grid">
                  <label><span>归档说明</span><textarea className="textarea" value={taskForm.archiveNotes} onChange={(e) => setTaskForm({ ...taskForm, archiveNotes: e.target.value })} /></label>
                  <label><span>归档标签</span><input className="input" value={taskForm.archiveTags} onChange={(e) => setTaskForm({ ...taskForm, archiveTags: e.target.value })} placeholder="用逗号分隔" /></label>
                </div>
              ) : null}
              <div className="card-actions"><button className="primary" onClick={runTaskAction} disabled={busy === "run-task"}>开始生成脚本</button></div>
            </div>
          </section>
        )}

        {activeTab === "competitor" && (
          <section className="stack">
            <div className="card">
              <div className="card-header"><div><p className="eyebrow">第 2 步</p><h2>复制竞手脚本并预处理</h2></div></div>
              <div className="form-grid">
                <label><span>产品</span><select className="select" value={competitorRaw.product} onChange={(e) => {
                  setCompetitorRaw({ ...competitorRaw, product: e.target.value, output: `products/${e.target.value}/competitor_processed.md` });
                  setSelectedProduct(e.target.value);
                }}>{bootstrap.products.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
                <label><span>竞手品牌 / 账号</span><input className="input" value={competitorRaw.brand} onChange={(e) => setCompetitorRaw({ ...competitorRaw, brand: e.target.value })} /></label>
                <label><span>类目</span><input className="input" value={competitorRaw.category} onChange={(e) => setCompetitorRaw({ ...competitorRaw, category: e.target.value })} /></label>
                <label><span>链接 / 来源</span><input className="input" value={competitorRaw.source} onChange={(e) => setCompetitorRaw({ ...competitorRaw, source: e.target.value })} /></label>
                <label><span>输出路径</span><input className="input" value={competitorRaw.output} onChange={(e) => setCompetitorRaw({ ...competitorRaw, output: e.target.value })} /></label>
                <label className="full"><span>竞手原始脚本</span><textarea className="textarea tall" value={competitorRaw.rawScript} onChange={(e) => setCompetitorRaw({ ...competitorRaw, rawScript: e.target.value })} /></label>
              </div>
              <div className="card-actions"><button className="primary" onClick={preprocessCompetitorAction} disabled={busy === "preprocess"}>预处理并保存</button></div>
            </div>

            {workspace ? (
              <div className="card">
                <div className="card-header">
                  <div>
                    <p className="eyebrow">预处理结果</p>
                    <h3>竞手分析只来自预处理产物</h3>
                  </div>
                  <span className="helper">这里展示的是 `competitor_processed.md` 当前内容，不在产品资料页人工维护。</span>
                </div>
                <div className="detail-summary-grid">
                  <div className="detail-block">
                    <span>竞手品牌 / 账号</span>
                    <p>{workspace.competitor.brand || "还没有预处理结果。"}</p>
                  </div>
                  <div className="detail-block">
                    <span>类目与来源</span>
                    <p>{[workspace.competitor.category, workspace.competitor.source].filter(Boolean).join(" · ") || "还没有预处理结果。"}</p>
                  </div>
                  <div className="detail-block">
                    <span>最适合差异化的 POV</span>
                    <p>{workspace.competitor.bestPov || "还没有预处理结果。"}</p>
                  </div>
                </div>

                <div className="compare-grid">
                  {workspace.competitor.cards.map((card, index) => (
                    <div className="nested-card" key={`competitor-preview-${index}`}>
                      <h4>脚本 {index + 1} 分析卡</h4>
                      <p><b>POV 概要：</b>{card.povSummary || "-"}</p>
                      <p><b>钩子结构：</b>{card.hookStructure || "-"}</p>
                      <p><b>转化逻辑：</b>{card.conversionLogic || "-"}</p>
                      <p><b>画面模式：</b>{card.visualPattern || "-"}</p>
                      <p><b>用户触发点：</b>{card.audienceTrigger || "-"}</p>
                      <p><b>弱点：</b>{card.weakness || "-"}</p>
                      <p><b>差异化机会：</b>{card.gap || "-"}</p>
                    </div>
                  ))}
                </div>

                <div className="detail-summary-grid">
                  <div className="detail-block">
                    <span>重复开头方式</span>
                    <p>{workspace.competitor.repeatedOpenings || "-"}</p>
                  </div>
                  <div className="detail-block">
                    <span>重复卖点表达</span>
                    <p>{workspace.competitor.repeatedClaims || "-"}</p>
                  </div>
                  <div className="detail-block">
                    <span>红海情绪区间</span>
                    <p>{workspace.competitor.emotionalRedOcean || "-"}</p>
                  </div>
                  <div className="detail-block">
                    <span>白区情绪区间</span>
                    <p>{workspace.competitor.emotionalWhiteSpace || "-"}</p>
                  </div>
                  <div className="detail-block">
                    <span>应避开角度</span>
                    <p>{workspace.competitor.avoidAngles || "-"}</p>
                  </div>
                  <div className="detail-block">
                    <span>应主攻角度</span>
                    <p>{workspace.competitor.attackAngles || "-"}</p>
                  </div>
                </div>
              </div>
            ) : null}
          </section>
        )}

        {activeTab === "outputs" && outputDetail && (
          <section className="stack">
            <div className="card">
              <div className="row">
                <div className="grow">
                  <p className="eyebrow">第 4 步</p>
                  <h2>结果与审稿</h2>
                </div>
                <select className="select wide-select" value={selectedOutput} onChange={(e) => setSelectedOutput(e.target.value)}>
                  {bootstrap.outputs.map((output) => (
                    <option key={output.outputFile} value={output.outputFile}>
                      {output.generatedAt} | {output.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="stats-grid compact-stats">
                {statCard("产品", outputDetail.entry.product, "当前任务所属产品")}
                {statCard("是否归档", outputDetail.entry.archived ? "是" : "否", "是否已经进入高表现资产库")}
                {statCard("表现状态", outputDetail.entry.performanceStatus || "pending", "归档后同步表现状态")}
                {statCard("终稿判断", `${outputDetail.finalCards.filter((c) => { const s = selectedDecision?.scripts?.[c.index]; return s?.status && s.status !== "未判断"; }).length} / ${outputDetail.finalCards.length}`, "已判断 / 总终稿")}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div>
                  <p className="eyebrow">审稿细节</p>
                  <h3>本轮生成与评审摘要</h3>
                </div>
              </div>
              <div className="detail-summary-grid">
                <div className="detail-block">
                  <span>生成稿数量</span>
                  <p>{outputDetail.generatedCards.length} 条候选，供本轮评审和修订。</p>
                </div>
                <div className="detail-block">
                  <span>终稿数量</span>
                  <p>{outputDetail.finalCards.length} 条终稿，可直接做拍摄或继续修改判断。</p>
                </div>
                <div className="detail-block">
                  <span>评审意见摘要</span>
                  {reviewBlocks.overall ? <MarkdownArticle content={reviewBlocks.overall} /> : <p>{trimPreview(outputDetail.review, 220) || "当前还没有可展示的评审摘要。"}</p>}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div>
                  <p className="eyebrow">脚本切换</p>
                  <h3>逐条审稿</h3>
                </div>
              </div>
              <div className="switch-row">
                {scriptIndexes.map((index) => (
                  <button
                    key={`script-switch-top-${index}`}
                    type="button"
                    className={selectedFinalIndex === index ? "segmented active" : "segmented"}
                    onClick={() => setSelectedFinalIndex(index)}
                  >
                    脚本 {index}
                  </button>
                ))}
              </div>
            </div>

            <div className="card">
            <div className="card-header">
              <div>
                <p className="eyebrow">AI 初版脚本</p>
                <h3>{selectedFinalIndex ? `脚本 ${selectedFinalIndex} 的生成候选` : "生成候选"}</h3>
              </div>
            </div>
            {activeGeneratedCard ? (
              <div className="readonly-stack">
                <div className="script-meta-grid">
                  <div className="meta-read-card"><span>Hook Type</span><strong>{activeGeneratedCard.hookType || "-"}</strong></div>
                  <div className="meta-read-card"><span>Emotional Arc</span><strong>{activeGeneratedCard.emotionalArc || "-"}</strong></div>
                  <div className="meta-read-card"><span>Best Use Scene</span><strong>{activeGeneratedCard.bestUseScene || "-"}</strong></div>
                </div>
                <div className="meta-note-grid">
                  <div className="detail-block">
                    <span>Visual Notes</span>
                    <p>{activeGeneratedCard.visualNotes || "-"}</p>
                  </div>
                  <div className="detail-block">
                    <span>Alternate Hooks</span>
                    <p>{activeGeneratedCard.alternateHooks || "-"}</p>
                  </div>
                </div>
                <MarkdownArticle content={renderScriptMarkdown(activeGeneratedCard.rawMarkdown)} />
              </div>
            ) : (
              outputDetail.generated ? <MarkdownArticle content={outputDetail.generated} /> : <div className="empty">当前没有可解析的 AI 初版脚本。</div>
            )}
            </div>

            <div className="card">
            <div className="card-header">
              <div>
                <p className="eyebrow">AI 审核意见</p>
                <h3>{selectedFinalIndex ? `脚本 ${selectedFinalIndex} 的评审报告` : "评审报告"}</h3>
              </div>
            </div>
            <div className="readonly-stack">
              {activeReviewScores.length ? (
                <div className="score-grid">
                  {activeReviewScores.map((item) => (
                    <div key={`score-${item.label}`} className={`score-card ${scoreTone(item.score, item.max)}`}>
                      <span>{item.label}</span>
                      <strong>{item.score}/{item.max}</strong>
                    </div>
                  ))}
                </div>
              ) : null}
              <MarkdownArticle className="review-report" content={activeReviewBody || "当前没有可展示的 AI 审核意见。"} />
              {reviewBlocks.overall && reviewBlocks.overall !== activeReviewMarkdown ? (
                <div className="overall-review">
                  <span>总体建议</span>
                  <MarkdownArticle content={reviewBlocks.overall} />
                </div>
              ) : null}
            </div>
            </div>

            {(overallRecommendation.best || overallRecommendation.onlyOne || overallRecommendation.weakest || overallRecommendation.risks) ? (
              <div className="card">
                <div className="card-header">
                  <div>
                    <p className="eyebrow">总体建议</p>
                    <h3>拍摄优先结论</h3>
                  </div>
                </div>
                <div className="recommendation-stack-horizontal">
                  {overallRecommendation.best ? <div className="recommendation-card accent-good"><span>Best Script</span><strong>{overallRecommendation.best}</strong></div> : null}
                  {overallRecommendation.onlyOne ? <div className="recommendation-card accent-blue"><span>Only One To Film</span><strong>{overallRecommendation.onlyOne}</strong></div> : null}
                  {overallRecommendation.weakest ? <div className="recommendation-card accent-warn"><span>Weakest Script</span><strong>{overallRecommendation.weakest}</strong></div> : null}
                  {overallRecommendation.risks ? <div className="detail-block"><span>Must-fix Risks</span><MarkdownArticle content={overallRecommendation.risks} /></div> : null}
                </div>
              </div>
            ) : null}

            <div className="review-shell">
              <div className="card review-rail">
                <div className="card-header">
                  <div>
                    <p className="eyebrow">终稿列表</p>
                    <h3>先选版本，再做判断</h3>
                  </div>
                </div>
                {selectedDecision?.bestScriptIndex ? (
                  <div className="featured-banner compact">
                    <div>
                      <span>当前主推</span>
                      <strong>终稿 #{selectedDecision.bestScriptIndex}</strong>
                    </div>
                    <p>{selectedDecision.bestScriptReason || "建议补充主推理由。"} </p>
                  </div>
                ) : null}
                <div className="review-list">
                  {outputDetail.finalCards.map((card) => {
                    const scriptDecision = selectedDecision?.scripts?.[card.index] || {};
                    const isBest = selectedDecision?.bestScriptIndex === card.index;
                    const isActive = activeFinalCard?.index === card.index;
                    return (
                      <button
                        type="button"
                        key={`final-nav-${card.index}`}
                        className={isActive ? "review-list-item active" : "review-list-item"}
                        onClick={() => setSelectedFinalIndex(card.index)}
                      >
                        <div className="review-list-top">
                          <strong>终稿 #{card.index}</strong>
                          <div className="review-list-actions">
                            {isBest ? <span className="best-badge">主推</span> : null}
                            <span className="copy-btn-sm" onClick={(e) => {
                              e.stopPropagation();
                              const table = card.rawMarkdown.match(/\|[\s\S]*$/)?.[0] || "";
                              navigator.clipboard.writeText(table.trim()).then(() => setNotice(`终稿 #${card.index} 表格已复制。`));
                            }}>复制</span>
                          </div>
                        </div>
                        <div className="pill-row">
                          <span className={`status-pill ${statusTone(scriptDecision.status)}`}>{scriptDecision.status || "未判断"}</span>
                          <span className="meta-pill">{scriptDecision.priority || "普通"}</span>
                        </div>
                        <p>{card.hookType || "未标注钩子"} · {card.bestUseScene || "未标注场景"}</p>
                        <small>{card.scriptBody.slice(0, 72) || "暂无正文"}</small>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="review-detail">
                {activeFinalCard ? (
                  <div className="card">
                    <div className="detail-hero">
                      <div>
                        <p className="eyebrow">终稿详情</p>
                        <h2>终稿 #{activeFinalCard.index}</h2>
                        <div className="pill-row">
                          <span className="meta-pill">{activeFinalCard.hookType || "未标注钩子"}</span>
                          <span className="meta-pill">{activeFinalCard.emotionalArc || "未标注情绪弧线"}</span>
                          <span className="meta-pill">{activeFinalCard.bestUseScene || "未标注场景"}</span>
                        </div>
                      </div>
                      <div className="detail-actions">
                        <span className={`status-pill ${statusTone(activeScriptDecision.status)}`}>{activeScriptDecision.status || "未判断"}</span>
                        <button
                          className={selectedDecision?.bestScriptIndex === activeFinalCard.index ? "secondary" : "primary"}
                          type="button"
                          onClick={() => {
                            void saveReviewDecision({
                              ...(selectedDecision || {}),
                              bestScriptIndex: activeFinalCard.index,
                              bestScriptReason: selectedDecision?.bestScriptReason || "",
                            });
                          }}
                        >
                          {selectedDecision?.bestScriptIndex === activeFinalCard.index ? "当前主推" : "设为主推"}
                        </button>
                      </div>
                    </div>

                    <div className="detail-grid">
                      <div className="detail-block">
                        <div className="detail-block-header">
                          <span>终稿内容</span>
                          <button className="copy-btn" onClick={() => {
                            const table = activeFinalCard.rawMarkdown.match(/\|[\s\S]*$/)?.[0] || "";
                            navigator.clipboard.writeText(table.trim()).then(() => setNotice("表格已复制到剪贴板。"));
                          }}>复制表格</button>
                        </div>
                        <div className="script-meta-grid compact">
                          <div className="meta-read-card"><span>Hook Type</span><strong>{activeFinalCard.hookType || "-"}</strong></div>
                          <div className="meta-read-card"><span>Emotional Arc</span><strong>{activeFinalCard.emotionalArc || "-"}</strong></div>
                          <div className="meta-read-card"><span>Best Use Scene</span><strong>{activeFinalCard.bestUseScene || "-"}</strong></div>
                        </div>
                        <MarkdownArticle content={renderScriptMarkdown(activeFinalCard.rawMarkdown)} />
                      </div>
                      <div className="detail-block">
                        <span>画面建议</span>
                        <p>{activeFinalCard.visualNotes || "-"}</p>
                      </div>
                      <div className="detail-block">
                        <span>备选开头</span>
                        <p>{activeFinalCard.alternateHooks || "-"}</p>
                      </div>
                      {activeFinalCard.whatWasFixed ? (
                        <div className="detail-block">
                          <span>本轮修正</span>
                          <p>{activeFinalCard.whatWasFixed}</p>
                        </div>
                      ) : null}
                    </div>

                    <div className="detail-controls">
                      <label><span>脚本状态</span><select className="select" value={activeScriptDecision.status || "未判断"} onChange={(e) => {
                        const next: ReviewDecision = {
                          ...(selectedDecision || {}),
                          scripts: {
                            ...(selectedDecision?.scripts || {}),
                            [activeFinalCard.index]: {
                              ...(selectedDecision?.scripts?.[activeFinalCard.index] || {}),
                              status: e.target.value,
                            },
                          },
                        };
                        void saveReviewDecision(next);
                      }}>{["未判断", "建议拍摄", "继续修改", "淘汰"].map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
                      <label><span>优先级</span><select className="select" value={activeScriptDecision.priority || "普通"} onChange={(e) => {
                        const next: ReviewDecision = {
                          ...(selectedDecision || {}),
                          scripts: {
                            ...(selectedDecision?.scripts || {}),
                            [activeFinalCard.index]: {
                              ...(selectedDecision?.scripts?.[activeFinalCard.index] || {}),
                              priority: e.target.value,
                            },
                          },
                        };
                        void saveReviewDecision(next);
                      }}>{["普通", "高", "紧急"].map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
                    </div>
                  </div>
                ) : outputDetail.final ? (
                  <div className="card">
                    <div className="card-header">
                      <div>
                        <p className="eyebrow">终稿详情</p>
                        <h2>终稿内容</h2>
                      </div>
                    </div>
                    <MarkdownArticle content={outputDetail.final} />
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        )}

        {activeTab === "metrics" && (
          <section className="stack">
            <div className="card">
              <div className="card-header"><div><p className="eyebrow">表现回填</p><h2>脚本表现数据更新</h2></div><span className="helper">归档记录与建议拍摄的终稿均可回填表现数据。</span></div>
              <div className="form-grid">
                <label><span>选择记录</span><select className="select" value={metricsForm.entryId} onChange={(e) => {
                  const entry = metricsEntries.find((item) => item.id === e.target.value);
                  if (!entry) return;
                  setMetricsForm({
                    entryId: entry.id,
                    entryType: entry.type,
                    outputKey: entry.outputKey ?? "",
                    scriptIndex: entry.scriptIndex ?? "",
                    status: entry.performance.status || "pending_manual_update",
                    views: entry.performance.views || "",
                    holdRate3s: entry.performance.holdRate3s || "",
                    completionRate: entry.performance.completionRate || "",
                    ctr: entry.performance.ctr || "",
                    cvr: entry.performance.cvr || "",
                    commentSignals: entry.performance.commentSignals || "",
                    creativeTakeaway: entry.performance.creativeTakeaway || "",
                    updatedAt: entry.performance.updatedAt || "",
                  });
                }}>
                  <option value="">-- 选择记录 --</option>
                  {metricsEntries.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.type === "archive" ? "[归档] " : "[建议拍摄] "}{entry.label} · {entry.product}
                    </option>
                  ))}
                </select></label>
                <label><span>表现状态</span><select className="select" value={metricsForm.status} onChange={(e) => setMetricsForm({ ...metricsForm, status: e.target.value })}>{["pending_manual_update", "testing", "validated_winner", "weak_result", "needs_iteration"].map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
                <label><span>播放量</span><input className="input" value={metricsForm.views} onChange={(e) => setMetricsForm({ ...metricsForm, views: e.target.value })} /></label>
                <label><span>3 秒留存</span><input className="input" value={metricsForm.holdRate3s} onChange={(e) => setMetricsForm({ ...metricsForm, holdRate3s: e.target.value })} /></label>
                <label><span>完播率</span><input className="input" value={metricsForm.completionRate} onChange={(e) => setMetricsForm({ ...metricsForm, completionRate: e.target.value })} /></label>
                <label><span>CTR</span><input className="input" value={metricsForm.ctr} onChange={(e) => setMetricsForm({ ...metricsForm, ctr: e.target.value })} /></label>
                <label><span>CVR</span><input className="input" value={metricsForm.cvr} onChange={(e) => setMetricsForm({ ...metricsForm, cvr: e.target.value })} /></label>
                <label><span>数据更新时间</span><input className="input" readOnly value={metricsForm.updatedAt ? new Date(metricsForm.updatedAt).toLocaleString("zh-CN") : "尚未更新"} style={{ background: "#f4f6fa", color: "var(--muted)" }} /></label>
                <label className="full"><span>评论信号</span><textarea className="textarea" value={metricsForm.commentSignals} onChange={(e) => setMetricsForm({ ...metricsForm, commentSignals: e.target.value })} /></label>
                <label className="full"><span>创意结论</span><textarea className="textarea" value={metricsForm.creativeTakeaway} onChange={(e) => setMetricsForm({ ...metricsForm, creativeTakeaway: e.target.value })} /></label>
              </div>
              <div className="card-actions"><button className="primary" onClick={updateMetricsAction} disabled={busy === "metrics" || !metricsForm.entryId}>更新表现数据</button></div>
            </div>
          </section>
        )}

        {activeTab === "reports" && (
          <section className="stack">
            <div className="card">
              <div className="card-header"><div><p className="eyebrow">复盘报告</p><h2>生成与查看</h2></div></div>
              <div className="form-grid">
                <label><span>产品筛选</span><select className="select" value={reportForm.product} onChange={(e) => setReportForm({ ...reportForm, product: e.target.value })}><option value="">全部产品</option>{bootstrap.products.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
                <label><span>开始日期</span><input className="input" value={reportForm.dateFrom} onChange={(e) => setReportForm({ ...reportForm, dateFrom: e.target.value })} placeholder="YYYY-MM-DD" /></label>
                <label><span>结束日期</span><input className="input" value={reportForm.dateTo} onChange={(e) => setReportForm({ ...reportForm, dateTo: e.target.value })} placeholder="YYYY-MM-DD" /></label>
                <label><span>输出路径</span><input className="input" value={reportForm.output} onChange={(e) => setReportForm({ ...reportForm, output: e.target.value })} placeholder="留空自动生成" /></label>
              </div>
              <div className="card-actions"><button className="primary" onClick={generateReportAction} disabled={busy === "report"}>生成复盘报告</button></div>
            </div>
            <div className="card">
              <div className="row">
                <div className="grow">
                  <p className="eyebrow">报告预览</p>
                  <h3>最近生成</h3>
                </div>
                <select className="select wide-select" value={selectedReport} onChange={(e) => setSelectedReport(e.target.value)}>
                  {bootstrap.reports.map((report) => <option key={report.name} value={report.name}>{report.name}</option>)}
                </select>
              </div>
              <MarkdownArticle className="report-view" content={reportContent || "还没有报告内容。"} />
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
