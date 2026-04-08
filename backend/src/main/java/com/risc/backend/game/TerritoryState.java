package com.risc.backend.game;

import java.util.EnumMap;
import java.util.Map;

public class TerritoryState {
  private final TerritoryDefinition definition;
  private final EnumMap<UnitLevel, Integer> unitCounts;
  private PlayerId owner;

  public TerritoryState(TerritoryDefinition definition, PlayerId owner, int units) {
    this.definition = definition;
    this.owner = owner;
    this.unitCounts = new EnumMap<>(UnitLevel.class);
    clearUnitCounts();
    addUnits(UnitLevel.BASIC, Math.max(0, units));
  }

  public TerritoryState(TerritoryDefinition definition, PlayerId owner, Map<UnitLevel, Integer> unitCounts) {
    this.definition = definition;
    this.owner = owner;
    this.unitCounts = new EnumMap<>(UnitLevel.class);
    clearUnitCounts();
    setUnitCounts(unitCounts);
  }

  public TerritoryDefinition definition() {
    return definition;
  }

  public PlayerId owner() {
    return owner;
  }

  public void owner(PlayerId owner) {
    this.owner = owner;
  }

  public int units() {
    return unitCounts.values().stream().mapToInt(Integer::intValue).sum();
  }

  public void units(int units) {
    clearUnitCounts();
    addUnits(UnitLevel.BASIC, Math.max(0, units));
  }

  public Map<UnitLevel, Integer> unitCounts() {
    return Map.copyOf(unitCounts);
  }

  public int unitCount(UnitLevel level) {
    return unitCounts.getOrDefault(level, 0);
  }

  public void setUnitCounts(Map<UnitLevel, Integer> nextCounts) {
    clearUnitCounts();
    if (nextCounts == null) {
      return;
    }
    for (Map.Entry<UnitLevel, Integer> entry : nextCounts.entrySet()) {
      addUnits(entry.getKey(), entry.getValue());
    }
  }

  public void addUnits(UnitLevel level, int amount) {
    if (level == null || amount <= 0) {
      return;
    }
    unitCounts.merge(level, amount, Integer::sum);
  }

  public void addUnits(Map<UnitLevel, Integer> additions) {
    if (additions == null) {
      return;
    }
    for (Map.Entry<UnitLevel, Integer> entry : additions.entrySet()) {
      addUnits(entry.getKey(), entry.getValue());
    }
  }

  public void removeUnits(UnitLevel level, int amount) {
    if (level == null || amount <= 0) {
      return;
    }
    int current = unitCounts.getOrDefault(level, 0);
    if (amount > current) {
      throw new IllegalArgumentException("Not enough units of level " + level.name() + ".");
    }
    unitCounts.put(level, current - amount);
  }

  public TerritoryState copy() {
    return new TerritoryState(definition, owner, unitCounts);
  }

  private void clearUnitCounts() {
    for (UnitLevel level : UnitLevel.values()) {
      unitCounts.put(level, 0);
    }
  }
}
