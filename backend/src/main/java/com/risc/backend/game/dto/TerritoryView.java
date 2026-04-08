package com.risc.backend.game.dto;

import java.util.List;
import java.util.Map;

public record TerritoryView(
    String name,
    String owner,
    int units,
    int x,
    int y,
    int size,
    Map<String, Integer> resourceProduction,
    Map<String, Integer> unitCounts,
    List<String> neighbors,
    boolean hidden,
    List<VertexView> polygon) {}
