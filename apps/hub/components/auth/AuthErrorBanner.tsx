"use client";

import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { authErrorClass } from "@/components/auth/styles";

const ease = [0.22, 1, 0.36, 1] as const;

export function AuthErrorBanner({ message }: { message: string }) {
  return (
    <motion.div
      className={authErrorClass}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease }}
    >
      <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-500 dark:text-red-400" aria-hidden />
      <span>{message}</span>
    </motion.div>
  );
}
