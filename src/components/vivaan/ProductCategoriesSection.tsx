"use client";

import React from 'react';
import { ArrowRight } from 'lucide-react';

interface ProductCategoriesSectionProps {
  onSelectCategory: (categoryId: string) => void;
  onViewAll?: () => void;
}

const CATEGORIES_DATA = [
  {
    id: 'ghee',
    title: 'Vedic A2 Ghee',
    subtitle: 'Bilona Churned',
    emoji: '🏺',
    colorBg: 'from-[#DF9F3D] to-[#C98A28]'
  },
  {
    id: 'sweets',
    title: 'Farm Sweets',
    subtitle: 'A2 Ghee & Jaggery',
    emoji: '🍬',
    colorBg: 'from-[#E5A844] to-[#C98A28]'
  }
];

export const ProductCategoriesSection: React.FC<ProductCategoriesSectionProps> = ({
  onSelectCategory,
  onViewAll
}) => {
  return (
    <section className="py-8 sm:py-12 bg-[#F9F6EF] border-b border-[#EAE3D2] relative overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10">
        
        {/* Header with Title and View All */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-headline text-xl sm:text-2xl md:text-3xl font-extrabold text-[#C85A32] tracking-tight">
            Product Categories
          </h2>
          <button
            onClick={onViewAll}
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-black text-[#0D3520] hover:text-[#C85A32] transition-colors uppercase tracking-wider underline decoration-2 underline-offset-4"
          >
            <span>view all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Horizontal Category Cards Row matching screenshot */}
        <div className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto no-scrollbar pb-3 px-1">
          {CATEGORIES_DATA.map((cat) => (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className="w-[140px] sm:w-[170px] md:w-[200px] shrink-0 rounded-2xl p-4 sm:p-5 flex flex-col justify-between items-center text-center cursor-pointer transition-all duration-300 hover:scale-[1.03] active:scale-95 shadow-sm hover:shadow-md bg-gradient-to-br from-[#E2A645] to-[#C88924] text-white border border-[#D1922E]"
            >
              {/* Category Emoji / Icon */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-2xl sm:text-3xl shadow-inner mb-3">
                {cat.emoji}
              </div>

              {/* Title & Subtitle */}
              <div>
                <h3 className="font-headline font-black text-sm sm:text-base leading-tight drop-shadow-xs">
                  {cat.title}
                </h3>
                <p className="text-[10px] sm:text-xs text-white/80 font-bold uppercase tracking-wider mt-1">
                  {cat.subtitle}
                </p>
              </div>

              {/* Explore Indicator */}
              <div className="mt-3 text-[10px] sm:text-xs font-black bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full uppercase tracking-wider">
                Explore →
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
