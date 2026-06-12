import Game2048 from "@/components/game2048/Game2048";

export const metadata = {
  title: "2048 · Pasch",
  description: "Wische, kombiniere, erreiche 2048.",
};

export default function Page2048() {
  return <Game2048 />;
}
