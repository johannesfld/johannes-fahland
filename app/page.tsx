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
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-8">
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
    "group flex flex-col gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-left shadow-sm transition-all duration-200 " +
    "hover:border-amber-300/40 hover:shadow-md dark:hover:border-zinc-600 dark:hover:bg-[var(--surface-muted)]";

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
    <Link
      href="/wizzard-punkterechner"
      className={
        "group relative flex flex-col gap-3 overflow-hidden rounded-2xl border-2 border-amber-400/35 bg-gradient-to-br " +
        "from-amber-50 via-white to-amber-100/90 p-6 text-left shadow-sm transition-all duration-300 " +
        "hover:border-amber-500/55 hover:shadow-[0_12px_40px_-12px_rgba(245,158,11,0.35)] " +
        "dark:border-amber-500/25 dark:from-[#0a1020] dark:via-[#0f172a] dark:to-[#020617] " +
        "dark:hover:border-amber-400/40 dark:hover:shadow-[0_12px_40px_-8px_rgba(245,158,11,0.15)]"
      }
    >
      <div
        className={
          "pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,#fde68a,transparent)] opacity-90 " +
          "dark:bg-[radial-gradient(circle_at_50%_-20%,#1e1b4b,transparent)] dark:opacity-100"
        }
      />
      <div className="relative flex flex-1 flex-col items-center justify-center gap-4">
        <h2
          className={
            "text-center font-serif text-3xl font-black tracking-tighter text-transparent md:text-4xl " +
            "bg-gradient-to-b from-amber-800 to-amber-500 bg-clip-text " +
            "dark:from-amber-200 dark:to-amber-500 dark:drop-shadow-[0_2px_12px_rgba(245,158,11,0.25)]"
          }
        >
          WIZARD
        </h2>
        <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-amber-700/70 dark:text-amber-500/70">
          Score Master
        </p>
      </div>
      <div className="relative mt-2 text-center text-xs font-medium text-amber-700 transition group-hover:text-amber-900 dark:text-amber-400 dark:group-hover:text-amber-300">
        Zum Spiel
      </div>
    </Link>
  );
}
