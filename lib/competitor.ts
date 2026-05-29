import type { CompetitorCard } from "./types";

export function competitorCardHasContent(card: CompetitorCard): boolean {
  return Boolean(
    card.povSummary.trim() ||
      card.hookStructure.trim() ||
      card.conversionLogic.trim() ||
      card.visualPattern.trim() ||
      card.audienceTrigger.trim() ||
      card.weakness.trim() ||
      card.gap.trim()
  );
}

export function filterCompetitorCards(cards: CompetitorCard[]): CompetitorCard[] {
  return cards.filter(competitorCardHasContent);
}
