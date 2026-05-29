export type ProductBrief = {
  category: string;
  productName: string;
  coreHook: string;
  keySpecs: string[];
  ratingSales: string;
  mediaKol: string;
  certificationAward: string;
  price: string;
  competitorRange: string;
  positioning: string;
  unsupportedClaims: string;
  restrictedWords: string;
  toneTaboos: string;
};

export type AudienceInsight = {
  ageRange: string;
  lifeStage: string;
  persona: string;
  typicalDailyScene: string;
  whyProblemMatters: string;
  positiveQuotes: string[];
  painQuotes: string[];
  competitorWeakness: string[];
  unexpectedUseCases: string[];
  purchaseTriggers: string[];
  confidenceBuilders: string[];
  scrollAwayReasons: string[];
  trustIssues: string[];
  naturalWords: string[];
};

export type CompetitorCard = {
  povSummary: string;
  hookStructure: string;
  conversionLogic: string;
  visualPattern: string;
  audienceTrigger: string;
  weakness: string;
  gap: string;
};

export type CompetitorProcessed = {
  brand: string;
  category: string;
  source: string;
  cards: CompetitorCard[];
  repeatedOpenings: string;
  repeatedClaims: string;
  emotionalRedOcean: string;
  emotionalWhiteSpace: string;
  avoidAngles: string;
  attackAngles: string;
  bestPov: string;
};

export type ProductWorkspace = {
  slug: string;
  brief: ProductBrief;
  audience: AudienceInsight;
  competitor: CompetitorProcessed;
};

export type OutputEntry = {
  generatedAt: string;
  label: string;
  product: string;
  model: string;
  outputFile: string;
  paramsFile?: string;
  competitorFile?: string;
  archived: boolean;
  archiveFile?: string;
  performanceStatus?: string;
};

export type ArchiveEntry = {
  archiveSlug: string;
  archivedAt: string;
  label: string;
  product: string;
  archiveFile: string;
  archiveTags?: string[];
  performance?: {
    status?: string;
    views?: string;
    holdRate3s?: string;
    completionRate?: string;
    ctr?: string;
    cvr?: string;
    commentSignals?: string;
    creativeTakeaway?: string;
  };
};

export type ScriptCard = {
  index: string;
  rawMarkdown: string;
  hookType: string;
  emotionalArc: string;
  bestUseScene: string;
  whatWasFixed: string;
  scriptBody: string;
  visualNotes: string;
  alternateHooks: string;
};

export type ReviewDecision = {
  status?: string;
  priority?: string;
  owner?: string;
  note?: string;
  nextAction?: string;
  label?: string;
  product?: string;
  generatedAt?: string;
  bestScriptIndex?: string;
  bestScriptReason?: string;
  scripts?: Record<
    string,
    {
      status?: string;
      priority?: string;
      note?: string;
      performance?: {
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
    }
  >;
};

export type ReviewDecisions = Record<string, ReviewDecision>;

export type ReportFile = {
  path: string;
  name: string;
  content?: string;
};

export type BootstrapData = {
  products: string[];
  outputs: OutputEntry[];
  archives: ArchiveEntry[];
  reviewDecisions: ReviewDecisions;
  reports: ReportFile[];
};

export type OutputDetail = {
  entry: OutputEntry;
  generated: string;
  review: string;
  final: string;
  generatedCards: ScriptCard[];
  finalCards: ScriptCard[];
};
