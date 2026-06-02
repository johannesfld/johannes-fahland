"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Sparkles, Dices, Ship, SquareStack, Trophy, Grid3x3, Zap } from "lucide-react";
import { FeatureTile } from "./FeatureTile";

const ease = [0.22, 1, 0.36, 1] as const;

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

export function FeatureTiles() {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3"
      variants={reduced ? undefined : containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Wizard — groß, nimmt 2 Spalten auf lg */}
      <FeatureTile
        href="/wizzard-punkterechner"
        tool="wizard"
        icon={Sparkles}
        meta="Kartenspiel · bis 6 Spieler"
        reduced={reduced}
        index={0}
        className="lg:col-span-2 lg:row-span-1"
        wordmark={
          <span className="font-display text-5xl font-black italic tracking-tight leading-none">
            WIZARD
          </span>
        }
        pattern={
          <svg className="absolute inset-0 h-full w-full" aria-hidden>
            {[...Array(4)].map((_, i) => (
              <circle
                key={i}
                cx={`${[15, 85, 20, 80][i]}%`}
                cy={`${[15, 20, 80, 75][i]}%`}
                r="2.5"
                fill="var(--accent)"
                opacity="0.08"
              />
            ))}
          </svg>
        }
      />

      {/* Kniffel */}
      <FeatureTile
        href="/kniffel-rechner"
        tool="kniffel"
        icon={Dices}
        meta="Würfelspiel · Tabelle"
        reduced={reduced}
        index={1}
        wordmark={
          <span className="font-sans text-4xl font-black italic tracking-tight leading-none">
            KNIFFEL
          </span>
        }
        pattern={
          <svg className="absolute inset-0 h-full w-full" aria-hidden>
            {[[20,20],[80,20],[20,80],[80,80],[50,50]].map(([cx, cy], i) => (
              <circle key={i} cx={`${cx}%`} cy={`${cy}%`} r="1.8" fill="var(--accent)" opacity="0.10" />
            ))}
          </svg>
        }
      />

      {/* Schiffe */}
      <FeatureTile
        href="/schiffe-versenken"
        tool="schiffe"
        icon={Ship}
        meta="1 – 2 Spieler"
        reduced={reduced}
        index={2}
        wordmark={
          <div className="flex flex-col leading-none">
            <span className="font-sans text-3xl font-black uppercase tracking-widest leading-tight">SCHIFFE</span>
            <span className="font-sans text-3xl font-black uppercase tracking-widest leading-tight">VERSENKEN</span>
          </div>
        }
        pattern={
          <svg className="absolute inset-0 h-full w-full" aria-hidden>
            <path d="M 0 60% Q 25% 55%, 50% 62% T 100% 58%" stroke="var(--accent)" strokeWidth="1.5" fill="none" opacity="0.08" />
            <path d="M 0 70% Q 25% 65%, 50% 72% T 100% 68%" stroke="var(--accent)" strokeWidth="1" fill="none" opacity="0.06" />
          </svg>
        }
      />

      {/* Rommé */}
      <FeatureTile
        href="/romme"
        tool="romme"
        icon={SquareStack}
        meta="Kartenspiel · Tabelle"
        reduced={reduced}
        index={3}
        wordmark={
          <span className="font-sans text-4xl font-bold uppercase tracking-tight leading-none">
            ROMMÉ
          </span>
        }
        pattern={
          <svg className="absolute inset-0 h-full w-full" aria-hidden>
            <rect x="75%" y="15%" width="14%" height="20%" rx="3" stroke="var(--accent)" strokeWidth="1.2" fill="none" opacity="0.10" />
            <rect x="78%" y="18%" width="14%" height="20%" rx="3" stroke="var(--accent)" strokeWidth="1.2" fill="none" opacity="0.07" />
          </svg>
        }
      />

      {/* Turnier */}
      <FeatureTile
        href="/tischtennis-turnier"
        tool="turnier"
        icon={Trophy}
        meta="Einzel & Doppel"
        reduced={reduced}
        index={4}
        wordmark={
          <span className="font-mono text-[1.65rem] font-black uppercase tracking-[0.1em] leading-none">
            TURNIER
          </span>
        }
        pattern={
          <svg className="absolute inset-0 h-full w-full" aria-hidden>
            <line x1="50%" y1="0" x2="50%" y2="100%" stroke="var(--accent)" strokeWidth="1.2" opacity="0.06" />
          </svg>
        }
      />

      {/* 2048 */}
      <FeatureTile
        href="/2048"
        tool="g2048"
        icon={Grid3x3}
        meta="Solo · Highscore"
        reduced={reduced}
        index={5}
        wordmark={
          <span className="font-sans text-5xl font-black tabular-nums tracking-tight leading-none">
            2048
          </span>
        }
        pattern={
          <svg className="absolute inset-0 h-full w-full" aria-hidden>
            {[[20,25],[55,25],[20,60],[55,60],[82,25],[82,60]].map(([cx, cy], i) => (
              <rect
                key={i}
                x={`${cx}%`}
                y={`${cy}%`}
                width="14%"
                height="22%"
                rx="3"
                fill="var(--accent)"
                opacity={0.05 + i * 0.012}
              />
            ))}
          </svg>
        }
      />

      {/* Snake */}
      <FeatureTile
        href="/snake"
        tool="snake"
        icon={Zap}
        meta="Solo · Highscore"
        reduced={reduced}
        index={6}
        wordmark={
          <span className="font-sans text-5xl font-black uppercase tracking-tight leading-none">
            SNAKE
          </span>
        }
        pattern={
          <svg className="absolute inset-0 h-full w-full" aria-hidden>
            <polyline
              points="20%,70% 20%,40% 50%,40% 50%,65% 75%,65% 75%,30%"
              stroke="var(--accent)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              opacity="0.12"
            />
          </svg>
        }
      />
    </motion.div>
  );
}
