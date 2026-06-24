import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Brandmark, Wordmark } from "@/components/ui/Brandmark";

export const metadata: Metadata = {
  title: "Impressum · Turnier",
  description: "Anbieterkennzeichnung und rechtliche Angaben nach § 5 DDG.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[var(--vibe-r-2xl)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)] p-5 shadow-[var(--vibe-shadow-soft)]">
      <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--vibe-fg-faint)]">
        {title}
      </h2>
      <div className="mt-2 space-y-1 text-sm leading-relaxed text-[var(--vibe-fg-base)]">
        {children}
      </div>
    </section>
  );
}

export default function ImpressumPage() {
  return (
    <main className="h-full min-h-0 w-full overflow-y-auto bg-[var(--vibe-bg-base)] text-[var(--vibe-fg-base)]">
      <div className="mx-auto w-full max-w-2xl px-4 pb-12 pt-[calc(env(safe-area-inset-top)+1rem)] sm:px-6 sm:pt-6">
        {/* Kopf */}
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-[var(--vibe-r-xl)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-elevated)] px-3.5 py-2 text-sm font-semibold text-[var(--vibe-fg-muted)] shadow-[var(--vibe-shadow-soft)] transition-transform duration-200 [transition-timing-function:var(--vibe-ease-spring)] [@media(hover:hover)]:hover:text-[var(--vibe-fg-base)] active:scale-[0.96]"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.4} />
            Zurück
          </Link>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-[var(--vibe-r-md)] bg-[var(--accent-soft)] text-[var(--accent)]">
              <Brandmark size={20} />
            </span>
            <Wordmark />
          </div>
        </div>

        <header className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--vibe-fg-faint)]">
            Anbieterkennzeichnung
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Impressum
          </h1>
        </header>

        <div className="flex flex-col gap-3">
          <Section title="Angaben gemäß § 5 DDG">
            <p className="font-semibold">Johannes Fahland</p>
            <p className="text-[var(--vibe-fg-muted)]">Gillestraße 10</p>
            <p className="text-[var(--vibe-fg-muted)]">01219 Dresden</p>
          </Section>

          <Section title="Kontakt">
            <p>
              E-Mail:{" "}
              <a
                href="mailto:johannes.fahland@gmail.com"
                className="font-semibold text-[var(--accent)] underline decoration-[var(--accent-line)] underline-offset-2 transition-colors [@media(hover:hover)]:hover:text-[var(--brand-700)]"
              >
                johannes.fahland@gmail.com
              </a>
            </p>
          </Section>

          <Section title="Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV">
            <p>Johannes Fahland (Anschrift wie oben).</p>
          </Section>

          <Section title="Haftungsausschluss">
            <p className="text-[var(--vibe-fg-muted)]">
              Turnier ist ein privates, nicht-kommerzielles Hobbyprojekt. Inhalte und Funktionen
              werden mit Sorgfalt erstellt; eine Gewähr für Vollständigkeit, Aktualität oder
              Eignung für einen bestimmten Zweck wird nicht übernommen.
            </p>
          </Section>

          <Section title="Datenschutz">
            <p className="text-[var(--vibe-fg-muted)]">
              Turnierdaten (Namen, Runden, Ergebnisse) werden in einer bei Vercel gehosteten
              Postgres-Datenbank gespeichert, um Turniere geräteübergreifend per Link teilen zu
              können. Es werden keine personenbezogenen Daten zu Werbe- oder Tracking-Zwecken
              erhoben oder an Dritte weitergegeben.
            </p>
          </Section>
        </div>

        <footer className="mt-10 border-t border-[var(--vibe-line)] pt-6 text-xs text-[var(--vibe-fg-faint)]">
          <p>Turnier · Turnierleitung für Tischtennis &amp; mehr</p>
        </footer>
      </div>
    </main>
  );
}
