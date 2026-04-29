"use client";

import { useMemo, useState } from "react";
import { MatchCard } from "@/components/turnier/components/MatchCard";
import { SetScoreInput } from "@/components/turnier/components/SetScoreInput";
import { getRequiredSetSlots, getWinsPerTeam } from "@/components/turnier/logic";
import { actionBtn, turnierCard } from "@/components/turnier/styles";
import type { BestOf, RoundEntry } from "@/components/turnier/types";
import { bestOfToWinsNeeded } from "@/lib/turnier/validation";

type ScoreEntryViewProps = {
  round: RoundEntry | null;
  bestOf: BestOf;
  isPending: boolean;
  readOnly: boolean;
  onSaveAndCompleteMatch: (
    matchId: string,
    sets: Array<{ setNumber: number; scoreTeam1: number; scoreTeam2: number }>,
  ) => void;
  onCompleteRound: (roundId: string) => void;
};

type DraftScores = Record<string, Record<number, { scoreTeam1?: number; scoreTeam2?: number }>>;

export function ScoreEntryView({
  round,
  bestOf,
  isPending,
  readOnly,
  onSaveAndCompleteMatch,
  onCompleteRound,
}: ScoreEntryViewProps) {
  const [draft, setDraft] = useState<DraftScores>({});

  const allMatchesDone = useMemo(
    () => (round ? round.matches.every((match) => match.status === "completed") : false),
    [round],
  );

  if (!round) {
    return (
      <section className={turnierCard}>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Noch keine Runde ausgelost. Wechsle zur Auslosung, um zu starten.
        </p>
      </section>
    );
  }

  const completedMatches = round.matches.filter((match) => match.status === "completed").length;
  const totalMatches = round.matches.length;

  return (
    <section className={`${turnierCard} flex min-w-0 flex-col gap-4`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-xl font-black tracking-tight">
            Ergebnisse – Runde {round.roundNumber}
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            {completedMatches} von {totalMatches} Matches abgeschlossen · Best of {bestOf}
          </p>
        </div>
        <button
          type="button"
          className={actionBtn}
          disabled={isPending || !allMatchesDone || readOnly}
          onClick={() => onCompleteRound(round.id)}
        >
          Runde abschließen
        </button>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
        {round.matches.map((match) => {
          const mergedSets = Array.from(
            new Map(
              [...match.sets, ...Object.entries(draft[match.id] ?? {}).map(([setNumber, values]) => ({
                setNumber: Number(setNumber),
                scoreTeam1: values.scoreTeam1 ?? -1,
                scoreTeam2: values.scoreTeam2 ?? -1,
              }))].map((setEntry) => [setEntry.setNumber, setEntry]),
            ).values(),
          )
            .filter((setEntry) => setEntry.scoreTeam1 >= 0 && setEntry.scoreTeam2 >= 0)
            .sort((a, b) => a.setNumber - b.setNumber);

          const slots = getRequiredSetSlots(bestOf, mergedSets);
          const winsNeeded = bestOfToWinsNeeded(bestOf);
          const wins = getWinsPerTeam(mergedSets);
          const matchCanClose = wins.team1 >= winsNeeded || wins.team2 >= winsNeeded;

          return (
            <MatchCard key={match.id} match={match}>
              <div className="flex flex-col gap-2">
                {Array.from({ length: slots }, (_, index) => index + 1).map((setNumber) => {
                  const fromSaved = match.sets.find((setEntry) => setEntry.setNumber === setNumber);
                  const fromDraft = draft[match.id]?.[setNumber];
                  const scoreTeam1 = fromDraft?.scoreTeam1 ?? fromSaved?.scoreTeam1;
                  const scoreTeam2 = fromDraft?.scoreTeam2 ?? fromSaved?.scoreTeam2;

                  return (
                    <SetScoreInput
                      key={setNumber}
                      setNumber={setNumber}
                      scoreTeam1={scoreTeam1}
                      scoreTeam2={scoreTeam2}
                      disabled={readOnly}
                      onChange={(team, value) =>
                        setDraft((prev) => ({
                          ...prev,
                          [match.id]: {
                            ...(prev[match.id] ?? {}),
                            [setNumber]: {
                              ...(prev[match.id]?.[setNumber] ?? {}),
                              [team === 1 ? "scoreTeam1" : "scoreTeam2"]:
                                value === "" ? undefined : Number(value),
                            },
                          },
                        }))
                      }
                    />
                  );
                })}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!matchCanClose || readOnly || isPending}
                  className={actionBtn}
                  onClick={() =>
                    onSaveAndCompleteMatch(
                      match.id,
                      mergedSets.map((setEntry) => ({
                        setNumber: setEntry.setNumber,
                        scoreTeam1: setEntry.scoreTeam1,
                        scoreTeam2: setEntry.scoreTeam2,
                      })),
                    )
                  }
                >
                  {match.status === "completed" ? "Match aktualisieren" : "Match abschließen"}
                </button>
              </div>
            </MatchCard>
          );
        })}
      </div>
    </section>
  );
}
