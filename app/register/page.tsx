"use client";

import Link from "next/link";
import { useActionState } from "react";
import { motion } from "framer-motion";
import { registerAction } from "@/app/actions/auth";
import { SubmitButton } from "@/components/SubmitButton";
import { AuthErrorBanner } from "@/components/auth/AuthErrorBanner";
import {
  authCardClass,
  authFieldClass,
  authSubmitButtonClass,
  authSwapLinkClass,
} from "@/components/auth/styles";

type AuthState = { error: string | null };

const initialState: AuthState = { error: null };

const ease = [0.22, 1, 0.36, 1] as const;

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
};

export default function RegisterPage() {
  const [state, formAction] = useActionState(registerAction, initialState);

  return (
    <motion.div
      className="flex flex-col gap-4 sm:gap-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div className={authCardClass} variants={cardVariants}>
        <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Welcome
        </div>
        <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
          vibecode projekte
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Erstelle ein Konto und starte anschließend auf der Home-Seite.
        </p>
      </motion.div>

      <motion.div className={authCardClass} variants={cardVariants}>
        <h2 className="text-sm font-semibold tracking-tight">Register</h2>

        <form action={formAction} className="mt-4 flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">Username</span>
            <input
              name="username"
              type="text"
              autoComplete="username"
              required
              className={authFieldClass}
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
              className={authFieldClass}
            />
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Minimum 8 characters.
            </span>
          </label>

          {state.error ? <AuthErrorBanner message={state.error} /> : null}

          <SubmitButton
            pendingText="Creating account..."
            className={authSubmitButtonClass}
          >
            Register
          </SubmitButton>
        </form>

        <div className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          Schon registriert?{" "}
          <Link
            href="/login"
            className={authSwapLinkClass}
          >
            Zum Login
          </Link>
          .
        </div>
      </motion.div>
    </motion.div>
  );
}
