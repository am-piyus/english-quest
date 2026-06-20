"use client";

import { AnimatePresence, motion } from "framer-motion";

export default function AchievementPopup({
  show,
  title,
  detail,
}: {
  show: boolean;
  title: string;
  detail?: string;
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -16, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.9 }}
          className="fixed inset-x-0 top-5 z-50 mx-auto w-fit max-w-[90%] rounded-full bg-ink px-5 py-2.5 text-center text-sm text-paper shadow-lg"
          role="status"
        >
          <span className="font-bold">{title}</span>
          {detail && <span className="ml-2 text-paper/80">{detail}</span>}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
