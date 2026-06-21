"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Sparkles, Dices, Ship, SquareStack, Grid3x3, Zap, Brain, Type } from "lucide-react";
import { FeatureTile } from "./FeatureTile";

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

/** Einheitlicher Wordmark-Stil für alle Tiles: Hanken Grotesk, klar & modern. */
const WORDMARK_CLASS = "font-sans text-[1.75rem] font-extrabold tracking-tight leading-none";

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

      <FeatureTile
        href="/2048"
        tool="g2048"
        icon={Grid3x3}
        meta="Solo · Highscore"
        reduced={reduced}
        staggerIndex={0}
        wordmark={<span className={`${WORDMARK_CLASS} tabular-nums`}>2048</span>}
      />

      <FeatureTile
        href="/snake"
        tool="snake"
        icon={Zap}
        meta="Solo · Highscore"
        reduced={reduced}
        staggerIndex={1}
        wordmark={<span className={WORDMARK_CLASS}>Snake</span>}
      />

      <FeatureTile
        href="/wordle"
        tool="wordle"
        icon={Type}
        meta="Solo · Tageswort"
        reduced={reduced}
        staggerIndex={2}
        wordmark={<span className={WORDMARK_CLASS}>Wordle</span>}
      />

      <FeatureTile
        href="/memory"
        tool="memory"
        icon={Brain}
        meta="Solo · 2 Spieler"
        reduced={reduced}
        staggerIndex={3}
        wordmark={<span className={WORDMARK_CLASS}>Memory</span>}
      />

      {/* --- Multiplayer Games --- */}

      <FeatureTile
        href="/wizard"
        tool="wizard"
        icon={Sparkles}
        meta="Multiplayer · bis 6 Spieler"
        reduced={reduced}
        staggerIndex={4}
        wordmark={<span className={WORDMARK_CLASS}>Wizard</span>}
      />

      <FeatureTile
        href="/kniffel-rechner"
        tool="kniffel"
        icon={Dices}
        meta="Multiplayer · Würfelspiel"
        reduced={reduced}
        staggerIndex={5}
        wordmark={<span className={WORDMARK_CLASS}>Kniffel</span>}
      />

      <FeatureTile
        href="/schiffe-versenken"
        tool="schiffe"
        icon={Ship}
        meta="Multiplayer · 1 – 2 Spieler"
        reduced={reduced}
        staggerIndex={6}
        wordmark={
          <div className="flex flex-col leading-tight">
            <span className={WORDMARK_CLASS}>Schiffe</span>
            <span className={WORDMARK_CLASS}>versenken</span>
          </div>
        }
      />

      <FeatureTile
        href="/romme"
        tool="romme"
        icon={SquareStack}
        meta="Multiplayer · Kartenspiel"
        reduced={reduced}
        staggerIndex={7}
        wordmark={<span className={WORDMARK_CLASS}>Rommé</span>}
      />
    </motion.div>
  );
}
