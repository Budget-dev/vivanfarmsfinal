"use client";

import React from 'react';
import Image from 'next/image';

interface FarmJourneySectionProps {
  upperWaveColor?: string;
  lowerWaveColor?: string;
}

export const FarmJourneySection: React.FC<FarmJourneySectionProps> = ({
  upperWaveColor = "text-[#E8F4F8]",
  lowerWaveColor = "text-white"
}) => {
  const steps = [
    { num: 1, title: "Milk", desc: "Fresh milk harvested ethically from free-grazing buffaloes & indigenous cows" },
    { num: 2, title: "Micro-Unit", desc: "Crafted in small village units using traditional earthen pots & wooden bilona" },
    { num: 3, title: "Ware House", desc: "Tested twice for 100% purity & packed in airtight, sterilized glass jars" },
    { num: 4, title: "Dispatch", desc: "Fast express direct doorstep delivery in 14 days from milking" },
  ];

  return (
    <section className="relative w-full bg-[#FAF6EE] pt-12 pb-14 sm:pt-16 sm:pb-20 md:pt-20 md:pb-28 overflow-hidden select-none border-none">
      
      {/* ── Upper Wave Transition (Seamless organic transition from section above) ── */}
      <div className="absolute top-0 left-0 w-full overflow-hidden leading-none z-10 pointer-events-none -mt-px">
        <svg 
          viewBox="0 0 1440 96" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg" 
          className={`w-full h-8 sm:h-14 md:h-20 lg:h-24 ${upperWaveColor}`}
          preserveAspectRatio="none"
        >
          <path 
            d="M0,0 L1440,0 L1440,30 C1200,85 960,10 720,50 C480,90 240,15 0,65 Z" 
            fill="currentColor" 
          />
        </svg>
      </div>

      {/* ── Lower Wave Transition (Seamless organic transition to section below) ── */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-10 pointer-events-none -mb-px">
        <svg 
          viewBox="0 0 1440 96" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg" 
          className={`w-full h-8 sm:h-14 md:h-20 lg:h-24 ${lowerWaveColor}`}
          preserveAspectRatio="none"
        >
          <path 
            d="M0,96 L1440,96 L1440,65 C1200,15 960,85 720,45 C480,10 240,80 0,30 Z" 
            fill="currentColor" 
          />
        </svg>
      </div>

      <div className="w-full relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-6 sm:mb-8 md:mb-10 px-4 max-w-[1440px] mx-auto">
          <p className="text-[10px] sm:text-xs font-black text-[#6B5A45] tracking-[2.5px] uppercase mb-1 sm:mb-1.5">
            Farm to Kitchen Transparency
          </p>
          <h2 className="font-serif text-2xl sm:text-4xl md:text-5xl font-extrabold text-[#113B29] tracking-tight">
            From Our Farmers’<br className="sm:hidden" /> To Your Kitchen
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-[#5A4D3B] font-bold mt-2 sm:mt-2.5">
            In Just 14 Days
          </p>
          <div className="w-12 sm:w-16 h-0.5 bg-[#113B29]/20 mx-auto mt-2 rounded-full" />
        </div>

        {/* Full-Width Journey Map Graphic (Edge-to-Edge on Mobile & Desktop, Zero Borders) */}
        <div className="w-full px-0 mx-0 mb-6 sm:mb-8 md:mb-10 border-none">
          <div className="relative w-full aspect-[1376/768] overflow-hidden rounded-none shadow-none border-none bg-[#FAF6EE]">
            <Image 
              src="/products/buffalo-ghee/journey_map.jpg"
              alt="From Our Farmers To Your Kitchen 14 Day Journey"
              fill
              className="object-cover object-center w-full h-full"
              sizes="100vw"
              priority
            />
          </div>
        </div>

        {/* 4 Step Milestones (Full-Width Responsive Grid, Borderless Soft Cards) */}
        <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
            {steps.map((st) => (
              <div 
                key={st.num}
                className="bg-white/95 backdrop-blur-xs rounded-2xl p-3.5 sm:p-5 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between"
              >
                <div className="flex items-center gap-2 sm:gap-2.5 mb-2 sm:mb-3">
                  <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#E76F51] text-white font-black text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-2xs">
                    {st.num}
                  </span>
                  <span className="font-serif font-extrabold text-xs sm:text-base text-[#113B29] truncate">
                    {st.title}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs md:text-sm text-gray-600 font-medium leading-relaxed">
                  {st.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
