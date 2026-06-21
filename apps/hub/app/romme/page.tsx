import RommeScoreApp from "@/components/romme/RommeScoreApp";

export const metadata = {
  title: "Rommé · Pasch",
  description: "Rommé-Punktezähler für mehrere Spieler über beliebig viele Runden.",
};

export default function RommePage() {
  return <RommeScoreApp />;
}
