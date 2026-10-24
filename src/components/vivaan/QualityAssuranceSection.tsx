"use client";

import React, { useRef } from 'react';
import Image from 'next/image';
import { ArrowUpRight, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const QUALITY_CARDS = [
  {
    title: "In-House Lab Testing Exceeding FSSAI Parameters",
    desc: "Rigorous analytical testing for fatty acid profile, moisture, and absolute absence of adulterants.",
    image: "/images/home/lab_testing_scientists.jpg",
    tag: "FSSAI & NABL Compliant"
  },
  {
    title: "We Quality Check Every Single Batch",
    desc: "Every single lot undergoes dual microscopic and sensory evaluation before bottling.",
    image: "/images/home/lab_microscope_analyst.jpg",
    tag: "Batch-by-Batch Audit"
  },
  {
    title: "Purity & Quality Guaranteed",
    desc: "Zero chemical solvent extraction, zero paraffin, and zero artificial aroma enhancers.",
    image: "/images/home/lab_purity_pipette.jpg",
    tag: "100% Zero Chemicals"
  },
  {
    title: "Lab Reports: Don't Just Trust Us",
    desc: "Every batch report is publicly accessible. Scan the QR on your bottle to verify real-time purity.",
    image: "/images/home/lab_quality_report.jpg",
    tag: "Public Verification"
  },
  {
    title: "Zero Heavy Metals & Pesticide Free",
    desc: "Certified free of lead, mercury, glyphosate, and harmful organophosphate residues.",
    image: "/images/home/lab_testing_scientists.jpg",
    tag: "Toxin Screened"
  },
  {
    title: "Vedic Bilona & Cold Extraction Verification",
    desc: "Spectroscopic temperature checks ensure processing strictly below 40°C to preserve bioactive nutrients.",
    image: "/images/home/lab_purity_pipette.jpg",
    tag: "< 40°C Certified"
  }
];

export const QualityAssuranceSection: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -300 : 300;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-8 sm:py-12 md:py-20 bg-[#E8F4F8] relative select-none">
      <div className="max-w-[1440px] mx-auto px-3 sm:px-8 lg:px-12">
        
        {/* Title */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6 sm:mb-10">
          <div className="text-center sm:text-left">
            <p className="text-[10px] sm:text-sm font-black text-[#1A4E5F] tracking-[2.5px] uppercase mb-1">
              Zero Compromise Standard
            </p>
            <h2 className="font-serif text-xl sm:text-3xl md:text-5xl font-extrabold text-[#0D3B2E] tracking-tight">
              Only Perfect Makes The Cut
            </h2>
            <div className="w-16 sm:w-20 h-0.5 bg-[#0D3B2E]/25 mt-2 rounded-full mx-auto sm:mx-0" />
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 border border-[#D2E7ED] text-xs font-bold text-[#1A4E5F]">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              NABL Certified Tests
            </span>
          </div>
        </div>

        {/* Swipeable Carousel Container with Left/Right Arrows */}
        <div className="relative group/carousel">
          {/* Left Arrow */}
          <button
            type="button"
            onClick={() => scroll('left')}
            className="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center text-[#0D3B2E] hover:bg-[#0D3B2E] hover:text-white transition-all cursor-pointer opacity-90 hover:opacity-100"
            aria-label="Previous lab images"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Right Arrow */}
          <button
            type="button"
            onClick={() => scroll('right')}
            className="absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center text-[#0D3B2E] hover:bg-[#0D3B2E] hover:text-white transition-all cursor-pointer opacity-90 hover:opacity-100"
            aria-label="Next lab images"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Horizontal Swipeable Cards Row */}
          <div
            ref={scrollRef}
            className="flex items-stretch gap-3 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth pb-3 px-1"
          >
            {QUALITY_CARDS.map((card, idx) => {
              return (
                <div
                  key={idx}
                  className="w-[220px] sm:w-[280px] md:w-[320px] shrink-0 bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-xs sm:shadow-sm hover:shadow-xl transition-all duration-300 border border-[#D2E7ED] group flex flex-col justify-between"
                >
                  {/* Image */}
                  <div className="relative w-full aspect-[16/10] sm:aspect-[4/3] overflow-hidden bg-slate-100">
                    <span className="absolute top-2 left-2 z-10 bg-[#0D3B2E]/90 backdrop-blur-xs text-white text-[8px] sm:text-[9px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider">
                      {card.tag}
                    </span>
                    <Image
                      src={card.image}
                      alt={card.title}
                      fill
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 220px, 320px"
                    />
                  </div>

                  {/* Text */}
                  <div className="p-3 sm:p-5 flex flex-col flex-1 justify-between gap-2">
                    <div>
                      <h3 className="font-serif text-xs sm:text-base font-bold text-gray-900 group-hover:text-[#0D3B2E] transition-colors leading-tight sm:leading-snug mb-1 sm:mb-2 line-clamp-2">
                        {card.title}
                      </h3>
                      <p className="text-[10px] sm:text-xs text-gray-600 leading-tight sm:leading-relaxed font-normal line-clamp-3">
                        {card.desc}
                      </p>
                    </div>

                    <div className="pt-2 sm:pt-3 border-t border-gray-100 flex items-center justify-between text-[9px] sm:text-xs font-bold text-[#0D3B2E] mt-auto">
                      <span className="truncate">View Verified Parameters</span>
                      <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
};
