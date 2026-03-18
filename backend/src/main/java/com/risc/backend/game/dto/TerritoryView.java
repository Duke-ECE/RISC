package com.risc.backend.game.dto;

import java.util.List;

public record TerritoryView(
    String name,
    String owner,
    int units,
    int x,
    int y,
    List<String> neighbors,
    boolean hidden,
    List<VertexView> polygon) {}
