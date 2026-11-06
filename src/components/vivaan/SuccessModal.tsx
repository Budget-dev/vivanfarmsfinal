"use client";

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose, total }) => {
  const [confetti, setConfetti] = useState<React.ReactNode[]>([]);

  useEffect(() => {
    if (isOpen) {
      const colors = ['#1B5E3B', '#0D3520', '#FFFFFF', '#237348', '#D0EDD8', '#EBF5EE'];
      const pieces = Array.from({ length: 40 }).map((_, i) => {
        const size = 5 + Math.random() * 10;
        const left = Math.random() * 100;
        const delay = Math.random() * 3;
        const duration = 2 + Math.random() * 2.5;
        const color = colors[Math.floor(Math.random() * colors.length)];
        return (
          <div 
            key={i}
            className="absolute animate-fall"
            style={{ 
              left: `${left}%`, 
              width: `${size}px`, 
              height: `${size}px`, 
              backgroundColor: color, 
              animationDelay: `${delay}s`, 
              animationDuration: `${duration}s`,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              top: '-20px'
            }}
          />
        );
      });
      setConfetti(pieces);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/60 backdrop-blur-lg p-5">
      <div className="bg-gradient-to-br from-primary via-secondary to-[#3AAA60] rounded-[32px] max-w-[520px] w-full p-12 text-center shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="absolute inset-0 pointer-events-none">
          {confetti}
        </div>
        
        <div className="relative z-10">
          <div className="w-28 h-28 bg-white/10 border-2 border-white/25 rounded-full flex items-center justify-center mx-auto mb-8 text-6xl animate-pulse">
            ✅
          </div>
          <h2 className="font-headline text-5xl font-extrabold text-white mb-4">Order Placed! 🌿</h2>
          <p className="text-white/65 text-sm leading-relaxed mb-8 max-w-[340px] mx-auto">
            Your farm-fresh order is being carefully packed at Vivaan Farms. Bringing farm freshness directly to your home! 🌿
          </p>
          
          <div className="bg-white/10 border border-white/20 rounded-2xl p-4 flex items-center gap-4 mb-6 text-left">
            <div className="text-4xl">🪙</div>
            <div>
              <div className="text-lg font-black text-white">+545 Purity Coins Earned!</div>
              <div className="text-xs text-white/50 font-medium">Worth ₹54 · Valid 90 days</div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/15 rounded-[20px] p-6 space-y-3 mb-8 text-left">
             <div className="flex justify-between items-center text-xs">
                <span className="text-white/40 font-semibold uppercase tracking-wider">Order ID</span>
                <span className="text-white font-bold">#VF-2024-8842</span>
             </div>
             <div className="flex justify-between items-center text-xs">
                <span className="text-white/40 font-semibold uppercase tracking-wider">Amount Paid</span>
                <span className="text-white font-black text-base">₹{total.toLocaleString('en-IN')}</span>
             </div>
             <div className="flex justify-between items-center text-xs">
                <span className="text-white/40 font-semibold uppercase tracking-wider">Delivery</span>
                <span className="text-white font-bold">3–5 Business Days 📦</span>
             </div>
             <div className="flex justify-between items-center text-xs">
                <span className="text-white/40 font-semibold uppercase tracking-wider">Total Saved</span>
                <span className="text-[#80EBA8] font-bold">₹1,518 🎉</span>
             </div>
          </div>

          <Button 
            onClick={onClose}
            className="w-full h-14 bg-white text-primary rounded-full text-base font-black uppercase tracking-widest hover:bg-background transition-all"
          >
            ← Continue Shopping
          </Button>
        </div>
      </div>
      <style>{`
        @keyframes fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(500px) rotate(400deg); opacity: 0; }
        }
        .animate-fall {
          animation-name: fall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
      `}</style>
    </div>
  );
};
