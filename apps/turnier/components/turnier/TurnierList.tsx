"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Brandmark, Wordmark } from "@/components/ui/Brandmark";
import { createTournament, deleteTournament } from "@/app/actions/turnier";
import {
  actionBtn,
  sectionLabel,
  selectChevron,
  selectStyled,
  subtleBtn,
  turnierCard,
} from "@/components/turnier/styles";
import { ToolShell } from "@/components/tool-shell/ToolShell";
import {
  MODE_LABELS,
  type BestOf,
  type TournamentFormat,
  type TournamentListItem,
  type TournamentMode,
} from "@/components/turnier/types";

const MODE_ORDER: TournamentMode[] = ["round_robin", "knockout", "swiss", "groups_ko"];

// Modi außer Round-Robin sind aktuell Einzel-basiert.
const MODE_SUPPORTS_DOUBLES: Record<TournamentMode, boolean> = {
  round_robin: true,
  knockout: false,
  swiss: false,
  groups_ko: false,
};

const MODE_HINTS: Record<TournamentMode, string> = {
  round_robin: "Jeder spielt reihum gegen alle (bzw. mit allen als Partner). Faire Rotation.",
  knockout: "K.-o.-Baum: Verlierer scheidet aus, Sieger steigt auf bis zum Finale. Nur Einzel.",
  swiss: "Feste Rundenzahl, Paarung nach Punktstand, keine Wiederholungen. Nur Einzel.",
  groups_ko: "Erst Gruppen (jeder gegen jeden), dann K.-o.-Finalrunde. Nur Einzel.",
};

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
  const [format, setFormat] = useState<TournamentFormat>("doubles");
  const [mode, setMode] = useState<TournamentMode>("round_robin");
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const doublesAllowed = MODE_SUPPORTS_DOUBLES[mode];
  const effectiveFormat: TournamentFormat = doublesAllowed ? format : "singles";

  function selectMode(next: TournamentMode) {
    setMode(next);
    if (!MODE_SUPPORTS_DOUBLES[next]) setFormat("singles");
  }

  return (
    <ToolShell>
    <div className="mx-auto flex min-h-0 w-full max-w-7xl min-w-0 flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
      <section className={`${turnierCard} flex flex-col gap-3`}>
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--vibe-r-md)] bg-[var(--accent-soft)] text-[var(--accent)]">
            <Brandmark size={20} />
          </div>
          <div className="min-w-0">
            <Wordmark />
            <p className="text-[10px] font-medium uppercase tracking-widest text-[var(--vibe-fg-faint)]">
              Turnierleitung
            </p>
          </div>
        </div>
        <h1 className="font-display text-3xl font-medium tracking-tight">Deine Turniere</h1>
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex min-w-0 flex-col gap-2">
            <p className={sectionLabel}>Modus</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {MODE_ORDER.map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`${mode === m ? actionBtn : subtleBtn} truncate px-2 sm:px-4`}
                  onClick={() => selectMode(m)}
                >
                  {MODE_LABELS[m]}
                </button>
              ))}
            </div>
            <p className="text-xs text-[var(--vibe-fg-faint)]">{MODE_HINTS[mode]}</p>
          </div>

          {doublesAllowed ? (
            <div className="flex min-w-0 flex-col gap-2">
              <p className={sectionLabel}>Format</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={format === "doubles" ? actionBtn : subtleBtn}
                  onClick={() => setFormat("doubles")}
                >
                  Doppel
                </button>
                <button
                  type="button"
                  className={format === "singles" ? actionBtn : subtleBtn}
                  onClick={() => setFormat("singles")}
                >
                  Einzel
                </button>
              </div>
            </div>
          ) : null}
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Turniername"
              className="min-h-11 min-w-0 flex-1 rounded-xl border border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)] px-3 text-sm text-[var(--vibe-fg-base)] placeholder:text-[var(--vibe-fg-faint)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60"
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
                  void createTournament(name, bestOf, effectiveFormat, mode).then((id) => {
                    setItems((prev) => [
                      {
                        id,
                        name,
                        status: "setup",
                        format: effectiveFormat,
                        mode,
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
        </div>
      </section>

      <section className="grid min-h-0 min-w-0 grid-cols-1 gap-3 pb-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.length === 0 ? (
          <p className="text-sm text-[var(--vibe-fg-muted)]">
            Noch keine Turniere – lege oben dein erstes Turnier an.
          </p>
        ) : null}
        {items.map((item) => (
          <article
            key={item.id}
            className="group relative flex min-w-0 flex-col gap-2 overflow-hidden rounded-2xl border border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)] p-4 shadow-[var(--vibe-shadow-soft)] transition duration-200 [@media(hover:hover)]:hover:-translate-y-0.5 [@media(hover:hover)]:hover:border-[var(--accent-line)]"
          >
            <Link
              href={`/${item.id}`}
              className="flex min-w-0 flex-col gap-2 focus-visible:outline-none"
            >
              <p
                className={
                  item.status === "active"
                    ? "text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ok)]"
                    : item.status === "paused"
                      ? "text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--warn)]"
                      : "text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--vibe-fg-faint)]"
                }
              >
                {tournamentListStatusLabel(item)}
              </p>
              <h2 className="truncate font-display text-lg font-medium tracking-tight">{item.name}</h2>
              <p className="text-sm text-[var(--vibe-fg-muted)]">
                {item.playerCount} Spieler · {MODE_LABELS[item.mode]} ·{" "}
                {item.format === "doubles" ? "Doppel" : "Einzel"} · Best of {item.bestOf}
              </p>
              {item.status === "finished" && item.winnerName ? (
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
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
              className="absolute right-2.5 top-2.5 inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--vibe-line)] bg-[var(--vibe-bg-overlay)]/90 text-[var(--vibe-fg-muted)] shadow-[var(--vibe-shadow-flat)] transition duration-200 ease-out hover:border-[var(--danger)] hover:text-[var(--danger)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--danger)]/60 disabled:opacity-40 disabled:pointer-events-none [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:focus-visible:opacity-100"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </article>
        ))}
      </section>
    </div>
    </ToolShell>
  );
}
