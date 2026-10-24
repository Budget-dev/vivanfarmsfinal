"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface FestiveHeroProps {
  onShopClick?: () => void;
}

const BANNER_SLIDES = [
  {
    id: 'banner-1',
    url: 'https://vivanfa.sirv.com/ChatGPT%20Image%20Sep%208%2C%202026%2C%2008_07_57%20AM.png',
    alt: 'Vivaan Farms - Traditional Vedic Ghee & Natural Farm Produce',
  },
  {
    id: 'banner-2',
    url: 'https://vivanfa.sirv.com/ChatGPT%20Image%20Sep%208%2C%202026%2C%2008_07_53%20AM.png',
    alt: 'Vivaan Farms - Wood Pressed Oils & Pure Vedic Bilona Ghee',
  },
  {
    id: 'banner-3',
    url: 'https://vivanfa.sirv.com/ChatGPT%20Image%20Sep%208%2C%202026%2C%2008_08_08%20AM.png',
    alt: 'Vivaan Farms - Pure Organic Harvest Direct From Gujarat Pastures',
  },
];

export const FestiveHero: React.FC<FestiveHeroProps> = ({ onShopClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchDeltaXRef = useRef<number>(0);
  const isSwipingRef = useRef<boolean>(false);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % BANNER_SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + BANNER_SLIDES.length) % BANNER_SLIDES.length);
  }, []);

  // Auto-play timer
  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const scrollToPantry = () => {
    if (onShopClick) {
      onShopClick();
      return;
    }
    const el = document.getElementById('cleanest-pantry') || document.getElementById('top-picks');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Touch handlers for mobile swiping
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    touchDeltaXRef.current = 0;
    isSwipingRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = touchStartXRef.current - currentX;
    const diffY = touchStartYRef.current - currentY;

    // If horizontal movement is greater than vertical movement, mark as swiping
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
      isSwipingRef.current = true;
      touchDeltaXRef.current = diffX;
    }
  };

  const handleTouchEnd = () => {
    if (isSwipingRef.current) {
      if (touchDeltaXRef.current > 40) {
        nextSlide();
      } else if (touchDeltaXRef.current < -40) {
        prevSlide();
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    touchDeltaXRef.current = 0;
    // Keep isSwipingRef briefly true to avoid triggering immediate click
    setTimeout(() => {
      isSwipingRef.current = false;
    }, 50);
  };

  const handleClick = () => {
    if (isSwipingRef.current) return;
    scrollToPantry();
  };

  return (
    <section className="w-full relative select-none bg-[#F9F6EF] overflow-hidden group">
      {/* 
        Responsive 3-Banner Carousel:
        - Mobile (< md): 16:9 aspect ratio with touch swipe support
        - Desktop (>= md): 1983/793 aspect ratio with arrows & dots
      */}
      <div 
        className="relative w-full cursor-pointer overflow-hidden shadow-xs aspect-[1983/793] bg-[#F9F6EF]"
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Animated Horizontal Slide Container */}
        <div 
          className="flex w-full h-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {BANNER_SLIDES.map((slide, index) => (
            <div 
              key={slide.id} 
              className="w-full h-full shrink-0 relative overflow-hidden"
            >
              <Image
                src={slide.url}
                alt={slide.alt}
                fill
                priority={index === 0}
                sizes="100vw"
                className="object-cover w-full h-full"
              />
            </div>
          ))}
        </div>

        {/* Desktop Left Arrow Navigation */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            prevSlide();
          }}
          className="hidden md:flex absolute left-4 lg:left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/85 hover:bg-white text-[#0D3B2E] shadow-xl items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer hover:scale-110 active:scale-95"
          aria-label="Previous Slide"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Desktop Right Arrow Navigation */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            nextSlide();
          }}
          className="hidden md:flex absolute right-4 lg:right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/85 hover:bg-white text-[#0D3B2E] shadow-xl items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer hover:scale-110 active:scale-95"
          aria-label="Next Slide"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Bottom Dots Indicator */}
        <div className="absolute bottom-2.5 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2 bg-black/30 backdrop-blur-xs px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full">
          {BANNER_SLIDES.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              className={`transition-all duration-300 rounded-full cursor-pointer ${
                currentIndex === idx 
                  ? 'w-5 sm:w-7 h-1.5 sm:h-2 bg-[#F8D279] shadow-xs' 
                  : 'w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white/60 hover:bg-white'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
