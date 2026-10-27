"use client";

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { 
  Instagram, 
  Heart, 
  MessageCircle, 
  Share2, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  ShoppingBag, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight,
  Check,
  BadgeCheck
} from 'lucide-react';
import { Product } from '@/types';
import { cn } from '@/lib/utils';

interface ProductInstagramReelSectionProps {
  product: Product;
  onAddToCart?: () => void;
}

interface ReelItem {
  id: string;
  title: string;
  subtitle: string;
  videoUrl: string;
  posterUrl?: string;
  caption: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewsLabel: string;
  tag: string;
}

const DEFAULT_VIDEO_URL = "https://vivanfa.sirv.com/Firefly%20Create%20a%20cinematic%205-second%20square%20(1-1)%20premium%20food%20advertisement%20set%20in%20a%20warm%2C%20rustic%20ki.mp4";

export const ProductInstagramReelSection: React.FC<ProductInstagramReelSectionProps> = ({
  product,
  onAddToCart
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Curate 9:16 reels for this product - prioritized from admin configuration
  const reels: ReelItem[] = React.useMemo(() => {
    if (Array.isArray((product as any).reels) && (product as any).reels.length > 0) {
      return (product as any).reels.map((r: any, idx: number) => {
        // Ensure reel title matches product as requested by user
        const baseTitle = r.title || 'In Action';
        const prodName = product.name || 'Product';
        const reelTitle = baseTitle.toLowerCase().includes(prodName.toLowerCase()) 
          ? baseTitle 
          : `${prodName} — ${baseTitle}`;

        return {
          id: r.id || `reel-${idx}`,
          title: reelTitle,
          subtitle: r.subtitle || 'Farm Fresh & Authentic',
          videoUrl: r.videoUrl || product.videoUrl || DEFAULT_VIDEO_URL,
          posterUrl: r.posterUrl || product.imageUrls?.[idx % (product.imageUrls?.length || 1)] || '/images/products/ghee_tin.jpg',
          caption: r.caption || `Experience authentic farm-direct ${product.name}. 100% pure ingredients crafted with traditional love and care.`,
          likesCount: Number(r.likesCount) || (3500 + idx * 850),
          commentsCount: Number(r.commentsCount) || (120 + idx * 45),
          sharesCount: Number(r.sharesCount) || (250 + idx * 70),
          viewsLabel: r.viewsLabel || `${(18.5 + idx * 6.2).toFixed(1)}k`,
          tag: r.tag || product.name
        };
      });
    }

    const primaryImg = product.imageUrls?.[0] || '/images/products/ghee_tin.jpg';
    const prodName = product.name || 'A2 Desi Farm Product';

    return [
      {
        id: 'reel-1',
        title: `${prodName} — Sacred Process`,
        subtitle: 'Gujarat Organic Farm',
        videoUrl: product.videoUrl || DEFAULT_VIDEO_URL,
        posterUrl: primaryImg,
        caption: `Slow-crafted with pure dedication and authentic farm tradition. Experience the genuine nutrition and natural richness of ${prodName}! 🔥🌿`,
        likesCount: 4892,
        commentsCount: 184,
        sharesCount: 521,
        viewsLabel: '28.4k',
        tag: prodName
      },
      {
        id: 'reel-2',
        title: `${prodName} — Purity Tested`,
        subtitle: '100% Cruelty-Free',
        videoUrl: DEFAULT_VIDEO_URL,
        posterUrl: product.imageUrls?.[1] || primaryImg,
        caption: `Every batch of ${prodName} is double lab tested for 100% purity with zero artificial chemicals or adulteration. Certified farm fresh! 🌾🐄`,
        likesCount: 3640,
        commentsCount: 112,
        sharesCount: 389,
        viewsLabel: '19.7k',
        tag: prodName
      },
      {
        id: 'reel-3',
        title: `${prodName} — Kitchen Fresh`,
        subtitle: 'Unfiltered Goodness',
        videoUrl: DEFAULT_VIDEO_URL,
        posterUrl: product.imageUrls?.[2] || primaryImg,
        caption: `Hand-packed in food-grade packaging and delivered straight from our farm to your kitchen in record time. Pure heritage goodness for your family 💛✨`,
        likesCount: 6120,
        commentsCount: 265,
        sharesCount: 840,
        viewsLabel: '34.2k',
        tag: prodName
      }
    ];
  }, [product]);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  return (
    <section id="product-reels" className="w-full py-10 sm:py-14 bg-gradient-to-b from-[#FAF7F2] via-[#F4EFE6] to-[#FAF7F2] border-t border-b border-[#E9DFCF] overflow-hidden">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 md:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            {/* Instagram Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-[#833AB4]/10 via-[#FD1D1D]/10 to-[#F77737]/10 border border-[#DD2A7B]/30 mb-3">
              <span className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white flex items-center justify-center text-[11px] shadow-xs">
                <Instagram className="w-3 h-3 stroke-[2.2]" />
              </span>
              <span className="text-xs font-black uppercase tracking-wider bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] bg-clip-text text-transparent">
                Instagram Reels · 9:16 In Action
              </span>
            </div>

            <h2 className="font-serif font-black text-2xl sm:text-3xl md:text-4xl text-[#100C06] tracking-tight">
              Watch Our Vedic Process in 9:16
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1.5 max-w-xl">
              Real behind-the-scenes farm reels. See how our traditional Vedic Bilona method preserves rich golden granules, sacred aroma, and Ayurvedic goodness.
            </p>
          </div>

          {/* Social Follow CTA & Carousel Arrow Navigation */}
          <div className="flex items-center gap-3">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#E5DCD0] hover:border-[#DD2A7B] text-xs font-extrabold text-[#111827] hover:text-[#DD2A7B] shadow-2xs hover:shadow-xs transition-all cursor-pointer"
            >
              <Instagram className="w-4 h-4 text-[#DD2A7B]" />
              <span>Follow @vivaanfarms</span>
            </a>

            <div className="hidden sm:flex items-center gap-1.5">
              <button
                type="button"
                onClick={scrollLeft}
                className="w-9 h-9 rounded-full bg-white border border-[#E5DCD0] hover:bg-[#FAF7F2] text-gray-700 flex items-center justify-center shadow-2xs cursor-pointer active:scale-95 transition-all"
                aria-label="Previous reel"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={scrollRight}
                className="w-9 h-9 rounded-full bg-[#0D3B2E] text-white hover:bg-[#072B21] flex items-center justify-center shadow-xs cursor-pointer active:scale-95 transition-all"
                aria-label="Next reel"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Swipeable 9:16 Reels Container */}
        <div 
          ref={scrollRef}
          className="flex overflow-x-auto snap-x snap-mandatory gap-5 sm:gap-6 pb-6 pt-1 px-1 -mx-4 sm:-mx-6 md:-mx-8 sm:px-6 md:px-8 no-scrollbar scroll-smooth"
        >
          {reels.map((reel, index) => (
            <SingleInstagramReelCard 
              key={reel.id} 
              reel={reel} 
              product={product} 
              isPrimary={index === 0}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>

        {/* Mobile Swipe Hint */}
        <div className="flex items-center justify-center gap-2 mt-2 sm:hidden text-gray-400 text-[11px] font-semibold">
          <span>← Swipe to watch more 9:16 farm reels →</span>
        </div>

      </div>
    </section>
  );
};

// ── SINGLE 9:16 INSTAGRAM REEL CARD ──────────────────────────────────────────
interface SingleReelCardProps {
  reel: ReelItem;
  product: Product;
  isPrimary?: boolean;
  onAddToCart?: () => void;
}

const SingleInstagramReelCard: React.FC<SingleReelCardProps> = ({
  reel,
  product,
  isPrimary = false,
  onAddToCart
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [likes, setLikes] = useState(reel.likesCount);
  const [isLiked, setIsLiked] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showCenterIcon, setShowCenterIcon] = useState<'play' | 'pause' | null>(null);

  // Keep progress bar updated
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const p = (videoRef.current.currentTime / (videoRef.current.duration || 1)) * 100;
      setProgress(p);
    }
  };

  // Toggle Play / Pause on Video Click
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      triggerCenterIcon('pause');
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
      triggerCenterIcon('play');
    }
  };

  const triggerCenterIcon = (type: 'play' | 'pause') => {
    setShowCenterIcon(type);
    setTimeout(() => setShowCenterIcon(null), 700);
  };

  // Toggle Mute / Unmute
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Toggle Like with heart animation
  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLiked) {
      setLikes(prev => prev - 1);
      setIsLiked(false);
    } else {
      setLikes(prev => prev + 1);
      setIsLiked(true);
    }
  };

  // Share handler
  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window !== 'undefined' && navigator.share) {
      navigator.share({
        title: `${product.name} - 9:16 Instagram Reel`,
        url: window.location.href,
      }).catch(() => {});
    } else if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  return (
    <div className="w-[280px] sm:w-[320px] md:w-[340px] shrink-0 snap-center flex flex-col group">
      
      {/* 9:16 ASPECT RATIO CONTAINER */}
      <div 
        onClick={togglePlay}
        className="relative w-full aspect-[9/16] rounded-[24px] sm:rounded-[28px] overflow-hidden bg-black shadow-lg hover:shadow-2xl transition-all border border-[#E5DCD0]/60 cursor-pointer select-none"
      >
        {/* Background Video (Exact 9:16 fit) */}
        <video
          ref={videoRef}
          src={reel.videoUrl}
          poster={reel.posterUrl}
          className="w-full h-full object-cover"
          playsInline
          loop
          autoPlay
          muted={isMuted}
          onTimeUpdate={handleTimeUpdate}
        />

        {/* Subdued Dark Vignette Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/60 pointer-events-none" />

        {/* Central Play / Pause Ripple Indicator */}
        {showCenterIcon && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
            <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center animate-ping duration-300">
              {showCenterIcon === 'play' ? (
                <Play className="w-8 h-8 fill-white ml-1" />
              ) : (
                <Pause className="w-8 h-8 fill-white" />
              )}
            </div>
          </div>
        )}

        {/* ── TOP HEADER (Instagram Style) ── */}
        <div className="absolute top-3.5 left-3.5 right-3.5 z-20 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            {/* Avatar with Instagram ring */}
            <div className="w-8 h-8 rounded-full p-[1.5px] bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] shadow-sm shrink-0">
              <div className="w-full h-full rounded-full bg-[#0D3B2E] flex items-center justify-center text-[10px] font-black text-[#F8D279] uppercase">
                VF
              </div>
            </div>
            
            <div className="flex flex-col leading-tight">
              <div className="flex items-center gap-1 text-[11px] font-black tracking-tight drop-shadow-sm">
                <span>vivaanfarms</span>
                <BadgeCheck className="w-3.5 h-3.5 text-[#3897F0] fill-[#3897F0]" />
              </div>
              <span className="text-[9px] text-white/80 font-medium">Original Reel · {reel.viewsLabel} views</span>
            </div>
          </div>

          {/* Sound Mute / Unmute Button */}
          <button
            type="button"
            onClick={toggleMute}
            className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 text-white flex items-center justify-center transition-all cursor-pointer border border-white/20 active:scale-90"
            aria-label={isMuted ? "Unmute video" : "Mute video"}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-white/90" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#F8D279]" />
            )}
          </button>
        </div>

        {/* ── RIGHT ACTION RAIL (Instagram Style) ── */}
        <div className="absolute right-3 bottom-24 z-20 flex flex-col items-center gap-3.5 text-white">
          
          {/* Like Button */}
          <button
            type="button"
            onClick={handleLike}
            className="flex flex-col items-center group/btn active:scale-125 transition-transform cursor-pointer"
            aria-label="Like reel"
          >
            <div className={cn(
              "w-9 h-9 rounded-full bg-black/35 backdrop-blur-md flex items-center justify-center border border-white/15 transition-colors",
              isLiked ? "bg-red-500/20 text-red-500 border-red-500/40" : "text-white hover:text-red-400"
            )}>
              <Heart className={cn("w-5 h-5", isLiked && "fill-red-500")} />
            </div>
            <span className="text-[10px] font-bold mt-1 drop-shadow-md">
              {likes >= 1000 ? `${(likes / 1000).toFixed(1)}k` : likes}
            </span>
          </button>

          {/* Comment Icon */}
          <div className="flex flex-col items-center cursor-pointer">
            <div className="w-9 h-9 rounded-full bg-black/35 backdrop-blur-md flex items-center justify-center border border-white/15 hover:bg-black/50 transition-colors">
              <MessageCircle className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold mt-1 drop-shadow-md">
              {reel.commentsCount}
            </span>
          </div>

          {/* Share Button */}
          <button
            type="button"
            onClick={handleShare}
            className="flex flex-col items-center group/share active:scale-110 transition-transform cursor-pointer"
            aria-label="Share reel"
          >
            <div className="w-9 h-9 rounded-full bg-black/35 backdrop-blur-md flex items-center justify-center border border-white/15 hover:bg-black/50 transition-colors">
              {copiedShare ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </div>
            <span className="text-[9px] font-bold mt-1 drop-shadow-md">
              {copiedShare ? 'Copied' : 'Share'}
            </span>
          </button>

          {/* Quick Add To Cart / Bag */}
          {onAddToCart && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onAddToCart(); }}
              className="flex flex-col items-center group/cart active:scale-110 transition-transform cursor-pointer"
              aria-label="Add product to cart"
            >
              <div className="w-9 h-9 rounded-full bg-[#F8D279] text-[#0D3B2E] flex items-center justify-center shadow-md hover:bg-[#FFE39A] transition-colors">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-black mt-1 drop-shadow-md text-[#F8D279]">
                BUY
              </span>
            </button>
          )}

        </div>

        {/* ── BOTTOM OVERLAY: Product Pill & Caption ── */}
        <div className="absolute bottom-3 left-3 right-14 z-20 text-white flex flex-col gap-2">
          
          {/* Linked Product Quick Pill */}
          <div 
            onClick={(e) => { e.stopPropagation(); onAddToCart?.(); }}
            className="bg-white/15 backdrop-blur-md border border-white/20 rounded-xl p-1.5 flex items-center gap-2 shadow-md hover:bg-white/25 transition-colors cursor-pointer group/pill"
          >
            {product.imageUrls?.[0] && (
              <div className="w-8 h-8 rounded-lg bg-white overflow-hidden relative shrink-0">
                <Image 
                  src={product.imageUrls[0]} 
                  alt={product.name} 
                  fill 
                  className="object-cover" 
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-black truncate text-white leading-tight">
                {product.name}
              </div>
              <div className="text-[9px] font-extrabold text-[#F8D279] leading-tight">
                Rs. {product.price?.toLocaleString('en-IN') || '1,099'}.00
              </div>
            </div>
            <div className="w-6 h-6 rounded-md bg-[#0D3B2E] text-white flex items-center justify-center shrink-0 group-hover/pill:scale-105 transition-transform">
              <ShoppingBag className="w-3 h-3" />
            </div>
          </div>

          {/* Reel Caption */}
          <p className="text-[10px] sm:text-[11px] text-white/90 leading-snug line-clamp-2 drop-shadow-sm font-medium">
            {reel.caption}
          </p>

          {/* Audio Track Marquee */}
          <div className="flex items-center gap-1.5 text-[9px] text-white/80 font-bold overflow-hidden">
            <span className="text-[10px]">♫</span>
            <span className="truncate">Original Audio · Vivaan Organic Farms</span>
          </div>

        </div>

        {/* Reel Progress Bar at very bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-20">
          <div 
            className="h-full bg-gradient-to-r from-[#F58529] via-[#DD2A7B] to-[#F8D279] transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

      </div>

      {/* Reel Subtitle under video */}
      <div className="mt-2.5 px-1 flex items-center justify-between">
        <div>
          <h3 className="text-xs sm:text-sm font-extrabold text-[#111827] truncate">
            {reel.title}
          </h3>
          <span className="text-[10px] text-gray-500 font-semibold">
            {reel.subtitle}
          </span>
        </div>
        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#0D3B2E]/10 text-[#0D3B2E]">
          9:16 HD
        </span>
      </div>

    </div>
  );
};
