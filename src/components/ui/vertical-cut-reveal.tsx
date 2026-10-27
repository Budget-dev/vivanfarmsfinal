"use client";

import React from "react";
import { motion } from "motion/react";

interface VerticalCutRevealProps {
  children: string;
  splitBy?: "words" | "characters";
  staggerDuration?: number;
  staggerFrom?: "first" | "last" | "center";
  reverse?: boolean;
  transition?: any;
  className?: string;
}

export const VerticalCutReveal: React.FC<VerticalCutRevealProps> = ({
  children,
  staggerDuration = 0.08,
  className = "",
}) => {
  const words = typeof children === "string" ? children.split(" ") : [children];

  return (
    <span className={`inline-flex flex-wrap gap-x-[0.25em] overflow-hidden ${className}`}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden py-0.5">
          <motion.span
            className="inline-block"
            initial={{ y: "100%", opacity: 0 }}
            whileInView={{ y: "0%", opacity: 1 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.6,
              delay: i * staggerDuration,
              ease: [0.215, 0.61, 0.355, 1],
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </span>
  );
};
