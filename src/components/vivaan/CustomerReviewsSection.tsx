"use client";

import React, { useState, useMemo } from 'react';
import { Star, CheckCircle, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

export const CustomerReviewsSection: React.FC = () => {
  const [showAll, setShowAll] = useState(false);
  const db = useFirestore();

  const reviewsRef = useMemoFirebase(() => collection(db, 'reviews'), [db]);
  const { data: rawReviews } = useCollection(reviewsRef);

  const reviews = useMemo(() => {
    if (!rawReviews) return [];
    return rawReviews
      .filter((r: any) => r.status === 'approved' || !r.status || r.status === 'published')
      .map((r: any) => ({
        id: r.id,
        name: r.userName || r.name || 'Verified Customer',
        city: r.city || 'Verified Buyer',
        role: r.role || 'Verified Buyer',
        rating: Number(r.rating) || 5,
        title: r.title || r.productName || 'Pure & Authentic',
        review: r.comment || r.review || '',
        product: r.productName || 'Vivaan Farms Product'
      }))
      .filter(r => r.review && r.review.trim().length > 0);
  }, [rawReviews]);

  if (reviews.length === 0) {
    return null;
  }

  return (
    <section className="py-8 sm:py-12 md:py-20 bg-[#FFFFFF] border-b border-[#EAE3D2] select-none">
      <div className="max-w-[1440px] mx-auto px-3 sm:px-8 lg:px-12">
        
        {/* Title */}
        <div className="text-center mb-6 sm:mb-10 md:mb-14">
          <p className="text-[10px] sm:text-sm font-black text-[#6B5A45] tracking-[2.5px] uppercase mb-1">
            Real Experiences
          </p>
          <h2 className="font-serif text-xl sm:text-3xl md:text-5xl font-extrabold text-[#0D3B2E] tracking-tight">
            What Do Our Customers Say
          </h2>
          <div className="w-16 sm:w-20 h-0.5 bg-[#0D3B2E]/25 mx-auto mt-2 sm:mt-3 rounded-full" />
        </div>

        {/* 2-up on Mobile, 4-up on Desktop Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6">
          {reviews.map((rev, idx) => {
            const isHiddenOnMobile = !showAll && idx >= 2;

            return (
              <div
                key={rev.id || idx}
                className={cn(
                  "bg-[#FAF8F5] rounded-xl sm:rounded-3xl p-2.5 sm:p-6 border border-[#EBE3D3] hover:border-[#0D3B2E]/30 hover:shadow-xl transition-all duration-300 flex-col justify-between group",
                  isHiddenOnMobile ? "hidden sm:flex" : "flex"
                )}
              >
                <div>
                  {/* 5 Stars */}
                  <div className="flex items-center gap-0.5 text-amber-500 mb-1.5 sm:mb-3">
                    {[...Array(Math.min(5, Math.max(1, Math.round(rev.rating))))].map((_, i) => (
                      <Star key={i} className="w-3 h-3 sm:w-4 sm:h-4 fill-amber-500 text-amber-500" />
                    ))}
                  </div>

                  {/* Review Headline */}
                  <h4 className="font-serif text-xs sm:text-base font-bold text-gray-900 group-hover:text-[#0D3B2E] transition-colors leading-tight sm:leading-snug mb-1 sm:mb-2 line-clamp-2">
                    &ldquo;{rev.title}&rdquo;
                  </h4>

                  {/* Review Body */}
                  <p className="text-[10px] sm:text-[13px] text-[#5C4524] font-normal leading-tight sm:leading-relaxed mb-2 sm:mb-4 line-clamp-3 sm:line-clamp-none">
                    {rev.review}
                  </p>
                </div>

                {/* Author & Verified Badge */}
                <div className="pt-2 sm:pt-4 border-t border-[#EAE3D2] flex items-center justify-between mt-auto gap-1">
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] sm:text-xs font-bold text-gray-900 truncate">
                      {rev.name}
                    </div>
                    <div className="text-[9px] sm:text-[11px] text-gray-500 truncate">
                      {rev.city}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 text-[9px] sm:text-[11px] text-[#0D3B2E] font-medium shrink-0">
                    <CheckCircle className="w-3 h-3 text-[#0D3B2E]" />
                    <span className="hidden min-[400px]:inline">Verified</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* View More on Mobile */}
        {reviews.length > 2 && (
          <div className="mt-6 text-center sm:hidden">
            <button
              onClick={() => setShowAll(!showAll)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0D3B2E] px-4 py-2 border border-[#0D3B2E]/20 rounded-full bg-white hover:bg-emerald-50/50 transition-colors"
            >
              <span>{showAll ? 'Show Less' : `View All Reviews (${reviews.length})`}</span>
              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", showAll && "rotate-180")} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
