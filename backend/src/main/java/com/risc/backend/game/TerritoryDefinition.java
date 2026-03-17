package com.risc.backend.game;

import java.util.List;

public record TerritoryDefinition(
    String name,
    int x,
    int y,
    PlayerId initialOwner,
    List<String> neighbors) {}

