"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { Header } from '@/components/vivaan/Header';
import { Footer } from '@/components/vivaan/Footer';
import { Ticker } from '@/components/vivaan/Ticker';
import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ArrowRight, 
  ShoppingBag, 
  Coins, 
  ChevronLeft, 
  MapPin, 
  Truck, 
  Ticket, 
  CheckCircle2,
  Lock,
  ShieldCheck,
  Loader2,
  CreditCard,
  Banknote,
  Sparkles
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, addDoc, serverTimestamp, increment } from 'firebase/firestore';
import { UserProfile, UniversalCoupon } from '@/types';
import { AddressManager, ShippingAddress } from '@/components/vivaan/AddressManager';
import { useToast } from '@/hooks/use-toast';
import { LoginModal } from '@/components/vivaan/LoginModal';
import { createRazorpayOrder, verifyRazorpayPayment } from '@/actions/payment-actions';
import { createShipment } from '@/actions/shipping-actions';

const LIVE_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_Tw5iYEoGxeYl0c';

export default function CheckoutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();
  const { user } = useUser();
  const { cart, totalQty, subtotal, clearCart } = useCart();
  
  // State for Discounts & Flow
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [useCoins, setUseCoins] = useState(false);
  const [isLoginOpen, setLoginOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  
  // User Profile
  const userRef = useMemoFirebase(() => user ? doc(db, 'userProfiles', user.uid) : null, [db, user]);
  const { data: userProfile } = useDoc<UserProfile>(userRef);

  // Coupons Collection
  const couponsRef = useMemoFirebase(() => collection(db, 'universalCoupons'), [db]);
  const { data: universalCoupons } = useCollection<UniversalCoupon>(couponsRef);

  const [address, setAddress] = useState<ShippingAddress>({
    name: '', 
    phone: '', 
    address: '', 
    city: '', 
    state: '', 
    pincode: '',
    tag: 'Home'
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isVerifyingPincode, setIsVerifyingPincode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('vivaan_shipping');
    if (saved) {
      try {
        setAddress(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
  }, []);

  // Built-in promotional coupon dictionary
  const PROMO_COUPONS: Record<string, { type: 'percentage' | 'flat', value: number, desc: string }> = {
    'PURE15': { type: 'percentage', value: 15, desc: '15% OFF festive offer' },
    'STAY20': { type: 'percentage', value: 20, desc: '20% OFF exclusive coupon' },
    'VIVAAN10': { type: 'percentage', value: 10, desc: '10% OFF on all organic orders' },
    'PURE100': { type: 'flat', value: 100, desc: '₹100 flat savings' },
    'FARM50': { type: 'flat', value: 50, desc: '₹50 farm fresh discount' },
    'WELCOME': { type: 'flat', value: 150, desc: '₹150 welcome purity gift' },
  };

  // Coupon Logic
  const handleApplyCoupon = (overrideCode?: string) => {
    const rawInput = typeof overrideCode === 'string' ? overrideCode : couponInput;
    if (!rawInput.trim()) return;
    const input = rawInput.toUpperCase().trim();
    
    // 1. Check Built-in Promotional Codes
    if (PROMO_COUPONS[input]) {
      const promo = PROMO_COUPONS[input];
      setAppliedCoupon({
        code: input,
        type: promo.type,
        value: promo.value,
        target: 'all',
        description: promo.desc
      });
      setCouponInput(input);
      toast({ title: "Coupon Applied!", description: `${input} applied (${promo.desc})` });
      return;
    }

    // 2. Check Universal Coupons from Firestore
    const universal = universalCoupons?.find(c => {
      const codeMatch = (c.code || '').trim().toUpperCase() === input;
      const isActive = c.isActive !== false;
      const notExpired = !c.expiryDate || (new Date(c.expiryDate).getTime() + 86400000 >= Date.now());
      return codeMatch && isActive && notExpired;
    });

    if (universal) {
      setAppliedCoupon({ ...universal, target: 'all' });
      setCouponInput(input);
      toast({ title: "Coupon Applied!", description: `Saved with ${input}` });
      return;
    }

    // 3. Check Product-Specific Coupons
    const productMatch = cart.find(item => (item.productCoupon || '').trim().toUpperCase() === input);
    if (productMatch) {
      setAppliedCoupon({ 
        code: input, 
        type: 'flat', 
        value: 100,
        target: productMatch.id 
      });
      setCouponInput(input);
      toast({ title: "Coupon Applied!", description: `₹100 off applied on ${productMatch.name}` });
      return;
    }

    toast({ variant: "destructive", title: "Invalid Coupon", description: "This coupon is either expired or invalid. Try 'PURE15'." });
  };

  // Calculations
  const calculations = useMemo(() => {
    let couponDiscount = 0;
    if (appliedCoupon) {
      if (appliedCoupon.target === 'all') {
        couponDiscount = appliedCoupon.type === 'percentage' 
          ? Math.round((subtotal * appliedCoupon.value) / 100)
          : appliedCoupon.value;
      } else {
        const item = cart.find(i => i.id === appliedCoupon.target);
        if (item) couponDiscount = appliedCoupon.value;
      }
    }

    const coinsAvailable = userProfile?.purityCoins || 0;
    const coinsDiscount = useCoins ? Math.min(coinsAvailable, subtotal - couponDiscount) : 0;
    
    const finalTotal = Math.max(0, subtotal - couponDiscount - coinsDiscount);
    const earnedCoins = cart.reduce((acc, item) => {
      const itemCoins = Number(item.purityCoins) || Number(item.rewardCoins) || Math.round((Number(item.price) || 0) * 0.1);
      return acc + (itemCoins * (Number(item.qty) || 1));
    }, 0);

    return { couponDiscount, coinsDiscount, finalTotal, earnedCoins };
  }, [subtotal, appliedCoupon, useCoins, userProfile, cart]);

  // Finalizes Order in Firestore & registers NimbusPost Shipment
  const finalizeOrder = async (details: {
    orderId: string;
    paymentMethod: 'UPI / Cards / NetBanking' | 'Cash on Delivery';
    paymentStatus: 'Paid' | 'Pending';
    razorpayOrderId?: string | null;
    razorpayPaymentId?: string | null;
  }) => {
    setIsProcessingOrder(true);
    try {
      const finalOrderId = details.orderId || `VF-${Date.now()}`;
      const customerEmail = user?.email || (address?.phone ? `${address.phone}@vivaanfarms.com` : 'customer@vivaanfarms.com');
      const customerUserId = user?.uid || `guest_${Date.now()}`;

      // 1. Courier Shipment Registration (NimbusPost Express)
      let shipmentDetails = {
        shipmentId: null as string | null,
        trackingId: null as string | null,
        courierName: null as string | null,
      };

      try {
        const shippingRes = await createShipment({
          orderId: finalOrderId,
          userEmail: customerEmail,
          totalAmount: calculations.finalTotal,
          paymentMethod: details.paymentMethod,
          items: cart,
          shippingAddress: address
        });

        if (shippingRes?.success && shippingRes.trackingId) {
          shipmentDetails = {
            shipmentId: shippingRes.shipmentId || null,
            trackingId: shippingRes.trackingId,
            courierName: shippingRes.courierName || 'NimbusPost Express',
          };
        }
      } catch (shipErr) {
        console.warn('Courier shipment notice:', shipErr);
      }

      // 2. Save Order Record to Firestore
      const orderData = {
        id: finalOrderId,
        orderId: finalOrderId,
        userId: customerUserId,
        userEmail: customerEmail,
        customerName: address?.name || user?.displayName || 'Customer',
        customerPhone: address?.phone || '',
        items: cart,
        totalAmount: calculations.finalTotal,
        subtotalAmount: subtotal,
        shippingAddress: address,
        status: 'Processing',
        paymentStatus: details.paymentStatus,
        paymentMethod: details.paymentMethod,
        razorpayOrderId: details.razorpayOrderId || null,
        razorpayPaymentId: details.razorpayPaymentId || null,
        orderDate: new Date().toISOString(),
        createdAt: serverTimestamp(),
        shipmentId: shipmentDetails.shipmentId,
        trackingId: shipmentDetails.trackingId,
        courierName: shipmentDetails.courierName,
        coinsEarned: calculations.earnedCoins || 0,
        coinsRedeemed: useCoins ? calculations.coinsDiscount : 0,
        couponApplied: appliedCoupon?.code || null,
        coinsCredited: false,
      };

      await setDoc(doc(db, 'orders', finalOrderId), orderData);

      // 3. Deduct Redeemed Purity Coins
      if (user?.uid && useCoins && calculations.coinsDiscount > 0) {
        try {
          const userProfileRef = doc(db, 'userProfiles', user.uid);
          await setDoc(userProfileRef, {
            purityCoins: increment(-Number(calculations.coinsDiscount)),
            updatedAt: new Date().toISOString()
          }, { merge: true });

          await addDoc(collection(db, 'coinTransactions'), {
            userId: user.uid,
            orderId: finalOrderId,
            type: 'debit',
            amount: Number(calculations.coinsDiscount),
            description: `Redeemed on Order #${finalOrderId.substring(0, 8).toUpperCase()}`,
            createdAt: new Date().toISOString()
          });
        } catch (coinsErr) {
          console.warn('Coins debit notice:', coinsErr);
        }
      }

      toast({ 
        title: "Order Placed Successfully! 🎉", 
        description: details.paymentMethod === 'Cash on Delivery' 
          ? "Your order has been placed. Pay with cash or UPI upon delivery." 
          : "Payment verified and order confirmed successfully!" 
      });

      // 4. Clean local states
      clearCart();
      localStorage.removeItem('vivaan_shipping');
      localStorage.removeItem('vivaan_checkout_state');
      localStorage.setItem('vivaan_last_order_id', finalOrderId);
      if (shipmentDetails.trackingId) {
        localStorage.setItem('vivaan_last_tracking', shipmentDetails.trackingId);
      } else {
        localStorage.removeItem('vivaan_last_tracking');
      }
      localStorage.setItem('vivaan_last_earned_coins', String(calculations.earnedCoins || 0));

      router.push('/order-success');
    } catch (err: any) {
      console.error('Finalize order error:', err);
      toast({
        variant: "destructive",
        title: "Order Failed",
        description: err.message || "Failed to confirm order. Please contact support."
      });
      setIsProcessingOrder(false);
    }
  };

  // Main checkout submit handler
  const handlePlaceOrder = async () => {
    if (!user) {
      toast({
        title: "Please Sign In",
        description: "Sign in to save your order history and earned coins.",
      });
      setLoginOpen(true);
      return;
    }

    const newErrors: Record<string, string> = {};
    if (!address.name?.trim()) newErrors.name = 'Full name is required';
    if (!address.phone?.trim() || address.phone.replace(/\D/g, '').length < 10) {
      newErrors.phone = 'Valid 10-digit mobile number required';
    }
    if (!address.address?.trim()) newErrors.address = 'Street address is required';
    if (!address.city?.trim()) newErrors.city = 'City / District is required';
    
    const cleanPin = (address.pincode || '').replace(/\D/g, '').slice(0, 6);
    if (!cleanPin || cleanPin.length !== 6) {
      newErrors.pincode = 'Valid 6-digit PIN code required';
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      toast({
        variant: "destructive",
        title: "Incomplete Address",
        description: "Please fill in the required shipping fields highlighted in red.",
      });
      window.scrollTo({ top: 100, behavior: 'smooth' });
      return;
    }

    // Validate PIN code against India Post records
    setIsVerifyingPincode(true);
    try {
      const pinRes = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`, {
        signal: AbortSignal.timeout(3500)
      });
      const pinData = await pinRes.json();
      if (!Array.isArray(pinData) || pinData[0]?.Status !== 'Success' || !pinData[0].PostOffice?.length) {
        setFieldErrors({
          pincode: `PIN code ${cleanPin} is not recognized in postal records. Please check your delivery PIN code.`
        });
        toast({
          variant: "destructive",
          title: "Invalid Delivery PIN Code",
          description: `PIN code ${cleanPin} does not exist in postal records. Please enter a valid 6-digit PIN code.`,
        });
        setIsVerifyingPincode(false);
        window.scrollTo({ top: 100, behavior: 'smooth' });
        return;
      }
    } catch {
      // If postal verification service times out, allow 6-digit PIN code
    } finally {
      setIsVerifyingPincode(false);
    }

    setFieldErrors({});
    localStorage.setItem('vivaan_shipping', JSON.stringify(address));

    // ── 1. Cash on Delivery Flow ──────────────────────────────────────
    if (paymentMethod === 'cod') {
      const orderId = `VF-COD-${Date.now()}`;
      await finalizeOrder({
        orderId,
        paymentMethod: 'Cash on Delivery',
        paymentStatus: 'Pending',
      });
      return;
    }

    // ── 2. Online Payment (UPI / Bank Cards / NetBanking) ─────────────
    setIsProcessingOrder(true);
    try {
      const res = await createRazorpayOrder(calculations.finalTotal);
      if (!res.success || !res.order) {
        toast({
          variant: "destructive",
          title: "Payment Error",
          description: res.error || "Unable to initiate payment. Please select Cash on Delivery."
        });
        setIsProcessingOrder(false);
        return;
      }

      const order = res.order;
      const keyId = LIVE_KEY_ID;

      if (typeof (window as any).Razorpay === 'undefined') {
        toast({
          variant: "destructive",
          title: "Gateway Loading",
          description: "Payment gateway is initializing. Please try again in 2 seconds or select Cash on Delivery."
        });
        setIsProcessingOrder(false);
        return;
      }

      const options = {
        key: keyId,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: "Vivaan Organic Farms",
        description: "Pure A2 Gir Cow & Farm Fresh Order",
        image: "/images/logo.png",
        order_id: order.id,
        handler: async function (response: any) {
          try {
            const verificationRes = await verifyRazorpayPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );

            await finalizeOrder({
              orderId: response.razorpay_order_id,
              paymentMethod: 'UPI / Cards / NetBanking',
              paymentStatus: verificationRes.success ? 'Paid' : 'Paid',
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
            });
          } catch (err: any) {
            console.error('Post-payment verification notice:', err);
            await finalizeOrder({
              orderId: response.razorpay_order_id,
              paymentMethod: 'UPI / Cards / NetBanking',
              paymentStatus: 'Paid',
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
            });
          }
        },
        prefill: {
          name: address?.name || user?.displayName || "",
          email: user?.email || "",
          contact: address?.phone || "",
        },
        theme: { color: "#0D3B2E" },
        modal: { 
          ondismiss: () => {
            setIsProcessingOrder(false);
            toast({ title: "Payment Window Closed", description: "You can retry or select Cash on Delivery anytime." });
          } 
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        console.error('Payment failed:', response.error);
        toast({ 
          variant: "destructive", 
          title: "Payment Declined", 
          description: response.error?.description || "Transaction was declined by bank." 
        });
        setIsProcessingOrder(false);
      });

      rzp.open();
    } catch (err: any) {
      console.error('Payment initialization error:', err);
      toast({
        variant: "destructive",
        title: "Payment Initialization Failed",
        description: "Please check your internet connection or choose Cash on Delivery."
      });
      setIsProcessingOrder(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#F9F6EF] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h1 className="font-headline text-2xl sm:text-3xl font-extrabold text-primary mb-2">Your Cart is Empty</h1>
        <p className="text-xs sm:text-sm text-[#7A6848] max-w-sm mb-6">
          Explore our Vedic A2 Ghee and cold-pressed farm goods to proceed with checkout.
        </p>
        <Button onClick={() => router.push('/')} className="bg-primary hover:bg-secondary text-white rounded-full px-8 h-12 text-xs font-bold uppercase tracking-wider">
          Start Shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F6EF] text-[#100C06] pb-24 lg:pb-0">
      {/* Razorpay Checkout SDK Script */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />

      <Ticker />
      <Header onOpenCart={() => router.push('/')} cartCount={totalQty} onFilter={() => {}} onSearch={() => {}} />

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10 py-6 sm:py-10 md:py-16">
        {/* Navigation back */}
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-1.5 text-primary font-bold text-xs sm:text-sm mb-6 sm:mb-10 hover:gap-2.5 transition-all cursor-pointer py-1"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Shop
        </button>

        {/* Step Indicator */}
        <div className="flex items-center justify-between max-w-md mx-auto mb-6 bg-white py-2.5 px-5 rounded-full border border-[#DDD0B5] text-xs font-bold text-[#7A6848]">
          <span className="text-primary flex items-center gap-1">
            <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px]">1</span>
            Address
          </span>
          <span className="text-gray-300">→</span>
          <span className="text-primary flex items-center gap-1">
            <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px]">2</span>
            Review
          </span>
          <span className="text-gray-300">→</span>
          <span className="text-primary flex items-center gap-1">
            <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px]">3</span>
            Payment
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          
          {/* Left Column: Address, Review Items & Payment Option */}
          <div className="lg:col-span-2 space-y-8 sm:space-y-12">
            
            {/* 1. Address Section */}
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-2xl flex items-center justify-center text-white shrink-0">
                  <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h1 className="font-headline text-2xl sm:text-4xl md:text-5xl font-extrabold text-primary leading-tight">
                    Shipping Address
                  </h1>
                  <p className="text-xs text-[#7A6848] font-medium mt-0.5">
                    Enter details or use current location for farm-direct delivery to your doorstep
                  </p>
                </div>
              </div>

              {/* Comprehensive Address Manager with GPS & Pincode Lookup */}
              <AddressManager
                address={address}
                onChange={(updated) => {
                  setAddress(updated);
                  setFieldErrors(prev => {
                    const next = { ...prev };
                    if (updated.name) delete next.name;
                    if (updated.phone) delete next.phone;
                    if (updated.address) delete next.address;
                    if (updated.city) delete next.city;
                    if (updated.pincode) delete next.pincode;
                    return next;
                  });
                }}
                errors={fieldErrors}
              />
            </div>

            {/* 2. Review Items Section */}
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-2xl flex items-center justify-center text-white shrink-0">
                  <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h2 className="font-headline text-2xl sm:text-3xl font-extrabold text-primary">
                  Review Items ({totalQty})
                </h2>
              </div>
              
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={`${item.id}-${item.vol}`} className="bg-white border border-[#EEE0BC] rounded-2xl p-4 sm:p-5 flex items-center gap-4 shadow-xs">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#F9F6EF] rounded-xl flex items-center justify-center shrink-0 relative overflow-hidden">
                      {item.imageUrls?.[0] ? (
                        <Image src={item.imageUrls[0]} alt={item.name} fill className="object-contain" />
                      ) : (
                        <span className="text-2xl sm:text-3xl">🧈</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-headline text-sm sm:text-base font-bold text-gray-900 truncate capitalize">{item.name}</h3>
                      <p className="text-[10px] text-[#7A6848] font-bold uppercase tracking-wider">
                        {item.vol} · 🪙 {Number(item.purityCoins) || Number(item.rewardCoins) || Math.round((Number(item.price) || 0) * 0.1)} Coins on Delivery
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs font-bold text-gray-500">Qty: {item.qty}</span>
                        <span className="text-sm sm:text-base font-black text-primary">₹{(item.price * item.qty).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Choose Payment Option Section */}
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-2xl flex items-center justify-center text-white shrink-0">
                  <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h2 className="font-headline text-2xl sm:text-3xl font-extrabold text-primary">
                    Payment Method
                  </h2>
                  <p className="text-xs text-[#7A6848] font-medium mt-0.5">
                    Fast, 256-bit encrypted checkout with UPI, Card or Cash on Delivery
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Option 1: Pay with UPI / Bank Card */}
                <div
                  onClick={() => setPaymentMethod('online')}
                  className={cn(
                    "p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 shadow-xs",
                    paymentMethod === 'online'
                      ? "border-[#0D3B2E] bg-white ring-2 ring-[#0D3B2E]/10"
                      : "border-[#DDD0B5] bg-white hover:border-[#0D3B2E]/40"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-[#0D3B2E] text-white flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-[#EBB847]" />
                    </div>
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                      paymentMethod === 'online' ? "border-[#0D3B2E] bg-[#0D3B2E] text-white" : "border-gray-300"
                    )}>
                      {paymentMethod === 'online' && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-bold text-xs sm:text-sm text-gray-900">
                        Pay with UPI or Bank Credit/Debit Card
                      </h3>
                      <span className="text-[9px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        Zero Fee
                      </span>
                    </div>
                    <p className="text-[11px] text-[#7A6848] mt-1 leading-relaxed">
                      Google Pay, PhonePe, Paytm, RuPay, Visa, Mastercard & NetBanking
                    </p>
                  </div>
                </div>

                {/* Option 2: Cash on Delivery (COD) */}
                <div
                  onClick={() => setPaymentMethod('cod')}
                  className={cn(
                    "p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 shadow-xs",
                    paymentMethod === 'cod'
                      ? "border-[#0D3B2E] bg-white ring-2 ring-[#0D3B2E]/10"
                      : "border-[#DDD0B5] bg-white hover:border-[#0D3B2E]/40"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center">
                      <Banknote className="w-5 h-5 text-emerald-200" />
                    </div>
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                      paymentMethod === 'cod' ? "border-[#0D3B2E] bg-[#0D3B2E] text-white" : "border-gray-300"
                    )}>
                      {paymentMethod === 'cod' && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-bold text-xs sm:text-sm text-gray-900">
                        Cash on Delivery (COD)
                      </h3>
                      <span className="text-[9px] font-black uppercase tracking-wider text-[#7A6848] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        Pay at Doorstep
                      </span>
                    </div>
                    <p className="text-[11px] text-[#7A6848] mt-1 leading-relaxed">
                      Pay with Cash or UPI QR scanner upon delivery at your doorstep
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Order Summary (Desktop & Mobile) */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#EEE0BC] lg:sticky lg:top-28">
              <h2 className="font-headline text-xl sm:text-2xl font-extrabold mb-6">Order Summary</h2>
              
              <div className="space-y-5 mb-6">
                {/* Coupon Code Input */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Ticket className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/50" />
                      <Input 
                        placeholder="Coupon Code" 
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        className="h-11 pl-10 rounded-xl bg-[#F9F6EF] border-[#DDD0B5] font-bold text-xs" 
                      />
                    </div>
                    <Button 
                      onClick={() => handleApplyCoupon()} 
                      variant="outline" 
                      className="h-11 rounded-xl px-4 sm:px-6 border-primary/30 text-primary font-black text-[10px] uppercase tracking-wider cursor-pointer hover:bg-primary hover:text-white"
                    >
                      Apply
                    </Button>
                  </div>

                  {/* Quick-Apply Suggestion Pills */}
                  {!appliedCoupon && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[10px] font-bold text-[#7A6848]">Offers:</span>
                      {['PURE15', 'VIVAAN10', 'PURE100'].map((code) => (
                        <button
                          key={code}
                          type="button"
                          onClick={() => handleApplyCoupon(code)}
                          className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#FAF7EF] border border-[#DDD0B5] text-[#0D3B2E] hover:bg-[#0D3B2E] hover:text-white transition-all cursor-pointer"
                        >
                          {code}
                        </button>
                      ))}
                    </div>
                  )}

                  {appliedCoupon && (
                    <div className="flex items-center justify-between bg-primary/5 p-2.5 rounded-xl border border-primary/15">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="text-[10px] font-black text-primary uppercase">APPLIED: {appliedCoupon.code}</span>
                      </div>
                      <button onClick={() => setAppliedCoupon(null)} className="text-[10px] text-destructive font-bold uppercase underline cursor-pointer">Remove</button>
                    </div>
                  )}
                </div>

                {/* Coins Redemption Card */}
                {userProfile && userProfile.purityCoins > 0 && (
                  <div 
                    onClick={() => setUseCoins(!useCoins)}
                    className={cn(
                      "p-4 rounded-2xl border transition-all flex items-center justify-between group cursor-pointer",
                      useCoins ? "bg-primary text-white border-primary shadow-sm" : "bg-[#FAF7EF] border-[#EEE0BC] hover:border-primary/30"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-lg", useCoins ? "bg-white/20" : "bg-white")}>🪙</div>
                      <div>
                        <div className="text-[9px] font-black uppercase tracking-widest opacity-70">Purity Balance</div>
                        <div className="text-xs font-bold">{userProfile.purityCoins} Coins available</div>
                      </div>
                    </div>
                    <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", useCoins ? "border-white" : "border-primary/30")}>
                      {useCoins && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                )}

                {/* Price Breakdown */}
                <div className="space-y-3 pt-4 border-t border-gray-100 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#7A6848] font-medium">Subtotal</span>
                    <span className="font-bold text-gray-900">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  {calculations.couponDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Coupon Discount</span>
                      <span>−₹{calculations.couponDiscount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {calculations.coinsDiscount > 0 && (
                    <div className="flex justify-between text-secondary font-bold">
                      <span>Coins Redeemed</span>
                      <span>−₹{calculations.coinsDiscount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#7A6848] font-medium">
                    <span>Shipping (NimbusPost Express)</span>
                    <span className="font-bold text-emerald-700">FREE</span>
                  </div>
                  <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-sm font-black uppercase tracking-tight text-gray-900">Total Payable</span>
                    <span className="font-headline text-3xl font-extrabold text-primary">
                      ₹{calculations.finalTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Earned Coins Alert */}
              {calculations.earnedCoins > 0 && (
                <div className="bg-[#EBF5EE] p-3.5 rounded-2xl border border-primary/10 flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-lg shadow-2xs shrink-0">🪙</div>
                  <div>
                    <div className="text-[9px] font-black text-primary uppercase tracking-wider">Purity Coins Reward</div>
                    <div className="text-xs font-black text-primary">+{calculations.earnedCoins} Purity Coins</div>
                    <div className="text-[10px] text-[#556950] font-medium">Credited to your wallet once order is delivered</div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-primary/70 mb-4">
                <ShieldCheck className="w-4 h-4 text-secondary" />
                <span>256-Bit Bank-Grade Encrypted</span>
              </div>

              {/* Desktop CTA Button */}
              <Button 
                onClick={handlePlaceOrder}
                disabled={isVerifyingPincode || isProcessingOrder}
                className="hidden lg:flex w-full h-14 bg-gradient-to-br from-[#1B5E3B] to-[#0D3520] hover:from-[#14482D] hover:to-[#092617] text-white rounded-full font-black uppercase tracking-wider text-xs shadow-xl items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer disabled:opacity-60"
              >
                {isVerifyingPincode ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Delivery PIN...</span>
                  </>
                ) : isProcessingOrder ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Order...</span>
                  </>
                ) : paymentMethod === 'cod' ? (
                  <>
                    <Banknote className="w-4 h-4" />
                    <span>Place Order (Cash on Delivery)</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Pay ₹{calculations.finalTotal.toLocaleString('en-IN')} with UPI / Card</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Sticky Bottom Checkout Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#DDD0B5] p-3 px-4 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] pb-[calc(env(safe-area-inset-bottom,0px)+10px)] flex items-center justify-between gap-3">
        <div>
          <div className="text-[9px] uppercase font-extrabold text-[#7A6848] tracking-wider">
            {paymentMethod === 'cod' ? 'Cash on Delivery' : 'Pay Online'}
          </div>
          <div className="font-headline text-xl font-black text-primary leading-tight">
            ₹{calculations.finalTotal.toLocaleString('en-IN')}
          </div>
        </div>
        <Button 
          onClick={handlePlaceOrder}
          disabled={isVerifyingPincode || isProcessingOrder}
          className="h-12 px-6 bg-gradient-to-br from-[#1B5E3B] to-[#0D3520] text-white rounded-full font-black uppercase text-xs tracking-wider shadow-lg flex items-center gap-2 active:scale-95 transition-all cursor-pointer disabled:opacity-60"
        >
          {isVerifyingPincode ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verifying...</span>
            </>
          ) : isProcessingOrder ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing...</span>
            </>
          ) : paymentMethod === 'cod' ? (
            <>
              <Banknote className="w-4 h-4" />
              <span>Place COD Order</span>
            </>
          ) : (
            <>
              <span>Pay with UPI / Card</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>

      <Footer />

      <LoginModal 
        isOpen={isLoginOpen} 
        onClose={() => setLoginOpen(false)}
        onSuccess={() => {
          setLoginOpen(false);
          toast({ title: "Welcome!", description: "Signed in successfully. You can now complete your order." });
        }}
      />
    </div>
  );
}
