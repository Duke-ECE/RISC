package com.risc.backend.game;

public enum PlayerId {
  GREEN,
  BLUE,
  RED;

  public String displayName() {
    return name().charAt(0) + name().substring(1).toLowerCase();
  }
}

