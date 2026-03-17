package com.risc.backend.game.dto;

import jakarta.validation.constraints.NotNull;
import java.util.Map;

public record PlacementRequest(@NotNull Map<String, Integer> allocations) {}

