"use client";

import { motion } from "framer-motion";

/** A little burst of stars, popped in one after another. */
export default function StarReward({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      className="inline-flex items-center gap-0.5 align-middle"
      aria-label={`${count} star${count === 1 ? "" : "s"} earned`}
    >
      {Array.from({ length: count }).map((_, i) => (
        <motion.span
          key={i}
          className="text-amber"
          initial={{ scale: 0, rotate: -45, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ delay: i * 0.08, type: "spring", stiffness: 500, damping: 14 }}
        >
          ⭐
        </motion.span>
      ))}
    </span>
  );
}
