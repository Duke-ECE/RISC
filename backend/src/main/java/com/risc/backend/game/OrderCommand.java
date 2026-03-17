package com.risc.backend.game;

public record OrderCommand(OrderType type, String source, String target, int units, PlayerId playerId) {}

