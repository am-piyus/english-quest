"use client";

import { motion } from "framer-motion";

export default function ProgressBar({
  percent,
  className = "h-3",
}: {
  percent: number;
  className?: string;
}) {
  return (
    <div className={`w-full overflow-hidden rounded-full bg-paper-2 ${className}`}>
      <motion.div
        className="h-full rounded-full bg-brand"
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </div>
  );
}
