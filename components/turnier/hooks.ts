"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
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
import type { ApiEnvelope, TournamentDetail } from "@/components/turnier/types";

export function useTournamentSync(tournamentId: string, initial: TournamentDetail) {
  const [tournament, setTournament] = useState<TournamentDetail>(initial);
  const [isSyncing, setIsSyncing] = useState(false);

  const refresh = useCallback(async () => {
    const showSyncTimer = window.setTimeout(() => setIsSyncing(true), 500);
    try {
      const response = await fetch(`/api/turnier/${tournamentId}`, { cache: "no-store" });
      if (!response.ok) return;
      const payload = (await response.json()) as ApiEnvelope<TournamentDetail>;
      setTournament(payload.data);
    } finally {
      window.clearTimeout(showSyncTimer);
      setIsSyncing(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void refresh();
    }, 3000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  return { tournament, setTournament, refresh, isSyncing };
}

export function useTournamentActions(tournamentId: string, refresh: () => Promise<void>) {
  const [isPending, startTransition] = useTransition();
  const run = useCallback(
    (operation: () => Promise<void>) => {
      startTransition(() => {
        void operation().then(refresh);
      });
    },
    [refresh],
  );

  return {
    isPending,
    addPlayer: (name: string) => run(() => addPlayer(tournamentId, name)),
    reactivatePlayer: (playerId: string) => run(() => reactivatePlayer(tournamentId, playerId)),
    updateBestOf: (bestOf: 1 | 3 | 5) => run(() => updateBestOf(tournamentId, bestOf)),
    removePlayer: (playerId: string) => run(() => removePlayer(tournamentId, playerId)),
    startTournament: () => run(() => startTournament(tournamentId)),
    drawRound: () => run(() => drawRound(tournamentId)),
    submitSetScore: (matchId: string, setNumber: number, scoreTeam1: number, scoreTeam2: number) =>
      run(() => submitSetScore(tournamentId, matchId, setNumber, scoreTeam1, scoreTeam2)),
    saveAndCompleteMatch: (
      matchId: string,
      sets: Array<{ setNumber: number; scoreTeam1: number; scoreTeam2: number }>,
    ) => run(() => saveAndCompleteMatch(tournamentId, matchId, sets)),
    completeMatch: (matchId: string) => run(() => completeMatch(tournamentId, matchId)),
    completeRound: (roundId: string) => run(() => completeRound(tournamentId, roundId)),
    pauseTournament: () => run(() => pauseTournament(tournamentId)),
    resumeTournament: () => run(() => resumeTournament(tournamentId)),
    finishTournament: () => run(() => finishTournament(tournamentId)),
  };
}
