"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BookOpen, Clock } from 'lucide-react';

export const BlogSection: React.FC = () => {
  return (
    <section className="bg-gradient-to-b from-[#C85A32] to-[#B34C28] py-8 sm:py-14 text-white">
      <div className="max-w-[760px] mx-auto px-4 sm:px-6">
        
        {/* Section Heading matching reference screenshot */}
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="font-headline text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            Blogs
          </h2>
          <p className="text-xs sm:text-sm text-white/80 font-bold uppercase tracking-wider mt-1">
            Stories & Wisdom from Our Organic Farms
          </p>
        </div>

        {/* Featured Blog Card */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-white/20 text-[#1A1410] transition-transform duration-300 hover:scale-[1.01]">
          
          {/* High Clarity Bilona Curd Churning Image */}
          <div className="relative w-full aspect-[16/9] bg-[#FAF7F0] overflow-hidden">
            <Image
              src="/images/home/bilona_blog.jpg"
              alt="Ancient Vedic Bilona Method - Why Curd Churning Matters"
              fill
              className="object-cover object-center transition-transform duration-700 hover:scale-105"
              sizes="(max-width: 768px) 100vw, 760px"
            />
            {/* Tag Badge */}
            <div className="absolute top-3 left-3 z-20">
              <span className="bg-[#0D3520] text-white text-[10px] sm:text-xs font-black uppercase px-2.5 py-1 rounded-md tracking-wider shadow-sm">
                VEDIC BILONA HERITAGE
              </span>
            </div>
          </div>

          {/* Blog Content */}
          <div className="p-5 sm:p-7 space-y-3">
            
            <div className="flex items-center gap-3 text-xs text-[#7A6848] font-bold">
              <span className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-[#C85A32]" />
                Farm Knowledge
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#C85A32]" />
                4 Min Read
              </span>
            </div>

            <h3 className="font-headline text-lg sm:text-2xl font-black text-[#1A1410] hover:text-[#C85A32] transition-colors leading-tight">
              <Link href="/blog">
                Ancient Vedic Bilona: Why Curd Churning Matters
              </Link>
            </h3>

            <p className="text-xs sm:text-sm text-[#5C4524] font-medium leading-relaxed">
              Discover why authentic Ayurvedic texts mandate that pure A2 Ghee must be hand-churned from cultured whole milk curd, rather than separated industrial cream. Experience the difference in aroma, butyric acid levels, and gut-healing enzymes.
            </p>

            <div className="pt-2">
              <Link 
                href="/blog"
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-black text-[#C85A32] hover:text-[#9A3B1B] uppercase tracking-wider underline decoration-2 underline-offset-4 cursor-pointer transition-colors"
                aria-label="Read full article on Vedic Bilona Curd Churning"
              >
                <span>Read Full Article</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
