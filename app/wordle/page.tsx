import { readFile } from "fs/promises";
import path from "path";
import WordleGame from "@/components/wordle/WordleGame";

export const metadata = {
  title: "Wordle · vibecode",
  description: "Errate das Tageswort in 6 Versuchen.",
};

export default async function WordlePage() {
  const file = await readFile(path.join(process.cwd(), "public", "wordle-words.json"), "utf-8");
  const words: string[] = JSON.parse(file);
  return <WordleGame words={words} />;
}
