export type LogSectionKind = "orders" | "combat" | "reinforcement" | "summary" | "misc";

export type LogSection = {
  title: string;
  kind: LogSectionKind;
  entries: string[];
};

export function classifyLogEntry(entry: string): LogSectionKind {
  if (
    entry.startsWith("Committed move orders") ||
    entry.startsWith("Committed attack orders") ||
    entry.startsWith(" - Green") ||
    entry.startsWith(" - Blue") ||
    entry.startsWith(" - Red")
  ) {
    return "orders";
  }
  if (
    entry.startsWith("Battle queue") ||
    entry.startsWith("Combat starts") ||
    entry.startsWith("  Round ") ||
    entry.startsWith("Combat result")
  ) {
    return "combat";
  }
  if (entry.startsWith("Reinforcement:")) {
    return "reinforcement";
  }
  if (entry.startsWith(" - ") && entry.includes(" holds ") && entry.includes(" units.")) {
    return "summary";
  }
  if (entry.startsWith("Turn ") && entry.endsWith(" final map state:")) {
    return "summary";
  }
  return "misc";
}

export function sectionTitle(kind: LogSectionKind): string {
  switch (kind) {
    case "orders":
      return "Orders";
    case "combat":
      return "Combat";
    case "reinforcement":
      return "Reinforcements";
    case "summary":
      return "End Of Turn";
    default:
      return "Notes";
  }
}

export function groupLogEntries(entries: string[]): LogSection[] {
  const sections: LogSection[] = [];
  for (const entry of entries) {
    const kind = classifyLogEntry(entry);
    const last = sections.at(-1);
    if (!last || last.kind !== kind) {
      sections.push({
        title: sectionTitle(kind),
        kind,
        entries: [entry]
      });
      continue;
    }
    last.entries.push(entry);
  }
  return sections;
}
