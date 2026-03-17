package com.risc.backend.game.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record TurnRequest(@NotNull List<@Valid OrderRequest> orders) {}

