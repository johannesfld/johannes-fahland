"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { rommeDisplay } from "@/components/romme/romme-display-font";
import { Sparkles, Dices, Ship, SquareStack, Trophy } from "lucide-react";

const MotionLink = motion.create(Link);

const ease = [0.22, 1, 0.36, 1] as const;

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const tileVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease } },
};

export function FeatureTiles() {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 sm:[grid-auto-rows:1fr] lg:grid-cols-3 xl:grid-cols-5"
      variants={prefersReduced ? undefined : containerVariants}
      initial="hidden"
      animate="show"
    >
      <WizardTile reduced={prefersReduced} />
      <KniffelTile reduced={prefersReduced} />
      <SchiffeTile reduced={prefersReduced} />
      <RommeTile reduced={prefersReduced} />
      <TurnierTile reduced={prefersReduced} />
    </motion.div>
  );
}

function WizardTile({ reduced }: { reduced: boolean | null }) {
  return (
    <MotionLink
      href="/wizzard-punkterechner"
      variants={reduced ? undefined : tileVariants}
      className="@container group relative flex h-full flex-col gap-3 sm:gap-4 overflow-hidden rounded-2xl sm:rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 sm:p-6 text-left shadow-md transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-amber-500 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.98] dark:border-amber-900/50 dark:from-[#0f172a] dark:to-[#020617] dark:focus-visible:ring-offset-zinc-950"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,#f59e0b20,transparent)] opacity-100" />
      <div className="relative flex flex-1 flex-col items-center justify-center py-6 sm:py-8">
        <Sparkles
          className="mb-3 h-7 w-7 sm:h-8 sm:w-8 text-amber-400 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12 dark:text-amber-500"
          aria-hidden
        />
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
    </MotionLink>
  );
}

function KniffelTile({ reduced }: { reduced: boolean | null }) {
  return (
    <MotionLink
      href="/kniffel-rechner"
      variants={reduced ? undefined : tileVariants}
      className="@container group relative flex h-full flex-col gap-3 sm:gap-4 overflow-hidden rounded-2xl sm:rounded-3xl border border-zinc-200 bg-white p-4 sm:p-6 text-left shadow-md transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-amber-500 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-900 dark:focus-visible:ring-offset-zinc-950"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,#f59e0b15,transparent)] opacity-100" />
      <div className="relative flex flex-1 flex-col items-center justify-center py-6 sm:py-8">
        <Dices
          className="mb-3 h-7 w-7 sm:h-8 sm:w-8 text-amber-400 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-12 dark:text-amber-500"
          aria-hidden
        />
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
    </MotionLink>
  );
}

function SchiffeTile({ reduced }: { reduced: boolean | null }) {
  return (
    <MotionLink
      href="/schiffe-versenken"
      variants={reduced ? undefined : tileVariants}
      className="@container group relative flex h-full flex-col gap-3 sm:gap-4 overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-300 bg-gradient-to-br from-slate-100 to-white p-4 sm:p-6 text-left shadow-md transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-slate-500 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.98] dark:border-slate-700 dark:from-[#12141a] dark:to-[#0a0a0e] dark:focus-visible:ring-offset-zinc-950"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,#71717a20,transparent)] opacity-100" />
      <div className="relative flex flex-1 flex-col items-center justify-center py-6 sm:py-8">
        <Ship
          className="mb-3 h-7 w-7 sm:h-8 sm:w-8 text-slate-400 transition-transform duration-500 group-hover:scale-110 group-hover:translate-x-1 dark:text-slate-500"
          aria-hidden
        />
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
    </MotionLink>
  );
}

function RommeTile({ reduced }: { reduced: boolean | null }) {
  return (
    <MotionLink
      href="/romme"
      variants={reduced ? undefined : tileVariants}
      className={`${rommeDisplay.variable} @container group relative flex h-full flex-col gap-3 sm:gap-4 overflow-hidden rounded-2xl sm:rounded-3xl border border-red-900/35 bg-gradient-to-br from-red-950/[0.07] to-white p-4 sm:p-6 text-left shadow-md transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-red-800 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.98] dark:border-red-900/50 dark:from-red-950/80 dark:to-zinc-950 dark:shadow-black/30 dark:focus-visible:ring-offset-zinc-950`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(127,29,29,0.2),transparent)] opacity-100 dark:bg-[radial-gradient(circle_at_50%_120%,rgba(185,28,28,0.15),transparent)]" />
      <div className="relative flex flex-1 flex-col items-center justify-center py-6 sm:py-8">
        <SquareStack
          className="mb-3 h-7 w-7 sm:h-8 sm:w-8 text-red-900 transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-0.5 dark:text-red-300"
          aria-hidden
        />
        <h2
          className={`${rommeDisplay.className} text-center text-[clamp(2.2rem,12cqw,3.5rem)] font-bold uppercase tracking-tight text-transparent bg-gradient-to-b from-red-950 to-red-700 bg-clip-text transition-transform duration-500 group-hover:scale-105 dark:from-red-100 dark:to-red-400`}
        >
          ROMMÉ
        </h2>
        <div className="mt-3 h-1.5 w-12 rounded-full bg-red-200 transition-all duration-500 group-hover:w-24 group-hover:bg-red-800 dark:bg-red-900/60 dark:group-hover:bg-red-500" />
      </div>
      <div className="relative mt-2 flex items-center justify-between border-t border-red-900/15 pt-4 dark:border-red-900/40">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-950/70 dark:text-red-200/70">
          Tabelle
        </p>
        <span className="text-xs font-bold text-red-900 transition-all group-hover:translate-x-1 dark:text-red-300">
          Öffnen →
        </span>
      </div>
    </MotionLink>
  );
}

function TurnierTile({ reduced }: { reduced: boolean | null }) {
  return (
    <MotionLink
      href="/tischtennis-turnier"
      variants={reduced ? undefined : tileVariants}
      className="@container group relative flex h-full flex-col gap-3 sm:gap-4 overflow-hidden rounded-2xl sm:rounded-3xl border border-[#8DC4AA]/70 bg-gradient-to-br from-[#DAF7E9] to-white p-4 sm:p-6 text-left shadow-md transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[#4C9170] hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4C9170]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.98] dark:border-[#4C9170]/50 dark:from-[#06331D] dark:to-[#1E5E3F]/90 dark:shadow-black/30 dark:focus-visible:ring-offset-zinc-950"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(76,145,112,0.22),transparent)] opacity-100 dark:bg-[radial-gradient(circle_at_50%_120%,rgba(141,196,170,0.18),transparent)]" />
      <div className="relative flex flex-1 flex-col items-center justify-center py-6 sm:py-8">
        <Trophy
          className="mb-3 h-7 w-7 sm:h-8 sm:w-8 text-[#4C9170] transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-0.5 dark:text-[#8DC4AA]"
          aria-hidden
        />
        <h2 className="text-center font-mono text-[clamp(1.45rem,8.5cqw,2.35rem)] font-black uppercase tracking-[0.12em] text-transparent bg-gradient-to-b from-[#1E5E3F] to-[#4C9170] bg-clip-text transition-transform duration-500 group-hover:scale-105 dark:from-[#DAF7E9] dark:to-[#8DC4AA]">
          TURNIERTOOL
        </h2>
        <div className="mt-3 h-1.5 w-12 rounded-full bg-[#8DC4AA] transition-all duration-500 group-hover:w-24 group-hover:bg-[#4C9170] dark:bg-[#4C9170]/60 dark:group-hover:bg-[#8DC4AA]" />
      </div>
      <div className="relative mt-2 flex items-center justify-between border-t border-[#8DC4AA]/50 pt-4 dark:border-[#4C9170]/35">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1E5E3F]/80 dark:text-[#DAF7E9]/75">
          Einzel & Doppel
        </p>
        <span className="text-xs font-bold text-[#4C9170] transition-all group-hover:translate-x-1 dark:text-[#8DC4AA]">
          Öffnen →
        </span>
      </div>
    </MotionLink>
  );
}
