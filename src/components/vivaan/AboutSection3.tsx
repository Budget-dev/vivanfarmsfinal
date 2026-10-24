"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { TimelineContent } from "@/components/ui/timeline-animation";
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal";
import { 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  Heart, 
  ShieldCheck, 
  Droplets, 
  Compass, 
  Award,
  Sun,
  Flame,
  Leaf
} from "lucide-react";

export function AboutSection3() {
  const heroRef = useRef<HTMLDivElement>(null);

  const revealVariants = {
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        delay: i * 0.12,
        duration: 0.5,
      },
    }),
    hidden: {
      filter: "blur(10px)",
      y: -20,
      opacity: 0,
    },
  };

  const scaleVariants = {
    visible: (i: number) => ({
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        delay: i * 0.15,
        duration: 0.6,
      },
    }),
    hidden: {
      filter: "blur(10px)",
      opacity: 0,
    },
  };

  return (
    <section className="py-10 md:py-20 px-4 bg-[#F9F6EF] text-[#100C06] overflow-hidden select-none" ref={heroRef}>
      <div className="max-w-6xl mx-auto">
        <div className="relative">
          {/* Header with badge & social icons */}
          <div className="flex justify-between items-center mb-4 sm:mb-8 w-full sm:w-[88%] sm:absolute lg:top-4 md:top-2 sm:top-0 z-10 px-1 sm:px-0">
            <div className="flex items-center gap-2 text-xl">
              <span className="text-amber-600 animate-spin">✱</span>
              <TimelineContent
                as="span"
                animationNum={0}
                timelineRef={heroRef}
                customVariants={revealVariants}
                className="text-xs sm:text-sm font-black text-amber-900 tracking-[3px] uppercase"
              >
                ABOUT VIVAAN FARMS
              </TimelineContent>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <TimelineContent
                as="a"
                animationNum={0}
                timelineRef={heroRef}
                customVariants={revealVariants}
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                title="Facebook"
                className="md:w-9 md:h-9 sm:w-7 w-6 sm:h-7 h-6 border border-amber-200/80 bg-white/90 shadow-2xs rounded-xl flex items-center justify-center hover:scale-105 transition-all cursor-pointer"
              >
                <img src="https://pro-section.ui-layouts.com/facebook.svg" alt="Facebook" className="w-4 h-4" />
              </TimelineContent>
              <TimelineContent
                as="a"
                animationNum={1}
                timelineRef={heroRef}
                customVariants={revealVariants}
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                title="Instagram"
                className="md:w-9 md:h-9 sm:w-7 w-6 sm:h-7 h-6 border border-amber-200/80 bg-white/90 shadow-2xs rounded-xl flex items-center justify-center hover:scale-105 transition-all cursor-pointer"
              >
                <img src="https://pro-section.ui-layouts.com/instagram.svg" alt="Instagram" className="w-4 h-4" />
              </TimelineContent>
              <TimelineContent
                as="a"
                animationNum={2}
                timelineRef={heroRef}
                customVariants={revealVariants}
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                title="YouTube"
                className="md:w-9 md:h-9 sm:w-7 w-6 sm:h-7 h-6 border border-amber-200/80 bg-white/90 shadow-2xs rounded-xl flex items-center justify-center hover:scale-105 transition-all cursor-pointer"
              >
                <img src="https://pro-section.ui-layouts.com/youtube.svg" alt="YouTube" className="w-4 h-4" />
              </TimelineContent>
            </div>
          </div>

          {/* Banner Figure with Cut SVG Clip Path */}
          <TimelineContent
            as="figure"
            animationNum={4}
            timelineRef={heroRef}
            customVariants={scaleVariants}
            className="relative group rounded-3xl overflow-hidden shadow-2xl border border-amber-900/10 mb-8"
          >
            <svg
              className="w-full h-auto min-h-[260px] md:min-h-[420px]"
              width={"100%"}
              height={"100%"}
              viewBox="0 0 100 40"
            >
              <defs>
                <clipPath
                  id="clip-inverted"
                  clipPathUnits={"objectBoundingBox"}
                >
                  <path
                    d="M0.0998072 1H0.422076H0.749756C0.767072 1 0.774207 0.961783 0.77561 0.942675V0.807325C0.777053 0.743631 0.791844 0.731953 0.799059 0.734076H0.969813C0.996268 0.730255 1.00088 0.693206 0.999875 0.675159V0.0700637C0.999875 0.0254777 0.985045 0.00477707 0.977629 0H0.902473C0.854975 0 0.890448 0.138535 0.850165 0.138535H0.0204424C0.00408849 0.142357 0 0.180467 0 0.199045V0.410828C0 0.449045 0.0136283 0.46603 0.0204424 0.469745H0.0523086C0.0696245 0.471019 0.0735527 0.497877 0.0733523 0.511146V0.915605C0.0723903 0.983121 0.090588 1 0.0998072 1Z"
                    fill="#D9D9D9"
                  />
                </clipPath>
              </defs>
              <image
                clipPath="url(#clip-inverted)"
                preserveAspectRatio="xMidYMid slice"
                width={"100%"}
                height={"100%"}
                xlinkHref="https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=1400&auto=format&fit=crop"
              />
            </svg>
          </TimelineContent>

          {/* Stats Bar */}
          <div className="flex flex-wrap lg:justify-start justify-between items-center py-4 px-2 text-sm border-b border-amber-900/10 mb-10">
            <TimelineContent
              as="div"
              animationNum={5}
              timelineRef={heroRef}
              customVariants={revealVariants}
              className="flex flex-wrap gap-4 md:gap-8"
            >
              <div className="flex items-center gap-2 sm:text-base text-xs font-semibold">
                <span className="text-amber-700 font-extrabold text-lg">100%</span>
                <span className="text-gray-700">Pure Honey</span>
                <span className="text-gray-300 hidden sm:inline">|</span>
              </div>
              <div className="flex items-center gap-2 sm:text-base text-xs font-semibold">
                <span className="text-amber-700 font-extrabold text-lg">0%</span>
                <span className="text-gray-700">Added Sugars & Additives</span>
                <span className="text-gray-300 hidden sm:inline">|</span>
              </div>
              <div className="flex items-center gap-2 sm:text-base text-xs font-semibold">
                <span className="text-amber-700 font-extrabold text-lg">50,000+</span>
                <span className="text-gray-700">Happy Families</span>
              </div>
            </TimelineContent>

            <div className="lg:absolute right-0 bottom-16 flex lg:flex-col flex-row-reverse lg:gap-0 gap-4 mt-4 lg:mt-0">
              <TimelineContent
                as="div"
                animationNum={6}
                timelineRef={heroRef}
                customVariants={revealVariants}
                className="flex lg:text-3xl sm:text-2xl text-xl items-center gap-2 mb-1"
              >
                <span className="text-amber-700 font-extrabold">100%</span>
                <span className="text-gray-800 uppercase font-black text-sm sm:text-base tracking-wider">Natural & Authentic</span>
              </TimelineContent>
              <TimelineContent
                as="div"
                animationNum={7}
                timelineRef={heroRef}
                customVariants={revealVariants}
                className="flex items-center gap-2 mb-2 sm:text-sm text-xs font-medium"
              >
                <span className="text-emerald-700 font-bold">Tested & Certified</span>
                <span className="text-gray-600">Pure Hive Sourced</span>
              </TimelineContent>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-3 gap-8 md:gap-12 items-start mb-16">
          <div className="md:col-span-2">
            <h1 className="sm:text-3xl md:text-5xl text-2xl !leading-[120%] font-black text-gray-900 mb-6 tracking-tight font-headline">
              <VerticalCutReveal
                splitBy="words"
                staggerDuration={0.08}
                staggerFrom="first"
                reverse={true}
                transition={{
                  type: "spring",
                  stiffness: 250,
                  damping: 30,
                  delay: 0.2,
                }}
              >
                Pure Honey. Straight From Nature.
              </VerticalCutReveal>
            </h1>

            <TimelineContent
              as="div"
              animationNum={9}
              timelineRef={heroRef}
              customVariants={revealVariants}
              className="space-y-6 text-gray-700"
            >
              <div className="text-sm md:text-base leading-relaxed bg-white/70 p-6 sm:p-8 rounded-3xl border border-amber-900/10 shadow-sm">
                <p className="leading-relaxed text-[#5A4628] text-base md:text-lg mb-4">
                  At <strong className="text-amber-900 font-extrabold">Vivaan Farms</strong>, we believe that the best honey is nature’s own honey — pure, natural, and full of authentic taste.
                </p>
                <p className="leading-relaxed text-[#7A6848] text-sm md:text-base">
                  We bring you carefully collected honey from healthy hives, preserving its natural character, aroma, and flavour. Our aim is simple: to provide families with quality honey they can trust and enjoy every day.
                </p>
              </div>

              {/* Our Story Card */}
              <div className="bg-gradient-to-br from-amber-500/10 via-white to-amber-500/5 p-6 sm:p-8 rounded-3xl border border-amber-500/20 shadow-sm">
                <div className="flex items-center gap-2 text-amber-800 font-headline font-black text-xl md:text-2xl mb-3">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                  <h2>Our Story</h2>
                </div>
                <p className="leading-relaxed text-[#5A4628] text-sm md:text-base mb-5">
                  Vivaan Farms was created with a passion for bringing the goodness of natural honey closer to people. From the hive to every jar, we focus on maintaining the natural quality of our honey while ensuring it is carefully packed for you.
                </p>
                
                <div className="pt-2 border-t border-amber-200/60">
                  <div className="text-xs font-black uppercase tracking-wider text-amber-900 mb-3">
                    Our Signature Varieties:
                  </div>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {[
                      { name: "Himalayan Dark Honey", desc: "Deep aroma & rich natural minerals" },
                      { name: "Multi-Floral Honey", desc: "Balanced sweet nectar from wild blooms" },
                      { name: "Wild Forest Honey", desc: "Raw, robust flavor from untouched groves" }
                    ].map((variety, i) => (
                      <div key={i} className="bg-white p-3.5 rounded-2xl border border-amber-200 shadow-2xs">
                        <div className="font-extrabold text-amber-900 text-xs md:text-sm mb-1">{variety.name}</div>
                        <div className="text-[11px] text-[#7A6848] leading-tight">{variety.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TimelineContent>
          </div>

          {/* Right Sidebar / Brand Info */}
          <div className="md:col-span-1">
            <div className="bg-white p-7 sm:p-8 rounded-3xl border border-amber-900/10 shadow-xl text-left md:text-right sticky top-28">
              <TimelineContent
                as="div"
                animationNum={12}
                timelineRef={heroRef}
                customVariants={revealVariants}
                className="text-amber-800 text-2xl md:text-3xl font-black tracking-wider mb-1 font-headline"
              >
                VIVAAN FARMS
              </TimelineContent>
              <TimelineContent
                as="div"
                animationNum={13}
                timelineRef={heroRef}
                customVariants={revealVariants}
                className="text-amber-600 text-xs font-extrabold uppercase tracking-widest mb-6"
              >
                Pure Honey · Nature’s Sweetness
              </TimelineContent>

              <TimelineContent
                as="div"
                animationNum={14}
                timelineRef={heroRef}
                customVariants={revealVariants}
                className="mb-6 space-y-4"
              >
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-left">
                  <div className="text-xs font-black text-amber-900 uppercase tracking-wider mb-1">Our Promise</div>
                  <p className="text-xs text-[#5A4628] leading-relaxed font-medium">
                    At Vivaan Farms, we don&apos;t just want to sell honey. We want to build a relationship with our customers based on trust.
                  </p>
                  <p className="text-xs font-extrabold text-amber-800 mt-2">
                    Pure by nature. Carefully brought to you by Vivaan Farms.
                  </p>
                </div>

                <p className="text-gray-800 text-xs sm:text-sm font-semibold leading-relaxed">
                  Ready to experience unadulterated nature in every spoonful?
                </p>
              </TimelineContent>

              <TimelineContent
                as="a"
                animationNum={15}
                timelineRef={heroRef}
                customVariants={revealVariants}
                href="/category/honey"
                className="inline-flex items-center justify-center gap-2 hover:gap-3 bg-amber-900 hover:bg-amber-950 text-white px-6 py-3.5 rounded-2xl cursor-pointer font-bold text-xs uppercase tracking-widest shadow-lg transition-all duration-300 ease-in-out w-full"
              >
                <span>EXPLORE OUR HONEY</span> <ArrowRight className="w-4 h-4" />
              </TimelineContent>
            </div>
          </div>
        </div>

        {/* Section 2: Our Commitment */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <span className="text-xs font-black text-amber-800 tracking-[3px] uppercase">OUR STANDARD</span>
            <h2 className="font-headline text-2xl md:text-4xl font-extrabold text-[#100C06] mt-1">
              Our Commitment
            </h2>
            <p className="text-xs sm:text-sm text-[#7A6848] max-w-xl mx-auto mt-2">
              We are committed to providing honey that upholds the highest standards of natural purity and integrity.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[
              {
                icon: <Droplets className="w-6 h-6 text-amber-600" />,
                title: "100% Pure Honey",
                desc: "Never adulterated, never diluted. Pure nectar straight from healthy hives."
              },
              {
                icon: <Leaf className="w-6 h-6 text-emerald-600" />,
                title: "Natural & Authentic",
                desc: "Retaining authentic floral aromas, enzymes, and the natural depth of raw honey."
              },
              {
                icon: <ShieldCheck className="w-6 h-6 text-amber-700" />,
                title: "Free From Added Ingredients",
                desc: "Zero added sugars, syrups, artificial colorings, or synthetic preservatives."
              },
              {
                icon: <Award className="w-6 h-6 text-amber-600" />,
                title: "Carefully Collected & Packed",
                desc: "Ethically harvested with respect for bees, hygienic processing, and sealed in jars."
              },
              {
                icon: <Compass className="w-6 h-6 text-emerald-600" />,
                title: "Transparent Information",
                desc: "Clear and transparent details about our ingredients and nutritional profiles."
              },
              {
                icon: <Heart className="w-6 h-6 text-rose-500" />,
                title: "Family First Quality",
                desc: "Wholesome natural sweetness you can confidently share with your loved ones every day."
              }
            ].map((item, idx) => (
              <div 
                key={idx}
                className="bg-white p-6 rounded-3xl border border-amber-900/10 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <h3 className="font-headline text-lg font-bold text-gray-900 mb-1.5 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#7A6848] leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: From Hive to Your Home & Mission */}
        <div className="grid md:grid-cols-2 gap-8 items-stretch">
          {/* Hive to Home */}
          <div className="bg-gradient-to-br from-[#2D5A27] to-[#1E3F1A] text-white p-8 md:p-10 rounded-3xl shadow-xl flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-amber-300 mb-4">
                <Sun className="w-3.5 h-3.5" /> Direct & Pure
              </div>
              <h2 className="font-headline text-2xl md:text-3xl font-extrabold mb-4">
                From Hive to Your Home
              </h2>
              <p className="text-white/80 text-sm md:text-base leading-relaxed mb-6">
                Every jar represents our effort to bring nature’s sweetness to your table. We carefully handle and pack our honey while preserving the qualities that make natural honey special.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/15">
              <div className="text-xs text-amber-200 font-bold uppercase tracking-wider mb-1">Our Philosophy</div>
              <p className="text-sm font-semibold text-white">
                “Pure honey, honest quality, and the goodness of nature.”
              </p>
            </div>
          </div>

          {/* Mission */}
          <div className="bg-white p-8 md:p-10 rounded-3xl border border-amber-900/10 shadow-xl flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Purpose Driven
              </div>
              <h2 className="font-headline text-2xl md:text-3xl font-extrabold text-[#100C06] mb-4">
                Our Mission
              </h2>
              <p className="text-[#7A6848] text-sm md:text-base leading-relaxed mb-6">
                Our mission is to make high-quality natural honey accessible to more families while building a brand based on <strong className="text-amber-900">purity, trust, transparency, and quality</strong>.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-amber-100">
              <div className="text-center p-3 bg-amber-50/60 rounded-2xl">
                <div className="font-headline font-black text-lg text-amber-900">Purity & Trust</div>
                <div className="text-[11px] text-[#7A6848]">Core Foundation</div>
              </div>
              <div className="text-center p-3 bg-amber-50/60 rounded-2xl">
                <div className="font-headline font-black text-lg text-amber-900">Transparency</div>
                <div className="text-[11px] text-[#7A6848]">Open & Honest</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
