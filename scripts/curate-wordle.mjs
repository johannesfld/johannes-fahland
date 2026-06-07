#!/usr/bin/env node
// Validiert + normalisiert die Wordle-Wortlisten.
// Tageswörter (wordle-words.json): handkuratierte Alltagswörter, garantiert in Akzeptanzliste.
// Akzeptanzliste (wordle-accepted.json): breitere deutsche 5-Letter-Wörter, vom Spieler tippbar.
//
// Regeln:
//   - exakt 5 ASCII-Großbuchstaben [A-Z]
//   - keine Duplikate
//   - jedes Tageswort MUSS in der Akzeptanzliste vorkommen (sonst kann Spieler die Lösung nicht eintippen)
//
// Quelle Tageswörter: handkurierter Korpus von Alltagsdeutsch (Substantive Singular/Plural, Adjektive,
// gängige Verbformen), abgeleitet aus eigener Sprachkenntnis + Abgleich gegen Akzeptanzliste.
// Quelle Akzeptanzliste: bereits vorhanden, hier nur normalisiert (sortiert, dedupliziert, gefiltert).

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const WORDS_PATH = path.join(ROOT, "public", "wordle-words.json");
const ACCEPTED_PATH = path.join(ROOT, "public", "wordle-accepted.json");

const isValidWord = (w) => typeof w === "string" && /^[A-Z]{5}$/.test(w);

function normalize(list) {
  const seen = new Set();
  const out = [];
  let dropped = 0;
  for (const raw of list) {
    const w = typeof raw === "string" ? raw.toUpperCase().trim() : "";
    if (!isValidWord(w)) { dropped++; continue; }
    if (seen.has(w)) { dropped++; continue; }
    seen.add(w);
    out.push(w);
  }
  out.sort();
  return { out, dropped };
}

async function main() {
  const writeMode = process.argv.includes("--write");
  const [wordsRaw, acceptedRaw] = await Promise.all([
    readFile(WORDS_PATH, "utf8"),
    readFile(ACCEPTED_PATH, "utf8"),
  ]);
  const words = JSON.parse(wordsRaw);
  const accepted = JSON.parse(acceptedRaw);

  const w = normalize(words);
  const a = normalize(accepted);

  const acceptedSet = new Set(a.out);
  const missing = w.out.filter((x) => !acceptedSet.has(x));

  console.log(`Tageswörter: ${w.out.length} (${w.dropped} verworfen)`);
  console.log(`Akzeptanz:   ${a.out.length} (${a.dropped} verworfen)`);
  if (missing.length) {
    console.error(`FEHLER: ${missing.length} Tageswörter fehlen in der Akzeptanzliste:`);
    console.error(missing.join(", "));
    process.exitCode = 1;
  } else {
    console.log("OK: alle Tageswörter sind in der Akzeptanzliste enthalten.");
  }

  if (writeMode) {
    await writeFile(WORDS_PATH, JSON.stringify(w.out) + "\n", "utf8");
    await writeFile(ACCEPTED_PATH, JSON.stringify(a.out) + "\n", "utf8");
    console.log("Listen normalisiert geschrieben.");
  } else {
    console.log("(dry-run, keine Schreibvorgänge; --write zum Persistieren)");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
