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
        <p className="text-sm text-[var(--vibe-fg-muted)]">
          Noch keine Runde ausgelost. Wechsle zur Auslosung, um zu starten.
        </p>
      </section>
    );
  }

  const completedMatches = round.matches.filter((match) => match.status === "completed").length;
  const totalMatches = round.matches.length;
  const progressPct = totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;

  return (
    <section className={`${turnierCard} flex min-w-0 flex-col gap-4`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-display text-xl font-extrabold tracking-tight sm:truncate sm:text-2xl">
            Ergebnisse – Runde {round.roundNumber}
          </h2>
          <p className="text-sm text-[var(--vibe-fg-muted)]">
            {completedMatches} von {totalMatches} Matches abgeschlossen · Best of {bestOf}
          </p>
        </div>
        <button
          type="button"
          className={`${actionBtn} w-full shrink-0 sm:w-auto`}
          disabled={!allMatchesDone || readOnly}
          onClick={() => onCompleteRound(round.id)}
        >
          Runde abschließen
        </button>
      </div>

      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--vibe-bg-sunken)]"
        role="progressbar"
        aria-valuenow={progressPct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Fortschritt der Runde"
      >
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-500 [transition-timing-function:var(--vibe-ease-spring)]"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {round.matches.map((match) => {
          // Ein Entwurf enthält nur das geänderte Team. Ohne Rückfall auf den
          // gespeicherten Wert des anderen Teams fiele der ganze Satz aus der
          // Auswertung – ein bereits eingetragenes Ergebnis ging beim Korrigieren
          // eines einzelnen Werts verloren.
          const savedBySetNumber = new Map(match.sets.map((s) => [s.setNumber, s]));
          const draftSets = Object.entries(draft[match.id] ?? {}).map(([setNumber, values]) => {
            const number = Number(setNumber);
            const saved = savedBySetNumber.get(number);
            return {
              setNumber: number,
              scoreTeam1: values.scoreTeam1 ?? saved?.scoreTeam1 ?? -1,
              scoreTeam2: values.scoreTeam2 ?? saved?.scoreTeam2 ?? -1,
            };
          });
          const mergedSets = Array.from(
            new Map(
              [...match.sets, ...draftSets].map((setEntry) => [setEntry.setNumber, setEntry]),
            ).values(),
          )
            .filter((setEntry) => setEntry.scoreTeam1 >= 0 && setEntry.scoreTeam2 >= 0)
            .sort((a, b) => a.setNumber - b.setNumber);

          const slots = getRequiredSetSlots(bestOf, mergedSets);
          const winsNeeded = bestOfToWinsNeeded(bestOf);
          const wins = getWinsPerTeam(mergedSets);
          const matchCanClose = wins.team1 >= winsNeeded || wins.team2 >= winsNeeded;
          // Bei einem fertigen Match nur dann einen Button zeigen, wenn sich
          // gegenüber dem gespeicherten Stand wirklich etwas geändert hat.
          const isDirty =
            mergedSets.length !== match.sets.length ||
            mergedSets.some((entry, i) => {
              const saved = match.sets[i];
              return (
                !saved ||
                saved.setNumber !== entry.setNumber ||
                saved.scoreTeam1 !== entry.scoreTeam1 ||
                saved.scoreTeam2 !== entry.scoreTeam2
              );
            });
          const showSaveButton =
            !readOnly && matchCanClose && (match.status !== "completed" || isDirty);
          const teamName = (team: 1 | 2) =>
            match.players
              .filter((player) => player.team === team)
              .map((player) => player.name)
              .join(" / ") || `Team ${team}`;

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
                      team1Label={teamName(1)}
                      team2Label={teamName(2)}
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
              {showSaveButton ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
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
              ) : null}
            </MatchCard>
          );
        })}
      </div>
    </section>
  );
}
