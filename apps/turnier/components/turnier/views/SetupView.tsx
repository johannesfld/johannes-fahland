"use client";

import { useRef, useState } from "react";
import { PlayerChip } from "@/components/turnier/components/PlayerChip";
import { actionBtn, subtleBtn, turnierCard } from "@/components/turnier/styles";
import type { BestOf, TournamentDetail } from "@/components/turnier/types";

type SetupViewProps = {
  tournament: TournamentDetail;
  isPending: boolean;
  isPaused: boolean;
  onAddPlayer: (name: string) => void;
  onRemovePlayer: (playerId: string) => void;
  onReactivatePlayer: (playerId: string) => void;
  onStartTournament: () => void;
  onBestOfChange: (bestOf: BestOf) => void;
};

export function SetupView({
  tournament,
  isPending,
  isPaused,
  onAddPlayer,
  onRemovePlayer,
  onReactivatePlayer,
  onStartTournament,
  onBestOfChange,
}: SetupViewProps) {
  const [nameInput, setNameInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const submitPlayer = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      inputRef.current?.focus();
      return;
    }
    onAddPlayer(trimmed);
    setNameInput("");
    inputRef.current?.focus();
  };
  const activePlayers = tournament.players.filter((player) => player.active);
  const inactivePlayers = tournament.players.filter((player) => !player.active);
  const minPlayers = tournament.format === "doubles" ? 4 : 2;
  const minPlayersReached = activePlayers.length >= minPlayers;
  const canStart = !isPaused && tournament.status === "setup";
  const showBestOfEditor = tournament.status === "setup" && !isPaused;
  const formatLabel = tournament.format === "doubles" ? "Doppel (2 vs 2)" : "Einzel (1 vs 1)";

  return (
    <section className={`${turnierCard} flex min-w-0 flex-col gap-6`}>
      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="text-xl font-black tracking-tight">Setup</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          {isPaused
            ? "Während der Pause kannst du Spieler ergänzen, entfernen oder reaktivieren."
            : showBestOfEditor
              ? "Spieler verwalten und Best-of festlegen, dann das Turnier starten."
              : "Spieler verwalten. Best-of und Format sind nach dem Start fest."}
        </p>
      </div>

      <div className="flex min-w-0 flex-col gap-2">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
          Turnierformat
        </p>
        <p className="inline-flex min-h-11 w-fit items-center rounded-xl border border-zinc-300 bg-zinc-50 px-4 text-sm font-semibold text-zinc-800 dark:border-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-100">
          {formatLabel}
        </p>
      </div>

      {showBestOfEditor ? (
        <div className="flex min-w-0 flex-col gap-2">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
            Best-of pro Match
          </p>
          <div className="flex flex-wrap gap-2">
            {[1, 3, 5].map((option) => (
              <button
                key={option}
                type="button"
                className={tournament.bestOf === option ? actionBtn : subtleBtn}
                onClick={() => onBestOfChange(option as BestOf)}
              >
                Best of {option}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <form
        className="flex min-w-0 flex-col gap-2"
        autoComplete="off"
        onSubmit={(event) => {
          event.preventDefault();
          submitPlayer();
        }}
      >
        <label
          htmlFor="setup-player-name"
          className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400"
        >
          Spieler hinzufügen
        </label>
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
          <input
            id="setup-player-name"
            ref={inputRef}
            name="tischtennis-spielername"
            value={nameInput}
            onChange={(event) => setNameInput(event.target.value)}
            placeholder="Spielername"
            autoComplete="nickname"
            enterKeyHint="done"
            className="min-h-11 min-w-0 flex-1 rounded-xl border border-zinc-300 bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4C9170]/60 dark:border-zinc-700 dark:bg-zinc-950"
          />
          <button
            type="submit"
            className={actionBtn}
            disabled={isPending || !nameInput.trim()}
          >
            Hinzufügen
          </button>
        </div>
      </form>

      <div className="flex min-w-0 flex-col gap-2">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
          Aktive Spieler ({activePlayers.length})
        </p>
        {activePlayers.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Noch keine aktiven Spieler. Mindestens {minPlayers} für den Start nötig.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {activePlayers.map((player) => (
              <PlayerChip
                key={player.id}
                name={player.name}
                active
                removable
                onRemove={() => onRemovePlayer(player.id)}
              />
            ))}
          </div>
        )}
      </div>

      {inactivePlayers.length > 0 ? (
        <div className="flex min-w-0 flex-col gap-2">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
            Ausgeschiedene Spieler ({inactivePlayers.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {inactivePlayers.map((player) => (
              <PlayerChip
                key={player.id}
                name={player.name}
                active={false}
                reactivatable
                onReactivate={() => onReactivatePlayer(player.id)}
              />
            ))}
          </div>
        </div>
      ) : null}

      {canStart ? (
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {!minPlayersReached ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Mindestens {minPlayers} aktive Spieler nötig, um das Turnier zu starten.
            </p>
          ) : (
            <p className="text-sm text-emerald-700 dark:text-emerald-400">
              Bereit zum Start mit {activePlayers.length} Spielern.
            </p>
          )}
          <button
            type="button"
            disabled={isPending || !minPlayersReached}
            onClick={onStartTournament}
            className={actionBtn}
          >
            Turnier starten
          </button>
        </div>
      ) : null}

      {isPaused ? (
        <p className="rounded-2xl border border-[#8DC4AA]/50 bg-[#DAF7E9]/90 p-3 text-sm text-[#1E5E3F] dark:border-[#4C9170]/40 dark:bg-[#06331D]/70 dark:text-[#DAF7E9]">
          Nach dem Fortsetzen wird die nächste Auslosung mit den aktuellen aktiven Spielern berechnet.
        </p>
      ) : null}
    </section>
  );
}
