"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Header } from '@/components/vivaan/Header';
import { Footer } from '@/components/vivaan/Footer';
import { Ticker } from '@/components/vivaan/Ticker';
import { BottomNav } from '@/components/vivaan/BottomNav';
import { CartSidebar } from '@/components/vivaan/CartSidebar';
import { useCart } from '@/hooks/use-cart';
import { Mail, Phone, MapPin, Send, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function ContactPage() {
  const router = useRouter();
  const { cart, updateQty, removeFromCart, totalQty } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);

  const handleTabChange = (tab: string) => {
    if (tab === 'home' || tab === 'shop') {
      router.push('/');
    } else if (tab === 'cart') {
      setIsCartOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F6EF] text-[#100C06] pb-24 md:pb-0">
      <div className="sticky top-0 z-[900]">
        <Ticker />
        <Header 
          onOpenCart={() => setIsCartOpen(true)} 
          cartCount={totalQty}
          onFilter={() => router.push('/')}
          onSearch={() => router.push('/')}
        />
      </div>

      <main className="py-6 sm:py-12 md:py-24">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-16 md:gap-24">
            <motion.div 
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 sm:space-y-12"
            >
              <div className="space-y-3 sm:space-y-6">
                <span className="text-[10px] font-black text-primary tracking-[3px] uppercase px-3.5 py-1.5 bg-primary/5 rounded-full inline-block">Contact Us</span>
                <h1 className="font-headline text-2xl sm:text-5xl md:text-7xl font-extrabold text-primary leading-tight">Reach the Farm.</h1>
                <p className="text-sm sm:text-lg text-[#7A6848] font-medium leading-relaxed max-w-lg">
                  Whether you have questions about our Bilona Ghee or want to visit our Gujarat farm, we&apos;re here to help you on your purity journey.
                </p>
              </div>

              <div className="space-y-6 sm:space-y-8">
                {[
                  { icon: <Mail className="w-5 h-5 sm:w-6 sm:h-6" />, label: "Email Us", val: "care@vivaanfarms.com", href: "mailto:care@vivaanfarms.com" },
                  { icon: <Phone className="w-5 h-5 sm:w-6 sm:h-6" />, label: "Call Us", val: "+91 98765 43210", href: "tel:+919876543210" },
                  { icon: <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />, label: "Visit Farm", val: "Rajkot, Gujarat, India", href: "https://maps.google.com/?q=Rajkot,+Gujarat,+India" },
                ].map((item, i) => (
                  <a 
                    key={i} 
                    href={item.href}
                    target={item.href.startsWith('http') ? '_blank' : undefined}
                    rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="flex items-start gap-4 sm:gap-6 group p-2 -m-2 rounded-2xl hover:bg-primary/5 transition-colors"
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-2xl flex items-center justify-center text-primary shadow-md border border-primary/5 group-hover:scale-105 transition-transform shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-[#7A6848] uppercase tracking-[2px] mb-0.5">{item.label}</div>
                      <div className="text-lg sm:text-xl font-bold text-primary break-all group-hover:underline">{item.val}</div>
                    </div>
                  </a>
                ))}
              </div>

              <div className="p-6 sm:p-8 bg-[#EBF5EE] rounded-[28px] sm:rounded-[32px] border border-primary/10">
                <div className="flex items-center gap-3 mb-3">
                  <MessageSquare className="text-primary w-5 h-5" />
                  <h3 className="font-headline text-xl sm:text-2xl font-black text-primary">Live Support</h3>
                </div>
                <p className="text-xs sm:text-sm text-[#7A6848] font-medium mb-5">Our farm desk is available Mon-Sat, 9am - 7pm IST.</p>
                <a
                  href="https://wa.me/919876543210?text=Hi%20Vivaan%20Farms%2C%20I%20have%20an%20inquiry%20regarding%20pure%20Gir%20cow%20ghee."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center h-12 px-7 bg-primary hover:bg-secondary text-white rounded-full text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all min-h-[44px]"
                >
                  Chat on WhatsApp
                </a>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.08 }}
              className="bg-white p-6 sm:p-8 md:p-12 rounded-[28px] sm:rounded-[40px] shadow-xl border border-primary/5"
            >
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  alert("Thank you! Your message has been sent to our farm desk. We will respond within 24 hours.");
                }} 
                className="space-y-5 sm:space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#7A6848]">Full Name</label>
                    <Input 
                      required
                      autoComplete="name"
                      placeholder="Enter your name" 
                      className="h-13 sm:h-14 rounded-2xl bg-[#F9F6EF] border-transparent font-bold text-sm" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#7A6848]">Email Address</label>
                    <Input 
                      required
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="name@example.com" 
                      className="h-13 sm:h-14 rounded-2xl bg-[#F9F6EF] border-transparent font-bold text-sm" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#7A6848]">Subject</label>
                  <Input 
                    placeholder="How can we help?" 
                    className="h-13 sm:h-14 rounded-2xl bg-[#F9F6EF] border-transparent font-bold text-sm" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#7A6848]">Your Message</label>
                  <Textarea 
                    required
                    placeholder="Tell us more about your inquiry..." 
                    className="min-h-[140px] sm:min-h-[160px] rounded-2xl bg-[#F9F6EF] border-transparent font-bold p-4 sm:p-5 text-sm" 
                  />
                </div>
                <Button type="submit" className="w-full h-14 sm:h-16 bg-primary hover:bg-secondary text-white rounded-full font-black uppercase tracking-[2px] shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-transform min-h-[48px]">
                  Send Message <Send className="w-4 h-4" />
                </Button>
              </form>
            </motion.div>
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
        onCheckout={() => { setIsCartOpen(false); router.push('/checkout'); }}
      />
    </div>
  );
}
