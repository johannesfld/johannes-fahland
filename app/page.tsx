import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { getCurrentUser } from "@/lib/auth";

export default function Home() {
  return <HomeInner />;
}

async function HomeInner() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col gap-6 h-screen overflow-hidden">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Home
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              Eingeloggt als <span className="font-medium">{user.username}</span>
            </p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-800 active:bg-zinc-700 transition-all duration-200 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:active:bg-zinc-300"
            >
              Logout
            </button>
          </form>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 flex-1 overflow-hidden">
        <WizardTile />
        <Tile
          title="Platzhalter 1"
          description="Kommt später."
          disabled
        />
        <Tile
          title="Platzhalter 2"
          description="Kommt später."
          disabled
        />
        <Tile
          title="Platzhalter 3"
          description="Kommt später."
          disabled
        />
        <Tile
          title="Platzhalter 4"
          description="Kommt später."
          disabled
        />
      </div>
    </div>
  );
}

function Tile({
  title,
  description,
  href,
  disabled,
}: {
  title: string;
  description: string;
  href?: string;
  disabled?: boolean;
}) {
  const className =
    "group flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-5 text-left transition hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 dark:hover:bg-zinc-900";

  if (disabled || !href) {
    return (
      <div className={`${className} opacity-60`}>
        <div className="text-sm font-semibold tracking-tight">{title}</div>
        <div className="text-sm text-zinc-600 dark:text-zinc-300">
          {description}
        </div>
      </div>
    );
  }

  return (
    <Link href={href} className={className}>
      <div className="text-sm font-semibold tracking-tight">{title}</div>
      <div className="text-sm text-zinc-600 dark:text-zinc-300">
        {description}
      </div>
      <div className="mt-2 text-sm font-medium text-zinc-900 group-hover:underline dark:text-zinc-50">
        Öffnen
      </div>
    </Link>
  );
}

function WizardTile() {
  return (
    <Link href="/wizzard-punkterechner" className="group flex flex-col gap-3 rounded-2xl border-2 border-amber-900/20 bg-gradient-to-br from-[#020617] to-slate-900/20 p-6 text-left transition hover:border-amber-500/40 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#1e1b4b,transparent)] pointer-events-none" />
      <div className="relative flex flex-col gap-4 flex-1 items-center justify-center">
        <h2 className="text-3xl md:text-4xl font-serif font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-500 drop-shadow-[0_2px_10px_rgba(245,158,11,0.3)] text-center">
          WIZARD
        </h2>
        <p className="text-[9px] uppercase tracking-[0.3em] text-amber-500/60 font-bold">
          Score Master
        </p>
      </div>
      <div className="relative mt-2 text-xs font-medium text-amber-400 group-hover:text-amber-300 transition text-center">
        Zum Spiel
      </div>
    </Link>
  );
}
