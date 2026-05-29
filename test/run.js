const fs = require("fs");
const path = require("path");

function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) {
    return;
  }

  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      continue;
    }

    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
      continue;
    }

    args[key] = next;
    i += 1;
  }
  return args;
}

function requireArg(args, key, message) {
  if (!args[key]) {
    throw new Error(message);
  }
  return args[key];
}

function readFileSafe(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label} not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, "utf8").trim();
}

function readJsonFileSafe(filePath, label) {
  const content = readFileSafe(filePath, label);
  try {
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${filePath}`);
  }
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeJsonFile(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function writeTextFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf8");
}

function renderTemplate(template, values) {
  return Object.entries(values).reduce((result, [key, value]) => {
    return result.replaceAll(`{{${key}}}`, value ?? "");
  }, template);
}

function buildCompetitorBlock(competitorContent) {
  if (!competitorContent) {
    return "";
  }

  return [
    "【竞手脚本参考】",
    "以下是竞手脚本分析。你的任务是找到他们没有覆盖的角度，不要模仿，要差异化。",
    competitorContent,
  ].join("\n");
}

function slugifyFileName(input) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "output";
}

function extractOutputCount(paramsContent) {
  const match = paramsContent.match(/\*\*Output Count:\*\*[\s\S]*?-\s*(\d+)/i);
  return match ? match[1] : "3";
}

function extractRawCompetitorScript(content) {
  const rawMatch = content.match(/\*\*Raw Script（原始脚本）:\*\*([\s\S]*)$/);
  if (rawMatch) {
    return rawMatch[1].trim();
  }

  const marker = "## COMPETITOR RAW SCRIPT";
  if (content.includes(marker)) {
    return content.slice(content.indexOf(marker) + marker.length).trim();
  }

  return content.trim();
}

function extractCompetitorMetadata(content) {
  const getField = (label) => {
    const regex = new RegExp(`\\*\\*${label}:\\*\\*\\s*(.*)`);
    const match = content.match(regex);
    return match ? match[1].trim() : "";
  };

  return {
    competitorBrand: getField("Competitor Brand / Account（竞手品牌 / 账号）"),
    category: getField("Category（类目）"),
    linkSource: getField("Link / Source（链接 / 来源）"),
  };
}

function resolveOptionalFile(rootDir, filePath) {
  if (!filePath) {
    return null;
  }
  return path.resolve(rootDir, filePath);
}

function resolveTaskConfig(rootDir, task) {
  if (!task || typeof task !== "object") {
    throw new Error("Task entry must be an object.");
  }

  if (!task.product) {
    throw new Error("Task entry missing required field: product");
  }

  if (!task.params) {
    throw new Error(`Task for product "${task.product}" missing required field: params`);
  }

  return {
    product: task.product,
    paramsPath: path.resolve(rootDir, task.params),
    competitorPath: resolveOptionalFile(rootDir, task.competitor),
    outputPath: resolveOptionalFile(rootDir, task.output),
    label: task.label || task.product,
    archive: Boolean(task.archive),
    archiveNotes: task.archiveNotes || "",
    archiveTags: Array.isArray(task.archiveTags) ? task.archiveTags : [],
  };
}

function getDefaultOutputPath(rootDir, product) {
  const outputDir = path.join(rootDir, "outputs");
  ensureDir(outputDir);

  const timestamp = new Date().toISOString();
  const dateOnly = timestamp.slice(0, 10);
  return path.join(outputDir, `${dateOnly}_${slugifyFileName(product)}_scripts.md`);
}

function readJsonIfExists(filePath, fallbackValue) {
  if (!fs.existsSync(filePath)) {
    return fallbackValue;
  }

  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    return fallbackValue;
  }
}

function updateOutputIndex(rootDir, entry) {
  const indexPath = path.join(rootDir, "outputs", "index.json");
  const current = readJsonIfExists(indexPath, { entries: [] });
  const entries = Array.isArray(current.entries) ? current.entries : [];
  entries.unshift(entry);

  const deduped = [];
  const seen = new Set();
  for (const item of entries) {
    const key = item.outputFile;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(item);
  }

  writeOutputIndex(rootDir, deduped);
}

function writeOutputIndex(rootDir, entries) {
  writeJsonFile(path.join(rootDir, "outputs", "index.json"), { entries });

  const markdown = [
    "# Output Index",
    "",
    "| Generated At | Label | Product | Model | Output File | Archived | Performance Status |",
    "|--------------|-------|---------|-------|-------------|----------|--------------------|",
    ...entries.map((item) => {
      return `| ${item.generatedAt} | ${item.label} | ${item.product} | ${item.model} | ${item.outputFile} | ${item.archived ? "yes" : "no"} | ${item.performanceStatus || "pending"} |`;
    }),
    "",
  ].join("\n");

  writeTextFile(path.join(rootDir, "outputs", "index.md"), markdown);
}

function writeHighPerformerIndex(rootDir, entries) {
  const archivesDir = path.join(rootDir, "archives", "high_performers");
  writeJsonFile(path.join(archivesDir, "index.json"), { entries });

  const markdown = [
    "# High Performers",
    "",
    "| Archived At | Label | Product | Archive File | Tags | Performance Status |",
    "|-------------|-------|---------|--------------|------|--------------------|",
    ...entries.map((item) => {
      return `| ${item.archivedAt} | ${item.label} | ${item.product} | ${item.archiveFile} | ${(item.archiveTags || []).join(", ") || "N/A"} | ${item.performance?.status || "pending_manual_update"} |`;
    }),
    "",
  ].join("\n");

  writeTextFile(path.join(archivesDir, "index.md"), markdown);
}

function archiveHighPerformer(rootDir, archiveInput) {
  const archivesDir = path.join(rootDir, "archives", "high_performers");
  const packagesDir = path.join(archivesDir, "packages");
  const metadataDir = path.join(archivesDir, "metadata");
  ensureDir(packagesDir);
  ensureDir(metadataDir);

  const archiveSlug = `${archiveInput.dateOnly}_${slugifyFileName(archiveInput.product)}_${slugifyFileName(archiveInput.label)}`;
  const packagePath = path.join(packagesDir, `${archiveSlug}.md`);
  const metadataPath = path.join(metadataDir, `${archiveSlug}.json`);
  const metadata = {
    archiveSlug,
    archivedAt: archiveInput.generatedAt,
    product: archiveInput.product,
    label: archiveInput.label,
    model: archiveInput.model,
    outputFile: archiveInput.outputFile,
    paramsFile: archiveInput.paramsFile,
    competitorFile: archiveInput.competitorFile,
    archiveNotes: archiveInput.archiveNotes,
    archiveTags: archiveInput.archiveTags,
    performance: {
      status: "pending_manual_update",
      views: "",
      holdRate3s: "",
      completionRate: "",
      ctr: "",
      cvr: "",
      commentSignals: "",
      creativeTakeaway: "",
    },
  };
  writeJsonFile(metadataPath, metadata);

  writeTextFile(packagePath, buildArchivePackageContent(metadata, archiveInput.finalScripts, archiveInput.reviewResult));

  const indexPath = path.join(archivesDir, "index.json");
  const current = readJsonIfExists(indexPath, { entries: [] });
  const entries = Array.isArray(current.entries) ? current.entries : [];
  const archiveEntry = {
    archiveSlug,
    archivedAt: archiveInput.generatedAt,
    label: archiveInput.label,
    product: archiveInput.product,
    model: archiveInput.model,
    outputFile: archiveInput.outputFile,
    archiveFile: path.relative(rootDir, packagePath),
    metadataFile: path.relative(rootDir, metadataPath),
    archiveNotes: archiveInput.archiveNotes,
    archiveTags: archiveInput.archiveTags,
    performance: metadata.performance,
  };

  entries.unshift(archiveEntry);
  writeHighPerformerIndex(rootDir, entries);

  return path.relative(rootDir, packagePath);
}

function buildArchivePackageContent(metadata, finalScripts, reviewResult) {
  return [
    `# High Performer Archive: ${metadata.label}`,
    "",
    `- Archive Slug: ${metadata.archiveSlug}`,
    `- Archived At: ${metadata.archivedAt}`,
    `- Product: ${metadata.product}`,
    `- Model: ${metadata.model}`,
    `- Output File: ${metadata.outputFile}`,
    `- Params File: ${metadata.paramsFile}`,
    `- Competitor File: ${metadata.competitorFile || "N/A"}`,
    `- Archive Tags: ${(metadata.archiveTags || []).join(", ") || "N/A"}`,
    "",
    "## Why This Was Archived",
    metadata.archiveNotes || "Pending team notes.",
    "",
    "## Final Scripts",
    finalScripts,
    "",
    "## Review Snapshot",
    reviewResult,
    "",
    "## Manual Performance Update",
    `- Status: ${metadata.performance.status || "pending_manual_update"}`,
    `- Views: ${metadata.performance.views || ""}`,
    `- 3s Hold Rate: ${metadata.performance.holdRate3s || ""}`,
    `- Completion Rate: ${metadata.performance.completionRate || ""}`,
    `- CTR: ${metadata.performance.ctr || ""}`,
    `- CVR: ${metadata.performance.cvr || ""}`,
    `- Comment Signals: ${metadata.performance.commentSignals || ""}`,
    `- Creative Takeaway: ${metadata.performance.creativeTakeaway || ""}`,
    "",
  ].join("\n");
}

function extractSection(content, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`## ${escaped}\\n([\\s\\S]*?)(?=\\n## |$)`);
  const match = content.match(regex);
  return match ? match[1].trim() : "";
}

function updateArchivePerformance(rootDir, metricsPath) {
  const metrics = readJsonFileSafe(metricsPath, "Performance metrics");
  if (!metrics.archiveSlug) {
    throw new Error("Performance metrics file must include archiveSlug.");
  }

  const archivesDir = path.join(rootDir, "archives", "high_performers");
  const archiveIndex = readJsonIfExists(path.join(archivesDir, "index.json"), { entries: [] });
  const entries = Array.isArray(archiveIndex.entries) ? archiveIndex.entries : [];
  const entryIndex = entries.findIndex((entry) => entry.archiveSlug === metrics.archiveSlug);
  if (entryIndex === -1) {
    throw new Error(`Archive slug not found: ${metrics.archiveSlug}`);
  }

  const entry = entries[entryIndex];
  const metadata = readJsonFileSafe(path.join(rootDir, entry.metadataFile), "Archive metadata");
  metadata.performance = {
    status: metrics.status || metadata.performance.status || "updated",
    views: metrics.views ?? metadata.performance.views ?? "",
    holdRate3s: metrics.holdRate3s ?? metadata.performance.holdRate3s ?? "",
    completionRate: metrics.completionRate ?? metadata.performance.completionRate ?? "",
    ctr: metrics.ctr ?? metadata.performance.ctr ?? "",
    cvr: metrics.cvr ?? metadata.performance.cvr ?? "",
    commentSignals: metrics.commentSignals ?? metadata.performance.commentSignals ?? "",
    creativeTakeaway: metrics.creativeTakeaway ?? metadata.performance.creativeTakeaway ?? "",
  };
  writeJsonFile(path.join(rootDir, entry.metadataFile), metadata);

  const packagePath = path.join(rootDir, entry.archiveFile);
  const packageContent = readFileSafe(packagePath, "Archive package");
  const finalScripts = extractSection(packageContent, "Final Scripts");
  const reviewResult = extractSection(packageContent, "Review Snapshot");
  writeTextFile(packagePath, buildArchivePackageContent(metadata, finalScripts, reviewResult));

  entries[entryIndex] = {
    ...entry,
    archiveNotes: metadata.archiveNotes,
    archiveTags: metadata.archiveTags,
    performance: metadata.performance,
  };
  writeHighPerformerIndex(rootDir, entries);

  const outputIndex = readJsonIfExists(path.join(rootDir, "outputs", "index.json"), { entries: [] });
  const outputEntries = Array.isArray(outputIndex.entries) ? outputIndex.entries : [];
  const updatedOutputEntries = outputEntries.map((outputEntry) => {
    if (outputEntry.archiveFile !== entry.archiveFile) {
      return outputEntry;
    }
    return {
      ...outputEntry,
      performanceStatus: metadata.performance.status || "updated",
    };
  });
  writeOutputIndex(rootDir, updatedOutputEntries);

  console.log(`Updated performance for archive ${metrics.archiveSlug}`);
}

async function callDeepSeek(userPrompt) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
  const model = process.env.DEEPSEEK_MODEL || "deepseek-v4";
  const temperature = Number(process.env.DEEPSEEK_TEMPERATURE || "0.8");
  const maxTokens = Number(process.env.DEEPSEEK_MAX_TOKENS || "4000");

  if (!apiKey) {
    throw new Error("Missing DEEPSEEK_API_KEY. Add it to .env or your shell environment.");
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature,
      max_tokens: maxTokens,
      messages: [
        {
          role: "system",
          content: "You are a precise and reliable creative operations assistant.",
        },
        {
          role: "user",
          content: userPrompt,
        },
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
    throw new Error("DeepSeek API returned no message content.");
  }

  return content.trim();
}

async function preprocessCompetitor(rootDir, inputPath, outputPath) {
  const promptTemplate = readFileSafe(path.join(rootDir, "core", "competitor_preprocess.md"), "Competitor preprocess prompt");
  const rawInput = readFileSafe(inputPath, "Competitor raw input");
  const rawScript = extractRawCompetitorScript(rawInput);
  const metadata = extractCompetitorMetadata(rawInput);
  const prompt = renderTemplate(promptTemplate, {
    COMPETITOR_BRAND: metadata.competitorBrand,
    COMPETITOR_CATEGORY: metadata.category,
    COMPETITOR_LINK_SOURCE: metadata.linkSource,
    RAW_COMPETITOR_SCRIPT: rawScript,
  });

  const processed = await callDeepSeek(prompt);
  writeTextFile(outputPath, processed.endsWith("\n") ? processed : `${processed}\n`);
  console.log(`Saved competitor preprocessing output to ${outputPath}`);
}

async function runTask(taskConfig, sharedFiles) {
  const { rootDir, promptDir, knowledgeDir } = sharedFiles;
  const { product, paramsPath, competitorPath, outputPath, label, archive, archiveNotes, archiveTags } = taskConfig;

  const productDir = path.join(rootDir, "products", product);
  const productBriefPath = path.join(productDir, "product_brief.md");
  const audienceInsightPath = path.join(productDir, "audience_insight.md");
  const defaultCompetitorPath = path.join(productDir, "competitor_processed.md");
  const finalCompetitorPath = competitorPath || (fs.existsSync(defaultCompetitorPath) ? defaultCompetitorPath : null);

  const productBrief = readFileSafe(productBriefPath, "Product brief");
  const audienceInsight = readFileSafe(audienceInsightPath, "Audience insight");
  const styleGuide = readFileSafe(path.join(knowledgeDir, "style_guide_us.md"), "Style guide");
  const params = readFileSafe(paramsPath, "Script parameters");
  const competitor = finalCompetitorPath ? readFileSafe(finalCompetitorPath, "Competitor analysis") : "";

  const mainPromptTemplate = readFileSafe(path.join(promptDir, "main_prompt.md"), "Main prompt");
  const reviewPromptTemplate = readFileSafe(path.join(promptDir, "review_prompt.md"), "Review prompt");
  const revisePromptTemplate = readFileSafe(path.join(promptDir, "revise_prompt.md"), "Revise prompt");

  const count = extractOutputCount(params);
  const mainPrompt = renderTemplate(mainPromptTemplate, {
    MODULE_1_PRODUCT_BRIEF: productBrief,
    MODULE_2_AUDIENCE_INSIGHT: audienceInsight,
    MODULE_3_STYLE_GUIDE: styleGuide,
    MODULE_4_COMPETITOR_BLOCK: buildCompetitorBlock(competitor),
    MODULE_5_PARAMETERS: params,
    COUNT: count,
  });

  const generatedScripts = await callDeepSeek(mainPrompt);

  const reviewPrompt = renderTemplate(reviewPromptTemplate, {
    GENERATED_SCRIPTS: generatedScripts,
  });
  const reviewResult = await callDeepSeek(reviewPrompt);

  const revisePrompt = renderTemplate(revisePromptTemplate, {
    GENERATED_SCRIPTS: generatedScripts,
    REVIEW_RESULT: reviewResult,
  });
  const finalScripts = await callDeepSeek(revisePrompt);

  const timestamp = new Date().toISOString();
  const outputName = outputPath || getDefaultOutputPath(rootDir, product);

  const model = process.env.DEEPSEEK_MODEL || "deepseek-v4";
  const outputContent = [
    `# Script Output: ${product}`,
    "",
    `- Task Label: ${label}`,
    `- Generated At: ${timestamp}`,
    `- Model: ${model}`,
    `- Product: ${product}`,
    `- Params File: ${path.relative(rootDir, paramsPath)}`,
    `- Competitor File: ${finalCompetitorPath ? path.relative(rootDir, finalCompetitorPath) : "N/A"}`,
    "",
    "---",
    "",
    "## Generated Scripts",
    generatedScripts,
    "",
    "---",
    "",
    "## Review Report",
    reviewResult,
    "",
    "---",
    "",
    "## Final Scripts",
    finalScripts,
    "",
  ].join("\n");

  ensureDir(path.dirname(outputName));
  fs.writeFileSync(outputName, outputContent, "utf8");
  const relativeOutput = path.relative(rootDir, outputName);
  let archivedFile = null;

  if (archive) {
    archivedFile = archiveHighPerformer(rootDir, {
      generatedAt: timestamp,
      dateOnly: timestamp.slice(0, 10),
      product,
      label,
      model,
      outputFile: relativeOutput,
      paramsFile: path.relative(rootDir, paramsPath),
      competitorFile: finalCompetitorPath ? path.relative(rootDir, finalCompetitorPath) : "",
      archiveNotes,
      archiveTags,
      finalScripts,
      reviewResult,
    });
  }

  updateOutputIndex(rootDir, {
    generatedAt: timestamp,
    label,
    product,
    model,
    outputFile: relativeOutput,
    paramsFile: path.relative(rootDir, paramsPath),
    competitorFile: finalCompetitorPath ? path.relative(rootDir, finalCompetitorPath) : "",
    archived: Boolean(archivedFile),
    archiveFile: archivedFile || "",
    performanceStatus: archivedFile ? "pending_manual_update" : "not_archived",
  });

  console.log(`[${label}] Saved output to ${outputName}${archivedFile ? ` and archived to ${archivedFile}` : ""}`);
}

async function main() {
  const rootDir = process.cwd();
  loadEnvFile(path.join(rootDir, ".env"));
  const args = parseArgs(process.argv.slice(2));

  const promptDir = path.join(rootDir, "core");
  const knowledgeDir = path.join(rootDir, "knowledge");
  const sharedFiles = { rootDir, promptDir, knowledgeDir };

  if (args.updateMetrics) {
    updateArchivePerformance(rootDir, path.resolve(rootDir, args.updateMetrics));
    return;
  }

  if (args.preprocessCompetitor) {
    const inputPath = path.resolve(rootDir, args.preprocessCompetitor);
    const outputPath = path.resolve(
      rootDir,
      args.output || "products/example_product/competitor_processed_from_raw.md"
    );
    await preprocessCompetitor(rootDir, inputPath, outputPath);
    return;
  }

  if (args.batch) {
    const batchPath = path.resolve(rootDir, args.batch);
    const batchConfig = readJsonFileSafe(batchPath, "Batch config");
    if (!Array.isArray(batchConfig.tasks) || batchConfig.tasks.length === 0) {
      throw new Error("Batch config must contain a non-empty tasks array.");
    }

    for (const task of batchConfig.tasks) {
      const taskConfig = resolveTaskConfig(rootDir, task);
      await runTask(taskConfig, sharedFiles);
    }
    return;
  }

  if (args.task) {
    const taskPath = path.resolve(rootDir, args.task);
    const taskConfig = resolveTaskConfig(rootDir, readJsonFileSafe(taskPath, "Task config"));
    await runTask(taskConfig, sharedFiles);
    return;
  }

  const product = requireArg(args, "product", "Missing --product, for example: --product example_product");
  const paramsPath = requireArg(args, "params", "Missing --params, for example: --params inputs/script_parameters_template.md");
  await runTask(
    {
      product,
      paramsPath: path.resolve(rootDir, paramsPath),
      competitorPath: resolveOptionalFile(rootDir, args.competitor),
      outputPath: resolveOptionalFile(rootDir, args.output),
      label: product,
      archive: Boolean(args.archive),
      archiveNotes: "",
      archiveTags: [],
    },
    sharedFiles
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
