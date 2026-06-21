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

      <FeatureTile
        href="/2048"
        tool="g2048"
        icon={Grid3x3}
        meta="Solo · Highscore"
        reduced={reduced}
        index="2"
        staggerIndex={0}
        wordmark={<span className={`${WORDMARK_CLASS} tabular-nums`}>2048</span>}
      />

      <FeatureTile
        href="/snake"
        tool="snake"
        icon={Zap}
        meta="Solo · Highscore"
        reduced={reduced}
        index="S"
        staggerIndex={1}
        wordmark={<span className={WORDMARK_CLASS}>SNAKE</span>}
      />

      <FeatureTile
        href="/wordle"
        tool="wordle"
        icon={Type}
        meta="Solo · Tageswort"
        reduced={reduced}
        index="W"
        staggerIndex={2}
        wordmark={<span className={WORDMARK_CLASS}>WORDLE</span>}
      />

      <FeatureTile
        href="/memory"
        tool="memory"
        icon={Brain}
        meta="Solo · 2 Spieler"
        reduced={reduced}
        index="M"
        staggerIndex={3}
        wordmark={<span className={WORDMARK_CLASS}>MEMORY</span>}
      />

      {/* --- Multiplayer Games --- */}

      <FeatureTile
        href="/wizard"
        tool="wizard"
        icon={Sparkles}
        meta="Multiplayer · bis 6 Spieler"
        reduced={reduced}
        index="Z"
        staggerIndex={4}
        wordmark={<span className={WORDMARK_CLASS}>WIZARD</span>}
      />

      <FeatureTile
        href="/kniffel-rechner"
        tool="kniffel"
        icon={Dices}
        meta="Multiplayer · Würfelspiel"
        reduced={reduced}
        index="K"
        staggerIndex={5}
        wordmark={<span className={WORDMARK_CLASS}>KNIFFEL</span>}
      />

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
      />

      <FeatureTile
        href="/romme"
        tool="romme"
        icon={SquareStack}
        meta="Multiplayer · Kartenspiel"
        reduced={reduced}
        index="R"
        staggerIndex={7}
        wordmark={<span className={WORDMARK_CLASS}>ROMMÉ</span>}
      />
    </motion.div>
  );
}
