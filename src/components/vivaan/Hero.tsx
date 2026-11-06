"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Truck, Tag, Award, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

const HERO_SLIDES = [
  {
    id: 'hero-farm-lifestyle',
    url: '/images/home/hero_lifestyle.jpg',
    alt: 'Vivaan Farms - Pure A2 Vedic Ghee, Raw Honey & Wood-Pressed Oils',
    subtitle: 'Cold Pressed Oils & Pure Vedic Ghee',
    highlight: 'Farm-Fresh to your doorstep'
  },
  {
    id: 'hero-bilona-curd',
    url: '/images/home/bilona_blog.jpg',
    alt: 'Vivaan Farms - Traditional Vedic Bilona Method',
    subtitle: '100% Traditional Vedic Bilona Method',
    highlight: 'Hand-Churned from Cultured Curd'
  },
  {
    id: 'hero-banner-farm',
    url: 'https://vivanfa.sirv.com/ChatGPT%20Image%20Sep%208%2C%202026%2C%2008_07_53%20AM.png',
    alt: 'Vivaan Farms - Sustainable Organic Dairy & Farm Goods',
    subtitle: 'Pure Farm Fresh Buffalo Milk & Traditional Goods',
    highlight: 'Natural Products Directly From Farm'
  }
];

export const Hero: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % HERO_SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  }, []);

  useEffect(() => {
    const interval = setInterval(nextSlide, 6000);
    return () => clearInterval(interval);
  }, [nextSlide]);

  return (
    <section className="w-full bg-[#F9F6EF] px-0 relative overflow-hidden select-none">
      {/* Top Tagline & Promo Badges Header matching reference */}
      <div className="bg-[#FAF7F0] border-b border-[#EAE3D2] py-2.5 px-3 md:px-6 text-center">
        <h1 className="text-xs sm:text-sm md:text-base font-extrabold text-[#0D3520] tracking-wide uppercase">
          Cold Pressed Oils & Pure Vedic Ghee <span className="text-[#C85A32] font-black">|</span> Farm-Fresh to your doorstep
        </h1>
        
        {/* Promotional Badges Strip */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 md:gap-4 mt-2 flex-wrap text-[10px] sm:text-xs">
          <div className="inline-flex items-center gap-1 bg-[#E8F3EC] text-[#0D3520] font-black px-2.5 py-1 rounded-full border border-[#0D3520]/20 shadow-xs">
            <Truck className="w-3.5 h-3.5 text-[#1B5E3B]" />
            <span>Free Shipping ₹999+</span>
          </div>

          <div className="inline-flex items-center gap-1 bg-[#FFF4E5] text-[#C85A32] font-black px-2.5 py-1 rounded-full border border-[#C85A32]/25 shadow-xs">
            <Tag className="w-3.5 h-3.5 text-[#C85A32]" />
            <span>₹100 OFF: <span className="font-mono text-[#0D3520]">VIVAAN100</span></span>
          </div>

          <div className="inline-flex items-center gap-1 bg-[#F9F1DC] text-[#7A5B0B] font-black px-2.5 py-1 rounded-full border border-[#DF9F3D]/30 shadow-xs">
            <Award className="w-3.5 h-3.5 text-[#C48B47]" />
            <span>12% Off Member Club</span>
          </div>
        </div>
      </div>

      {/* Hero Visual Area with High Clarity Lifestyle Image */}
      <div className="relative w-full aspect-[16/9] sm:aspect-[16/8] md:aspect-[2.4/1] overflow-hidden shadow-sm bg-[#F9F6EF]">
        {HERO_SLIDES.map((slide, index) => {
          const isActive = index === currentIndex;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <Image
                src={slide.url}
                alt={slide.alt}
                fill
                priority={index === 0}
                loading={index === 0 ? "eager" : "lazy"}
                sizes="100vw"
                className="object-cover object-center w-full h-full"
                referrerPolicy="no-referrer"
              />
              {/* Soft subtle gradient to enhance contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />

              {/* In-Slide Floating Pill Label */}
              <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 z-20 max-w-[85%] text-white">
                <span className="inline-flex items-center gap-1 text-[9px] sm:text-xs font-black uppercase tracking-wider bg-[#0D3520]/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[#E8F3EC] border border-white/20">
                  <Sparkles className="w-3 h-3 text-[#F5D110]" />
                  {slide.subtitle}
                </span>
                <p className="text-sm sm:text-xl md:text-2xl font-black drop-shadow-md text-white mt-1">
                  {slide.highlight}
                </p>
              </div>
            </div>
          );
        })}

        {/* Carousel Arrow Controls */}
        <button
          onClick={prevSlide}
          aria-label="Previous Slide"
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white/70 hover:bg-white text-[#0D3520] flex items-center justify-center backdrop-blur-xs transition-all shadow-sm active:scale-95"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <button
          onClick={nextSlide}
          aria-label="Next Slide"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white/70 hover:bg-white text-[#0D3520] flex items-center justify-center backdrop-blur-xs transition-all shadow-sm active:scale-95"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Navigation Indicator Dots */}
        <div className="absolute bottom-2 right-4 z-20 flex items-center gap-1.5 bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full">
          {HERO_SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
