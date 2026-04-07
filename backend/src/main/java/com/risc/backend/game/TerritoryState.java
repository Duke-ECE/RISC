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
    for (UnitLevel level : UnitLevel.values()) {
      unitCounts.put(level, 0);
    }
    this.unitCounts.put(UnitLevel.BASIC, Math.max(0, units));
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
    for (UnitLevel level : UnitLevel.values()) {
      unitCounts.put(level, 0);
    }
    unitCounts.put(UnitLevel.BASIC, Math.max(0, units));
  }

  public Map<UnitLevel, Integer> unitCounts() {
    return Map.copyOf(unitCounts);
  }
}
