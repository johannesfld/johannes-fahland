"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Sparkles, Dices, Ship, SquareStack, Grid3x3, Zap, Brain, Type } from "lucide-react";
import { FeatureTile } from "./FeatureTile";

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

/** Einheitlicher Wordmark-Stil für alle Tiles: gleiche Schriftgröße, -gewicht und -form. */
const WORDMARK_CLASS = "font-display text-4xl font-black uppercase tracking-tight leading-none";

export function FeatureTiles() {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3"
      variants={reduced ? undefined : containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* --- Solo Games --- */}

      {/* 2048 */}
      <FeatureTile
        href="/2048"
        tool="g2048"
        icon={Grid3x3}
        meta="Solo · Highscore"
        reduced={reduced}
        index="2"
        staggerIndex={0}
        wordmark={
          <span className={`${WORDMARK_CLASS} tabular-nums`}>2048</span>
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
        index="S"
        staggerIndex={1}
        wordmark={<span className={WORDMARK_CLASS}>SNAKE</span>}
        pattern={
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            <polyline
              points="20,70 20,40 50,40 50,65 75,65 75,30"
              stroke="var(--accent)"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              opacity="0.12"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        }
      />

      {/* Wordle */}
      <FeatureTile
        href="/wordle"
        tool="wordle"
        icon={Type}
        meta="Solo · Tageswort"
        reduced={reduced}
        index="W"
        staggerIndex={2}
        wordmark={<span className={WORDMARK_CLASS}>WORDLE</span>}
        pattern={
          <svg className="absolute inset-0 h-full w-full" aria-hidden>
            {["W","O","R","T"].map((letter, i) => (
              <text
                key={i}
                x={`${12 + i * 24}%`}
                y="65%"
                fontSize="28"
                fontWeight="900"
                fill="var(--accent)"
                opacity={0.06 + i * 0.025}
                fontFamily="sans-serif"
              >
                {letter}
              </text>
            ))}
          </svg>
        }
      />

      {/* Memory */}
      <FeatureTile
        href="/memory"
        tool="memory"
        icon={Brain}
        meta="Solo · 2 Spieler"
        reduced={reduced}
        index="M"
        staggerIndex={3}
        wordmark={<span className={WORDMARK_CLASS}>MEMORY</span>}
        pattern={
          <svg className="absolute inset-0 h-full w-full" aria-hidden>
            {[[15,20],[38,20],[62,20],[85,20],[15,55],[38,55],[62,55],[85,55]].map(([cx, cy], i) => (
              <rect
                key={i}
                x={`${cx - 7}%`}
                y={`${cy - 10}%`}
                width="14%"
                height="20%"
                rx="3"
                fill="var(--accent)"
                opacity={i % 2 === 0 ? 0.08 : 0.05}
              />
            ))}
          </svg>
        }
      />

      {/* --- Multiplayer Games --- */}

      {/* Wizard — groß, nimmt 2 Spalten auf lg */}
      <FeatureTile
        href="/wizard"
        tool="wizard"
        icon={Sparkles}
        meta="Multiplayer · bis 6 Spieler"
        reduced={reduced}
        index="Z"
        staggerIndex={4}
        wordmark={<span className={WORDMARK_CLASS}>WIZARD</span>}
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
        meta="Multiplayer · Würfelspiel"
        reduced={reduced}
        index="K"
        staggerIndex={5}
        wordmark={<span className={WORDMARK_CLASS}>KNIFFEL</span>}
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
        meta="Multiplayer · 1 – 2 Spieler"
        reduced={reduced}
        index="V"
        staggerIndex={6}
        wordmark={
          <div className="flex flex-col leading-none gap-1">
            <span className={WORDMARK_CLASS}>SCHIFFE</span>
            <span className={WORDMARK_CLASS}>VERSENKEN</span>
          </div>
        }
        pattern={
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            <path d="M 0 60 Q 25 55, 50 62 T 100 58" stroke="var(--accent)" strokeWidth="0.4" fill="none" opacity="0.08" vectorEffect="non-scaling-stroke" />
            <path d="M 0 70 Q 25 65, 50 72 T 100 68" stroke="var(--accent)" strokeWidth="0.3" fill="none" opacity="0.06" vectorEffect="non-scaling-stroke" />
          </svg>
        }
      />

      {/* Rommé */}
      <FeatureTile
        href="/romme"
        tool="romme"
        icon={SquareStack}
        meta="Multiplayer · Kartenspiel"
        reduced={reduced}
        index="R"
        staggerIndex={7}
        wordmark={<span className={WORDMARK_CLASS}>ROMMÉ</span>}
        pattern={
          <svg className="absolute inset-0 h-full w-full" aria-hidden>
            <rect x="75%" y="15%" width="14%" height="20%" rx="3" stroke="var(--accent)" strokeWidth="1.2" fill="none" opacity="0.10" />
            <rect x="78%" y="18%" width="14%" height="20%" rx="3" stroke="var(--accent)" strokeWidth="1.2" fill="none" opacity="0.07" />
          </svg>
        }
      />
    </motion.div>
  );
}
