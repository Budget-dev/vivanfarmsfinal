"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Sparkles, 
  CheckCircle2, 
  Heart, 
  ShieldCheck, 
  Droplets, 
  Award,
  Sun,
  Flame,
  Leaf,
  ArrowRight,
  MessageCircle,
  Clock,
  Compass,
  Check
} from "lucide-react";

export function AboutSection3() {
  return (
    <div className="bg-[#FAF7F2] text-[#1E2522] overflow-hidden selection:bg-[#0D3B2E] selection:text-white">
      
      {/* ── 1. Vedic Invocation & Hero Header ── */}
      <section className="pt-8 sm:pt-14 pb-8 sm:pb-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center">
        {/* Sanskrit Shloka Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EFE9DC] border border-[#D9CEBA] text-[#5A4321] text-[11px] sm:text-xs font-serif font-bold tracking-wider mb-4 sm:mb-6 shadow-2xs">
          <span className="text-[#C4821E] text-base leading-none">ॐ</span>
          <span>॥ गावो विश्वस्य मातरः · आहारः शुद्धौ सत्त्वशुद्धिः ॥</span>
        </div>

        {/* Main Title */}
        <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-black text-[#0D3B2E] tracking-tight leading-[1.15] max-w-4xl mx-auto mb-4 sm:mb-6">
          Nourishing Generations With The Sacred Purity Of Ancient India
        </h1>

        {/* Natural Traditional Subtitle */}
        <p className="text-sm sm:text-lg text-[#614E36] leading-relaxed max-w-3xl mx-auto font-medium">
          Rooted in the pristine pastures of Gujarat, <strong className="text-[#0D3B2E] font-bold">Vivaan Farms</strong> was born from a sacred vow: to revive the forgotten nutritional heritage of our ancestors. Where native Desi Gir cows graze freely under open skies, golden curd is hand-churned before sunrise in earthen clay pots, and raw forest honey is gathered straight from untamed hives without heat, chemicals, or dilution.
        </p>

        {/* Hero Image Card (Replacing the awkward watermelon cutout with true Indian farm imagery) */}
        <div className="relative mt-8 sm:mt-12 rounded-2xl sm:rounded-3xl overflow-hidden border border-[#E5DAC6] shadow-xl bg-white group">
          <div className="relative w-full h-[260px] sm:h-[420px] md:h-[500px]">
            <Image
              src="/images/home/trust_pastoral_farm.jpg"
              alt="Vivaan Farms - Native Desi Gir Cows Grazing in Natural Pastures"
              fill
              priority
              className="object-cover object-center group-hover:scale-[1.02] transition-transform duration-700 ease-out"
              sizes="(max-width: 768px) 100vw, 1200px"
            />
            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            
            {/* Floating Top Badge */}
            <div className="absolute top-3 sm:top-5 left-3 sm:left-5 bg-white/95 backdrop-blur-md px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-amber-900/10 shadow-md flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
              <span className="text-[10.5px] sm:text-xs font-black uppercase tracking-wider text-[#0D3B2E]">
                Indigenous Desi Gir Cow Sanctuary · Gujarat
              </span>
            </div>

            {/* Bottom Overlay Text */}
            <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-left">
              <div>
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-[2px] text-amber-300 block mb-1">
                  100% AHIMSA · GRASS-FED · PURE A2
                </span>
                <p className="text-white font-serif text-lg sm:text-2xl font-black drop-shadow-sm leading-snug">
                  Ethical Go-Samrakshana. Where calves drink their fill first.
                </p>
              </div>
              <div className="shrink-0 bg-amber-500/20 backdrop-blur-md border border-amber-300/40 text-amber-100 text-xs font-bold px-3 py-1.5 rounded-xl">
                Traditional Vedic Sanctuary
              </div>
            </div>
          </div>
        </div>

        {/* 4 Core Pillars Stats Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-6 sm:mt-8">
          {[
            { value: "50,000+", label: "Happy Indian Families", sub: "Nourished with 100% trust" },
            { value: "100%", label: "Two-Way Wooden Bilona", sub: "Ancient curd-churned process" },
            { value: "0%", label: "Chemicals & Palm Oil", sub: "Zero refined white sugars" },
            { value: "NABL", label: "Lab Tested Batches", sub: "Certified A2 Beta-Casein" }
          ].map((stat, i) => (
            <div 
              key={i} 
              className="bg-white p-4 sm:p-5 rounded-2xl border border-[#EAE3D2] shadow-2xs text-center hover:border-[#0D3B2E]/30 transition-colors"
            >
              <div className="font-serif text-2xl sm:text-3xl font-black text-[#0D3B2E] mb-0.5">
                {stat.value}
              </div>
              <div className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">
                {stat.label}
              </div>
              <div className="text-[11px] text-[#7A6848] mt-1 font-medium">
                {stat.sub}
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* ── 2. Our Sacred Genesis Story ── */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-[#EAE3D2]">
        <div className="grid md:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Narrative */}
          <div className="md:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[2px] text-[#C4821E]">
              <Sparkles className="w-4 h-4" />
              <span>OUR ROOTS & SACRED VOW</span>
            </div>

            <h2 className="font-serif text-2xl sm:text-4xl font-black text-[#0D3B2E] tracking-tight leading-tight">
              A Return To The Soil, A Promise To Our Children.
            </h2>

            <p className="text-sm sm:text-base text-[#5A4321] leading-relaxed">
              In a hurried world flooded with ultra-processed foods, adulterated market ghee made from industrial cream separator chemicals, and artificial honey laced with inverted sugar syrup, Indian kitchens lost their most divine blessing: <em>Pavitra Shuddhata</em> (Pure Sanctity).
            </p>

            <p className="text-sm sm:text-base text-[#5A4321] leading-relaxed">
              We asked ourselves a heartfelt question: <strong>Where did the authentic, nutty aroma of grandmother&apos;s clay-pot bilona ghee go?</strong> Why must mothers wonder if the honey they give their little ones is genuine wild nectar or commercial fructose?
            </p>

            <p className="text-sm sm:text-base text-[#5A4321] leading-relaxed">
              <strong>Vivaan Farms</strong> was born out of that collective yearning. We walked away from corporate city life to dedicate ourselves to native cow seva and natural farming. We re-established the traditional Vedic dairy cycle where our holy Desi Gir cows are treated as family, bathed in the warmth of the sun, and hand-milked only after their calves are fully satisfied.
            </p>

            {/* Sacred Quote Card */}
            <div className="bg-[#F5EFEB] p-5 sm:p-6 rounded-2xl border-l-4 border-[#0D3B2E] text-left">
              <p className="font-serif italic text-sm sm:text-base text-[#0D3B2E] font-bold leading-snug">
                &ldquo;Food is not merely calories; in our ancient Sanatana tradition, pure food is Prana (the vital life force). When prepared with sacred patience and maternal devotion, food becomes medicine for both body and soul.&rdquo;
              </p>
              <span className="block text-[11px] font-black uppercase tracking-wider text-[#7A6848] mt-2">
                — The Vivaan Farms Philosophy
              </span>
            </div>
          </div>

          {/* Right Column: Authentic Image Showcase */}
          <div className="md:col-span-5">
            <div className="relative rounded-3xl overflow-hidden border border-[#E5DAC6] shadow-xl bg-white">
              <div className="relative w-full h-[360px] sm:h-[460px]">
                <Image
                  src="/images/home/hero_lifestyle.jpg"
                  alt="Vivaan Farms - Traditional Pure Food For The Entire Family"
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 768px) 100vw, 500px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                
                <div className="absolute bottom-5 left-5 right-5 text-white">
                  <div className="flex items-center gap-1.5 text-amber-300 text-xs font-black uppercase tracking-wider mb-1">
                    <Heart className="w-3.5 h-3.5 fill-amber-300" /> Three Generations Of Trust
                  </div>
                  <p className="font-serif font-bold text-sm sm:text-base leading-snug">
                    Restoring the golden health and memory of our ancestral kitchens in every Indian home.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>


      {/* ── 3. The Sacred 5-Step Vedic Bilona Journey ── */}
      <section className="py-12 sm:py-20 bg-[#F4EFE6] border-y border-[#EAE3D2]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
            <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[2px] text-[#C4821E] mb-2">
              <Flame className="w-4 h-4 text-[#C4821E]" />
              <span>THE SACRED BILONA PARAMPARA</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-black text-[#0D3B2E] tracking-tight leading-tight">
              How True Vedic A2 Ghee Is Born: 5 Sacred Steps
            </h2>
            <p className="text-xs sm:text-base text-[#614E36] mt-3 leading-relaxed">
              Commercial ghee is produced in minutes by spinning industrial cream through heat separators. Our Vedic A2 Ghee requires over 48 hours of slow, patient human devotion.
            </p>
          </div>

          {/* 5 Steps Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            
            {/* Step 1 */}
            <div className="bg-white p-6 rounded-3xl border border-[#E5DAC6] shadow-2xs hover:shadow-md transition-shadow relative">
              <span className="text-xs font-black text-[#C4821E] uppercase tracking-wider bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 inline-block mb-3">
                Step 1 · गौ-सेवा
              </span>
              <h3 className="font-serif text-lg font-black text-gray-900 mb-2">
                Ahimsa Grazing & Calves First
              </h3>
              <p className="text-xs sm:text-sm text-[#7A6848] leading-relaxed">
                Indigenous Desi Gir cows roam freely in sunshine, grazing on organic grass and Ayurvedic herbs (Shatavari, Ashwagandha). Calves drink their full share first; only the surplus milk is respectfully gathered.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-6 rounded-3xl border border-[#E5DAC6] shadow-2xs hover:shadow-md transition-shadow relative">
              <span className="text-xs font-black text-[#C4821E] uppercase tracking-wider bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 inline-block mb-3">
                Step 2 · मिट्टी की हांडी
              </span>
              <h3 className="font-serif text-lg font-black text-gray-900 mb-2">
                Slow Woodfire Clay Boiling
              </h3>
              <p className="text-xs sm:text-sm text-[#7A6848] leading-relaxed">
                Fresh raw A2 milk is boiled slowly in traditional clay pots (matkas) and heavy brass cauldrons over gentle firewood embers, preserving natural bioactive enzymes and native sweetness.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-6 rounded-3xl border border-[#E5DAC6] shadow-2xs hover:shadow-md transition-shadow relative">
              <span className="text-xs font-black text-[#C4821E] uppercase tracking-wider bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 inline-block mb-3">
                Step 3 · प्राकृतिक जामन
              </span>
              <h3 className="font-serif text-lg font-black text-gray-900 mb-2">
                Overnight Curd Culturing
              </h3>
              <p className="text-xs sm:text-sm text-[#7A6848] leading-relaxed">
                The cooled milk is inoculated with a sacred natural curd starter (jamun) and kept overnight in earthen vessels. The whole milk undergoes natural fermentation into thick, gut-healing cultured dahi.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white p-6 rounded-3xl border border-[#E5DAC6] shadow-2xs hover:shadow-md transition-shadow relative">
              <span className="text-xs font-black text-[#C4821E] uppercase tracking-wider bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 inline-block mb-3">
                Step 4 · द्विमार्गी बिलोना
              </span>
              <h3 className="font-serif text-lg font-black text-gray-900 mb-2">
                Two-Way Wooden Churning
              </h3>
              <p className="text-xs sm:text-sm text-[#7A6848] leading-relaxed">
                During the serene Brahma Muhurta (dawn), the cultured curd is churned with a two-way wooden bilona rope churner. Golden, probiotic-rich cultured butter (makkhan) separates gently without friction heat.
              </p>
            </div>

            {/* Step 5 */}
            <div className="bg-white p-6 rounded-3xl border border-[#E5DAC6] shadow-2xs hover:shadow-md transition-shadow relative">
              <span className="text-xs font-black text-[#C4821E] uppercase tracking-wider bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 inline-block mb-3">
                Step 5 · कंडे की आंच
              </span>
              <h3 className="font-serif text-lg font-black text-gray-900 mb-2">
                Cow Dung Cake Clarification
              </h3>
              <p className="text-xs sm:text-sm text-[#7A6848] leading-relaxed">
                The cultured makkhan is melted slowly in brass vessels over dried cow dung cakes and firewood. Water evaporates, milk solids settle, and golden granular (danedar) A2 Ghee emerges with divine aroma.
              </p>
            </div>

            {/* Step Visual Card */}
            <div className="relative rounded-3xl overflow-hidden border border-[#E5DAC6] shadow-sm min-h-[200px] flex flex-col justify-end p-6 text-white bg-black">
              <Image
                src="/images/home/bilona_blog.jpg"
                alt="Traditional Wooden Bilona Method in Clay Pot"
                fill
                className="object-cover opacity-80"
              />
              <div className="relative z-10">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">
                  SACRED CRAFT
                </span>
                <p className="font-serif font-black text-base sm:text-lg leading-tight mt-1">
                  Over 25 to 30 Litres of Pure A2 Milk for 1 Single Litre of Authentic Bilona Ghee.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>


      {/* ── 4. Our Three Sacred Farm Harvests ── */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[2px] text-[#C4821E] mb-2">
            <Leaf className="w-4 h-4 text-[#C4821E]" />
            <span>OUR SACRED HARVEST</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-4xl font-black text-[#0D3B2E] tracking-tight">
            Pure Food Direct From Our Farm To Your Table
          </h2>
          <p className="text-xs sm:text-sm text-[#614E36] mt-2">
            Every product is handcrafted in small batches, tested in accredited laboratories, and sealed in glass.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
          
          {/* Card 1: A2 Ghee */}
          <div className="bg-white rounded-3xl overflow-hidden border border-[#E5DAC6] shadow-sm hover:shadow-lg transition-all flex flex-col group">
            <div className="relative w-full h-56 sm:h-64 bg-[#FAF7F2] p-4 overflow-hidden">
              <Image
                src="/images/home/featured_pure_jar.jpg"
                alt="Vedic A2 Desi Gir Cow Ghee"
                fill
                className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
              />
              <span className="absolute top-3 left-3 bg-[#EAB308] text-[#1F2937] text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shadow-2xs">
                Signature Vedic Ghee
              </span>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-serif text-xl font-black text-[#0D3B2E] mb-2">
                  A2 Desi Gir Cow Bilona Ghee
                </h3>
                <p className="text-xs sm:text-sm text-[#7A6848] leading-relaxed mb-4">
                  Handcrafted from whole cultured curd of indigenous Gir cows. Naturally granular (danedar), deep golden color, brimming with fat-soluble vitamins (A2, D, E, K) and gut-healing butyric acid.
                </p>
              </div>
              <Link
                href="/category/ghee"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#0D3B2E] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#155442] transition-colors"
              >
                <span>Explore A2 Ghee</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Card 2: Wild Honey */}
          <div className="bg-white rounded-3xl overflow-hidden border border-[#E5DAC6] shadow-sm hover:shadow-lg transition-all flex flex-col group">
            <div className="relative w-full h-56 sm:h-64 bg-[#FAF7F2] p-4 overflow-hidden">
              <Image
                src="/images/products/honey_jar.jpg"
                alt="Raw Wild Forest Honey"
                fill
                className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
              />
              <span className="absolute top-3 left-3 bg-amber-700 text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shadow-2xs">
                100% Raw & Unheated
              </span>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-serif text-xl font-black text-[#0D3B2E] mb-2">
                  Raw Forest Wild Honey
                </h3>
                <p className="text-xs sm:text-sm text-[#7A6848] leading-relaxed mb-4">
                  Ethically gathered by indigenous honey collectors from deep wild forest groves. 100% unpasteurized, unheated, unfiltered — preserving live floral pollen, royal jelly enzymes, and natural aroma.
                </p>
              </div>
              <Link
                href="/category/honey"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#0D3B2E] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#155442] transition-colors"
              >
                <span>Explore Raw Honey</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Card 3: Homemade Sweets */}
          <div className="bg-white rounded-3xl overflow-hidden border border-[#E5DAC6] shadow-sm hover:shadow-lg transition-all flex flex-col group">
            <div className="relative w-full h-56 sm:h-64 bg-[#FAF7F2] p-4 overflow-hidden">
              <Image
                src="/images/home/festive_hero_banner.jpg"
                alt="Artisanal Homemade Indian Sweets"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span className="absolute top-3 left-3 bg-rose-700 text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shadow-2xs">
                Zero White Sugar · Pure Gur
              </span>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-serif text-xl font-black text-[#0D3B2E] mb-2">
                  Heritage Homemade Sweets
                </h3>
                <p className="text-xs sm:text-sm text-[#7A6848] leading-relaxed mb-4">
                  Prepared strictly with our pure A2 Gir Cow Bilona Ghee, organic chemical-free desi jaggery, and handpicked premium nuts. Zero white refined sugar, zero palm oil, zero synthetic essence.
                </p>
              </div>
              <Link
                href="/category/sweets"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#0D3B2E] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#155442] transition-colors"
              >
                <span>Explore Pure Sweets</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </div>
      </section>


      {/* ── 5. Our Six Sacred Vows (The Vivaan Purity Standard) ── */}
      <section className="py-12 sm:py-20 bg-white border-t border-[#EAE3D2]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[2px] text-[#C4821E] mb-2">
              <ShieldCheck className="w-4 h-4 text-[#C4821E]" />
              <span>THE VIVAAN PLEDGE</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-4xl font-black text-[#0D3B2E] tracking-tight">
              Six Sacred Vows Behind Every Jar
            </h2>
            <p className="text-xs sm:text-sm text-[#614E36] mt-2">
              We never compromise on truth, ethics, or the health of our children.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                icon: <Sun className="w-6 h-6 text-amber-600" />,
                title: "100% Shuddh & Satvik",
                desc: "Zero preservatives, artificial colors, synthetic fragrances, or chemical flavor enhancers. Only pure Mother Nature."
              },
              {
                icon: <Heart className="w-6 h-6 text-rose-500" />,
                title: "Ahimsa Go-Samrakshana",
                desc: "Lifelong loving care for our indigenous Gir cows. Calves are never starved, and cows are protected throughout their natural elder years."
              },
              {
                icon: <Droplets className="w-6 h-6 text-amber-600" />,
                title: "Raw & Unheated Honey",
                desc: "Pure forest nectar that is never subjected to ultra-filtration or high heat pasteurization, keeping natural bee pollen and enzymes alive."
              },
              {
                icon: <Award className="w-6 h-6 text-emerald-600" />,
                title: "NABL Laboratory Certified",
                desc: "Every batch is tested in accredited NABL laboratories to verify 100% A2 Beta-Casein authenticity and zero pesticide or heavy metal residues."
              },
              {
                icon: <Flame className="w-6 h-6 text-amber-700" />,
                title: "Ancient Clay & Brass Craft",
                desc: "We refuse industrial aluminum and plastic boiling tubs, honoring time-tested Ayurvedic clay handis, wooden bilonas, and brass cauldrons."
              },
              {
                icon: <ShieldCheck className="w-6 h-6 text-[#0D3B2E]" />,
                title: "Food-Grade Glass & Metal Jars",
                desc: "Sealed in recyclable glass and metal containers to protect the food’s vital Prana and ensure zero toxic microplastic leaching into your food."
              }
            ].map((vow, idx) => (
              <div 
                key={idx}
                className="p-6 rounded-3xl bg-[#FAF8F5] border border-[#EAE3D2] hover:border-[#0D3B2E]/30 transition-all hover:shadow-xs group"
              >
                <div className="w-12 h-12 rounded-2xl bg-white border border-[#EAE3D2] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-2xs">
                  {vow.icon}
                </div>
                <h3 className="font-serif text-lg font-bold text-[#0D3B2E] mb-2 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  {vow.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#7A6848] leading-relaxed">
                  {vow.desc}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>


      {/* ── 6. Personal Note From The Founders ── */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="bg-[#FAF7F2] p-8 sm:p-12 md:p-16 rounded-3xl border border-[#D9CEBA] shadow-lg relative overflow-hidden">
          
          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
            <span className="text-3xl sm:text-4xl text-[#C4821E] font-serif font-black block">
              &ldquo;
            </span>

            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-black text-[#0D3B2E] leading-tight">
              An Open Invitation To Our Farm & Our Heart
            </h2>

            <p className="text-sm sm:text-base text-[#5A4321] leading-relaxed font-medium">
              We never intended Vivaan Farms to be a faceless commercial brand. For us, this is our life&apos;s dharma. When you open a jar of our golden A2 Ghee, taste the wildflower depth of our forest honey, or share our handmade sweets with your family during festivals, you are tasting the devotion of farmers, artisans, and holy cows who live in peaceful harmony with the earth.
            </p>

            <p className="text-sm sm:text-base text-[#5A4321] leading-relaxed font-medium">
              You are always welcome to visit our farm in Gujarat. Walk alongside our cows in the morning dew, hear the rhythmic sound of the wooden bilona churning, and share a warm cup of herbal tea with our farm family.
            </p>

            <div className="pt-6 border-t border-[#D9CEBA]/80">
              <div className="font-serif font-bold text-base sm:text-lg text-[#0D3B2E]">
                With Deep Prem &amp; Pranam,
              </div>
              <div className="text-xs font-black uppercase tracking-wider text-[#C4821E] mt-0.5">
                The Vivaan Farms Family
              </div>
            </div>
          </div>

        </div>
      </section>


      {/* ── 7. Call To Action Banner ── */}
      <section className="py-10 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto mb-10">
        <div className="bg-gradient-to-br from-[#0D3B2E] via-[#14422B] to-[#0A2E24] text-white p-8 sm:p-12 md:p-16 rounded-3xl shadow-xl text-center relative overflow-hidden">
          
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-amber-300 text-[10px] sm:text-xs font-black uppercase tracking-[2px]">
              Direct From Farm · Delivered Pan-India
            </span>
            
            <h2 className="font-serif text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              Experience The True Fragrance Of Ancient Purity
            </h2>

            <p className="text-white/80 text-xs sm:text-base leading-relaxed">
              Order farm-fresh A2 Desi Bilona Ghee, Raw Forest Honey, and Artisanal Homemade Sweets delivered directly to your doorstep in pristine protective glass packaging.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Link
                href="/category/all"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#EAB308] text-[#1F2937] font-black text-xs uppercase tracking-wider hover:bg-[#FACC15] transition-all shadow-md active:scale-95"
              >
                <span>Shop Pure Farm Harvest</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <a
                href="https://wa.me/916302548215?text=Namaste%20Vivaan%20Farms,%20I%20would%20like%20to%20know%20more%20about%20your%20A2%20Ghee%20and%20farm%20harvest"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>WhatsApp Our Farm</span>
              </a>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
