"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Sparkles, 
  Heart, 
  ShieldCheck, 
  Droplets, 
  Award,
  Leaf,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Clock,
  Compass,
  Check,
  Milk,
  Truck,
  Users,
  Target,
  Eye
} from "lucide-react";

export function AboutSection3() {
  return (
    <div className="bg-[#FAF7F2] text-[#1E2522] overflow-hidden selection:bg-[#0D3B2E] selection:text-white">
      
      {/* ── 1. Hero Header & Introduction ── */}
      <section className="pt-8 sm:pt-14 pb-8 sm:pb-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center">
        {/* Pre-title Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EFE9DC] border border-[#D9CEBA] text-[#5A4321] text-[11px] sm:text-xs font-semibold tracking-wider mb-4 sm:mb-6 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-[#C4821E]" />
          <span>About Us — Vivaan Farms</span>
        </div>

        {/* Main Title */}
        <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-black text-[#0D3B2E] tracking-tight leading-[1.15] max-w-4xl mx-auto mb-4 sm:mb-6">
          Bringing Farm Freshness Closer to Your Home
        </h1>

        {/* Introduction Paragraphs */}
        <div className="space-y-4 max-w-3xl mx-auto text-sm sm:text-lg text-[#614E36] leading-relaxed font-medium">
          <p>
            At <strong className="text-[#0D3B2E] font-bold">Vivaan Farms</strong>, we believe that good food begins with care, dedication, and a connection to the source. Founded with a vision to bring farm-fresh products closer to families, we are building a farm brand rooted in trust, quality, and traditional values.
          </p>
          <p className="text-xs sm:text-base text-[#5A4321]/90 bg-[#F4EFE6] p-4 sm:p-5 rounded-2xl border border-[#E5DAC6]">
            Located in <strong className="text-[#0D3B2E] font-bold">Chandravelli, Bellampalli, Telangana</strong>, Vivaan Farms focuses on dairy farming, with a commitment to providing fresh buffalo milk directly from our farm to local households. We strive to make the journey from farm to family simple, convenient, and reliable.
          </p>
        </div>

        {/* Hero Farm Image Banner */}
        <div className="relative mt-8 sm:mt-12 rounded-2xl sm:rounded-3xl overflow-hidden border border-[#E5DAC6] shadow-xl bg-white group">
          <div className="relative w-full h-[260px] sm:h-[420px] md:h-[480px]">
            <Image
              src="/images/home/trust_pastoral_farm.jpg"
              alt="Vivaan Farms - Fresh Buffalo Milk & Dairy Farming in Chandravelli, Telangana"
              fill
              priority
              className="object-cover object-center group-hover:scale-[1.02] transition-transform duration-700 ease-out"
              sizes="(max-width: 768px) 100vw, 1200px"
            />
            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
            
            {/* Floating Top Badge */}
            <div className="absolute top-3 sm:top-5 left-3 sm:left-5 bg-white/95 backdrop-blur-md px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-amber-900/10 shadow-md flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
              <span className="text-[10.5px] sm:text-xs font-black uppercase tracking-wider text-[#0D3B2E]">
                Chandravelli · Bellampalli · Telangana
              </span>
            </div>

            {/* Bottom Overlay Text */}
            <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-left">
              <div>
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-[2px] text-amber-300 block mb-1">
                  NATURAL PRODUCTS DIRECTLY FROM FARM
                </span>
                <p className="text-white font-serif text-lg sm:text-2xl font-black drop-shadow-sm leading-snug">
                  Fresh Buffalo Milk &amp; Traditional Farm Goodness for Your Family.
                </p>
              </div>
              <div className="shrink-0 bg-amber-500/20 backdrop-blur-md border border-amber-300/40 text-amber-100 text-xs font-bold px-3 py-1.5 rounded-xl">
                Dedicated Dairy Farming
              </div>
            </div>
          </div>
        </div>

        {/* 4 Pillars Stats Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-6 sm:mt-8">
          {[
            { value: "100%", label: "Farm Fresh Milk", sub: "Pure buffalo milk direct from farm" },
            { value: "Daily", label: "Doorstep Delivery", sub: "Simple, convenient & reliable" },
            { value: "Pure", label: "Care for Animals", sub: "Ethical & responsible dairy care" },
            { value: "Trust", label: "Long-Term Bonds", sub: "Honest communication with families" }
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


      {/* ── 2. Our Journey ── */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-[#EAE3D2]">
        <div className="grid md:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Narrative */}
          <div className="md:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[2px] text-[#C4821E]">
              <Compass className="w-4 h-4" />
              <span>HOW IT STARTED</span>
            </div>

            <h2 className="font-serif text-2xl sm:text-4xl font-black text-[#0D3B2E] tracking-tight leading-tight">
              Our Journey
            </h2>

            <p className="text-sm sm:text-base text-[#5A4321] leading-relaxed">
              <strong>Vivaan Farms</strong> was built on a passion for farming and a desire to create a meaningful connection between producers and consumers. What began as a farming vision has grown into a dedicated dairy venture focused on serving families with care and consistency.
            </p>

            <p className="text-sm sm:text-base text-[#5A4321] leading-relaxed">
              We believe that farming is more than a business — it is a responsibility to our customers, our animals, and the community we serve.
            </p>

            {/* Highlight Responsibility Card */}
            <div className="bg-[#F5EFEB] p-5 sm:p-6 rounded-2xl border-l-4 border-[#0D3B2E] text-left">
              <p className="font-serif italic text-sm sm:text-base text-[#0D3B2E] font-bold leading-snug">
                &ldquo;Farming is more than a business — it is a responsibility to our customers, our animals, and the community we serve.&rdquo;
              </p>
              <span className="block text-[11px] font-black uppercase tracking-wider text-[#7A6848] mt-2">
                — Vivaan Farms Guiding Principle
              </span>
            </div>
          </div>

          {/* Right Column: Imagery */}
          <div className="md:col-span-5">
            <div className="relative rounded-3xl overflow-hidden border border-[#E5DAC6] shadow-xl bg-white">
              <div className="relative w-full h-[340px] sm:h-[440px]">
                <Image
                  src="/images/home/hero_lifestyle.jpg"
                  alt="Vivaan Farms - Dedicated Dairy Farming with Care and Consistency"
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 768px) 100vw, 500px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                
                <div className="absolute bottom-5 left-5 right-5 text-white">
                  <div className="flex items-center gap-1.5 text-amber-300 text-xs font-black uppercase tracking-wider mb-1">
                    <Heart className="w-3.5 h-3.5 fill-amber-300" /> Rooted in Trust &amp; Quality
                  </div>
                  <p className="font-serif font-bold text-sm sm:text-base leading-snug">
                    Creating a meaningful connection between our farm and local households.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>


      {/* ── 3. What We Stand For (Core Values) ── */}
      <section className="py-12 sm:py-20 bg-[#F4EFE6] border-y border-[#EAE3D2]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
            <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[2px] text-[#C4821E] mb-2">
              <ShieldCheck className="w-4 h-4 text-[#C4821E]" />
              <span>OUR CORE PRINCIPLES</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-black text-[#0D3B2E] tracking-tight leading-tight">
              What We Stand For
            </h2>
            <p className="text-xs sm:text-base text-[#614E36] mt-3 leading-relaxed">
              Every step of our daily dairy operations is guided by these five foundational commitments.
            </p>
          </div>

          {/* 5 Core Pillars Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            
            {/* Pillar 1: Freshness */}
            <div className="bg-white p-6 rounded-3xl border border-[#E5DAC6] shadow-2xs hover:shadow-md transition-shadow relative">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#0D3B2E] mb-4">
                <Milk className="w-6 h-6 stroke-[1.8]" />
              </div>
              <h3 className="font-serif text-lg font-black text-[#0D3B2E] mb-2 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                Freshness
              </h3>
              <p className="text-xs sm:text-sm text-[#7A6848] leading-relaxed">
                We focus on delivering fresh buffalo milk from our farm directly to our customers every single day.
              </p>
            </div>

            {/* Pillar 2: Quality */}
            <div className="bg-white p-6 rounded-3xl border border-[#E5DAC6] shadow-2xs hover:shadow-md transition-shadow relative">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 mb-4">
                <Award className="w-6 h-6 stroke-[1.8]" />
              </div>
              <h3 className="font-serif text-lg font-black text-[#0D3B2E] mb-2 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                Quality
              </h3>
              <p className="text-xs sm:text-sm text-[#7A6848] leading-relaxed">
                We aim to maintain consistent quality and responsible handling throughout our dairy operations.
              </p>
            </div>

            {/* Pillar 3: Care for Animals */}
            <div className="bg-white p-6 rounded-3xl border border-[#E5DAC6] shadow-2xs hover:shadow-md transition-shadow relative">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-4">
                <Heart className="w-6 h-6 stroke-[1.8]" />
              </div>
              <h3 className="font-serif text-lg font-black text-[#0D3B2E] mb-2 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                Care for Animals
              </h3>
              <p className="text-xs sm:text-sm text-[#7A6848] leading-relaxed">
                We recognize the importance of proper animal care, humane treatment, and healthy nutrition in dairy farming.
              </p>
            </div>

            {/* Pillar 4: Customer Trust */}
            <div className="bg-white p-6 rounded-3xl border border-[#E5DAC6] shadow-2xs hover:shadow-md transition-shadow relative">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 mb-4">
                <Users className="w-6 h-6 stroke-[1.8]" />
              </div>
              <h3 className="font-serif text-lg font-black text-[#0D3B2E] mb-2 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                Customer Trust
              </h3>
              <p className="text-xs sm:text-sm text-[#7A6848] leading-relaxed">
                We value honest communication, dependable service, and long-term relationships with our customers.
              </p>
            </div>

            {/* Pillar 5: Farm-to-Home Convenience */}
            <div className="bg-white p-6 rounded-3xl border border-[#E5DAC6] shadow-2xs hover:shadow-md transition-shadow relative sm:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 mb-4">
                <Truck className="w-6 h-6 stroke-[1.8]" />
              </div>
              <h3 className="font-serif text-lg font-black text-[#0D3B2E] mb-2 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                Farm-to-Home Convenience
              </h3>
              <p className="text-xs sm:text-sm text-[#7A6848] leading-relaxed">
                We make it easier for local families to access our farm&apos;s fresh dairy products with seamless delivery.
              </p>
            </div>

            {/* Summary Accent Card */}
            <div className="bg-gradient-to-br from-[#0D3B2E] to-[#144E3D] p-6 rounded-3xl shadow-sm flex flex-col justify-between text-white sm:col-span-2 lg:col-span-1">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">
                  OUR PROMISE
                </span>
                <p className="font-serif font-black text-base sm:text-lg leading-snug mt-2">
                  Vivaan Farms — Natural Products Directly From Farm.
                </p>
              </div>
              <p className="text-xs text-emerald-100/80 mt-4">
                Thank you for being part of our journey.
              </p>
            </div>

          </div>

        </div>
      </section>


      {/* ── 4. Mission & Vision ── */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
          
          {/* Mission Card */}
          <div className="bg-white p-8 sm:p-10 rounded-3xl border border-[#E5DAC6] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#0D3B2E]">
                <Target className="w-7 h-7 stroke-[1.8]" />
              </div>
              <span className="inline-block text-xs font-black uppercase tracking-wider text-[#C4821E]">
                PURPOSE &amp; GOALS
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-black text-[#0D3B2E]">
                Our Mission
              </h3>
              <p className="text-sm sm:text-base text-[#614E36] leading-relaxed font-medium">
                Our mission is to build a trusted farm-to-home brand that brings fresh dairy products to families while following responsible farming practices and maintaining a strong focus on quality and customer satisfaction.
              </p>
            </div>
            <div className="pt-6 border-t border-[#EAE3D2] mt-6 flex items-center gap-2 text-xs font-bold text-[#0D3B2E]">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Responsible Farming · Quality · Satisfaction</span>
            </div>
          </div>

          {/* Vision Card */}
          <div className="bg-white p-8 sm:p-10 rounded-3xl border border-[#E5DAC6] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                <Eye className="w-7 h-7 stroke-[1.8]" />
              </div>
              <span className="inline-block text-xs font-black uppercase tracking-wider text-[#C4821E]">
                THE ROAD AHEAD
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-black text-[#0D3B2E]">
                Our Vision
              </h3>
              <p className="text-sm sm:text-base text-[#614E36] leading-relaxed font-medium">
                Our vision is to make Vivaan Farms a trusted name for dairy and traditional farm products, connecting more households with the goodness of farm-fresh food.
              </p>
            </div>
            <div className="pt-6 border-t border-[#EAE3D2] mt-6 flex items-center gap-2 text-xs font-bold text-[#0D3B2E]">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Trusted Name in Dairy &amp; Traditional Farm Food</span>
            </div>
          </div>

        </div>
      </section>


      {/* ── 5. From Our Farm to Your Family ── */}
      <section className="py-10 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="bg-[#FAF7F2] p-8 sm:p-12 md:p-16 rounded-3xl border border-[#D9CEBA] shadow-md text-center space-y-6 relative">
          <span className="text-3xl sm:text-4xl text-[#C4821E] font-serif font-black block leading-none">
            &ldquo;
          </span>

          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-black text-[#0D3B2E] leading-tight">
            From Our Farm to Your Family
          </h2>

          <p className="text-sm sm:text-lg text-[#5A4321] leading-relaxed max-w-3xl mx-auto font-medium">
            Every customer who chooses Vivaan Farms becomes part of our journey. We are committed to growing through trust, consistent service, and the values that inspired us to start farming.
          </p>

          <div className="pt-4">
            <p className="font-serif text-lg sm:text-xl font-black text-[#0D3B2E]">
              Vivaan Farms — Natural Products Directly From Farm.
            </p>
            <p className="text-xs sm:text-sm font-bold text-[#C4821E] uppercase tracking-wider mt-1">
              Thank you for being part of our journey.
            </p>
          </div>
        </div>
      </section>


      {/* ── 6. Get in Touch Section ── */}
      <section className="py-10 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto mb-10">
        <div className="bg-gradient-to-br from-[#0D3B2E] via-[#14422B] to-[#0A2E24] text-white p-8 sm:p-12 md:p-16 rounded-3xl shadow-xl">
          
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8 sm:mb-12 space-y-2">
              <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-amber-300 text-[10px] sm:text-xs font-black uppercase tracking-[2px]">
                CONNECT WITH US
              </span>
              <h2 className="font-serif text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                Get in Touch
              </h2>
              <p className="text-emerald-100/80 text-xs sm:text-sm">
                Have questions about our dairy products or daily farm delivery? Reach out to us directly.
              </p>
            </div>

            {/* Contact Details Cards */}
            <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
              
              {/* Address */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 hover:border-amber-300/40 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center mb-3">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="text-[10px] uppercase font-black tracking-wider text-amber-300 mb-1">
                  Farm Address
                </div>
                <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-medium">
                  Chandravelli, Bellampalli, Telangana, India – 504251
                </p>
              </div>

              {/* Email */}
              <a 
                href="mailto:support@vivaanfarms.in" 
                className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 hover:border-amber-300/40 transition-colors group block"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="text-[10px] uppercase font-black tracking-wider text-amber-300 mb-1">
                  Email Us
                </div>
                <p className="text-xs sm:text-sm text-white/90 group-hover:text-amber-200 transition-colors font-medium break-all">
                  support@vivaanfarms.in
                </p>
              </a>

              {/* Mobile */}
              <a 
                href="tel:+919988667848" 
                className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 hover:border-amber-300/40 transition-colors group block"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="text-[10px] uppercase font-black tracking-wider text-amber-300 mb-1">
                  Mobile / Call
                </div>
                <p className="text-xs sm:text-sm text-white/90 group-hover:text-amber-200 transition-colors font-bold">
                  +91 99886 67848
                </p>
              </a>

            </div>

            {/* Quick Actions Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-8 sm:pt-10">
              <a
                href="https://wa.me/919988667848?text=Hello%20Vivaan%20Farms,%20I%20would%20like%20to%20know%20more%20about%20your%20fresh%20farm%20dairy%20products."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat on WhatsApp (+91 99886 67848)</span>
              </a>

              <Link
                href="/category/all"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#EAB308] text-[#1F2937] font-black text-xs uppercase tracking-wider hover:bg-[#FACC15] transition-all shadow-md active:scale-95"
              >
                <span>Explore Farm Products</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

          </div>

        </div>
      </section>

    </div>
  );
}
