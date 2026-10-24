"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface PantryCategoryIconsProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

export interface CategoryIconItem {
  id: string;
  label: string;
  fullLabel?: string;
  image: string;
  isPhoto: boolean;
  fallbackImage?: string;
}

export const CATEGORY_ICONS_DATA: CategoryIconItem[] = [
  {
    id: 'ghee',
    label: 'Ghee',
    image: '/images/categories/ghee.png',
    isPhoto: false,
  },
  {
    id: 'sweets',
    label: 'Sweets',
    image: '/images/categories/sweets.png',
    isPhoto: false,
  },
  {
    id: 'honey',
    label: 'Honey',
    image: '/images/categories/honey.png',
    isPhoto: false,
  },
  {
    id: 'combos',
    label: 'Combo',
    fullLabel: 'Combos',
    image: '/images/categories/combos.png',
    isPhoto: false,
  },
  {
    id: 'all',
    label: 'All',
    image: '/images/categories/all.png',
    isPhoto: false,
  },
];

export const PantryCategoryIcons: React.FC<PantryCategoryIconsProps> = ({
  selectedId,
  onSelect
}) => {
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const handleImageError = (id: string) => {
    setFailedImages(prev => ({ ...prev, [id]: true }));
  };

  return (
    <div className="w-full py-1 sm:py-3 mb-2 sm:mb-4">
      <div className="max-w-[1000px] mx-auto px-1 sm:px-2">
        <div className="flex items-center justify-center gap-3 sm:gap-6 md:gap-8 overflow-x-auto no-scrollbar py-1 px-1">
          {CATEGORY_ICONS_DATA.map((cat) => {
            const isSelected = selectedId === cat.id;
            const hasError = !!failedImages[cat.id];

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelect(cat.id)}
                className="w-[50px] sm:w-[68px] md:w-[76px] flex flex-col items-center gap-1 group cursor-pointer focus:outline-none shrink-0"
              >
                {/* Circular container matching reference screenshot */}
                <div
                  className={cn(
                    "w-[46px] h-[46px] sm:w-[58px] sm:h-[58px] md:w-[66px] md:h-[66px] rounded-full flex items-center justify-center transition-all duration-300 relative shrink-0 overflow-hidden",
                    isSelected
                      ? "ring-2 ring-[#0D3B2E] shadow-sm scale-105 bg-[#EAF2ED]"
                      : "bg-white hover:scale-105 shadow-2xs"
                  )}
                >
                  {!hasError ? (
                    <Image
                      src={cat.image}
                      alt={cat.fullLabel || cat.label}
                      width={66}
                      height={66}
                      unoptimized
                      priority
                      onError={() => handleImageError(cat.id)}
                      className={cn(
                        "w-full h-full select-none pointer-events-none transition-transform duration-300 group-hover:scale-105",
                        cat.isPhoto ? "object-cover rounded-full" : "object-contain p-0.5"
                      )}
                    />
                  ) : cat.fallbackImage ? (
                    <Image
                      src={cat.fallbackImage}
                      alt={cat.fullLabel || cat.label}
                      width={66}
                      height={66}
                      unoptimized
                      className="w-full h-full object-cover rounded-full select-none pointer-events-none"
                    />
                  ) : (
                    /* Inline fallback vector if asset missing */
                    <div className="w-full h-full rounded-full border border-[#0D3B2E]/30 flex items-center justify-center bg-emerald-50 text-[#0D3B2E] text-xs font-serif font-black">
                      {cat.label.slice(0, 2)}
                    </div>
                  )}
                </div>

                {/* Text Label Underneath */}
                <span
                  className={cn(
                    "text-[10px] sm:text-xs md:text-sm font-serif font-bold tracking-tight text-center truncate max-w-full leading-tight transition-colors duration-200",
                    isSelected
                      ? "text-[#0D3B2E] font-black"
                      : "text-[#2A231C] group-hover:text-[#0D3B2E]"
                  )}
                >
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};


