import { redirect } from "next/navigation";
import { FeatureTiles } from "@/components/home/FeatureTiles";
import { getCurrentUser } from "@pasch/db";

export default async function Home() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 py-6 sm:px-0 sm:py-4">
      {/* Header */}
      <div className="flex flex-col gap-0.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--vibe-fg-faint)]">
          Spielabend-Werkzeug
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--vibe-fg-base)]">
          Hallo, {user.username === "Gast" ? "Johannes" : user.username}.
        </h1>
      </div>
      {/* Grid */}
      <FeatureTiles />
    </div>
  );
}