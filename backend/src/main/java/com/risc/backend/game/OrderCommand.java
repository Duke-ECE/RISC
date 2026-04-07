package com.risc.backend.game;

public record OrderCommand(
    OrderType type,
    String source,
    String target,
    int units,
    PlayerId playerId,
    UnitLevel fromLevel,
    UnitLevel toLevel) {

  public OrderCommand(OrderType type, String source, String target, int units, PlayerId playerId) {
    this(type, source, target, units, playerId, null, null);
  }

  public static OrderCommand upgradeTech(PlayerId playerId) {
    return new OrderCommand(OrderType.UPGRADE_TECH, null, null, 1, playerId, null, null);
  }

  public static OrderCommand upgradeUnit(String source, int units, PlayerId playerId, UnitLevel fromLevel, UnitLevel toLevel) {
    return new OrderCommand(OrderType.UPGRADE_UNIT, source, null, units, playerId, fromLevel, toLevel);
  }
}
