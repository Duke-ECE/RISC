package com.risc.backend.game.dto;

import java.util.Map;

public record PlayerView(
    String id,
    String displayName,
    int territories,
    int totalUnits,
    boolean defeated,
    boolean localPlayer,
    int reserveUnits,
    int maxTechnologyLevel,
    Map<String, Integer> resources) {}
