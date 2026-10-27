"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Header } from '@/components/vivaan/Header';
import { Footer } from '@/components/vivaan/Footer';
import { Ticker } from '@/components/vivaan/Ticker';
import { BottomNav } from '@/components/vivaan/BottomNav';
import { CartSidebar } from '@/components/vivaan/CartSidebar';
import { PaymentModal } from '@/components/vivaan/PaymentModal';
import { SuccessModal } from '@/components/vivaan/SuccessModal';
import { useCart } from '@/hooks/use-cart';
import { ArrowRight, Calendar, User } from 'lucide-react';

const BLOG_POSTS = [
  {
    id: 1,
    title: "Why A2 Ghee is the Superfood Your Gut Needs",
    excerpt: "Discover the scientific reasons why the A2 beta-casein protein in Gir Cow Ghee is a game-changer for digestion and inflammation.",
    image: "https://picsum.photos/seed/blog1/800/500",
    date: "Feb 15, 2025",
    author: "Dr. Meena Iyer",
    cat: "Wellness"
  },
  {
    id: 2,
    title: "5 Traditional Recipes That Taste Better with Bilona Ghee",
    excerpt: "From the perfect dal tadka to crispy Mysore Pak, we explore the culinary magic of hand-churned farm-direct ghee.",
    image: "https://picsum.photos/seed/blog2/800/500",
    date: "Feb 10, 2025",
    author: "Chef Rajeev",
    cat: "Recipes"
  },
  {
    id: 3,
    title: "The Story of the Gir Cow: India's Golden Heritage",
    excerpt: "Learn about the history and spiritual significance of the indigenous Gir cows of Gujarat and why their milk is special.",
    image: "https://picsum.photos/seed/blog3/800/500",
    date: "Feb 02, 2025",
    author: "Farm Desk",
    cat: "Heritage"
  },
  {
    id: 4,
    title: "How to Spot Fake Ghee: 3 Simple Home Tests",
    excerpt: "Don't let commercial brands fool you. Here are three simple ways to check the purity of your ghee at home.",
    image: "https://picsum.photos/seed/blog4/800/500",
    date: "Jan 28, 2025",
    author: "Purity Lab",
    cat: "Education"
  },
  {
    id: 5,
    title: "Spring Detox: The Ayurvedic Way with Ghee",
    excerpt: "Explore the ancient practice of Oleation and how pure A2 ghee can help flush out toxins from your body this spring.",
    image: "https://picsum.photos/seed/blog5/800/500",
    date: "Jan 20, 2025",
    author: "Acharya Vinay",
    cat: "Ayurveda"
  },
  {
    id: 6,
    title: "Cold Pressed vs. Refined Oils: What You Need to Know",
    excerpt: "Understanding the difference in extraction methods and why wood-pressed oils are essential for a healthy heart.",
    image: "https://picsum.photos/seed/blog6/800/500",
    date: "Jan 12, 2025",
    author: "Health Desk",
    cat: "Nutrition"
  }
];

export default function BlogPage() {
  const router = useRouter();
  const { cart, updateQty, removeFromCart, totalQty, subtotal, clearCart } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);

  const handleTabChange = (tab: string) => {
    if (tab === 'home' || tab === 'shop') {
      router.push('/');
    } else if (tab === 'cart') {
      setIsCartOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F6EF] text-[#100C06] pb-28 md:pb-0">
      <div className="sticky top-0 z-[900]">
        <Ticker />
        <Header 
          onOpenCart={() => setIsCartOpen(true)} 
          cartCount={totalQty}
          onFilter={() => router.push('/')}
          onSearch={() => router.push('/')}
        />
      </div>

      <main className="py-6 sm:py-12 md:py-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-5 md:px-10">
          <div className="text-center mb-8 sm:mb-16 space-y-2 sm:space-y-4">
            <span className="text-[10px] font-black text-[#7A6848] tracking-[3px] uppercase">Vivaan Journal</span>
            <h1 className="font-headline text-3xl sm:text-5xl md:text-7xl font-extrabold">Wellness & Wisdom</h1>
            <p className="text-[#7A6848] max-w-2xl mx-auto text-sm sm:text-lg">Insights from our farm, traditional recipes, and scientific guides to healthy living.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10">
            {BLOG_POSTS.map((post, idx) => (
              <motion.article 
                key={post.id} 
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(idx * 0.06, 0.24) }}
                className="group cursor-pointer"
              >
                <div className="relative aspect-[16/10] rounded-[24px] overflow-hidden mb-6 shadow-lg">
                  <Image 
                    src={post.image} 
                    alt={post.title} 
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-primary shadow-sm">
                    {post.cat}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-[11px] text-[#7A6848] font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {post.date}</span>
                    <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {post.author}</span>
                  </div>
                  <h2 className="font-headline text-2xl md:text-3xl font-bold leading-tight group-hover:text-primary transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-[#7A6848] text-sm leading-relaxed line-clamp-2 font-medium">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center gap-2 text-sm font-black text-primary group-hover:gap-3 transition-all">
                    Read Journal <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </main>

      <Footer />
      
      <BottomNav activeTab="account" onTabChange={handleTabChange} cartCount={totalQty} />

      <CartSidebar 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQty={updateQty}
        onRemove={removeFromCart}
        onCheckout={() => { setIsCartOpen(false); setIsPaymentOpen(true); }}
      />

      <PaymentModal 
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        total={Math.max(0, subtotal - 200)}
        itemCount={totalQty}
        onSuccess={() => { setIsPaymentOpen(false); setIsSuccessOpen(true); }}
      />

      <SuccessModal 
        isOpen={isSuccessOpen}
        onClose={() => { setIsSuccessOpen(false); clearCart(); }}
        total={Math.max(0, subtotal - 200)}
      />
    </div>
  );
}
