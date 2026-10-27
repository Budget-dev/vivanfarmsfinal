"use client";

import React from "react";
import { motion } from "motion/react";

interface TimelineContentProps {
  as?: string | React.ComponentType<any>;
  animationNum?: number;
  timelineRef?: React.RefObject<HTMLDivElement | null>;
  customVariants?: any;
  className?: string;
  children?: React.ReactNode;
  href?: string;
  target?: string;
  rel?: string;
  [key: string]: any;
}

export const TimelineContent: React.FC<TimelineContentProps> = ({
  as = "div",
  animationNum = 0,
  timelineRef,
  customVariants,
  className = "",
  children,
  ...props
}) => {
  const Component: any = typeof as === "string" ? ((motion as any)[as] || motion.div) : as;

  const defaultVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.15, duration: 0.5 }
    })
  };

  const variants = customVariants || defaultVariants;

  return (
    <Component
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-30px" }}
      custom={animationNum}
      variants={variants}
      className={className}
      {...props}
    >
      {children}
    </Component>
  );
};
