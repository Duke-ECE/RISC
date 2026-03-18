package com.risc.backend.game.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.Map;

public record PlacementRequest(
    @NotNull Map<String, Integer> allocations,
    List<String> abandon) {
  public List<String> abandonSafe() {
    return abandon == null ? List.of() : abandon;
  }
}
