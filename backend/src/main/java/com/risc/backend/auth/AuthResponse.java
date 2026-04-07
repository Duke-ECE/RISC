package com.risc.backend.auth;

import java.util.List;

public record AuthResponse(
    String username,
    String token,
    List<ActiveGameView> activeGames) {}
