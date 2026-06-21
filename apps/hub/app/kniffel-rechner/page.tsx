import KniffelScoreSheet from "@/components/kniffel/KniffelScoreSheet";

export const metadata = {
  title: "Kniffel · Pasch",
  description: "Digitaler Kniffel-Block: Punkte eintragen, Summen und Bonus rechnen sich automatisch.",
};

export default function KniffelRechnerPage() {
  return <KniffelScoreSheet />;
}
