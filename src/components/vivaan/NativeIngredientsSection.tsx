"use client";

import React, { useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAutoScroll } from '@/hooks/use-auto-scroll';

const NATIVE_CARDS = [
  {
    title: "From Native Geographies",
    subtitle: "to Ideal Growing Seasons",
    desc: "We take care of every factor when sourcing authentic local heirloom ingredients.",
    image: "/images/native/native_geographies.jpg",
    fallback: "/images/home/hero_lifestyle.jpg"
  },
  {
    title: "What Do We Look For?",
    subtitle: "Nutrition over Cost",
    desc: "Not high yield. Not lower cost. Just pure authentic flavour, nutrition, and soul.",
    image: "/images/native/nutrition_over_cost.jpg",
    fallback: "/images/products/mustard_oil.jpg"
  },
  {
    title: "Impurities, Out.",
    subtitle: "Goodness, In.",
    desc: "Slow wood-pressing under 40°C to preserve vital enzymes and natural aroma.",
    image: "/images/native/impurities_out_goodness_in.jpg",
    fallback: "/images/home/bilona_blog.jpg"
  },
  {
    title: "A2 Milk from Desi Cows",
    subtitle: "Grass-Fed & Cruelty Free",
    desc: "Pure native Gir cows and Murrah buffaloes raised with ethical, calf-first care.",
    image: "/images/native/a2_desi_cows.jpg",
    fallback: "/images/home/trust_pastoral_farm.jpg"
  }
];

export const NativeIngredientsSection: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { pause: pauseAutoScroll } = useAutoScroll(scrollRef, {
    interval: 3500,
    resumeDelay: 3000
  });

  const scroll = (direction: 'left' | 'right') => {
    pauseAutoScroll();
    if (scrollRef.current) {
      const offset = direction === 'left' ? -280 : 280;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Repeated list for continuous, seamless loop-around on wide displays
  const displayCards = [...NATIVE_CARDS, ...NATIVE_CARDS];

  return (
    <section className="py-8 sm:py-12 md:py-20 bg-[#F9F5EC] border-b border-[#EAE3D2] relative select-none">
      <div className="max-w-[1440px] mx-auto px-3 sm:px-8 lg:px-12">
        
        {/* Title */}
        <div className="text-center mb-6 sm:mb-10 md:mb-14">
          <h2 className="font-serif text-xl sm:text-3xl md:text-5xl font-extrabold text-[#0D3B2E] tracking-tight">
            Native Ingredients. No Substitutes.
          </h2>
          <div className="w-16 sm:w-20 h-0.5 bg-[#0D3B2E]/25 mx-auto mt-2 sm:mt-3 rounded-full" />
        </div>

        {/* Horizontal Auto-Scrolling Carousel */}
        <div className="relative group/carousel">
          {/* Left Arrow Button */}
          <button
            type="button"
            onClick={() => scroll('left')}
            className="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center text-[#0D3B2E] hover:bg-[#0D3B2E] hover:text-white transition-all cursor-pointer opacity-90 hover:opacity-100"
            aria-label="Previous card"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Right Arrow Button */}
          <button
            type="button"
            onClick={() => scroll('right')}
            className="absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center text-[#0D3B2E] hover:bg-[#0D3B2E] hover:text-white transition-all cursor-pointer opacity-90 hover:opacity-100"
            aria-label="Next card"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Horizontal Scroll Row */}
          <div
            ref={scrollRef}
            className="flex items-stretch gap-3 sm:gap-5 md:gap-6 overflow-x-auto no-scrollbar scroll-smooth pb-3 px-1"
          >
            {displayCards.map((card, idx) => (
              <div
                key={idx}
                className={cn(
                  "relative w-[210px] sm:w-[260px] md:w-[300px] shrink-0 aspect-[3/4] sm:aspect-[4/5] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs sm:shadow-md hover:shadow-2xl transition-all duration-500 group bg-stone-900 border border-[#E0D7C5] cursor-pointer"
                )}
              >
                {/* Background Image */}
                <Image
                  src={card.image || card.fallback}
                  alt={card.title}
                  fill
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  sizes="(max-width: 640px) 210px, (max-width: 1024px) 260px, 300px"
                />

                {/* Gradient Scrim */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                {/* Content Overlay */}
                <div className="absolute inset-0 p-3 sm:p-6 flex flex-col justify-end text-white">
                  <span className="text-[8px] sm:text-[11px] font-black tracking-wider sm:tracking-widest text-[#F8D279] uppercase mb-0.5 sm:mb-1 line-clamp-1">
                    {card.subtitle}
                  </span>
                  <h3 className="font-serif text-xs sm:text-lg md:text-xl font-bold leading-tight sm:leading-snug mb-1 sm:mb-2 text-white line-clamp-2">
                    {card.title}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-white/80 leading-tight sm:leading-relaxed font-normal line-clamp-2 sm:line-clamp-none">
                    {card.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
