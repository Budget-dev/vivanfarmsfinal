"use client";

import React from 'react';
import Image from 'next/image';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

export const CertificationsStrip: React.FC = () => {
  return (
    <section className="py-8 sm:py-12 bg-[#FAF7F2] border-b border-[#EAE3D2] select-none">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12">
        
        {/* Section Subheading */}
        <div className="text-center mb-5 sm:mb-7">
          <p className="text-[10px] sm:text-xs font-black text-[#6B5A45] tracking-[3px] uppercase">
            Recognized & Certified For Complete Food Purity
          </p>
          <div className="w-12 sm:w-16 h-0.5 bg-[#0D3B2E]/25 mx-auto mt-2 rounded-full" />
        </div>

        {/* Exclusive Single FSSAI Certification Card */}
        <div className="max-w-xl mx-auto bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-[#EBE3D3] shadow-xs hover:shadow-md transition-all duration-300">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-left">
            
            {/* High-Resolution FSSAI Certification Seal Emblem */}
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 shrink-0 rounded-full overflow-hidden shadow-xs border-2 border-[#113B29]/20 bg-white">
              <Image 
                src="/images/certifications/fssai.jpg"
                alt="FSSAI Certified - Food Safety and Standards Authority of India"
                fill
                className="object-cover"
                sizes="(max-width: 640px) 112px, 128px"
                priority
              />
            </div>

            {/* Certification Details */}
            <div className="flex-1 space-y-1.5 sm:space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF5EF] text-[#0D3B2E] text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>100% Food Safety Assured</span>
              </div>

              <h3 className="font-serif text-xl sm:text-2xl font-extrabold text-[#0D3B2E] tracking-tight">
                FSSAI Certified
              </h3>

              <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">
                Licensed under the Food Safety and Standards Authority of India (FSSAI). Rigorously tested for 100% natural purity, batch safety, and zero chemical additives.
              </p>

              <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2.5 text-[11px] font-bold text-[#6B5A45]">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  Zero Chemical Residues
                </span>
                <span className="text-gray-300">•</span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  Batch-Tested Purity
                </span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
