"use client";

import React, { useState } from 'react';
import { ChevronDown, Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ProductFaqSection: React.FC = () => {
  const [openGroup, setOpenGroup] = useState<'shipping' | 'product' | null>('shipping');
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);

  const toggleGroup = (group: 'shipping' | 'product') => {
    setOpenGroup(prev => prev === group ? null : group);
  };

  const toggleQuestion = (id: string) => {
    setOpenQuestion(prev => prev === id ? null : id);
  };

  const shippingFaqs = [
    {
      id: 'ship-1',
      q: 'How long will my order take to arrive?',
      a: 'Orders are freshly packed and dispatched within 24 hours. Metro deliveries arrive in 3 to 5 business days, and other locations across India arrive within 5 to 7 days.'
    },
    {
      id: 'ship-2',
      q: 'How do I track my order?',
      a: 'Once shipped, you will immediately receive an SMS and email notification with an active tracking link. You can also track your order anytime directly on our website using your order ID.'
    },
    {
      id: 'ship-3',
      q: 'When will I get my tracking details?',
      a: 'Tracking links are generated and messaged to your phone and email as soon as the package is handed over to our express courier partner (within 24 hours of placing order).'
    },
    {
      id: 'ship-4',
      q: 'What if my order arrives damaged or leaked?',
      a: 'We pack in shatter-proof bubble and heavy corrugated boxes. In the rare event of transit leakage or glass damage, send us a photo on WhatsApp (+91 99886 67848) and we will send a 100% free immediate replacement with no questions asked.'
    },
    {
      id: 'ship-5',
      q: 'Do you ship across India?',
      a: 'Yes, we deliver to over 28,000+ pincodes across India with trusted express delivery partners. Free shipping is available on all orders above ₹699.'
    },
    {
      id: 'ship-6',
      q: 'What is your return policy?',
      a: 'We offer a 100% Money Back Guarantee. Every jar comes with a complimentary 20ml sample pack. If it does not exceed your expectations, return it for a complete 100% refund.'
    }
  ];

  const productFaqs = [
    {
      id: 'prod-1',
      q: 'How is Vivaan A2 Buffalo Ghee made?',
      a: 'We follow the authentic Vedic Bilona method: Raw milk from pasture-fed buffaloes is boiled, naturally cultured into curd in mitti pots overnight, hand-churned with bi-directional wooden bilona to harvest makkhan, and gently slow-simmered over firewood flame.'
    },
    {
      id: 'prod-2',
      q: 'Is this certified pure A2 ghee?',
      a: 'Yes! Crafted exclusively from the whole milk of indigenous Indian buffaloes rich in natural A2 beta-casein proteins. Easy to digest and completely free of inflammatory A1 proteins.'
    },
    {
      id: 'prod-3',
      q: 'Does this ghee require refrigeration?',
      a: 'No refrigeration required. Pure Vedic Bilona ghee contains zero moisture and has natural stability. Keep tightly closed in a cool, dry place with a dry spoon.'
    },
    {
      id: 'prod-4',
      q: 'What is the shelf life of Vivaan Ghee?',
      a: 'It retains full aroma, therapeutic qualities, and taste for 12 months from the packaging date when stored properly.'
    },
    {
      id: 'prod-5',
      q: 'Can I use it for daily high-heat cooking?',
      a: 'Yes! With a natural smoke point of 250°C (482°F), it is the healthiest cooking fat for tadka, frying, sautéing, and baking without releasing toxic free radicals.'
    }
  ];

  return (
    <section className="bg-[#D4EDE1] py-14 sm:py-20 px-4">
      <div className="max-w-[850px] mx-auto">
        
        {/* Title */}
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#113B29] tracking-tight">
            FAQs
          </h2>
        </div>

        {/* Group 1: Tracking And Shipping */}
        <div className="bg-[#E6F4ED] border border-[#BCE1CE] rounded-2xl overflow-hidden mb-4 shadow-2xs">
          <button
            type="button"
            onClick={() => toggleGroup('shipping')}
            className="w-full px-5 py-4 text-left flex items-center justify-between font-sans font-extrabold text-sm sm:text-base text-[#113B29] hover:bg-[#D8EDE2] transition-colors cursor-pointer"
          >
            <span>Tracking And Shipping</span>
            <ChevronDown className={cn(
              "w-5 h-5 text-[#113B29] transition-transform duration-300",
              openGroup === 'shipping' && "rotate-180"
            )} />
          </button>

          {openGroup === 'shipping' && (
            <div className="px-5 pb-5 pt-1 space-y-3 border-t border-[#CCE5D8]">
              {shippingFaqs.map((faq) => {
                const isQOpen = openQuestion === faq.id;
                return (
                  <div key={faq.id} className="border-b border-[#CCE5D8] last:border-0 pb-3 last:pb-0">
                    <button
                      type="button"
                      onClick={() => toggleQuestion(faq.id)}
                      className="w-full text-left flex items-start justify-between gap-3 font-medium text-xs sm:text-sm text-[#143D24] hover:text-black cursor-pointer pt-1"
                    >
                      <span className="flex items-start gap-2">
                        <span className="text-black font-extrabold text-sm leading-none mt-0.5">•</span>
                        <span className="font-semibold">{faq.q}</span>
                      </span>
                      <span className="shrink-0 text-gray-700 font-bold ml-2">
                        {isQOpen ? <Minus className="w-4 h-4 stroke-[2.5]" /> : <Plus className="w-4 h-4 stroke-[2.5]" />}
                      </span>
                    </button>

                    {isQOpen && (
                      <p className="mt-2 pl-4 text-xs sm:text-sm text-gray-700 leading-relaxed font-normal bg-white/70 p-3 rounded-xl border border-[#CCE5D8]">
                        {faq.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Group 2: Product Information */}
        <div className="bg-[#E6F4ED] border border-[#BCE1CE] rounded-2xl overflow-hidden shadow-2xs">
          <button
            type="button"
            onClick={() => toggleGroup('product')}
            className="w-full px-5 py-4 text-left flex items-center justify-between font-sans font-extrabold text-sm sm:text-base text-[#113B29] hover:bg-[#D8EDE2] transition-colors cursor-pointer"
          >
            <span>Product Information</span>
            <ChevronDown className={cn(
              "w-5 h-5 text-[#113B29] transition-transform duration-300",
              openGroup === 'product' && "rotate-180"
            )} />
          </button>

          {openGroup === 'product' && (
            <div className="px-5 pb-5 pt-1 space-y-3 border-t border-[#CCE5D8]">
              {productFaqs.map((faq) => {
                const isQOpen = openQuestion === faq.id;
                return (
                  <div key={faq.id} className="border-b border-[#CCE5D8] last:border-0 pb-3 last:pb-0">
                    <button
                      type="button"
                      onClick={() => toggleQuestion(faq.id)}
                      className="w-full text-left flex items-start justify-between gap-3 font-medium text-xs sm:text-sm text-[#143D24] hover:text-black cursor-pointer pt-1"
                    >
                      <span className="flex items-start gap-2">
                        <span className="text-black font-extrabold text-sm leading-none mt-0.5">•</span>
                        <span className="font-semibold">{faq.q}</span>
                      </span>
                      <span className="shrink-0 text-gray-700 font-bold ml-2">
                        {isQOpen ? <Minus className="w-4 h-4 stroke-[2.5]" /> : <Plus className="w-4 h-4 stroke-[2.5]" />}
                      </span>
                    </button>

                    {isQOpen && (
                      <p className="mt-2 pl-4 text-xs sm:text-sm text-gray-700 leading-relaxed font-normal bg-white/70 p-3 rounded-xl border border-[#CCE5D8]">
                        {faq.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </section>
  );
};
