"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Instagram,
  Youtube,
  Globe,
} from "lucide-react";

export const HoverFooter: React.FC = () => {
  const [year, setYear] = useState<number>(2026);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  const footerLinks = [
    {
      title: "Our Purity",
      links: [
        { label: "Bilona Method", href: "/about" },
        { label: "Gir Cow Heritage", href: "/about" },
        { label: "Lab Reports", href: "/blog" },
        { label: "Farm Visit", href: "/about" },
      ],
    },
    {
      title: "Quick Links",
      links: [
        { label: "A2 Ghee", href: "/" },
        { label: "Honey", href: "/" },
        { label: "Sweets", href: "/" },
        { label: "Contact Support", href: "#", pulse: true },
      ],
    },
  ];

  return (
    <footer className="bg-primary text-white relative h-fit rounded-[40px] overflow-hidden m-4 md:m-8 shadow-2xl">
      <div className="max-w-[1400px] mx-auto p-8 md:p-16 z-40 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand section */}
          <div className="flex flex-col space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-44 h-14 relative">
                <Image 
                  src="/images/logo-white.png"
                  alt="Vivaan Farms Logo"
                  fill
                  className="object-contain object-left"
                />
              </div>
            </div>
            <p className="text-sm text-white/60 leading-relaxed font-medium">
              Authentic farm-direct purity from the heart of Gujarat. Traditional Bilona method A2 Ghee and handcrafted goods.
            </p>
          </div>

          {/* Links */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h4 className="text-[11px] font-black text-white/40 uppercase tracking-[3px] mb-8">
                {section.title}
              </h4>
              <ul className="space-y-4">
                {section.links.map((link) => (
                  <li key={link.label} className="relative w-fit">
                    <Link
                      href={link.href}
                      className="text-sm font-semibold hover:text-accent transition-colors"
                    >
                      {link.label}
                    </Link>
                    {link.pulse && (
                      <span className="absolute -right-3 top-1 w-1.5 h-1.5 rounded-full bg-accent animate-ping"></span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact section */}
          <div>
            <h4 className="text-[11px] font-black text-white/40 uppercase tracking-[3px] mb-8">
              Reach Us
            </h4>
            <ul className="space-y-5">
              <li className="flex items-center space-x-4 group">
                <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center group-hover:bg-white/10 transition-all">
                  <Mail size={16} className="text-accent" />
                </div>
                <a href="mailto:care@vivaanfarms.com" className="text-sm font-semibold hover:text-accent transition-colors">care@vivaanfarms.com</a>
              </li>
              <li className="flex items-center space-x-4 group">
                <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center group-hover:bg-white/10 transition-all">
                  <Phone size={16} className="text-accent" />
                </div>
                <a href="tel:+919999999999" className="text-sm font-semibold hover:text-accent transition-colors">+91 98765 43210</a>
              </li>
              <li className="flex items-center space-x-4 group">
                <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center group-hover:bg-white/10 transition-all">
                  <MapPin size={16} className="text-accent" />
                </div>
                <span className="text-sm font-semibold">Rajkot, Gujarat</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex space-x-6 text-white/40">
            {[Facebook, Instagram, Youtube, Globe].map((Icon, i) => (
              <button key={i} className="hover:text-white transition-colors">
                <Icon size={20} />
              </button>
            ))}
          </div>
          <p className="text-[11px] font-black text-white/30 uppercase tracking-[2px]">
            &copy; {year} Vivaan Farms. Pure Heritage.
          </p>
        </div>
      </div>

      {/* Cinematic Text Background */}
      <div className="absolute bottom-[-10%] left-0 w-full select-none pointer-events-none opacity-[0.03] overflow-hidden whitespace-nowrap">
        <h2 className="text-[25vw] font-headline font-extrabold leading-none animate-draw-vivaan">VIVAAN</h2>
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>

      <style>{`
        @keyframes draw-vivaan {
          0% { transform: translateY(10%); opacity: 0; }
          100% { transform: translateY(0); opacity: 0.03; }
        }
        .animate-draw-vivaan {
          animation: draw-vivaan 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </footer>
  );
}
