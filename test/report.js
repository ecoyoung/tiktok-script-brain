const fs = require("fs");
const path = require("path");

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

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJsonIfExists(filePath, fallbackValue) {
  if (!fs.existsSync(filePath)) {
    return fallbackValue;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    return fallbackValue;
  }
}

function slugifyFileName(input) {
  return (input || "all")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "all";
}

function normalizeEntries(data) {
  return Array.isArray(data?.entries) ? data.entries : [];
}

function filterByProduct(entries, product) {
  if (!product) {
    return entries;
  }
  return entries.filter((entry) => entry.product === product);
}

function filterByDate(entries, dateFrom, dateTo, field) {
  return entries.filter((entry) => {
    const value = entry[field];
    if (!value) {
      return false;
    }

    const day = String(value).slice(0, 10);
    if (dateFrom && day < dateFrom) {
      return false;
    }
    if (dateTo && day > dateTo) {
      return false;
    }
    return true;
  });
}

function groupCount(entries, field) {
  const counts = new Map();
  for (const entry of entries) {
    const key = entry[field] || "unknown";
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function summarizePerformance(entries) {
  const counts = new Map();
  for (const entry of entries) {
    const key = entry.performanceStatus || entry.performance?.status || "unknown";
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function extractTopArchiveSignals(entries) {
  return entries
    .filter((entry) => entry.performance?.creativeTakeaway || entry.archiveNotes)
    .slice(0, 5)
    .map((entry) => ({
      label: entry.label,
      product: entry.product,
      takeaway: entry.performance?.creativeTakeaway || entry.archiveNotes || "",
    }));
}

function buildReport(filters, outputEntries, archiveEntries) {
  const tasksByProduct = groupCount(outputEntries, "product");
  const archiveByProduct = groupCount(archiveEntries, "product");
  const performanceBreakdown = summarizePerformance(outputEntries);
  const topSignals = extractTopArchiveSignals(archiveEntries);

  return [
    "# TikTok Script Brain Report",
    "",
    "## Filters",
    `- Product: ${filters.product || "all"}`,
    `- Date From: ${filters.dateFrom || "N/A"}`,
    `- Date To: ${filters.dateTo || "N/A"}`,
    "",
    "## Task Summary",
    `- Total tasks: ${outputEntries.length}`,
    `- Archived tasks: ${outputEntries.filter((entry) => entry.archived).length}`,
    `- Non-archived tasks: ${outputEntries.filter((entry) => !entry.archived).length}`,
    "",
    "## Performance Status Breakdown",
    ...(performanceBreakdown.length
      ? performanceBreakdown.map(([status, count]) => `- ${status}: ${count}`)
      : ["- No data"]),
    "",
    "## Tasks by Product",
    ...(tasksByProduct.length
      ? tasksByProduct.map(([product, count]) => `- ${product}: ${count}`)
      : ["- No data"]),
    "",
    "## High Performer Summary",
    `- Total archived high performers: ${archiveEntries.length}`,
    ...(archiveByProduct.length
      ? archiveByProduct.map(([product, count]) => `- ${product}: ${count}`)
      : ["- No archived entries"]),
    "",
    "## Recent High Performer Signals",
    ...(topSignals.length
      ? topSignals.map((item) => `- [${item.product}] ${item.label}: ${item.takeaway}`)
      : ["- No creative takeaways logged yet"]),
    "",
    "## Recent Tasks",
    ...(outputEntries.slice(0, 10).map((entry) => {
      return `- ${entry.generatedAt} | ${entry.product} | ${entry.label} | archived=${entry.archived ? "yes" : "no"} | status=${entry.performanceStatus || "pending"}`;
    }) || ["- No tasks"]),
    "",
    "## Recent High Performers",
    ...(archiveEntries.slice(0, 10).map((entry) => {
      return `- ${entry.archivedAt} | ${entry.product} | ${entry.label} | status=${entry.performance?.status || "pending_manual_update"} | tags=${(entry.archiveTags || []).join(", ") || "N/A"}`;
    }) || ["- No archives"]),
    "",
  ].join("\n");
}

function main() {
  const rootDir = process.cwd();
  const args = parseArgs(process.argv.slice(2));
  const filters = {
    product: args.product || "",
    dateFrom: args.dateFrom || "",
    dateTo: args.dateTo || "",
  };

  const outputIndex = normalizeEntries(readJsonIfExists(path.join(rootDir, "outputs", "index.json"), { entries: [] }));
  const archiveIndex = normalizeEntries(readJsonIfExists(path.join(rootDir, "archives", "high_performers", "index.json"), { entries: [] }));

  let filteredOutputs = filterByProduct(outputIndex, filters.product);
  let filteredArchives = filterByProduct(archiveIndex, filters.product);

  filteredOutputs = filterByDate(filteredOutputs, filters.dateFrom, filters.dateTo, "generatedAt");
  filteredArchives = filterByDate(filteredArchives, filters.dateFrom, filters.dateTo, "archivedAt");

  const content = buildReport(filters, filteredOutputs, filteredArchives);
  const reportsDir = path.join(rootDir, "reports");
  ensureDir(reportsDir);

  const dateStamp = new Date().toISOString().slice(0, 10);
  const suffix = filters.product ? slugifyFileName(filters.product) : "all_products";
  const outputPath = args.output
    ? path.resolve(rootDir, args.output)
    : path.join(reportsDir, `${dateStamp}_${suffix}_report.md`);

  fs.writeFileSync(outputPath, content, "utf8");
  console.log(`Saved report to ${outputPath}`);
}

main();
