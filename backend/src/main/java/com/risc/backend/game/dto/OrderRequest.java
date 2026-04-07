package com.risc.backend.game.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record OrderRequest(
    @NotNull String type,
    String source,
    String target,
    @Min(0) int units,
    String fromLevel,
    String toLevel) {}
