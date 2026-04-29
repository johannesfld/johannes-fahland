"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { createTournament, deleteTournament } from "@/app/actions/turnier";
import {
  actionBtn,
  selectChevron,
  selectStyled,
  turnierCard,
} from "@/components/turnier/styles";
import type { BestOf, TournamentListItem } from "@/components/turnier/types";

function tournamentListStatusLabel(item: TournamentListItem): string {
  switch (item.status) {
    case "setup":
      return "Setup";
    case "active":
      return "Läuft";
    case "paused":
      return "Pausiert";
    case "finished":
      return "Beendet";
    default:
      return item.status;
  }
}

type TurnierListProps = {
  initialItems: TournamentListItem[];
};

export function TurnierList({ initialItems }: TurnierListProps) {
  const [items, setItems] = useState(initialItems);
  const [name, setName] = useState("");
  const [bestOf, setBestOf] = useState<BestOf>(3);
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-7xl min-w-0 flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
      <section className={`${turnierCard} flex flex-col gap-3`}>
        <h1 className="text-2xl font-black tracking-tighter">Tischtennis Turniere</h1>
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Turniername"
            className="min-h-11 min-w-0 flex-1 rounded-xl border border-zinc-300 bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 dark:border-zinc-700 dark:bg-zinc-950"
          />
          <select
            value={bestOf}
            onChange={(event) => setBestOf(Number(event.target.value) as BestOf)}
            className={selectStyled}
            style={selectChevron}
          >
            <option value={1}>Best of 1</option>
            <option value={3}>Best of 3</option>
            <option value={5}>Best of 5</option>
          </select>
          <button
            type="button"
            className={actionBtn}
            disabled={isPending}
            onClick={() =>
              startTransition(() => {
                if (!name.trim()) return;
                void createTournament(name, bestOf).then((id) => {
                  setItems((prev) => [
                    {
                      id,
                      name,
                      status: "setup",
                      bestOf,
                      winnerName: null,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                      playerCount: 0,
                    },
                    ...prev,
                  ]);
                  setName("");
                });
              })
            }
          >
            Neues Turnier
          </button>
        </div>
      </section>

      <section className="grid min-h-0 min-w-0 grid-cols-1 gap-3 pb-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Noch keine Turniere – lege oben dein erstes Turnier an.
          </p>
        ) : null}
        {items.map((item) => (
          <article
            key={item.id}
            className="group relative flex min-w-0 flex-col gap-2 overflow-hidden rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-amber-500 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <Link
              href={`/tischtennis-turnier/${item.id}`}
              className="flex min-w-0 flex-col gap-2 focus-visible:outline-none"
            >
              <p
                className={
                  item.status === "active"
                    ? "text-xs font-black uppercase tracking-[0.22em] text-emerald-600 dark:text-emerald-400"
                    : item.status === "paused"
                      ? "text-xs font-black uppercase tracking-[0.22em] text-amber-600 dark:text-amber-400"
                      : "text-xs font-black uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400"
                }
              >
                {tournamentListStatusLabel(item)}
              </p>
              <h2 className="truncate text-lg font-black tracking-tight">{item.name}</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                {item.playerCount} Spieler · Best of {item.bestOf}
              </p>
              {item.status === "finished" && item.winnerName ? (
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
                  Sieger: {item.winnerName}
                </p>
              ) : null}
            </Link>
            <button
              type="button"
              aria-label={`Turnier ${item.name} löschen`}
              disabled={deletingId === item.id}
              onClick={() => {
                if (
                  !window.confirm(
                    `Turnier "${item.name}" wirklich löschen? Alle Runden, Matches und Ergebnisse gehen verloren.`,
                  )
                ) {
                  return;
                }
                setDeletingId(item.id);
                startTransition(() => {
                  void deleteTournament(item.id)
                    .then(() => {
                      setItems((prev) => prev.filter((entry) => entry.id !== item.id));
                    })
                    .catch((error) => {
                      window.alert(
                        error instanceof Error
                          ? error.message
                          : "Turnier konnte nicht gelöscht werden.",
                      );
                    })
                    .finally(() => setDeletingId(null));
                });
              }}
              className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white/90 text-zinc-500 opacity-0 shadow-sm transition duration-200 ease-out hover:border-red-400 hover:text-red-500 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60 group-hover:opacity-100 disabled:opacity-40 disabled:pointer-events-none dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-300"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </article>
        ))}
      </section>
    </div>
  );
}
