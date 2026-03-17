package com.risc.backend.game.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record OrderRequest(
    @NotNull String type,
    @NotBlank String source,
    @NotBlank String target,
    @Min(1) int units) {}

