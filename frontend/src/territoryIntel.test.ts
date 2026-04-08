import { describe, expect, it } from "vitest";
import { summarizeTerritoryIntel } from "./territoryIntel";

describe("summarizeTerritoryIntel", () => {
  it("filters zero-value resource and unit entries", () => {
    const summary = summarizeTerritoryIntel({
      name: "Oz",
      owner: "GREEN",
      size: 2,
      resourceProduction: {
        FOOD: 3,
        TECHNOLOGY: 0
      },
      unitCounts: {
        BASIC: 4,
        LEVEL_1: 0,
        LEVEL_2: 1
      }
    });

    expect(summary.resourceEntries).toEqual([["FOOD", 3]]);
    expect(summary.unitEntries).toEqual([
      ["BASIC", 4],
      ["LEVEL_2", 1]
    ]);
  });
});
