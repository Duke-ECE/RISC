package com.risc.backend.game;

public enum UnitLevel {
  BASIC(0, 1, 0),
  LEVEL_1(1, 1, 3),
  LEVEL_2(3, 2, 11),
  LEVEL_3(5, 3, 30),
  LEVEL_4(8, 4, 55),
  LEVEL_5(11, 5, 90),
  LEVEL_6(15, 6, 140);

  private final int combatBonus;
  private final int requiredTechLevel;
  private final int totalCost;

  UnitLevel(int combatBonus, int requiredTechLevel, int totalCost) {
    this.combatBonus = combatBonus;
    this.requiredTechLevel = requiredTechLevel;
    this.totalCost = totalCost;
  }

  public int combatBonus() {
    return combatBonus;
  }

  public int requiredTechLevel() {
    return requiredTechLevel;
  }

  public int totalCost() {
    return totalCost;
  }
}
