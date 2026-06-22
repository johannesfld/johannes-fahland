import type {
  EngineContext,
  EngineRound,
  PlannedMatch,
  TournamentModeEngine,
} from "@/lib/turnier/modes/types";

function pairKey(a: string, b: string) {
  return [a, b].sort().join("|");
}

export function defaultGroupCount(playerCount: number): number {
  if (playerCount <= 4) return 1;
  if (playerCount <= 8) return 2;
  if (playerCount <= 16) return 4;
  return 8;
}

/** Gruppenzuordnung aus den groupLabels der bisherigen Matches rekonstruieren. */
function groupAssignments(rounds: EngineRound[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const round of rounds) {
    for (const match of round.matches) {
      if (!match.groupLabel) continue;
      for (const p of match.players) {
        if (!map.has(p.playerId)) map.set(p.playerId, match.groupLabel);
      }
    }
  }
  return map;
}

function groupLabelForIndex(i: number): string {
  return `Gruppe ${String.fromCharCode(65 + i)}`;
}

/** Gespielte Gegnerpaare innerhalb der Gruppenphase. */
function playedOpponentKeys(rounds: EngineRound[], onlyGroup: boolean): Set<string> {
  const seen = new Set<string>();
  for (const round of rounds) {
    for (const match of round.matches) {
      if (onlyGroup && !match.groupLabel) continue;
      const t1 = match.players.filter((p) => p.team === 1).map((p) => p.playerId);
      const t2 = match.players.filter((p) => p.team === 2).map((p) => p.playerId);
      if (t1.length === 1 && t2.length === 1) seen.add(pairKey(t1[0], t2[0]));
    }
  }
  return seen;
}

/** Round-Robin innerhalb einer Gruppe komplett? (alle Paare gespielt) */
function groupComplete(members: string[], played: Set<string>): boolean {
  for (let i = 0; i < members.length; i += 1) {
    for (let j = i + 1; j < members.length; j += 1) {
      if (!played.has(pairKey(members[i], members[j]))) return false;
    }
  }
  return true;
}

function isGroupPhaseDone(ctx: EngineContext, assignments: Map<string, string>): boolean {
  if (assignments.size === 0) return false;
  const played = playedOpponentKeys(ctx.rounds, true);
  const byGroup = new Map<string, string[]>();
  for (const [pid, g] of assignments) {
    byGroup.set(g, [...(byGroup.get(g) ?? []), pid]);
  }
  for (const members of byGroup.values()) {
    if (!groupComplete(members, played)) return false;
  }
  return true;
}

/** Punkte (Siege) je Spieler in der Gruppenphase. */
function groupScores(rounds: EngineRound[]): Map<string, number> {
  const score = new Map<string, number>();
  for (const round of rounds) {
    for (const match of round.matches) {
      if (!match.groupLabel || match.status !== "completed" || !match.winnerTeam) continue;
      for (const w of match.players.filter((p) => p.team === match.winnerTeam)) {
        score.set(w.playerId, (score.get(w.playerId) ?? 0) + 1);
      }
    }
  }
  return score;
}

/**
 * Gruppen + K.-o. (Einzel). Phase 1: Spieler werden in Runde 1 auf Gruppen
 * verteilt (persistiert via groupLabel) und spielen Round-Robin innerhalb der
 * Gruppe (eine Begegnung pro Spieler pro Runde, Gruppen parallel). Phase 2:
 * nach Abschluss aller Gruppen ziehen die Top-N je Gruppe in ein K.-o.-Bracket.
 */
export const groupsKoEngine: TournamentModeEngine = {
  id: "groups_ko",
  label: "Gruppen + K.-o.",
  supportsFormats: ["singles"],
  minPlayers: () => 4,

  isComplete: (ctx) => {
    const assignments = groupAssignments(ctx.rounds);
    if (assignments.size === 0) return false;
    if (!isGroupPhaseDone(ctx, assignments)) return false;
    // K.o.-Phase: fertig, wenn eine reine K.o.-Runde (ohne groupLabel) mit
    // genau einem abgeschlossenen Match existiert (Finale).
    const koRounds = [...ctx.rounds]
      .filter((r) => r.matches.every((m) => !m.groupLabel))
      .sort((a, b) => a.roundNumber - b.roundNumber);
    if (koRounds.length === 0) return false;
    const last = koRounds[koRounds.length - 1];
    return last.matches.length === 1 && last.matches[0].status === "completed";
  },

  drawNextRound: (ctx) => {
    const assignments = groupAssignments(ctx.rounds);

    // --- Runde 1: Gruppen bilden ---
    if (assignments.size === 0) {
      const ids = [...ctx.activePlayers.map((p) => p.id)];
      // deterministisch genug gemischt über Index-Rotation (kein Date/Random-Bedarf hier,
      // aber wir dürfen Math.random im Server nutzen — Engine läuft serverseitig).
      for (let i = ids.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [ids[i], ids[j]] = [ids[j], ids[i]];
      }
      const groupCount = ctx.config?.groupCount ?? defaultGroupCount(ids.length);
      const groups: string[][] = Array.from({ length: groupCount }, () => []);
      ids.forEach((id, i) => groups[i % groupCount].push(id));

      return drawGroupRound(groups, new Set(), groupLabels(groupCount));
    }

    // --- Gruppenphase noch nicht fertig: nächste Gruppenrunde ---
    if (!isGroupPhaseDone(ctx, assignments)) {
      const played = playedOpponentKeys(ctx.rounds, true);
      const byGroup = new Map<string, string[]>();
      for (const [pid, g] of assignments) byGroup.set(g, [...(byGroup.get(g) ?? []), pid]);
      const groups = [...byGroup.entries()].sort((a, b) => a[0].localeCompare(b[0]));
      return drawGroupRoundFromLabeled(groups, played);
    }

    // --- K.o.-Phase ---
    const advancePerGroup = ctx.config?.advancePerGroup ?? 2;
    const scores = groupScores(ctx.rounds);
    const byGroup = new Map<string, string[]>();
    for (const [pid, g] of assignments) byGroup.set(g, [...(byGroup.get(g) ?? []), pid]);

    // Bisherige K.o.-Runden (ohne groupLabel).
    const koRounds = [...ctx.rounds]
      .filter((r) => r.matches.every((m) => !m.groupLabel))
      .sort((a, b) => a.roundNumber - b.roundNumber);

    if (koRounds.length === 0) {
      // Qualifikanten bestimmen: Top-N je Gruppe nach Siegen.
      const qualified: string[] = [];
      for (const [, members] of [...byGroup.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
        const ranked = [...members].sort(
          (a, b) => (scores.get(b) ?? 0) - (scores.get(a) ?? 0) || a.localeCompare(b),
        );
        qualified.push(...ranked.slice(0, advancePerGroup));
      }
      return buildKoRound(qualified);
    }

    // Folge-K.o.-Runde aus Siegern der letzten K.o.-Runde.
    const lastKo = koRounds[koRounds.length - 1];
    if (lastKo.matches.some((m) => m.status !== "completed")) {
      return { ok: false, error: "Erst die laufende K.-o.-Runde abschließen." };
    }
    const winners = lastKo.matches
      .map((m) => (m.winnerTeam ? m.players.find((p) => p.team === m.winnerTeam)?.playerId : null))
      .filter((id): id is string => !!id);
    if (winners.length <= 1) {
      return { ok: false, error: "K.-o.-Phase ist entschieden." };
    }
    return buildKoRound(winners);
  },
};

function groupLabels(count: number): string[] {
  return Array.from({ length: count }, (_, i) => groupLabelForIndex(i));
}

/** Eine Gruppenrunde aus rohen Gruppen (Runde 1, Labels frisch). */
function drawGroupRound(
  groups: string[][],
  played: Set<string>,
  labels: string[],
): ReturnType<TournamentModeEngine["drawNextRound"]> {
  const labeled = groups.map((members, i) => [labels[i], members] as [string, string[]]);
  return drawGroupRoundFromLabeled(labeled, played);
}

/** Eine Gruppenrunde: je Gruppe ein nicht gespieltes Paar pro Spieler. */
function drawGroupRoundFromLabeled(
  groups: Array<[string, string[]]>,
  played: Set<string>,
): ReturnType<TournamentModeEngine["drawNextRound"]> {
  const matches: PlannedMatch[] = [];
  const busy = new Set<string>();

  for (const [label, members] of groups) {
    const remaining = members.filter((m) => !busy.has(m));
    // Greedy: paare innerhalb der Gruppe Spieler, die noch nicht gegeneinander spielten.
    const pool = [...remaining];
    while (pool.length > 1) {
      const head = pool.shift()!;
      if (busy.has(head)) continue;
      const oppIdx = pool.findIndex((c) => !busy.has(c) && !played.has(pairKey(head, c)));
      if (oppIdx === -1) {
        // alle restlichen schon gespielt → diese Gruppe ist diese Runde fertig
        continue;
      }
      const opp = pool.splice(oppIdx, 1)[0];
      busy.add(head);
      busy.add(opp);
      matches.push({ team1: [head], team2: [opp], groupLabel: label });
    }
  }

  if (matches.length === 0) {
    return { ok: false, error: "Keine offenen Gruppenpaarungen mehr." };
  }
  return {
    ok: true,
    plan: { matches, benchedPlayerIds: [], stageLabel: "Gruppenphase" },
  };
}

/** K.-o.-Runde aus einer Liste qualifizierter Spieler. */
function buildKoRound(players: string[]): ReturnType<TournamentModeEngine["drawNextRound"]> {
  if (players.length < 2) return { ok: false, error: "Zu wenige Qualifikanten." };
  const matches: PlannedMatch[] = [];
  for (let i = 0; i < players.length - 1; i += 2) {
    matches.push({ team1: [players[i]], team2: [players[i + 1]], bracketSlot: i / 2 });
  }
  const oddBye = players.length % 2 === 1 ? [players[players.length - 1]] : [];
  const n = matches.length + oddBye.length;
  const label = n === 1 ? "Finale" : n === 2 ? "Halbfinale" : n === 4 ? "Viertelfinale" : `K.-o.-Runde`;
  return { ok: true, plan: { matches, benchedPlayerIds: oddBye, stageLabel: label } };
}
