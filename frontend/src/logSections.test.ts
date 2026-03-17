import { describe, expect, it } from "vitest";
import { classifyLogEntry, groupLogEntries } from "./logSections";

describe("classifyLogEntry", () => {
  it("classifies detailed combat lines", () => {
    expect(classifyLogEntry("Battle queue at Hogwarts: defender is Red with 4 units.")).toBe("combat");
    expect(classifyLogEntry("Combat starts at Hogwarts: Blue attacks from Scadrial (4) with 4 units against Red defending with 4 units.")).toBe("combat");
    expect(classifyLogEntry("  Round 1: attacker rolls 12, defender rolls 7 -> defender loses 1.")).toBe("combat");
    expect(classifyLogEntry("Combat result: Blue conquers Hogwarts from Red after 7 rounds and keeps 1 units there.")).toBe("combat");
  });

  it("classifies reinforcement and summary lines", () => {
    expect(classifyLogEntry("Reinforcement: Oz owned by Green gains 1 unit (5 -> 6).")).toBe("reinforcement");
    expect(classifyLogEntry("Turn 1 final map state:")).toBe("summary");
  });
});

describe("groupLogEntries", () => {
  it("groups sections for structured battle reports", () => {
    const sections = groupLogEntries([
      "Turn 1 begins.",
      "Committed move orders:",
      " - Green MOVE 1 from Narnia to Oz",
      "Committed attack orders:",
      " - Blue ATTACK 4 from Scadrial to Hogwarts",
      "Battle queue at Hogwarts: defender is Red with 4 units.",
      "Combat starts at Hogwarts: Blue attacks from Scadrial (4) with 4 units against Red defending with 4 units.",
      "  Round 1: attacker rolls 12, defender rolls 7 -> defender loses 1.",
      "Combat result: Blue conquers Hogwarts from Red after 7 rounds and keeps 1 units there.",
      "Reinforcement: Oz owned by Green gains 1 unit (5 -> 6).",
      "Turn 1 final map state:",
      " - Oz: Green holds 6 units."
    ]);

    expect(sections.map((section) => section.kind)).toEqual([
      "misc",
      "orders",
      "combat",
      "reinforcement",
      "summary"
    ]);
    expect(sections[1].title).toBe("Orders");
    expect(sections[2].title).toBe("Combat");
  });
});
