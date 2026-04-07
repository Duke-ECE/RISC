export type UnitLevelName =
  | "BASIC"
  | "LEVEL_1"
  | "LEVEL_2"
  | "LEVEL_3"
  | "LEVEL_4"
  | "LEVEL_5"
  | "LEVEL_6";

const techRequirements: Record<UnitLevelName, number> = {
  BASIC: 1,
  LEVEL_1: 1,
  LEVEL_2: 2,
  LEVEL_3: 3,
  LEVEL_4: 4,
  LEVEL_5: 5,
  LEVEL_6: 6
};

const totalCosts: Record<UnitLevelName, number> = {
  BASIC: 0,
  LEVEL_1: 3,
  LEVEL_2: 11,
  LEVEL_3: 30,
  LEVEL_4: 55,
  LEVEL_5: 90,
  LEVEL_6: 140
};

export const unitLevels: UnitLevelName[] = [
  "BASIC",
  "LEVEL_1",
  "LEVEL_2",
  "LEVEL_3",
  "LEVEL_4",
  "LEVEL_5",
  "LEVEL_6"
];

export function techUpgradeCost(currentLevel: number): number | null {
  switch (currentLevel) {
    case 1:
      return 50;
    case 2:
      return 75;
    case 3:
      return 125;
    case 4:
      return 200;
    case 5:
      return 300;
    default:
      return null;
  }
}

export function unitUpgradeCost(fromLevel: UnitLevelName, toLevel: UnitLevelName, units: number): number {
  return Math.max(0, (totalCosts[toLevel] - totalCosts[fromLevel]) * Math.max(0, units));
}

export function canUpgradeUnit(
  currentTechLevel: number,
  fromLevel: UnitLevelName,
  toLevel: UnitLevelName,
  availableUnits: number,
  units: number): boolean {
  if (units <= 0 || availableUnits < units) {
    return false;
  }
  if (unitLevels.indexOf(toLevel) <= unitLevels.indexOf(fromLevel)) {
    return false;
  }
  return techRequirements[toLevel] <= currentTechLevel;
}
