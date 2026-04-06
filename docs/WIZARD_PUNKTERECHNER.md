# Wizard Punkterechner — Layout & Wartung

Diese Seite (`/wizzard-punkterechner`) ist ein **Client-only** Spiel-UI (`WizardScoreMaster`). Dieses Dokument beschreibt die **Layout-Kette** und Regeln, damit die Ansicht auf **Mobilgeräten, iPad und Desktop** zuverlässig bleibt.

## Architektur (von außen nach innen)

1. **`app/layout.tsx`** — `ThemeProvider`, `AppShell`, `body` mit `h-dvh overflow-hidden`.
2. **`components/AppShell.tsx`** — Shell mit **`flex-row`**: links Sidebar (`md+`), rechts Spalte mit Header (`h-14`) und **`main`**.
3. **`main`** — `flex flex-1 flex-col min-h-0 overflow-y-auto`; innerer Container `max-w-7xl` + Padding.
4. **`app/template.tsx`** — umschließt jede Route mit **`flex flex-1 flex-col min-h-0 w-full`**, damit Kinder eine **messbare Höhe** erben können.
5. **`app/wizzard-punkterechner/layout.tsx`** — volle Breite der Content-Spalte, **negativer Rand** (`-mx-4 -my-4`) gleicht das AppShell-Padding aus (optisch randlos im Hauptbereich).
6. **`components/wizard/WizardScoreMaster.tsx`** — Spiel-UI.

## Kritische Regeln

### Kein `position: absolute` / `fixed` als alleinige Wurzel

Ein **absolut** positioniertes Root (`absolute inset-0`) **trägt keine Höhe** zur Elternbox bei. Wenn die Elternbox nur ein absolutes Kind hat, kann ihre **berechnete Höhe 0** sein — auf dem Handy sieht man dann oft **nur den Hintergrundverlauf**, Inhalt „fehlt“.

**Lösung:** Die Wizard-Wurzel ist ein **`flex flex-col flex-1 min-h-0`**-Container im normalen Flow. Zusätzlich:

- **`min-h-[calc(100svh-3.5rem-2rem)]`** auf kleinen Viewports (`md:min-h-0`), damit die Höhe auch dann stimmt, wenn die Flex-Kette auf iOS/Android zickt (`svh` berücksichtigt mobile Browser-UI besser als `100vh`).

### Flex-Kette und `min-h-0`

Überall, wo **Scroll** innerhalb eines Flex-Layouts gewünscht ist, brauchen flexiblen Kinder typischerweise **`min-h-0`** (sonst: „Parent wächst endlos / Kind scrollt nicht“).

### AppShell: Sidebar + Hauptbereich

Der äußere Shell-Container nutzt **`flex-row`**, damit die Sidebar **links** und der Bereich Header + **`main`** **rechts** liegen — kein vertikales „Stacking“ von Sidebar über dem Content.

## Persistenz

- LocalStorage-Key: `wizard-pro-score-v3`
- Beim Laden wird der Zustand validiert; bei inkonsistenten Daten wird der Eintrag entfernt und zum Setup zurückgesetzt.

## Theming / Hydration

- **`ThemeToggle`**: Dynamische `title`-Texte mit „aktiv: hell/dunkel“ erst **nach** `useEffect` (Hydration).
- **`ThemeProvider`**: `resolved` vor `mounted` SSR-sicher abgleichen (siehe `ThemeProvider.tsx`).

## Checkliste manueller Tests

| Umgebung | Prüfen |
|----------|--------|
| **Mobile (Portrait)** | Setup-Karte sichtbar, Buttons bedienbar, kein „nur Hintergrund“; Phasen (Mischer, Ansagen, …) lesbar; Scroll bei Punktetabelle |
| **iPad (Portrait/Landscape)** | Zwischen `md` und großem Layout: Sidebar sichtbar ab `md`, Wizard füllt Hauptbereich |
| **Desktop** | Sidebar links, Wizard rechts unter Header, kein falsches „Split“-Layout |

## Geänderte / relevante Dateien

- `components/wizard/WizardScoreMaster.tsx` — Spiel-UI, Flex-Root, `min-h`
- `app/wizzard-punkterechner/layout.tsx` — Segment-Wrapper
- `app/template.tsx` — Flex-Kette für alle Routen
- `components/AppShell.tsx` — `flex-row`, `main`-Overflow
- `components/ThemeToggle.tsx` / `ThemeProvider.tsx` — Theme & Hydration

Bei Layout-Änderungen an **AppShell** oder **template** diese Datei aktualisieren und die Checkliste erneut durchgehen.
