import { describe, expect, it } from "vitest";
import { buildTurnSummary } from "./turnSummary";

describe("buildTurnSummary", () => {
  it("shows movement and reinforcement separately for the same territory", () => {
    const summary = buildTurnSummary([
      "Green MOVE 1 from Narnia to Oz | Narnia: 4 -> 3, Oz: 4 -> 5.",
      "Reinforcement: Narnia owned by Green gains 1 unit (3 -> 4).",
      "Reinforcement: Oz owned by Green gains 1 unit (5 -> 6).",
      " - Narnia: Green holds 4 units.",
      " - Oz: Green holds 6 units."
    ]);

    expect(summary).toEqual([
      {
        territory: "Narnia",
        owner: "Green",
        movementDelta: -1,
        reinforcementDelta: 1,
        finalUnits: 4
      },
      {
        territory: "Oz",
        owner: "Green",
        movementDelta: 1,
        reinforcementDelta: 1,
        finalUnits: 6
      }
    ]);
  });
});
