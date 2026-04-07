package com.risc.backend.game.dto;

import java.util.List;
import java.util.Map;

public record TerritoryView(
    String name,
    String owner,
    int units,
    int x,
    int y,
    List<String> neighbors,
    int size,
    Map<String, Integer> resourceProduction,
    boolean hidden,
    List<VertexView> polygon) {}
