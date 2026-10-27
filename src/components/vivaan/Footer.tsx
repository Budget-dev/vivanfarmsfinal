"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Phone, 
  Mail, 
  Clock, 
  Instagram, 
  Youtube, 
  Facebook, 
  CheckCircle2, 
  ShieldCheck, 
  Truck,
  ArrowRight
} from 'lucide-react';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  return (
    <footer className="w-full bg-[#0D3B2E] text-white border-t border-[#09281F] select-none">
      
      {/* ── Main Footer Grid ── */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 py-6 pb-20 md:py-16 md:pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 md:gap-8 lg:gap-10">
          
          {/* Column 1: Brand & Contact */}
          <div className="lg:col-span-2 space-y-3 md:space-y-4">
            <Link href="/" className="inline-block relative h-12 w-48 mb-1">
              <Image
                src="/images/logo-white.png"
                alt="Vivaan Farms"
                fill
                className="object-contain object-left"
              />
            </Link>

            <p className="text-[11px] md:text-sm text-emerald-100/80 leading-relaxed max-w-sm">
              Reviving authentic Vedic food traditions from our native soil to your table. Handcrafted A2 Gir Cow Bilona Ghee, cold wood-pressed unrefined oils, and raw forest honey with zero chemicals.
            </p>

            <div className="space-y-1.5 md:space-y-2 text-[11px] md:text-sm text-emerald-100/90 pt-0.5 md:pt-1">
              <a href="tel:+919217428737" className="flex items-center gap-2 hover:text-[#F8D279] transition-colors">
                <Phone className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#F8D279] shrink-0" />
                <span>Customer Care: +91 92174 28737 / +91 89508 00633</span>
              </a>
              <a href="mailto:support@varahifarms.com" className="flex items-center gap-2 hover:text-[#F8D279] transition-colors">
                <Mail className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#F8D279] shrink-0" />
                <span>support@varahifarms.com</span>
              </a>
              <div className="flex items-center gap-2 text-emerald-200/60 text-[10px] md:text-xs">
                <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#F8D279] shrink-0" />
                <span>Monday - Sunday: 8:00 AM - 8:00 PM IST</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-2.5 md:gap-3 pt-1 md:pt-2">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-white/10 hover:bg-[#F8D279] hover:text-[#0D3B2E] transition-all flex items-center justify-center text-white" aria-label="Instagram">
                <Instagram className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-white/10 hover:bg-[#F8D279] hover:text-[#0D3B2E] transition-all flex items-center justify-center text-white" aria-label="YouTube">
                <Youtube className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-white/10 hover:bg-[#F8D279] hover:text-[#0D3B2E] transition-all flex items-center justify-center text-white" aria-label="Facebook">
                <Facebook className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Shop */}
          <div className="space-y-2 md:space-y-3">
            <h4 className="font-serif font-black text-xs md:text-sm uppercase tracking-wider text-[#F8D279]">
              Our Pantry
            </h4>
            <ul className="space-y-1.5 md:space-y-2 text-[11px] md:text-sm text-emerald-100/80">
              <li>
                <Link href="/category/ghee" className="hover:text-white transition-colors">
                  A2 Desi Gir Cow Ghee
                </Link>
              </li>
              <li>
                <Link href="/category/ghee" className="hover:text-white transition-colors">
                  Murrah Buffalo Bilona Ghee
                </Link>
              </li>
              <li>
                <Link href="/category/ghee" className="hover:text-white transition-colors">
                  Native Hallikar Cow Ghee
                </Link>
              </li>
              <li>
                <Link href="/category/sweets" className="hover:text-white transition-colors">
                  Artisanal Bilona Ghee Laddus
                </Link>
              </li>
              <li>
                <Link href="/category/sweets" className="hover:text-white transition-colors">
                  Mathura Peda & Barfi Assortment
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Trust & Process */}
          <div className="space-y-2 md:space-y-3">
            <h4 className="font-serif font-black text-xs md:text-sm uppercase tracking-wider text-[#F8D279]">
              Transparency
            </h4>
            <ul className="space-y-1.5 md:space-y-2 text-[11px] md:text-sm text-emerald-100/80">
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  Our Native Farms & Dairy
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  The Vedic Bilona Method
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  Wood Press Extraction
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  Lab Test Reports
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Bulk & Export Inquiries
                </Link>
              </li>
              <li>
                <Link href="/track" className="hover:text-white transition-colors">
                  Track Your Order
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Newsletter Box */}
          <div className="space-y-2 md:space-y-3">
            <h4 className="font-serif font-black text-xs md:text-sm uppercase tracking-wider text-[#F8D279]">
              Join The Family
            </h4>
            <p className="text-[11px] md:text-xs text-emerald-100/80 leading-relaxed">
              Subscribe to get <span className="text-[#F8D279] font-bold">10% OFF</span> on your next order, weekly purity tips & exclusive harvest access.
            </p>

            <form onSubmit={handleSubscribe} className="space-y-1.5 md:space-y-2 pt-0.5 md:pt-1">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  required
                  className="w-full bg-[#144D3D] border border-white/20 rounded-xl px-3 md:px-3.5 py-2 md:py-2.5 text-[11px] md:text-xs text-white placeholder-emerald-200/50 focus:outline-none focus:border-[#F8D279] transition-colors"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1.5 bottom-1.5 px-2.5 md:px-3 rounded-lg bg-[#F8D279] text-[#0D3B2E] font-black text-[10px] md:text-[11px] uppercase hover:bg-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>Join</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {subscribed && (
                <p className="text-xs text-emerald-300 font-bold flex items-center gap-1 pt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Welcome to Vivaan Farms!
                </p>
              )}
            </form>

            <div className="pt-1 md:pt-2 text-[10px] md:text-[11px] text-emerald-200/60 leading-tight">
              🔒 100% Privacy. Zero Spam Guarantee.
            </div>
          </div>

        </div>

        {/* ── Bottom Bar: Copyright & Payment Badges ── */}
        <div className="mt-6 md:mt-12 pt-4 md:pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4 text-[10px] md:text-xs text-emerald-200/70">
          <p className="text-center md:text-left">
            © 2026 Vivaan Organic Farms Private Limited. All Rights Reserved. FSSAI Lic. No. 10822003000214
          </p>
          <div className="flex items-center gap-2.5 md:gap-3 text-[10px] md:text-xs font-semibold text-emerald-100/90">
            <span>🛡️ 100% Secure Checkout</span>
            <span>·</span>
            <span>UPI / Cards / NetBanking / COD</span>
          </div>
        </div>

      </div>

    </footer>
  );
};
