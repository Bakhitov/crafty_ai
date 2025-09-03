"use client";

import { motion } from "framer-motion";

export const Think = ({
  color = "primary",
}: { color?: "primary" | "green" | "amber" | "red" }) => {
  return (
    <motion.div
      className={`h-2 w-2 rounded-full ${
        color === "green"
          ? "bg-green-500"
          : color === "amber"
            ? "bg-amber-500"
            : color === "red"
              ? "bg-red-500"
              : "bg-primary"
      }`}
      animate={{
        scale: [1, 1.5, 1],
        opacity: [0.6, 1, 0.6],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 0,
      }}
    />
  );
};
