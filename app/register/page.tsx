"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction } from "@/app/actions/auth";
import { SubmitButton } from "@/components/SubmitButton";

type AuthState = { error: string | null };

const initialState: AuthState = { error: null };

const field =
  "h-11 rounded-xl border-2 border-[var(--border)] bg-[var(--surface)] px-4 text-base font-normal text-[var(--foreground)] transition-all " +
  "placeholder:text-zinc-400 focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)] " +
  "dark:placeholder:text-zinc-500 sm:h-12";

const card =
  "rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm sm:p-6 dark:shadow-none";

export default function RegisterPage() {
  const [state, formAction] = useActionState(registerAction, initialState);

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className={card}>
        <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Welcome
        </div>
        <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
          vibecode projekte
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Erstelle ein Konto und starte anschließend auf der Home-Seite.
        </p>
      </div>

      <div className={card}>
        <h2 className="text-sm font-semibold tracking-tight">Register</h2>

        <form action={formAction} className="mt-4 flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">Username</span>
            <input
              name="username"
              type="text"
              autoComplete="username"
              required
              className={field}
            />
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Minimum 3 characters.
            </span>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">Password</span>
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              required
              className={field}
            />
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Minimum 8 characters.
            </span>
          </label>

          {state.error ? (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/45 dark:bg-red-950/45 dark:text-red-200">
              <span className="mt-0.5 font-semibold" aria-hidden>
                !
              </span>
              <span>{state.error}</span>
            </div>
          ) : null}

          <SubmitButton
            pendingText="Creating account..."
            className={
              "inline-flex h-12 w-full touch-manipulation items-center justify-center rounded-xl px-4 text-sm font-semibold " +
              "bg-zinc-900 text-white transition-all hover:bg-zinc-800 active:scale-[0.99] active:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 " +
              "dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400 sm:h-11"
            }
          >
            Register
          </SubmitButton>
        </form>

        <div className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          Schon registriert?{" "}
          <Link
            href="/login"
            className="font-medium text-amber-700 underline decoration-amber-500/40 underline-offset-2 transition hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300"
          >
            Zum Login
          </Link>
          .
        </div>
      </div>
    </div>
  );
}
