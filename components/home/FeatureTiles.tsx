import Link from "next/link";

export function FeatureTiles() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:[grid-auto-rows:1fr] lg:grid-cols-3">
      <WizardTile />
      <KniffelTile />
      <SchiffeTile />
    </div>
  );
}

function WizardTile() {
  return (
    <Link
      href="/wizzard-punkterechner"
      className="@container group relative flex h-full flex-col gap-4 overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6 text-left shadow-md transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-amber-500 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.98] dark:border-amber-900/50 dark:from-[#0f172a] dark:to-[#020617] dark:focus-visible:ring-offset-zinc-950"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,#f59e0b20,transparent)] opacity-100" />
      <div className="relative flex flex-1 flex-col items-center justify-center py-8">
        <h2 className="text-center font-serif text-[clamp(2.5rem,15cqw,4.25rem)] font-black tracking-tighter text-transparent bg-gradient-to-b from-amber-800 to-amber-500 bg-clip-text dark:from-amber-200 dark:to-amber-500 transition-transform duration-500 group-hover:scale-110">
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
      className="@container group relative flex h-full flex-col gap-4 overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 text-left shadow-md transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-amber-500 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-900 dark:focus-visible:ring-offset-zinc-950"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,#f59e0b15,transparent)] opacity-100" />
      <div className="relative flex flex-1 flex-col items-center justify-center py-8">
        <h2 className="text-center font-sans text-[clamp(2.4rem,14cqw,4.1rem)] font-black italic tracking-tighter text-amber-500 transition-transform duration-500 group-hover:scale-110">
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
      className="@container group relative flex h-full flex-col gap-4 overflow-hidden rounded-3xl border border-slate-300 bg-gradient-to-br from-slate-100 to-white p-6 text-left shadow-md transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-slate-500 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.98] dark:border-slate-700 dark:from-[#12141a] dark:to-[#0a0a0e] dark:focus-visible:ring-offset-zinc-950"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,#71717a20,transparent)] opacity-100" />
      <div className="relative flex flex-1 flex-col items-center justify-center py-8">
        <h2 className="bg-gradient-to-b from-slate-700 to-slate-400 bg-clip-text text-center font-sans text-[clamp(1.4rem,9cqw,2.5rem)] font-black uppercase tracking-widest text-transparent transition-transform duration-500 group-hover:scale-105 dark:from-slate-200 dark:to-slate-400">
          SCHIFFE
        </h2>
        <h2 className="bg-gradient-to-b from-slate-700 to-slate-400 bg-clip-text text-center font-sans text-[clamp(1.4rem,9cqw,2.5rem)] font-black uppercase tracking-widest text-transparent transition-transform duration-500 group-hover:scale-105 dark:from-slate-200 dark:to-slate-400">
          VERSENKEN
        </h2>
        <div className="mt-3 h-1.5 w-12 rounded-full bg-slate-300 transition-all duration-500 group-hover:w-24 group-hover:bg-slate-500 dark:bg-slate-700" />
      </div>
      <div className="relative flex justify-between items-center mt-2 pt-4 border-t border-slate-200 dark:border-zinc-800/50">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500">
          1/2 Spieler
        </p>
        <span className="text-xs font-bold text-slate-600 transition-all group-hover:translate-x-1 dark:text-slate-400">
          Öffnen →
        </span>
      </div>
    </Link>
  );
}
