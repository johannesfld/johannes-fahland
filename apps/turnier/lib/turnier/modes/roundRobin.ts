import { isCoverageCompletePrisma } from "@/lib/turnier/coverage";
import { createRandomDoublesDraw, createRandomSinglesDraw } from "@/lib/turnier/draw";
import type { EngineContext, TournamentModeEngine } from "@/lib/turnier/modes/types";

function collectPreviousPairings(ctx: EngineContext) {
  const previousTeamPairings: Array<[string, string]> = [];
  const previousMatchPairings: Array<[string, string, string, string]> = [];
  const previousOpponentPairings: Array<[string, string]> = [];
  for (const round of ctx.rounds) {
    for (const match of round.matches) {
      const team1 = match.players.filter((e) => e.team === 1).map((e) => e.playerId);
      const team2 = match.players.filter((e) => e.team === 2).map((e) => e.playerId);
      if (team1.length === 2) previousTeamPairings.push([team1[0], team1[1]]);
      if (team2.length === 2) previousTeamPairings.push([team2[0], team2[1]]);
      if (team1.length === 2 && team2.length === 2) {
        previousMatchPairings.push([team1[0], team1[1], team2[0], team2[1]]);
      }
      if (team1.length === 1 && team2.length === 1) {
        previousOpponentPairings.push([team1[0], team2[0]]);
      }
    }
  }
  return { previousTeamPairings, previousMatchPairings, previousOpponentPairings };
}

/**
 * Jeder-gegen-jeden (Reihum). Kapselt die bestehende, bewährte Draw-Logik
 * 1:1 — Verhalten identisch zur ursprünglichen `drawRound`-Implementierung.
 */
export const roundRobinEngine: TournamentModeEngine = {
  id: "round_robin",
  label: "Jeder gegen jeden",
  supportsFormats: ["singles", "doubles"],
  minPlayers: (ctx) => (ctx.format === "doubles" ? 4 : 2),

  isComplete: (ctx) =>
    isCoverageCompletePrisma(
      ctx.rounds,
      ctx.activePlayers.map((p) => p.id),
      ctx.format,
    ),

  drawNextRound: (ctx) => {
    const drawPlayers = ctx.activePlayers.map((p) => ({
      id: p.id,
      roundsPlayed: p.roundsPlayed,
      roundsSatOut: p.roundsSatOut,
    }));
    const { previousTeamPairings, previousMatchPairings, previousOpponentPairings } =
      collectPreviousPairings(ctx);

    if (ctx.format === "doubles") {
      const draw = createRandomDoublesDraw(drawPlayers, {
        previousTeamPairings,
        previousMatchPairings,
      });
      if (draw.matches.length === 0) {
        return { ok: false, error: "Auslosung ergab keine Matches. Bitte Spielerzahl prüfen." };
      }
      return {
        ok: true,
        plan: {
          matches: draw.matches.map((m) => ({
            team1: [m.team1[0].id, m.team1[1].id],
            team2: [m.team2[0].id, m.team2[1].id],
          })),
          benchedPlayerIds: draw.benchedPlayerIds,
        },
      };
    }

    const draw = createRandomSinglesDraw(drawPlayers, { previousOpponentPairings });
    if (draw.matches.length === 0) {
      return { ok: false, error: "Auslosung ergab keine Matches. Bitte Spielerzahl prüfen." };
    }
    return {
      ok: true,
      plan: {
        matches: draw.matches.map((m) => ({
          team1: [m.player1.id],
          team2: [m.player2.id],
        })),
        benchedPlayerIds: draw.benchedPlayerIds,
      },
    };
  },
};
