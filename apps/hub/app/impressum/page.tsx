import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Impressum · Spielbrett",
  description: "Anbieterkennzeichnung und rechtliche Angaben nach § 5 DDG.",
};

export default function ImpressumPage() {
  return (
    <article className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12 text-[var(--vibe-fg-base)]">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--vibe-fg-faint)]">
          Anbieterkennzeichnung
        </p>
        <h1
          style={{ fontFamily: "var(--font-fraunces), serif" }}
          className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          Impressum
        </h1>
      </header>

      <section className="space-y-1 leading-relaxed">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--vibe-fg-muted)]">
          Angaben gemäß § 5 DDG
        </h2>
        <p className="mt-2">Johannes Fahland</p>
        <p className="text-[var(--vibe-fg-muted)]">
          Privater, nicht-kommerzieller Hobby-Tool-Hub. Bei rechtlichen Anliegen bitte
          per E-Mail anschreiben — die Postanschrift wird auf Anfrage mitgeteilt.
        </p>
      </section>

      <section className="mt-8 space-y-1 leading-relaxed">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--vibe-fg-muted)]">
          Kontakt
        </h2>
        <p>
          E-Mail:{" "}
          <a
            href="mailto:johannes.fahland@gmail.com"
            className="font-medium text-[var(--accent)] underline decoration-[var(--accent-line)] underline-offset-2 transition hover:text-[var(--brand-700)]"
          >
            johannes.fahland@gmail.com
          </a>
        </p>
      </section>

      <section className="mt-8 space-y-1 leading-relaxed">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--vibe-fg-muted)]">
          Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
        </h2>
        <p>Johannes Fahland (Anschrift wie oben).</p>
      </section>

      <section className="mt-8 space-y-2 leading-relaxed text-sm text-[var(--vibe-fg-muted)]">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--vibe-fg-muted)]">
          Haftungsausschluss
        </h2>
        <p>
          Spielbrett ist ein privates Hobbyprojekt. Inhalte und Tools werden mit Sorgfalt
          erstellt, eine Gewährleistung für Vollständigkeit, Aktualität oder Eignung für
          einen bestimmten Zweck wird jedoch nicht übernommen. Für externe Links
          (z.&nbsp;B. zur Subdomain <em>turnier.johannes-fahland.com</em>) gilt: zum
          Zeitpunkt der Verlinkung waren keine rechtswidrigen Inhalte erkennbar.
        </p>
      </section>

      <section className="mt-8 space-y-2 leading-relaxed text-sm text-[var(--vibe-fg-muted)]">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--vibe-fg-muted)]">
          Datenschutz
        </h2>
        <p>
          Die Spielstände, Highscores und Einstellungen aller Spiele werden ausschließlich
          lokal im Browser gespeichert (LocalStorage); es findet keine Übermittlung an
          einen Server statt. Das Turniertool speichert Turnierdaten in einer
          SQLite-Datenbank auf dem Server, der unter Cloudflare-Tunnel betrieben wird.
        </p>
      </section>

      <footer className="mt-12 border-t border-[var(--vibe-line)] pt-6 text-xs text-[var(--vibe-fg-faint)]">
        <p>Stand: {new Date().getFullYear()}</p>
      </footer>
    </article>
  );
}
