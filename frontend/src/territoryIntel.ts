export type TerritoryIntel = {
  name: string;
  owner: string | null;
  size: number;
  resourceProduction: Record<string, number>;
  unitCounts: Record<string, number>;
};

export function visibleResourceEntries(resourceProduction: Record<string, number>): Array<[string, number]> {
  return Object.entries(resourceProduction).filter(([, amount]) => amount > 0);
}

export function visibleUnitEntries(unitCounts: Record<string, number>): Array<[string, number]> {
  return Object.entries(unitCounts).filter(([, amount]) => amount > 0);
}

export function summarizeTerritoryIntel(territory: TerritoryIntel): {
  resourceEntries: Array<[string, number]>;
  unitEntries: Array<[string, number]>;
} {
  return {
    resourceEntries: visibleResourceEntries(territory.resourceProduction),
    unitEntries: visibleUnitEntries(territory.unitCounts)
  };
}
