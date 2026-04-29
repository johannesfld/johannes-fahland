import { redirect } from "next/navigation";
import { FeatureTiles } from "@/components/home/FeatureTiles";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4 sm:p-0">
      {/* User Header 
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-zinc-900 dark:text-zinc-50">Dashboard</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Willkommen zurück, <span className="font-semibold text-amber-500">{user.username}</span>
            </p>
          </div>
          <form action={logoutAction} className="w-full sm:w-auto">
            <button type="submit" className="w-full sm:w-auto inline-flex h-11 items-center justify-center rounded-xl bg-zinc-900 px-6 text-sm font-bold text-white transition duration-200 hover:bg-zinc-800 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-2 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-offset-zinc-950">
              Logout
            </button>
          </form>
        </div>
      </div>
        */}
      {/* Grid */}
      <FeatureTiles />
    </div>
  );
}