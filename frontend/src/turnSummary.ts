export type TerritoryChangeSummary = {
  territory: string;
  owner: string | null;
  movementDelta: number;
  reinforcementDelta: number;
  finalUnits: number | null;
};

const MOVE_PATTERN = /([A-Za-z]+) MOVE (\d+) from ([A-Za-z]+) to ([A-Za-z]+)/;
const REINFORCEMENT_PATTERN = /Reinforcement: ([A-Za-z]+) owned by ([A-Za-z]+) gains 1 unit \((\d+) -> (\d+)\)\./;
const SUMMARY_PATTERN = /- ([A-Za-z]+): ([A-Za-z]+) holds (\d+) units\./;

export function buildTurnSummary(entries: string[]): TerritoryChangeSummary[] {
  const summaries = new Map<string, TerritoryChangeSummary>();

  for (const entry of entries) {
    const moveMatch = entry.match(MOVE_PATTERN);
    if (moveMatch) {
      const units = Number(moveMatch[2]);
      const source = ensureSummary(summaries, moveMatch[3]);
      const target = ensureSummary(summaries, moveMatch[4]);
      source.movementDelta -= units;
      target.movementDelta += units;
      continue;
    }

    const reinforcementMatch = entry.match(REINFORCEMENT_PATTERN);
    if (reinforcementMatch) {
      const territory = ensureSummary(summaries, reinforcementMatch[1]);
      territory.owner = reinforcementMatch[2];
      territory.reinforcementDelta += 1;
      territory.finalUnits = Number(reinforcementMatch[4]);
      continue;
    }

    const summaryMatch = entry.trim().match(SUMMARY_PATTERN);
    if (summaryMatch) {
      const territory = ensureSummary(summaries, summaryMatch[1]);
      territory.owner = summaryMatch[2];
      territory.finalUnits = Number(summaryMatch[3]);
    }
  }

  return Array.from(summaries.values())
    .filter((summary) => summary.movementDelta !== 0 || summary.reinforcementDelta !== 0)
    .sort((left, right) => left.territory.localeCompare(right.territory));
}

function ensureSummary(
  summaries: Map<string, TerritoryChangeSummary>,
  territoryName: string
): TerritoryChangeSummary {
  const existing = summaries.get(territoryName);
  if (existing) {
    return existing;
  }
  const next: TerritoryChangeSummary = {
    territory: territoryName,
    owner: null,
    movementDelta: 0,
    reinforcementDelta: 0,
    finalUnits: null
  };
  summaries.set(territoryName, next);
  return next;
}
