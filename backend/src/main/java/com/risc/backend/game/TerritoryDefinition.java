package com.risc.backend.game;

import java.util.List;
import java.util.Map;

public record TerritoryDefinition(
    String name,
    int x,
    int y,
    PlayerId initialOwner,
    List<String> neighbors,
    int size,
    Map<String, Integer> resourceProduction,
    List<MapVertex> polygon) {}
