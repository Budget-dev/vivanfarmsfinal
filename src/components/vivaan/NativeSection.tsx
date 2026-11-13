"use client";

import React from 'react';
import Image from 'next/image';

const NATIVE_CARDS = [
  {
    title: "From Native Geographies",
    subtitle: "to Ideal Growing Seasons",
    desc: "We take care of every factor when sourcing local ingredients.",
    image: "/images/native/native_geographies.jpg",
  },
  {
    title: "What Do We Look For?",
    subtitle: "Nutrition over Cost",
    desc: "Not high yield. Not lower cost. Just flavour, nutrition, and soul.",
    image: "/images/native/nutrition_over_cost.jpg",
  },
  {
    title: "Impurities, Out.",
    subtitle: "Goodness, In.",
    desc: "Only the freshest milk and natural ingredients make the cut directly from our farm.",
    image: "/images/native/impurities_out_goodness_in.jpg",
  },
  {
    title: "Native Heritage",
    subtitle: "A2 Gir Milk & Seeds",
    desc: "We dare you to find better native ingredients than our farm direct goods.",
    image: "/images/native/a2_desi_cows.jpg",
  }
];

export const NativeSection: React.FC = () => {
  return (
    <section className="py-8 md:py-24 bg-[#F9F6EF] border-t border-border/50 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-5 md:px-10">
        <div className="text-center mb-8 md:mb-16">
          <h2 className="font-headline text-3xl md:text-6xl font-extrabold text-primary leading-tight">
            Native Ingredients. No Substitutes.
          </h2>
          <div className="w-24 h-1 bg-primary/20 mx-auto mt-4 md:mt-6 rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {NATIVE_CARDS.map((card, i) => (
            <div 
              key={i} 
              className="relative w-full aspect-[4/5] rounded-[20px] md:rounded-[24px] overflow-hidden group shadow-lg bg-white"
            >
              <Image 
                src={card.image}
                alt={card.title}
                fill
                referrerPolicy="no-referrer"
                className="object-cover transition-transform duration-1000 group-hover:scale-105"
                sizes="(max-width: 768px) 240px, 450px"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
