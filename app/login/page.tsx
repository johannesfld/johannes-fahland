"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";
import { SubmitButton } from "@/components/SubmitButton";

type AuthState = { error: string | null };

const initialState: AuthState = { error: null };

export default function LoginPage() {
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Welcome
        </div>
        <h1 className="mt-2 text-xl sm:text-2xl font-semibold tracking-tight">
          vibecode projekte
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Melde dich an, um zur Home-Seite zu gelangen.
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-sm font-semibold tracking-tight">Login</h2>

        <form action={formAction} className="mt-4 flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">Username</span>
            <input
              name="username"
              type="text"
              autoComplete="username"
              required
              className="h-11 sm:h-12 rounded-xl border-2 border-zinc-300 bg-white px-4 text-base font-normal transition-all focus:border-zinc-900 focus:shadow-[0_0_0_3px_rgba(0,0,0,0.1)] dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50 dark:focus:shadow-[0_0_0_3px_rgba(255,255,255,0.1)]"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">Password</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="h-11 sm:h-12 rounded-xl border-2 border-zinc-300 bg-white px-4 text-base font-normal transition-all focus:border-zinc-900 focus:shadow-[0_0_0_3px_rgba(0,0,0,0.1)] dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50 dark:focus:shadow-[0_0_0_3px_rgba(255,255,255,0.1)]"
            />
          </label>

          {state.error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
              {state.error}
            </div>
          ) : null}

          <SubmitButton
            pendingText="Signing in..."
            className="inline-flex h-12 sm:h-11 w-full items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-800 active:bg-zinc-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 touch-manipulation dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:active:bg-zinc-300"
          >
            Login
          </SubmitButton>
        </form>

        <div className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">
          Noch kein Konto?{" "}
          <Link href="/register" className="font-medium underline">
            Jetzt registrieren
          </Link>
          .
        </div>
      </div>
    </div>
  );
}
