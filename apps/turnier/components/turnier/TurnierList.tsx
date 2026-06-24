"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Trash2, Repeat, Zap, Layers, Grid3x3, Plus } from "lucide-react";
import { Brandmark, Wordmark } from "@/components/ui/Brandmark";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { createTournament, deleteTournament } from "@/app/actions/turnier";
import {
  actionBtn,
  pillToggle,
  sectionLabel,
  selectChevron,
  selectStyled,
  turnierCard,
} from "@/components/turnier/styles";
import { cn } from "@/components/ui/styles";
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

const MODE_ICON: Record<TournamentMode, typeof Repeat> = {
  round_robin: Repeat,
  knockout: Zap,
  swiss: Layers,
  groups_ko: Grid3x3,
};

const MODE_HINTS: Record<TournamentMode, string> = {
  round_robin: "Jeder spielt reihum gegen alle (bzw. mit allen als Partner). Faire Rotation.",
  knockout: "K.-o.-Baum: Verlierer scheidet aus, Sieger steigt auf bis zum Finale. Nur Einzel.",
  swiss: "Feste Rundenzahl, Paarung nach Punktstand, keine Wiederholungen. Nur Einzel.",
  groups_ko: "Erst Gruppen (jeder gegen jeden), dann K.-o.-Finalrunde. Nur Einzel.",
};

const MODE_SHORT: Record<TournamentMode, string> = {
  round_robin: "Reihum gegen alle",
  knockout: "K.-o.-Baum",
  swiss: "Schweizer System",
  groups_ko: "Gruppen + K.o.",
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
  const [pendingDelete, setPendingDelete] = useState<TournamentListItem | null>(null);

  const doublesAllowed = MODE_SUPPORTS_DOUBLES[mode];
  const effectiveFormat: TournamentFormat = doublesAllowed ? format : "singles";

  function selectMode(next: TournamentMode) {
    setMode(next);
    if (!MODE_SUPPORTS_DOUBLES[next]) setFormat("singles");
  }

  function confirmDelete() {
    const item = pendingDelete;
    if (!item) return;
    setPendingDelete(null);
    setDeletingId(item.id);
    startTransition(() => {
      void deleteTournament(item.id)
        .then(() => {
          setItems((prev) => prev.filter((entry) => entry.id !== item.id));
        })
        .catch((error) => {
          window.alert(
            error instanceof Error ? error.message : "Turnier konnte nicht gelöscht werden.",
          );
        })
        .finally(() => setDeletingId(null));
    });
  }

  return (
    <ToolShell>
      <div className="mx-auto flex min-h-0 w-full max-w-7xl min-w-0 flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden px-4 pb-10 pt-[calc(env(safe-area-inset-top)+1rem)] sm:px-6 sm:py-5 lg:px-8 lg:py-6">
        {/* --- Anlege-Karte --- */}
        <section className={cn(turnierCard, "flex flex-col gap-5")}>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--vibe-r-md)] bg-[var(--accent-soft)] text-[var(--accent)] shadow-[var(--vibe-shadow-soft)]">
              <Brandmark size={22} />
            </div>
            <div className="min-w-0">
              <Wordmark className="text-lg" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--vibe-fg-faint)]">
                Turnierleitung
              </p>
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="font-display text-3xl font-extrabold tracking-tight">Neues Turnier</h1>
            <p className="text-sm text-[var(--vibe-fg-muted)]">
              Modus wählen, Spieler eintragen, auslosen, Ergebnisse erfassen – fertig.
            </p>
          </div>

          {/* Modus als Icon-Cards */}
          <div className="flex min-w-0 flex-col gap-2">
            <p className={sectionLabel}>Modus</p>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              {MODE_ORDER.map((m) => {
                const Icon = MODE_ICON[m];
                const active = mode === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => selectMode(m)}
                    aria-pressed={active}
                    className={cn(
                      "flex min-h-[4.5rem] flex-col items-start gap-1 rounded-[var(--vibe-r-xl)] border p-3 text-left transition-[transform,border-color,background-color] duration-200 [transition-timing-function:var(--vibe-ease-spring)] active:scale-[0.97]",
                      active
                        ? "border-[var(--accent)] bg-[var(--accent-soft)] shadow-[var(--vibe-shadow-clay)]"
                        : "border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)] shadow-[var(--vibe-shadow-soft)] [@media(hover:hover)]:hover:border-[var(--accent-line)]",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex h-8 w-8 items-center justify-center rounded-full",
                        active
                          ? "bg-[var(--accent)] text-[var(--accent-ink)]"
                          : "bg-[var(--vibe-bg-sunken)] text-[var(--vibe-fg-muted)]",
                      )}
                    >
                      <Icon className="h-4 w-4" strokeWidth={2.4} />
                    </span>
                    <span className="text-sm font-bold tracking-tight text-[var(--vibe-fg-base)]">
                      {MODE_LABELS[m]}
                    </span>
                    <span className="text-[11px] leading-tight text-[var(--vibe-fg-faint)]">
                      {MODE_SHORT[m]}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-[var(--vibe-fg-faint)]">{MODE_HINTS[mode]}</p>
          </div>

          {/* Format (nur falls Doppel erlaubt) */}
          {doublesAllowed ? (
            <div className="flex min-w-0 flex-col gap-2">
              <p className={sectionLabel}>Format</p>
              <div className="inline-flex w-fit gap-1 rounded-full border border-[var(--vibe-line)] bg-[var(--vibe-bg-sunken)] p-1">
                {(["doubles", "singles"] as const).map((f) => {
                  const active = format === f;
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFormat(f)}
                      className={cn(
                        pillToggle,
                        active
                          ? "bg-[var(--accent)] text-[var(--accent-ink)] shadow-[var(--vibe-shadow-clay)]"
                          : "text-[var(--vibe-fg-muted)] [@media(hover:hover)]:hover:text-[var(--vibe-fg-base)]",
                      )}
                    >
                      {f === "doubles" ? "Doppel" : "Einzel"}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Name + Best-of + Anlegen */}
          <div className="flex min-w-0 flex-col gap-2">
            <p className={sectionLabel}>Name &amp; Modus</p>
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Turniername"
                className="min-h-12 min-w-0 flex-1 rounded-[var(--vibe-r-xl)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)] px-3.5 text-sm font-medium text-[var(--vibe-fg-base)] shadow-[var(--vibe-shadow-flat)] placeholder:text-[var(--vibe-fg-faint)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60"
              />
              <select
                value={bestOf}
                onChange={(event) => setBestOf(Number(event.target.value) as BestOf)}
                className={selectStyled}
                style={selectChevron}
                aria-label="Best of"
              >
                <option value={1}>Best of 1</option>
                <option value={3}>Best of 3</option>
                <option value={5}>Best of 5</option>
              </select>
              <button
                type="button"
                className={cn(actionBtn, "gap-1.5")}
                disabled={isPending || !name.trim()}
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
                <Plus className="h-4 w-4" strokeWidth={2.6} />
                Anlegen
              </button>
            </div>
          </div>
        </section>

        {/* --- Turnierliste --- */}
        <div className="flex min-w-0 items-center justify-between gap-2 px-1">
          <h2 className="font-display text-lg font-extrabold tracking-tight text-[var(--vibe-fg-base)]">
            Deine Turniere
          </h2>
          <span className="text-xs font-semibold text-[var(--vibe-fg-faint)]">
            {items.length} {items.length === 1 ? "Turnier" : "Turniere"}
          </span>
        </div>

        <section className="grid min-h-0 min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.length === 0 ? (
            <div className="col-span-full rounded-[var(--vibe-r-2xl)] border border-dashed border-[var(--vibe-line-strong)] bg-[var(--vibe-bg-sunken)]/40 p-8 text-center">
              <p className="text-sm font-medium text-[var(--vibe-fg-muted)]">
                Noch keine Turniere – lege oben dein erstes an.
              </p>
            </div>
          ) : null}
          {items.map((item) => {
            const StatusIcon = MODE_ICON[item.mode];
            return (
              <article
                key={item.id}
                className="group relative flex min-w-0 flex-col gap-2 overflow-hidden rounded-[var(--vibe-r-2xl)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)] p-4 shadow-[var(--vibe-shadow-clay)] transition-transform duration-200 [transition-timing-function:var(--vibe-ease-spring)] [@media(hover:hover)]:hover:-translate-y-1"
              >
                <Link
                  href={`/${item.id}`}
                  className="flex min-w-0 flex-col gap-2 pr-12 focus-visible:outline-none"
                >
                  <span
                    className={cn(
                      "inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em]",
                      item.status === "active"
                        ? "bg-[var(--ok-soft)] text-[var(--ok-ink)]"
                        : item.status === "paused"
                          ? "bg-[var(--warn-soft)] text-[var(--warn-ink)]"
                          : item.status === "finished"
                            ? "bg-[var(--neutral-soft)] text-[var(--neutral-ink)]"
                            : "bg-[var(--accent-soft)] text-[var(--accent)]",
                    )}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        item.status === "active"
                          ? "bg-[var(--ok)]"
                          : item.status === "paused"
                            ? "bg-[var(--warn)]"
                            : item.status === "finished"
                              ? "bg-[var(--vibe-fg-faint)]"
                              : "bg-[var(--accent)]",
                      )}
                    />
                    {tournamentListStatusLabel(item)}
                  </span>
                  <h3 className="truncate font-display text-lg font-extrabold tracking-tight">
                    {item.name}
                  </h3>
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[var(--vibe-fg-muted)]">
                    <span className="inline-flex items-center gap-1">
                      <StatusIcon className="h-3.5 w-3.5 text-[var(--vibe-fg-faint)]" strokeWidth={2.4} />
                      {MODE_LABELS[item.mode]}
                    </span>
                    <span className="text-[var(--vibe-fg-faint)]">·</span>
                    <span>{item.playerCount} Spieler</span>
                    <span className="text-[var(--vibe-fg-faint)]">·</span>
                    <span>{item.format === "doubles" ? "Doppel" : "Einzel"}</span>
                    <span className="text-[var(--vibe-fg-faint)]">·</span>
                    <span>Bo{item.bestOf}</span>
                  </p>
                  {item.status === "finished" && item.winnerName ? (
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--accent)]">
                      🏆 {item.winnerName}
                    </p>
                  ) : null}
                </Link>
                <button
                  type="button"
                  aria-label={`Turnier ${item.name} löschen`}
                  disabled={deletingId === item.id}
                  onClick={() => setPendingDelete(item)}
                  className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--vibe-line)] bg-[var(--vibe-bg-base)] text-[var(--vibe-fg-faint)] shadow-[var(--vibe-shadow-soft)] transition-[transform,color,border-color] duration-200 [transition-timing-function:var(--vibe-ease-spring)] [@media(hover:hover)]:hover:border-[var(--danger)] [@media(hover:hover)]:hover:text-[var(--danger)] active:scale-[0.9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--danger)]/60 disabled:opacity-40 disabled:pointer-events-none"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={2.2} />
                </button>
              </article>
            );
          })}
        </section>

        {/* --- Footer --- */}
        <footer className="mt-auto flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pt-4 text-xs text-[var(--vibe-fg-faint)]">
          <Link
            href="/impressum"
            className="font-semibold transition-colors [@media(hover:hover)]:hover:text-[var(--accent)]"
          >
            Impressum
          </Link>
          <span aria-hidden>·</span>
          <span>Turnier · Turnierleitung</span>
        </footer>
      </div>

      <ConfirmModal
        open={pendingDelete != null}
        title="Turnier löschen?"
        body={
          pendingDelete
            ? `„${pendingDelete.name}" und alle Runden, Matches und Ergebnisse werden unwiderruflich gelöscht.`
            : ""
        }
        confirmLabel="Löschen"
        cancelLabel="Abbrechen"
        tone="danger"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </ToolShell>
  );
}
