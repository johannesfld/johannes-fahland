import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { getCurrentUser } from "@/lib/auth";

export default function Home() {
  return <HomeInner />;
}

async function HomeInner() {
  const user = await getCurrentUser();

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Home
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              {user ? (
                <span>
                  Eingeloggt als <span className="font-medium">{user.email}</span>
                </span>
              ) : (
                <span>
                  Du bist nicht eingeloggt.{" "}
                  <Link href="/login" className="font-medium underline">
                    Login
                  </Link>{" "}
                  oder{" "}
                  <Link href="/register" className="font-medium underline">
                    Register
                  </Link>
                  .
                </span>
              )}
            </p>
          </div>
          {user ? (
            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Logout
              </button>
            </form>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Tile
          title="Wizzard Punkterechner"
          description="Wizard Score Master: Runden anlegen, Ansagen erfassen, Punkte berechnen."
          href="/wizzard-punkterechner"
        />
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
