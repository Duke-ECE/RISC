package com.risc.backend.game;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;

public final class MapGenerator {
  private MapGenerator() {}

  public static List<TerritoryDefinition> generate(List<PlayerId> players, int boardWidth, int boardHeight, Random random) {
    if (players == null || players.size() < 2 || players.size() > 5) {
      throw new IllegalArgumentException("Player count must be between 2 and 5.");
    }
    if (random == null) {
      throw new IllegalArgumentException("Random is required.");
    }

    int territoriesPerPlayer = 3;
    int totalTerritories = players.size() * territoriesPerPlayer;
    int centerX = boardWidth / 2;
    int centerY = boardHeight / 2;
    int radius = Math.min(boardWidth, boardHeight) / 2 - 90;
    radius = Math.max(140, radius);

    List<String> names = new ArrayList<>(List.of(
        "Narnia",
        "Midkemia",
        "Oz",
        "Elantris",
        "Scadrial",
        "Roshar",
        "Gondor",
        "Mordor",
        "Hogwarts",
        "Atlantis",
        "Avalon",
        "Neverland",
        "Asgard",
        "Rivendell",
        "Erebor",
        "Camelot",
        "Wakanda",
        "Shangri-La",
        "Eldorado",
        "Laputa",
        "Kakariko",
        "Hyrule",
        "Rapture",
        "Pandora",
        "Skellige",
        "Novigrad",
        "Kaer Morhen",
        "Valyria",
        "Braavos",
        "Stormwind",
        "Darnassus"));
    java.util.Collections.shuffle(names, random);
    if (names.size() < totalTerritories) {
      throw new IllegalStateException("Not enough territory names for this player count.");
    }

    List<TerritoryDefinition> definitions = new ArrayList<>(totalTerritories);
    for (int playerIndex = 0; playerIndex < players.size(); playerIndex++) {
      PlayerId playerId = players.get(playerIndex);
      for (int j = 1; j <= territoriesPerPlayer; j++) {
        int flatIndex = playerIndex * territoriesPerPlayer + (j - 1);
        double angle = (2.0 * Math.PI * flatIndex) / totalTerritories - Math.PI / 2.0;
        int x = centerX + (int) Math.round(radius * Math.cos(angle));
        int y = centerY + (int) Math.round(radius * Math.sin(angle));
        String name = names.get(flatIndex);
        definitions.add(new TerritoryDefinition(name, x, y, playerId, List.of()));
      }
    }

    Map<String, Set<String>> neighbors = new LinkedHashMap<>();
    for (TerritoryDefinition definition : definitions) {
      neighbors.put(definition.name(), new LinkedHashSet<>());
    }

    // Global ring connectivity.
    for (int i = 0; i < definitions.size(); i++) {
      String a = definitions.get(i).name();
      String b = definitions.get((i + 1) % definitions.size()).name();
      link(neighbors, a, b);
    }

    // Within each player's starting trio, fully connect.
    for (PlayerId playerId : players) {
      List<String> trio = definitions.stream()
          .filter(def -> def.initialOwner() == playerId)
          .map(TerritoryDefinition::name)
          .toList();
      for (int i = 0; i < trio.size(); i++) {
        for (int j = i + 1; j < trio.size(); j++) {
          link(neighbors, trio.get(i), trio.get(j));
        }
      }
    }

    List<TerritoryDefinition> withNeighbors = new ArrayList<>(definitions.size());
    for (TerritoryDefinition definition : definitions) {
      List<String> list = neighbors.get(definition.name()).stream().toList();
      withNeighbors.add(new TerritoryDefinition(
          definition.name(),
          definition.x(),
          definition.y(),
          definition.initialOwner(),
          list));
    }
    return withNeighbors;
  }

  private static void link(Map<String, Set<String>> neighbors, String a, String b) {
    neighbors.get(a).add(b);
    neighbors.get(b).add(a);
  }
}
