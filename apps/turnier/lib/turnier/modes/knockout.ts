import type {
  EngineRound,
  PlannedMatch,
  TournamentModeEngine,
} from "@/lib/turnier/modes/types";

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function nextPowerOfTwo(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

/** Sieger eines abgeschlossenen Matches (Einzel → eine Spieler-ID). */
function winnerIdOf(match: EngineRound["matches"][number]): string | null {
  if (match.status !== "completed" || !match.winnerTeam) return null;
  const winner = match.players.find((p) => p.team === match.winnerTeam);
  return winner?.playerId ?? null;
}

function stageLabelFor(matchesInRound: number): string {
  if (matchesInRound === 1) return "Finale";
  if (matchesInRound === 2) return "Halbfinale";
  if (matchesInRound === 4) return "Viertelfinale";
  if (matchesInRound === 8) return "Achtelfinale";
  return `Runde der letzten ${matchesInRound * 2}`;
}

/**
 * K.-o.-System (Single Elimination, Einzel). Runde 1 setzt die Spieler in
 * einen Baum der nächsten Zweierpotenz; überzählige Plätze sind Freilose
 * (Top-Seeds kommen automatisch weiter). Jede Folge-Runde paart die Sieger
 * der Vorrunde in Bracket-Reihenfolge. Sieger des Finales gewinnt.
 */
export const knockoutEngine: TournamentModeEngine = {
  id: "knockout",
  label: "K.-o.-System",
  supportsFormats: ["singles"],
  minPlayers: () => 2,

  isComplete: (ctx) => {
    if (ctx.rounds.length === 0) return false;
    // Sortiere nach Rundennummer aufsteigend, nimm die letzte.
    const sorted = [...ctx.rounds].sort((a, b) => a.roundNumber - b.roundNumber);
    const last = sorted[sorted.length - 1];
    // Fertig, wenn die letzte Runde genau 1 (abgeschlossenes) Match war = Finale.
    return last.matches.length === 1 && last.matches[0].status === "completed";
  },

  drawNextRound: (ctx) => {
    const sorted = [...ctx.rounds].sort((a, b) => a.roundNumber - b.roundNumber);

    // --- Runde 1: Bracket aufbauen ---
    if (sorted.length === 0) {
      const ids = shuffle(ctx.activePlayers.map((p) => p.id));
      if (ids.length < 2) return { ok: false, error: "Mindestens zwei Spieler nötig." };

      const bracketSize = nextPowerOfTwo(ids.length);
      const byes = bracketSize - ids.length;
      // Erste `byes` Spieler (zufällige Reihenfolge) bekommen ein Freilos:
      // sie ziehen kampflos in Runde 2 ein, indem sie hier kein Match spielen.
      // Wir bilden Matches nur aus den restlichen Spielern paarweise.
      const byePlayers = ids.slice(0, byes);
      const playingPlayers = ids.slice(byes);

      const matches: PlannedMatch[] = [];
      for (let i = 0; i < playingPlayers.length; i += 2) {
        matches.push({
          team1: [playingPlayers[i]],
          team2: [playingPlayers[i + 1]],
          bracketSlot: i / 2,
        });
      }
      if (matches.length === 0) {
        return { ok: false, error: "Zu wenige Spieler für ein Bracket." };
      }
      // Freilos-Spieler werden „gebencht" (spielen diese Runde nicht), ziehen
      // aber in die nächste Runde ein (siehe Folge-Runden-Logik).
      const firstRoundEntrants = playingPlayers.length / 2 + byePlayers.length;
      return {
        ok: true,
        plan: {
          matches,
          benchedPlayerIds: byePlayers,
          stageLabel: stageLabelFor(firstRoundEntrants),
        },
      };
    }

    // --- Folge-Runden: Sieger der Vorrunde + Freilos-Spieler ---
    const lastRound = sorted[sorted.length - 1];

    // Alle Matches der letzten Runde müssen abgeschlossen sein.
    const unfinished = lastRound.matches.filter((m) => m.status !== "completed");
    if (unfinished.length > 0) {
      return {
        ok: false,
        error: "Erst alle Matches der aktuellen Runde abschließen, dann die nächste Runde auslosen.",
      };
    }

    const winners = lastRound.matches
      .map((m) => winnerIdOf(m))
      .filter((id): id is string => id !== null);

    // Freilos-Spieler dieser Runde = aktive Spieler, die in der letzten Runde
    // nicht gespielt haben (kamen kampflos weiter).
    const playedLast = new Set(
      lastRound.matches.flatMap((m) => m.players.map((p) => p.playerId)),
    );
    const byeAdvancers = ctx.activePlayers
      .map((p) => p.id)
      .filter((id) => !playedLast.has(id) && !alreadyEliminated(id, sorted));

    const advancers = [...byeAdvancers, ...winners];

    if (advancers.length <= 1) {
      return { ok: false, error: "Turnier ist entschieden — keine weitere Runde." };
    }

    const matches: PlannedMatch[] = [];
    for (let i = 0; i < advancers.length - 1; i += 2) {
      matches.push({
        team1: [advancers[i]],
        team2: [advancers[i + 1]],
        bracketSlot: i / 2,
      });
    }
    // Ungerade Anzahl Aufsteiger: letzter bekommt ein Freilos in die nächste Runde.
    const oddBye = advancers.length % 2 === 1 ? [advancers[advancers.length - 1]] : [];

    return {
      ok: true,
      plan: {
        matches,
        benchedPlayerIds: oddBye,
        stageLabel: stageLabelFor(matches.length + oddBye.length),
      },
    };
  },
};

/** Ein Spieler ist ausgeschieden, wenn er ein Match verloren hat. */
function alreadyEliminated(playerId: string, rounds: EngineRound[]): boolean {
  for (const round of rounds) {
    for (const match of round.matches) {
      if (match.status !== "completed" || !match.winnerTeam) continue;
      const me = match.players.find((p) => p.playerId === playerId);
      if (me && me.team !== match.winnerTeam) return true;
    }
  }
  return false;
}
