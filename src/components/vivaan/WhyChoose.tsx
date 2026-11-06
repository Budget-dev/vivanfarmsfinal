"use client";

import React from 'react';
import { Tractor, Sparkles, ShieldCheck, GlassWater } from 'lucide-react';

const PILLARS = [
  {
    icon: <Tractor className="w-8 h-8 sm:w-10 sm:h-10 text-[#0D3520]" />,
    title: "Direct From Farms",
    desc: "Pure farm-fresh harvest and dairy delivered directly from our farm to your home."
  },
  {
    icon: (
      <svg width="40" height="40" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#0D3520] w-8 h-8 sm:w-10 sm:h-10">
        <path d="M32 8V56M16 24C16 24 20 52 32 52C44 52 48 24 48 24M12 16H52" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M24 16V8M40 16V8" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
      </svg>
    ),
    title: "Traditional Method",
    desc: "Ancient Vedic Bilona curd-churning and cold wood-pressed extraction."
  },
  {
    icon: <ShieldCheck className="w-8 h-8 sm:w-10 sm:h-10 text-[#0D3520]" />,
    title: "100% Pure & Safe",
    desc: "Certified purity with zero chemicals, zero palm oil, and zero preservatives."
  },
  {
    icon: <GlassWater className="w-8 h-8 sm:w-10 sm:h-10 text-[#0D3520]" />,
    title: "Eco-Friendly Glass",
    desc: "Food-grade non-toxic glass packaging preserving authentic aroma and nutrition."
  }
];

export const WhyChoose: React.FC = () => {
  return (
    <section className="py-8 sm:py-14 bg-white border-b border-[#EAE3D2]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-10">
        
        {/* Section Heading matching Reference Screenshot */}
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="font-headline text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#C85A32] tracking-tight">
            Why Choose Us on Organic Farms?
          </h2>
          <div className="w-12 h-0.5 bg-[#C85A32]/30 mx-auto mt-2 rounded-full" />
        </div>

        {/* 2x2 Grid on Mobile, 4-Cols on Desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
          {PILLARS.map((pillar, i) => (
            <div 
              key={i} 
              className="bg-[#FAF7F0] p-4 sm:p-6 rounded-2xl border border-[#EAE3D2] flex flex-col items-center text-center transition-all duration-300 hover:shadow-md hover:border-[#0D3520]/20 group"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white border border-[#E0D7C5] flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300 shadow-xs">
                {pillar.icon}
              </div>
              <h3 className="font-headline text-sm sm:text-base font-extrabold text-[#0D3520] mb-1.5 leading-snug">
                {pillar.title}
              </h3>
              <p className="text-[11px] sm:text-xs text-[#5C4524] font-medium leading-relaxed">
                {pillar.desc}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
