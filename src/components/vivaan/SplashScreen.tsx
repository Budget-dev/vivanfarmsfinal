"use client";

import React from 'react';
import Image from 'next/image';
const motion = {
  div: ({ children, className }: any) => <div className={className}>{children}</div>,
  h1: ({ children, className }: any) => <h1 className={className}>{children}</h1>,
};

export const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[9999] bg-primary flex flex-col items-center justify-center overflow-hidden">
      {/* Background Decorative Element */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.08, scale: 1.4 }}
        transition={{ duration: 3, ease: "easeOut", repeat: Infinity, repeatType: "reverse" }}
        className="absolute w-[600px] h-[600px] rounded-full bg-white pointer-events-none"
      />

      <div className="relative z-10 flex flex-col items-center text-center px-6">
        {/* Logo Animation */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="w-64 h-24 sm:w-80 sm:h-28 md:w-96 md:h-36 relative mb-6 brightness-0 invert"
        >
          <Image 
            src="/images/logo.png"
            alt="Vivaan Farms Logo"
            fill
            className="object-contain"
            priority
          />
          <motion.div 
            animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-white/10 blur-2xl rounded-full"
          />
        </motion.div>

        {/* Brand Name (Accessible for SEO/A11y) */}
        <h1 className="sr-only">VIVAAN FARMS</h1>

        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          <div className="w-16 h-0.5 bg-white/40 mb-6 rounded-full" />
          <p className="text-white/80 text-[10px] md:text-sm font-black uppercase tracking-[4px] leading-relaxed">
            Traditional Wisdom <span className="mx-2 text-white/30">|</span> Modern Purity
          </p>
        </motion.div>
      </div>

      {/* Modern Loading Indicator */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-48">
        <div className="h-1 bg-white/10 w-full rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 3, ease: "easeInOut" }}
            className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)]"
          />
        </div>
        <p className="text-[8px] text-white/30 font-black uppercase tracking-[2px] mt-3 text-center animate-pulse">
          Harvesting Purity...
        </p>
      </div>
    </div>
  );
};
