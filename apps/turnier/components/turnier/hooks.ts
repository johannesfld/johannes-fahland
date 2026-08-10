"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addPlayer,
  completeMatch,
  completeRound,
  drawRound,
  finishTournament,
  pauseTournament,
  reactivatePlayer,
  removePlayer,
  resumeTournament,
  saveAndCompleteMatch,
  startTournament,
  submitSetScore,
  updateBestOf,
} from "@/app/actions/turnier";
import { computeMatchResult } from "@/components/turnier/logic";
import { drawsAllowedForMatch } from "@/lib/turnier/scoring";
import type {
  ActionResult,
  ApiEnvelope,
  BestOf,
  MatchSet,
  TournamentDetail,
} from "@/components/turnier/types";

/**
 * Optimistische Schicht über dem Serverzustand.
 *
 * Sichtbarer Zustand = Serverzustand + alle noch laufenden Mutationen.
 * Eine Aktion rendert damit sofort; der Serveraufruf läuft im Hintergrund.
 * Kommt die Antwort, wird der neue Serverzustand gesetzt und die Mutation
 * im selben Tick aus der Queue genommen – beides zusammen ergibt genau einen
 * Re-Render, also kein Zurückspringen und kein Doppel-Anwenden.
 *
 * Die Applier sind bewusst idempotent (setzen Werte, statt zu inkrementieren),
 * damit eine Mutation, die der Server bereits eingerechnet hat, beim erneuten
 * Anwenden nichts kaputt macht.
 */
type Mutation = {
  id: number;
  apply: (state: TournamentDetail) => TournamentDetail;
};

const mapPlayers = (
  state: TournamentDetail,
  fn: (p: TournamentDetail["players"][number]) => TournamentDetail["players"][number],
): TournamentDetail => ({ ...state, players: state.players.map(fn) });

export function useTournament(tournamentId: string, initial: TournamentDetail) {
  const [serverState, setServerState] = useState<TournamentDetail>(initial);
  const [queue, setQueue] = useState<Mutation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [drawing, setDrawing] = useState(0);

  const nextId = useRef(0);
  const inFlight = useRef(0);

  const tournament = useMemo(
    () => queue.reduce((acc, m) => m.apply(acc), serverState),
    [serverState, queue],
  );

  const fetchState = useCallback(async (): Promise<TournamentDetail> => {
    const response = await fetch(`/api/${tournamentId}`, { cache: "no-store" });
    if (!response.ok) throw new Error("Turnier konnte nicht geladen werden.");
    const payload = (await response.json()) as ApiEnvelope<TournamentDetail>;
    return payload.data;
  }, [tournamentId]);

  const refresh = useCallback(async () => {
    try {
      setServerState(await fetchState());
    } catch {
      /* Hintergrund-Sync: stiller Fehlschlag, nächster Tick versucht es erneut */
    }
  }, [fetchState]);

  // Hintergrund-Abgleich. Pausiert, solange eine Mutation läuft – deren eigener
  // Reconcile ist aktueller als ein zwischendurch startender Poll.
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (inFlight.current === 0) void refresh();
    }, 3000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const mutate = useCallback(
    (apply: Mutation["apply"], operation: () => Promise<ActionResult>) => {
      const id = (nextId.current += 1);
      setQueue((q) => [...q, { id, apply }]);
      inFlight.current += 1;

      void (async () => {
        let failure: string | null = null;
        try {
          const result = await operation();
          if (!result.ok) failure = result.error;
        } catch {
          // Nur noch Transport-/Netzwerkfehler landen hier – fachliche Fehler
          // kommen als Rückgabewert.
          failure = "Keine Verbindung – die Änderung wurde nicht gespeichert.";
        }

        let fresh: TournamentDetail | null = null;
        try {
          fresh = await fetchState();
        } catch {
          /* Serverzustand bleibt, Optimismus wird trotzdem entfernt */
        }

        inFlight.current -= 1;
        // Beide Updates im selben Tick -> React batcht sie zu einem Render.
        if (fresh) setServerState(fresh);
        setQueue((q) => q.filter((m) => m.id !== id));
        if (failure) setError(failure);
      })();
    },
    [fetchState],
  );

  const actions = useMemo(() => {
    const setStatus = (status: TournamentDetail["status"]) => (state: TournamentDetail) => ({
      ...state,
      status,
    });

    return {
      addPlayer: (name: string) => {
        const safe = name.trim();
        if (!safe) return;
        mutate(
          (state) =>
            // Server reaktiviert bei Namensgleichheit statt anzulegen – hier genauso.
            state.players.some((p) => p.name === safe)
              ? mapPlayers(state, (p) =>
                  p.name === safe ? { ...p, active: true, leftAtRound: null } : p,
                )
              : {
                  ...state,
                  players: [
                    ...state.players,
                    {
                      id: `optimistic-${safe}`,
                      name: safe,
                      active: true,
                      joinedAtRound: state.rounds.length,
                      leftAtRound: null,
                      roundsPlayed: 0,
                      roundsSatOut: 0,
                    },
                  ],
                },
          () => addPlayer(tournamentId, safe),
        );
      },

      removePlayer: (playerId: string) =>
        mutate(
          (state) =>
            mapPlayers(state, (p) => (p.id === playerId ? { ...p, active: false } : p)),
          () => removePlayer(tournamentId, playerId),
        ),

      reactivatePlayer: (playerId: string) =>
        mutate(
          (state) =>
            mapPlayers(state, (p) =>
              p.id === playerId ? { ...p, active: true, leftAtRound: null } : p,
            ),
          () => reactivatePlayer(tournamentId, playerId),
        ),

      updateBestOf: (bestOf: BestOf) =>
        mutate(
          (state) => ({ ...state, bestOf }),
          () => updateBestOf(tournamentId, bestOf),
        ),

      startTournament: () =>
        mutate(setStatus("active"), () => startTournament(tournamentId)),

      pauseTournament: () =>
        mutate(setStatus("paused"), () => pauseTournament(tournamentId)),

      resumeTournament: () =>
        mutate(setStatus("active"), () => resumeTournament(tournamentId)),

      finishTournament: () =>
        // winnerName ermittelt der Server (modusabhängig) – die Siegerehrung
        // rechnet die Platzierung ohnehin lokal aus der Tabelle.
        mutate(setStatus("finished"), () => finishTournament(tournamentId)),

      /**
       * Auslosung ist serverseitig zufällig und lässt sich nicht vorwegnehmen.
       * Statt eines gefälschten Ergebnisses wird sofort der Lade-Platzhalter
       * der neuen Runde gezeigt (siehe DrawView).
       */
      drawRound: () => {
        setDrawing((n) => n + 1);
        mutate(
          (state) => state,
          async () => {
            try {
              return await drawRound(tournamentId);
            } finally {
              setDrawing((n) => Math.max(0, n - 1));
            }
          },
        );
      },

      saveAndCompleteMatch: (matchId: string, sets: MatchSet[]) =>
        mutate(
          (state) => ({
            ...state,
            rounds: state.rounds.map((round) => ({
              ...round,
              matches: round.matches.map((match) => {
                if (match.id !== matchId) return match;
                // Unentschieden = abgeschlossen ohne Sieger; deshalb wird
                // winnerTeam beim Abschluss immer neu gesetzt, nie nur ergänzt.
                const result = computeMatchResult(
                  sets,
                  state.bestOf,
                  drawsAllowedForMatch(state.mode, match.groupLabel),
                );
                return {
                  ...match,
                  sets,
                  status: result.decided ? ("completed" as const) : match.status,
                  winnerTeam: result.decided ? result.winnerTeam : match.winnerTeam,
                };
              }),
            })),
          }),
          () => saveAndCompleteMatch(tournamentId, matchId, sets),
        ),

      completeMatch: (matchId: string) =>
        mutate(
          (state) => ({
            ...state,
            rounds: state.rounds.map((round) => ({
              ...round,
              matches: round.matches.map((match) =>
                match.id === matchId ? { ...match, status: "completed" as const } : match,
              ),
            })),
          }),
          () => completeMatch(tournamentId, matchId),
        ),

      completeRound: (roundId: string) =>
        mutate(
          (state) => ({
            ...state,
            rounds: state.rounds.map((round) =>
              round.id === roundId ? { ...round, status: "completed" as const } : round,
            ),
          }),
          () => completeRound(tournamentId, roundId),
        ),

      submitSetScore: (
        matchId: string,
        setNumber: number,
        scoreTeam1: number,
        scoreTeam2: number,
      ) =>
        mutate(
          (state) => ({
            ...state,
            rounds: state.rounds.map((round) => ({
              ...round,
              matches: round.matches.map((match) => {
                if (match.id !== matchId) return match;
                const others = match.sets.filter((s) => s.setNumber !== setNumber);
                return {
                  ...match,
                  status: "playing" as const,
                  sets: [...others, { setNumber, scoreTeam1, scoreTeam2 }].sort(
                    (a, b) => a.setNumber - b.setNumber,
                  ),
                };
              }),
            })),
          }),
          () => submitSetScore(tournamentId, matchId, setNumber, scoreTeam1, scoreTeam2),
        ),
    };
  }, [mutate, tournamentId]);

  return {
    tournament,
    actions,
    refresh,
    error,
    dismissError: useCallback(() => setError(null), []),
    isDrawing: drawing > 0,
  };
}
