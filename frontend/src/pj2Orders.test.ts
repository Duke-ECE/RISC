import { describe, expect, it } from "vitest";
import { canUpgradeUnit, techUpgradeCost, unitUpgradeCost } from "./pj2Orders";

describe("pj2Orders", () => {
  it("computes tech upgrade costs", () => {
    expect(techUpgradeCost(1)).toBe(50);
    expect(techUpgradeCost(5)).toBe(300);
    expect(techUpgradeCost(6)).toBeNull();
  });

  it("computes cross-level unit upgrade cost", () => {
    expect(unitUpgradeCost("BASIC", "LEVEL_2", 2)).toBe(22);
    expect(unitUpgradeCost("LEVEL_1", "LEVEL_3", 1)).toBe(27);
  });

  it("checks local upgrade legality", () => {
    expect(canUpgradeUnit(1, "BASIC", "LEVEL_1", 3, 2)).toBe(true);
    expect(canUpgradeUnit(1, "BASIC", "LEVEL_2", 3, 1)).toBe(false);
    expect(canUpgradeUnit(3, "LEVEL_2", "LEVEL_1", 3, 1)).toBe(false);
    expect(canUpgradeUnit(3, "LEVEL_1", "LEVEL_3", 0, 1)).toBe(false);
  });
});
