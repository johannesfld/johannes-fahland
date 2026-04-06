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
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Welcome
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
          This is a minimal mobile-first Next.js + Tailwind + Prisma setup with
          email/password auth and a responsive header/sidebar layout.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-sm font-semibold tracking-tight">Session</h2>
          <div className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
            {user ? (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Signed in as
                  </div>
                  <div className="font-semibold">{user.email}</div>
                </div>
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  >
                    Logout
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div>Not logged in.</div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Link
                    href="/login"
                    className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
                  >
                    Register
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-sm font-semibold tracking-tight">What’s Next</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
            <li>
              Extend the Prisma <span className="font-medium">User</span> model
              with profile fields.
            </li>
            <li>
              Add protected pages by checking the session in server components.
            </li>
            <li>Replace this simple auth with a provider-based solution later.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
