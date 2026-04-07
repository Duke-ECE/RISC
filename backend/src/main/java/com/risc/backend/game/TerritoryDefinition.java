package com.risc.backend.game;

import java.util.List;
import java.util.Map;

public record TerritoryDefinition(
    String name,
    int x,
    int y,
    PlayerId initialOwner,
    int size,
    Map<ResourceType, Integer> resourceProduction,
    List<String> neighbors,
    List<MapVertex> polygon) {}
