import { readFile } from "fs/promises";
import path from "path";
import WordleGame from "@/components/wordle/WordleGame";

export const metadata = {
  title: "Wordle · Pasch",
  description: "Errate das Tageswort in 6 Versuchen.",
};

export default async function WordlePage() {
  const [wordsRaw, acceptedRaw] = await Promise.all([
    readFile(path.join(process.cwd(), "public", "wordle-words.json"), "utf-8"),
    readFile(path.join(process.cwd(), "public", "wordle-accepted.json"), "utf-8"),
  ]);
  const words: string[] = JSON.parse(wordsRaw);
  const accepted: string[] = JSON.parse(acceptedRaw);
  return <WordleGame words={words} accepted={accepted} />;
}
