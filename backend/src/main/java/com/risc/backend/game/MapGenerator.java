package com.risc.backend.game;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.Envelope;
import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.Polygon;
import org.locationtech.jts.triangulate.VoronoiDiagramBuilder;

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
    int radius = Math.min(boardWidth, boardHeight) / 2 - 130;
    radius = Math.max(160, radius);
    int margin = 54;

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

    List<String> territoryNames = names.subList(0, totalTerritories);
    List<PlayerId> territoryOwners = new ArrayList<>(totalTerritories);
    List<Integer> territorySizes = new ArrayList<>(totalTerritories);
    List<Map<String, Integer>> territoryResources = new ArrayList<>(totalTerritories);
    for (int playerIndex = 0; playerIndex < players.size(); playerIndex++) {
      for (int j = 0; j < territoriesPerPlayer; j++) {
        territoryOwners.add(players.get(playerIndex));
        territorySizes.add(List.of(1, 2, 3).get(j));
        territoryResources.add(resourcePattern(j));
      }
    }

    List<Coordinate> sites = new ArrayList<>(totalTerritories);
    double minDist = Math.max(86.0, Math.min(boardWidth, boardHeight) / 6.3);
    List<Coordinate> placed = new ArrayList<>();
    for (int playerIndex = 0; playerIndex < players.size(); playerIndex++) {
      double baseAngle = (2.0 * Math.PI * playerIndex) / players.size() - Math.PI / 2.0;
      double cx = centerX + (radius * 0.55) * Math.cos(baseAngle);
      double cy = centerY + (radius * 0.55) * Math.sin(baseAngle);
      for (int j = 0; j < territoriesPerPlayer; j++) {
        Coordinate coord = sampleNearCluster(
            cx,
            cy,
            boardWidth,
            boardHeight,
            margin,
            placed,
            minDist,
            random);
        placed.add(coord);
        sites.add(coord);
      }
    }

    GeometryFactory geometryFactory = new GeometryFactory();
    VoronoiDiagramBuilder voronoiBuilder = new VoronoiDiagramBuilder();
    voronoiBuilder.setSites(sites);
    voronoiBuilder.setClipEnvelope(new Envelope(margin, boardWidth - margin, margin, boardHeight - margin));
    Geometry diagram = voronoiBuilder.getDiagram(geometryFactory);
    List<Polygon> cells = new ArrayList<>();
    for (int i = 0; i < diagram.getNumGeometries(); i++) {
      Geometry geom = diagram.getGeometryN(i);
      if (geom instanceof Polygon polygon) {
        cells.add(polygon);
      }
    }

    // Assign each Voronoi cell to the site coordinate it contains.
    List<Polygon> polygonByIndex = new ArrayList<>(totalTerritories);
    for (Coordinate site : sites) {
      Point sitePoint = geometryFactory.createPoint(site);
      Polygon match = null;
      for (Polygon cell : cells) {
        if (cell.covers(sitePoint)) {
          match = cell;
          break;
        }
      }
      if (match == null) {
        // Fallback: pick the cell with nearest centroid.
        double best = Double.POSITIVE_INFINITY;
        for (Polygon cell : cells) {
          Coordinate centroid = cell.getCentroid().getCoordinate();
          double dx = centroid.x - site.x;
          double dy = centroid.y - site.y;
          double dist = dx * dx + dy * dy;
          if (dist < best) {
            best = dist;
            match = cell;
          }
        }
      }
      polygonByIndex.add(match);
    }

    Map<String, Set<String>> neighbors = new LinkedHashMap<>();
    for (String name : territoryNames) {
      neighbors.put(name, new LinkedHashSet<>());
    }

    // Neighbors from shared Voronoi edges.
    for (int i = 0; i < totalTerritories; i++) {
      Polygon a = polygonByIndex.get(i);
      if (a == null) {
        continue;
      }
      Geometry aBoundary = a.getBoundary();
      for (int j = i + 1; j < totalTerritories; j++) {
        Polygon b = polygonByIndex.get(j);
        if (b == null) {
          continue;
        }
        Geometry shared = aBoundary.intersection(b.getBoundary());
        if (shared.getDimension() == 1 && shared.getLength() > 1.0) {
          link(neighbors, territoryNames.get(i), territoryNames.get(j));
        }
      }
    }

    List<TerritoryDefinition> result = new ArrayList<>(totalTerritories);
    for (int i = 0; i < totalTerritories; i++) {
      Polygon polygon = polygonByIndex.get(i);
      List<MapVertex> vertices = polygon == null ? List.of() : toVertices(polygon);
      Coordinate centroid = polygon == null ? sites.get(i) : polygon.getCentroid().getCoordinate();
      String name = territoryNames.get(i);
      result.add(new TerritoryDefinition(
          name,
          (int) Math.round(centroid.x),
          (int) Math.round(centroid.y),
          territoryOwners.get(i),
          neighbors.get(name).stream().toList(),
          territorySizes.get(i),
          territoryResources.get(i),
          vertices));
    }

    return result;
  }

  private static Map<String, Integer> resourcePattern(int indexInStartingGroup) {
    return switch (indexInStartingGroup) {
      case 0 -> Map.of("food", 3, "technology", 1);
      case 1 -> Map.of("food", 2, "technology", 2);
      case 2 -> Map.of("food", 1, "technology", 3);
      default -> throw new IllegalArgumentException("Unexpected territory index: " + indexInStartingGroup);
    };
  }

  private static void link(Map<String, Set<String>> neighbors, String a, String b) {
    neighbors.get(a).add(b);
    neighbors.get(b).add(a);
  }

  private static Coordinate sampleNearCluster(
      double cx,
      double cy,
      int boardWidth,
      int boardHeight,
      int margin,
      List<Coordinate> alreadyPlaced,
      double minDist,
      Random random) {
    int attempts = 0;
    while (attempts < 2000) {
      attempts += 1;
      double angle = random.nextDouble() * Math.PI * 2.0;
      double r = 48 + random.nextDouble() * 120;
      double x = cx + Math.cos(angle) * r;
      double y = cy + Math.sin(angle) * r;
      x = Math.max(margin, Math.min(boardWidth - margin, x));
      y = Math.max(margin, Math.min(boardHeight - margin, y));
      Coordinate candidate = new Coordinate(x, y);
      boolean ok = true;
      for (Coordinate other : alreadyPlaced) {
        double dx = other.x - candidate.x;
        double dy = other.y - candidate.y;
        if ((dx * dx + dy * dy) < (minDist * minDist)) {
          ok = false;
          break;
        }
      }
      if (ok) {
        return candidate;
      }
    }
    // Fallback: just clamp without spacing.
    return new Coordinate(
        Math.max(margin, Math.min(boardWidth - margin, cx)),
        Math.max(margin, Math.min(boardHeight - margin, cy)));
  }

  private static List<MapVertex> toVertices(Polygon polygon) {
    Coordinate[] coords = polygon.getExteriorRing().getCoordinates();
    if (coords.length <= 1) {
      return List.of();
    }
    List<MapVertex> vertices = new ArrayList<>(coords.length - 1);
    for (int i = 0; i < coords.length - 1; i++) {
      Coordinate c = coords[i];
      vertices.add(new MapVertex((int) Math.round(c.x), (int) Math.round(c.y)));
    }
    return vertices;
  }
}
