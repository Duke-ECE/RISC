package com.risc.backend.game;

public class TerritoryState {
  private final TerritoryDefinition definition;
  private PlayerId owner;
  private int units;

  public TerritoryState(TerritoryDefinition definition, PlayerId owner, int units) {
    this.definition = definition;
    this.owner = owner;
    this.units = units;
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
    return units;
  }

  public void units(int units) {
    this.units = units;
  }
}

