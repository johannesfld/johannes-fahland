import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4 sm:p-0">
      {/* User Header */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-zinc-900 dark:text-zinc-50">Dashboard</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Willkommen zurück, <span className="font-semibold text-amber-500">{user.username}</span>
            </p>
          </div>
          <form action={logoutAction} className="w-full sm:w-auto">
            <button type="submit" className="w-full sm:w-auto inline-flex h-11 items-center justify-center rounded-xl bg-zinc-900 px-6 text-sm font-bold text-white transition-all hover:bg-zinc-800 active:scale-95 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
              Logout
            </button>
          </form>
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <WizardTile />
        <KniffelTile />
        <SchiffeTile />
      </div>
    </div>
  );
}

function WizardTile() {
  return (
    <Link
      href="/wizzard-punkterechner"
      className="group relative flex flex-col gap-3 overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6 text-left shadow-md transition-all duration-300 hover:border-amber-500 hover:shadow-xl dark:border-amber-900/50 dark:from-[#0f172a] dark:to-[#020617] active:scale-[0.98]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,#f59e0b20,transparent)] opacity-100" />
      
      <div className="relative flex flex-1 flex-col items-center justify-center py-8">
        <h2 className="text-center font-serif text-[clamp(2.5rem,8vw,4.25rem)] font-black tracking-tighter text-transparent bg-gradient-to-b from-amber-800 to-amber-500 bg-clip-text dark:from-amber-200 dark:to-amber-500 transition-transform duration-500 group-hover:scale-110">
          WIZARD
        </h2>
        <div className="mt-3 h-1.5 w-12 rounded-full bg-amber-200 dark:bg-amber-900/40 transition-all duration-500 group-hover:w-24 group-hover:bg-amber-500" />
      </div>

      <div className="relative flex justify-between items-center mt-2 pt-4 border-t border-amber-100 dark:border-zinc-800/50">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700/60 dark:text-amber-500/50">
          Game Assistant
        </p>
        <span className="text-xs font-bold text-amber-600 transition-all group-hover:translate-x-1">
          Öffnen →
        </span>
      </div>
    </Link>
  );
}

function KniffelTile() {
  return (
    <Link
      href="/kniffel-rechner"
      className="group relative flex flex-col gap-3 overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 text-left shadow-md transition-all duration-300 hover:border-amber-500 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900 active:scale-[0.98]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,#f59e0b15,transparent)] opacity-100" />
      
      <div className="relative flex flex-1 flex-col items-center justify-center py-8">
        <h2 className="text-center font-sans text-[clamp(2.4rem,7.6vw,4.1rem)] font-black italic tracking-tighter text-amber-500 transition-transform duration-500 group-hover:scale-110">
          KNIFFEL
        </h2>
        <div className="mt-3 h-1.5 w-12 rounded-full bg-zinc-100 dark:bg-zinc-800 transition-all duration-500 group-hover:w-24 group-hover:bg-amber-500" />
      </div>

      <div className="relative flex justify-between items-center mt-2 pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
          Tabelle
        </p>
        <span className="text-xs font-bold text-amber-600 transition-all group-hover:translate-x-1">
          Öffnen →
        </span>
      </div>
    </Link>
  );
}

function SchiffeTile() {
  return (
    <Link
      href="/schiffe-versenken"
      className="group relative flex flex-col gap-3 overflow-hidden rounded-3xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-6 text-left shadow-md transition-all duration-300 hover:border-sky-500 hover:shadow-xl dark:border-sky-900/40 dark:from-[#0c1222] dark:to-[#020617] active:scale-[0.98]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,#0ea5e920,transparent)] opacity-100" />
      <div className="relative flex flex-1 flex-col items-center justify-center py-8">
        <h2 className="text-center font-sans text-[clamp(1.6rem,5.5vw,2.75rem)] font-black tracking-tight text-sky-700 transition-transform duration-500 group-hover:scale-105 dark:text-sky-300">
          SCHIFFE
        </h2>
        <p className="mt-1 text-center text-xs font-bold uppercase tracking-widest text-sky-600/80 dark:text-sky-400/80">
          versenken · Solo
        </p>
        <div className="mt-3 h-1.5 w-12 rounded-full bg-sky-200 transition-all duration-500 group-hover:w-24 group-hover:bg-sky-500 dark:bg-sky-900/50" />
      </div>
      <div className="relative flex justify-between items-center mt-2 pt-4 border-t border-sky-100 dark:border-zinc-800/50">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-700/60 dark:text-sky-500/50">
          Gegen den Computer
        </p>
        <span className="text-xs font-bold text-sky-600 transition-all group-hover:translate-x-1 dark:text-sky-400">
          Öffnen →
        </span>
      </div>
    </Link>
  );
}