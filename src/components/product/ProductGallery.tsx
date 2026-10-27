"use client";

import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { Heart, Share2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export const BUFFALO_GHEE_IMAGES: string[] = ['/images/products/ghee_tin.jpg'];

interface ProductGalleryProps {
  images?: string[];
  activeImageIndex: number;
  onSelectImage: (index: number) => void;
  productName: string;
  discountPercent?: number;
  isWishlisted: boolean;
  onToggleWishlist: () => void;
  onShare: () => void;
  onOpenLightbox: () => void;
  category?: string;
  price?: number;
  onAddToCart?: () => void;
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({
  images,
  activeImageIndex,
  onSelectImage,
  productName,
  discountPercent = 0,
  isWishlisted,
  onToggleWishlist,
  onShare,
  onOpenLightbox,
  category = 'ghee',
  price = 1099,
  onAddToCart,
}) => {
  const displayImages = images && images.length > 0 && images.some(img => !!img) 
    ? images.filter(Boolean) 
    : ['/images/products/ghee_tin.jpg'];

  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);
  const thumbnailScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeImageIndex >= 0 && activeImageIndex < displayImages.length) {
      setCurrentIndex(activeImageIndex);
    }
  }, [activeImageIndex, displayImages.length]);

  const selectImage = (index: number) => {
    const safeIndex = Math.max(0, Math.min(index, displayImages.length - 1));
    setCurrentIndex(safeIndex);
    onSelectImage(safeIndex);

    // Scroll thumbnail into view
    if (thumbnailScrollRef.current) {
      const thumbs = thumbnailScrollRef.current.children;
      if (thumbs[safeIndex]) {
        (thumbs[safeIndex] as HTMLElement).scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  };

  const handlePrev = () => {
    selectImage((currentIndex - 1 + displayImages.length) % displayImages.length);
  };

  const handleNext = () => {
    selectImage((currentIndex + 1) % displayImages.length);
  };

  // Touch swipe handling for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartXRef.current || !touchEndXRef.current) return;
    const distance = touchStartXRef.current - touchEndXRef.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }

    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  return (
    <div className="w-full">
      
      {/* ── MOBILE VIEW (< 768px): Single Hero + Scrollable Thumbnails + Quick Add Bar ── */}
      <div className="md:hidden flex flex-col">
        {/* Main Swipeable Image Container */}
        <div 
          className="relative w-full aspect-square bg-[#FAF7F2] rounded-2xl overflow-hidden shadow-xs border border-[#E9DFCF]"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Zoom button on top-left matching reference screenshot */}
          <button 
            type="button"
            onClick={onOpenLightbox}
            className="absolute top-3 left-3 z-20 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 shadow-sm flex items-center justify-center text-gray-700 hover:text-black cursor-pointer active:scale-90 transition-transform"
            aria-label="Zoom image"
          >
            <Search className="w-4 h-4 stroke-[2.2]" />
          </button>

          {/* Wishlist & Share buttons on top-right */}
          <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
            <button 
              type="button"
              onClick={onToggleWishlist}
              className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-xs text-gray-700 hover:text-red-500 transition-all border border-gray-200 cursor-pointer active:scale-90"
              title="Add to Wishlist"
              aria-label="Wishlist"
            >
              <Heart className={cn("w-4 h-4 transition-colors", isWishlisted && "fill-red-500 text-red-500")} />
            </button>
            <button 
              type="button"
              onClick={onShare}
              className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-xs text-gray-700 transition-all border border-gray-200 cursor-pointer active:scale-90"
              title="Share"
              aria-label="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          {/* Active Image */}
          <div 
            className="w-full h-full relative cursor-zoom-in"
            onClick={onOpenLightbox}
          >
            <Image 
              src={displayImages[currentIndex]} 
              alt={`${productName} view ${currentIndex + 1}`} 
              fill 
              className="object-cover select-none"
              priority
              sizes="100vw"
            />
          </div>

          {/* Counter pill */}
          <div className="absolute bottom-2.5 right-2.5 z-10 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            {currentIndex + 1} / {displayImages.length}
          </div>
        </div>

        {/* Thumbnails Row with Nav Buttons */}
        <div className="relative mt-3 flex items-center">
          {/* Left Arrow Button (Matching Orange Reference Button) */}
          <button 
            type="button"
            onClick={handlePrev}
            className="absolute -left-1 z-10 w-7 h-7 rounded-full bg-[#E76F51] text-white flex items-center justify-center shadow-md active:scale-90 transition-transform cursor-pointer"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Scrollable Thumbnails list */}
          <div 
            ref={thumbnailScrollRef}
            className="flex gap-2 overflow-x-auto no-scrollbar py-1 px-7 w-full scroll-smooth"
          >
            {displayImages.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => selectImage(i)}
                className={cn(
                  "relative w-14 h-14 sm:w-20 sm:h-20 shrink-0 rounded-lg sm:rounded-xl overflow-hidden border-2 transition-all cursor-pointer shadow-xs",
                  currentIndex === i 
                    ? "border-[#0D3B2E] ring-2 ring-[#0D3B2E]/20 scale-[1.02]" 
                    : "border-[#E5DCD0] opacity-80 hover:opacity-100"
                )}
                aria-label={`Select image ${i + 1}`}
              >
                <Image 
                  src={img} 
                  alt="" 
                  fill 
                  className="object-cover" 
                  sizes="(max-width: 768px) 56px, 80px"
                />
              </button>
            ))}
          </div>

          {/* Right Arrow Button */}
          <button 
            type="button"
            onClick={handleNext}
            className="absolute -right-1 z-10 w-7 h-7 rounded-full bg-[#E76F51] text-white flex items-center justify-center shadow-md active:scale-90 transition-transform cursor-pointer"
            aria-label="Next image"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Quick link to 9:16 Instagram Reel below mobile gallery */}
        <div className="mt-2.5">
          <a
            href="#product-reels"
            className="w-full py-2 px-3.5 rounded-xl bg-gradient-to-r from-[#FDF9F3] via-white to-[#FDF9F3] border border-[#E9DFCF] flex items-center justify-between text-xs font-bold text-[#100C06] hover:border-[#833AB4]/40 transition-all shadow-2xs group"
          >
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white flex items-center justify-center text-[9px] shadow-xs group-hover:scale-110 transition-transform">
                ▶
              </span>
              <span className="font-extrabold text-[#111827] tracking-tight">Watch 9:16 Instagram Reel</span>
            </div>
            <span className="text-[10px] font-semibold text-[#833AB4] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
              Behind The Scenes →
            </span>
          </a>
        </div>
      </div>

      {/* ── DESKTOP & TABLET VIEW (>= 768px): Hero Image + 2-Column Infographic Grid ── */}
      <div className="hidden md:flex flex-col gap-6">
        
        {/* Main Hero Shot */}
        <div 
          onClick={onOpenLightbox}
          className="w-full relative aspect-square rounded-2xl border border-[#E9DFCF] overflow-hidden shadow-xs hover:shadow-md transition-all group flex items-center justify-center cursor-zoom-in bg-[#FAF7F2]"
        >
          {/* Zoom button on top-left matching reference screenshot */}
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); onOpenLightbox(); }}
            className="absolute top-4 left-4 z-20 w-9 h-9 rounded-full bg-white/95 backdrop-blur-sm border border-gray-200 shadow-sm flex items-center justify-center text-gray-700 hover:text-black cursor-pointer group-hover:scale-110 transition-transform"
            aria-label="Zoom image"
          >
            <Search className="w-4 h-4 stroke-[2.2]" />
          </button>

          {/* Action buttons on top-right */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); onToggleWishlist(); }}
              className="w-9 h-9 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-xs text-gray-700 hover:text-red-500 transition-all border border-gray-200 cursor-pointer active:scale-90"
              title="Add to Wishlist"
              aria-label="Wishlist"
            >
              <Heart className={cn("w-4 h-4 transition-colors", isWishlisted && "fill-red-500 text-red-500")} />
            </button>
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); onShare(); }}
              className="w-9 h-9 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-xs text-gray-700 transition-all border border-gray-200 cursor-pointer active:scale-90"
              title="Share"
              aria-label="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          <Image 
            src={displayImages[0]} 
            alt={`${productName} hero view`} 
            fill 
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02] select-none"
            priority
            sizes="(max-width: 989px) 450px, 660px"
          />
        </div>

        {/* 2-Column Grid of High-Res Infographics (Matching reference_desktop.png left column) */}
        <div className="grid grid-cols-2 gap-4">
          {displayImages.slice(1).map((img, index) => {
            const actualIndex = index + 1;
            return (
              <div 
                key={actualIndex}
                onClick={() => {
                  onSelectImage(actualIndex);
                  onOpenLightbox();
                }}
                className="w-full relative aspect-square rounded-2xl border border-[#E9DFCF] overflow-hidden shadow-xs hover:shadow-md transition-all group flex items-center justify-center cursor-zoom-in bg-[#FAF7F2]"
              >
                {/* Zoom button on top-left */}
                <button 
                  type="button"
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    onSelectImage(actualIndex);
                    onOpenLightbox(); 
                  }}
                  className="absolute top-3 left-3 z-20 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 shadow-sm flex items-center justify-center text-gray-700 hover:text-black cursor-pointer group-hover:scale-110 transition-transform"
                  aria-label="Zoom image"
                >
                  <Search className="w-3.5 h-3.5 stroke-[2.2]" />
                </button>

                <Image 
                  src={img} 
                  alt={`${productName} infographic ${actualIndex}`} 
                  fill 
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.02] select-none"
                  sizes="(max-width: 989px) 220px, 320px"
                />
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
};
