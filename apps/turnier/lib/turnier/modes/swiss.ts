import type { EngineRound, TournamentModeEngine } from "@/lib/turnier/modes/types";

function pairKey(a: string, b: string) {
  return [a, b].sort().join("|");
}

/** Punkte je Spieler aus abgeschlossenen Matches (1 Sieg = 1 Punkt). */
function scoreByPlayer(rounds: EngineRound[], activeIds: Set<string>): Map<string, number> {
  const score = new Map<string, number>();
  for (const id of activeIds) score.set(id, 0);
  for (const round of rounds) {
    for (const match of round.matches) {
      if (match.status !== "completed" || !match.winnerTeam) continue;
      const winners = match.players.filter((p) => p.team === match.winnerTeam);
      for (const w of winners) {
        if (score.has(w.playerId)) score.set(w.playerId, (score.get(w.playerId) ?? 0) + 1);
      }
    }
  }
  return score;
}

/** Buchholz: Summe der Punkte der bisherigen Gegner (Feinwertung). */
function buchholzByPlayer(
  rounds: EngineRound[],
  score: Map<string, number>,
): Map<string, number> {
  const bh = new Map<string, number>();
  for (const id of score.keys()) bh.set(id, 0);
  for (const round of rounds) {
    for (const match of round.matches) {
      const t1 = match.players.filter((p) => p.team === 1).map((p) => p.playerId);
      const t2 = match.players.filter((p) => p.team === 2).map((p) => p.playerId);
      for (const a of t1) for (const b of t2) {
        if (bh.has(a)) bh.set(a, (bh.get(a) ?? 0) + (score.get(b) ?? 0));
        if (bh.has(b)) bh.set(b, (bh.get(b) ?? 0) + (score.get(a) ?? 0));
      }
    }
  }
  return bh;
}

function previousOpponentKeys(rounds: EngineRound[]): Set<string> {
  const seen = new Set<string>();
  for (const round of rounds) {
    for (const match of round.matches) {
      const t1 = match.players.filter((p) => p.team === 1).map((p) => p.playerId);
      const t2 = match.players.filter((p) => p.team === 2).map((p) => p.playerId);
      // Swiss ist Einzel: ein Spieler je Team.
      if (t1.length === 1 && t2.length === 1) seen.add(pairKey(t1[0], t2[0]));
    }
  }
  return seen;
}

export function defaultSwissRounds(playerCount: number): number {
  if (playerCount <= 1) return 0;
  return Math.max(1, Math.ceil(Math.log2(playerCount)));
}

/**
 * Schweizer System (Einzel): feste Rundenzahl, jede Runde Paarung nach
 * Punktstand, Wiederholungspaarungen werden vermieden, kein Ausscheiden.
 * Feinwertung Buchholz für die Tabelle/Setzung.
 */
export const swissEngine: TournamentModeEngine = {
  id: "swiss",
  label: "Schweizer System",
  supportsFormats: ["singles"],
  minPlayers: () => 2,

  isComplete: (ctx) => {
    const playedRounds = ctx.rounds.length;
    const target =
      ctx.config?.swissRounds ?? defaultSwissRounds(ctx.activePlayers.length);
    return playedRounds >= target;
  },

  drawNextRound: (ctx) => {
    const activeIds = new Set(ctx.activePlayers.map((p) => p.id));
    if (activeIds.size < 2) {
      return { ok: false, error: "Mindestens zwei aktive Spieler nötig." };
    }
    const score = scoreByPlayer(ctx.rounds, activeIds);
    const bh = buchholzByPlayer(ctx.rounds, score);
    const usedKeys = previousOpponentKeys(ctx.rounds);

    // Spieler nach Punkten (desc), dann Buchholz (desc), stabil per id.
    const ordered = [...activeIds].sort((a, b) => {
      const sd = (score.get(b) ?? 0) - (score.get(a) ?? 0);
      if (sd !== 0) return sd;
      const bd = (bh.get(b) ?? 0) - (bh.get(a) ?? 0);
      if (bd !== 0) return bd;
      return a.localeCompare(b);
    });

    // Greedy-Pairing: jeweils Kopf mit nächstbestem nicht gespielten Gegner.
    const remaining = [...ordered];
    const matches: Array<{ team1: string[]; team2: string[] }> = [];
    const bench: string[] = [];
    // Ungerade Spielerzahl: der punktschwächste ohne bisheriges Freilos setzt aus.
    if (remaining.length % 2 === 1) {
      const byeIndex = (() => {
        for (let i = remaining.length - 1; i >= 0; i -= 1) {
          // (Vereinfachte Freilos-Regel: niedrigstplatzierter Spieler.)
          return i;
        }
        return remaining.length - 1;
      })();
      bench.push(remaining.splice(byeIndex, 1)[0]);
    }

    while (remaining.length > 0) {
      const head = remaining.shift()!;
      let oppIndex = remaining.findIndex((c) => !usedKeys.has(pairKey(head, c)));
      if (oppIndex === -1) oppIndex = 0; // notfalls Wiederholung erlauben
      const opp = remaining.splice(oppIndex, 1)[0];
      matches.push({ team1: [head], team2: [opp] });
    }

    if (matches.length === 0) {
      return { ok: false, error: "Keine Paarungen möglich." };
    }

    const target = ctx.config?.swissRounds ?? defaultSwissRounds(activeIds.size);
    return {
      ok: true,
      plan: {
        matches,
        benchedPlayerIds: bench,
        stageLabel: `Runde ${ctx.rounds.length + 1} von ${target}`,
      },
    };
  },
};
