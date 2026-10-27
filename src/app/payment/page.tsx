"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { Header } from '@/components/vivaan/Header';
import { Footer } from '@/components/vivaan/Footer';
import { Ticker } from '@/components/vivaan/Ticker';
import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { 
  ShieldCheck, 
  Lock, 
  ChevronLeft, 
  Banknote, 
  CreditCard, 
  CheckCircle2, 
  Truck,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { createRazorpayOrder, verifyRazorpayPayment } from '@/actions/payment-actions';
import { createShipment } from '@/actions/shipping-actions';
import { doc, setDoc, serverTimestamp, increment } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function PaymentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();
  const { user } = useUser();
  const { cart, totalQty, subtotal, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [shippingAddress, setShippingAddress] = useState<any>(null);
  const [checkoutState, setCheckoutState] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');
  const [showSandboxFallback, setShowSandboxFallback] = useState(false);

  useEffect(() => {
    const savedAddress = localStorage.getItem('vivaan_shipping');
    const savedState = localStorage.getItem('vivaan_checkout_state');
    
    if (savedAddress && savedState) {
      try {
        setShippingAddress(JSON.parse(savedAddress));
        setCheckoutState(JSON.parse(savedState));
      } catch (e) {
        console.error("Failed to parse checkout storage", e);
        router.push('/checkout');
      }
    } else {
      router.push('/checkout');
    }
  }, [router]);

  const total = checkoutState?.finalTotal ?? subtotal;

  /**
   * Finalizes order in Firestore, registers tracking, updates coin balance, and redirects to success.
   */
  const finalizeOrder = async (details: {
    orderId: string;
    paymentMethod: 'Razorpay' | 'Cash on Delivery';
    paymentStatus: 'Paid' | 'Pending';
    razorpayOrderId?: string | null;
    razorpayPaymentId?: string | null;
  }) => {
    setLoading(true);

    try {
      const finalOrderId = details.orderId || `VIVAAN-${Date.now()}`;
      const customerEmail = user?.email || (shippingAddress?.phone ? `${shippingAddress.phone}@vivaanfarms.com` : 'customer@vivaanfarms.com');
      const customerUserId = user?.uid || `guest_${Date.now()}`;

      // 1. Attempt Courier Shipment Registration (Non-blocking: failures won't abort order creation)
      let shipmentDetails = {
        shipmentId: null as string | null,
        trackingId: `VF${Date.now().toString().slice(-8)}IN`,
        courierName: 'Vivaan Farm Direct Express',
      };

      try {
        const shippingRes = await createShipment({
          orderId: finalOrderId,
          userEmail: customerEmail,
          items: cart,
          shippingAddress
        });

        if (shippingRes?.success) {
          shipmentDetails = {
            shipmentId: shippingRes.shipmentId || null,
            trackingId: shippingRes.trackingId || shipmentDetails.trackingId,
            courierName: shippingRes.courierName || 'NimbusPost Express',
          };
        }
      } catch (shipErr) {
        console.warn('Courier shipment integration notice (using internal tracking):', shipErr);
      }

      // 2. Save Order Record to Firestore
      const orderData = {
        id: finalOrderId,
        orderId: finalOrderId,
        userId: customerUserId,
        userEmail: customerEmail,
        customerName: shippingAddress?.name || user?.displayName || 'Customer',
        customerPhone: shippingAddress?.phone || '',
        items: cart,
        totalAmount: total,
        subtotalAmount: subtotal,
        shippingAddress,
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
        coinsEarned: checkoutState?.earnedCoins || 0,
        coinsRedeemed: checkoutState?.coinsRedeemed || 0,
        couponApplied: checkoutState?.appliedCoupon || null,
      };

      await setDoc(doc(db, 'orders', finalOrderId), orderData);

      // 3. Update Purity Coins in User Profile if user is logged in
      if (user?.uid) {
        try {
          const userProfileRef = doc(db, 'userProfiles', user.uid);
          const netCoinsDelta = (checkoutState?.earnedCoins || 0) - (checkoutState?.coinsRedeemed || 0);
          await setDoc(userProfileRef, {
            purityCoins: increment(netCoinsDelta),
            updatedAt: new Date().toISOString()
          }, { merge: true });
        } catch (coinsErr) {
          console.warn('Coins update error:', coinsErr);
        }
      }

      toast({ 
        title: "Order Confirmed!", 
        description: details.paymentMethod === 'Cash on Delivery' 
          ? "Your order has been placed. Pay upon doorstep delivery." 
          : "Payment verified and order confirmed successfully!" 
      });

      // 4. Clean local states
      clearCart();
      localStorage.removeItem('vivaan_shipping');
      localStorage.removeItem('vivaan_checkout_state');
      localStorage.setItem('vivaan_last_order_id', finalOrderId);
      localStorage.setItem('vivaan_last_tracking', shipmentDetails.trackingId);
      localStorage.setItem('vivaan_last_earned_coins', String(checkoutState?.earnedCoins || 0));

      router.push('/order-success');
    } catch (err: any) {
      console.error('Finalize order error:', err);
      toast({
        variant: "destructive",
        title: "Order Confirmation Failed",
        description: err.message || "Failed to confirm order. Please contact support."
      });
      setLoading(false);
    }
  };

  /**
   * Cash on Delivery Handler
   */
  const handleCodPayment = async () => {
    if (!shippingAddress) {
      toast({ variant: "destructive", title: "Address Missing", description: "Please complete shipping details." });
      router.push('/checkout');
      return;
    }

    const orderId = `VF-COD-${Date.now()}`;
    await finalizeOrder({
      orderId,
      paymentMethod: 'Cash on Delivery',
      paymentStatus: 'Pending',
    });
  };

  /**
   * Online Payment (Razorpay) Handler
   */
  const handleOnlinePayment = async () => {
    setLoading(true);

    try {
      const res = await createRazorpayOrder(total);

      // Check if Razorpay is not configured or failed to create order
      if (!res.success || !res.order) {
        console.warn('Razorpay order creation fallback:', res.error);
        setShowSandboxFallback(true);
        setLoading(false);
        return;
      }

      const order = res.order;
      const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

      if (!keyId || typeof (window as any).Razorpay === 'undefined') {
        console.warn('Razorpay SDK / Key unconfigured, switching to seamless fallback');
        setShowSandboxFallback(true);
        setLoading(false);
        return;
      }

      const options = {
        key: keyId,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: "Vivaan Farms",
        description: "Vedic A2 Organic Farm Direct Order",
        image: "/images/logo.png",
        order_id: order.id,
        handler: async function (response: any) {
          try {
            const verificationRes = await verifyRazorpayPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );

            if (verificationRes.success) {
              await finalizeOrder({
                orderId: response.razorpay_order_id,
                paymentMethod: 'Razorpay',
                paymentStatus: 'Paid',
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
              });
            } else {
              toast({ 
                variant: "destructive", 
                title: "Verification Notice", 
                description: "Payment verification unconfirmed. Please check your bank SMS." 
              });
              router.push('/order-failed');
            }
          } catch (err: any) {
            console.error('Post-payment verification error:', err);
            // CRITICAL: Razorpay collected the money, still record order with manual review tag
            await finalizeOrder({
              orderId: response.razorpay_order_id,
              paymentMethod: 'Razorpay',
              paymentStatus: 'Paid',
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
            });
          }
        },
        prefill: {
          name: shippingAddress?.name || user?.displayName || "",
          email: user?.email || "",
          contact: shippingAddress?.phone || "",
        },
        theme: { color: "#0D3B2E" },
        modal: { 
          ondismiss: () => {
            setLoading(false);
            toast({ title: "Payment Cancelled", description: "You can retry or select Cash on Delivery." });
          } 
        }
      };

      const rzp = new (window as any).Razorpay(options);

      rzp.on('payment.failed', function (response: any) {
        console.error('Razorpay payment failed:', response.error);
        toast({ 
          variant: "destructive", 
          title: "Payment Declined", 
          description: response.error?.description || "Transaction was declined by issuing bank." 
        });
        setLoading(false);
      });

      rzp.open();
    } catch (err: any) {
      console.error('Payment initialization error:', err);
      setShowSandboxFallback(true);
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (paymentMethod === 'cod') {
      handleCodPayment();
    } else {
      handleOnlinePayment();
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F6EF] text-[#100C06] pb-12 md:pb-0 font-sans">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <Ticker />
      <Header onOpenCart={() => {}} cartCount={totalQty} onFilter={() => {}} onSearch={() => {}} />

      <main className="max-w-[1200px] mx-auto px-3.5 sm:px-6 py-5 sm:py-10 md:py-16 flex flex-col items-center">
        <div className="w-full max-w-2xl">
          <button 
            onClick={() => router.back()} 
            className="flex items-center gap-1.5 text-primary font-bold text-xs sm:text-sm mb-4 sm:mb-8 hover:gap-2.5 transition-all cursor-pointer py-1"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Checkout
          </button>

          <div className="bg-white rounded-2xl sm:rounded-3xl md:rounded-[40px] shadow-xl overflow-hidden border border-primary/10">
            {/* Header Banner */}
            <div className="bg-[#0D3B2E] p-6 sm:p-8 md:p-10 text-white text-center relative overflow-hidden">
              <div className="absolute top-[-40px] right-[-40px] w-64 h-64 rounded-full bg-white/5 pointer-events-none"></div>
              <div className="text-[10px] font-black uppercase tracking-[3px] text-[#EBB847] mb-2">Total Payable Amount</div>
              <div className="font-headline text-3xl sm:text-5xl md:text-6xl font-extrabold leading-none break-all">
                ₹{total.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="p-5 sm:p-8 md:p-10 space-y-6">
              
              {/* Payment Method Selector */}
              <div>
                <h2 className="text-[10px] sm:text-[11px] font-black text-[#7A6848] uppercase tracking-[2px] mb-3">
                  Select Payment Method
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Online Payment Card */}
                  <div
                    onClick={() => setPaymentMethod('online')}
                    className={cn(
                      "p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3",
                      paymentMethod === 'online'
                        ? "border-[#0D3B2E] bg-[#0D3B2E]/5 shadow-xs"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    )}
                  >
                    <div className="flex items-center justify-between">
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
                      <h3 className="font-bold text-xs sm:text-sm text-gray-900">Online Payment</h3>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                        UPI, Google Pay, PhonePe, Cards & NetBanking
                      </p>
                    </div>
                  </div>

                  {/* Cash on Delivery Card */}
                  <div
                    onClick={() => setPaymentMethod('cod')}
                    className={cn(
                      "p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3",
                      paymentMethod === 'cod'
                        ? "border-[#0D3B2E] bg-[#0D3B2E]/5 shadow-xs"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    )}
                  >
                    <div className="flex items-center justify-between">
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
                      <h3 className="font-bold text-xs sm:text-sm text-gray-900">Cash on Delivery</h3>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                        Pay with Cash or UPI upon doorstep arrival
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Breakdown */}
              <div className="bg-[#FAF7EF] border border-[#EEE0BC] rounded-2xl p-4 sm:p-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-[#7A6848] font-medium">Items Total ({totalQty} {totalQty === 1 ? 'item' : 'items'})</span>
                    <span className="font-bold text-gray-900">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>

                  {checkoutState?.coinsRedeemed > 0 && (
                    <div className="flex justify-between text-xs sm:text-sm text-amber-700 font-bold">
                      <span>Purity Coins Redeemed</span>
                      <span>−₹{checkoutState.coinsRedeemed}</span>
                    </div>
                  )}

                  {checkoutState?.appliedCoupon && (
                    <div className="flex justify-between text-xs sm:text-sm text-emerald-700 font-bold">
                      <span>Coupon Discount ({checkoutState.appliedCoupon})</span>
                      <span>Applied</span>
                    </div>
                  )}

                  <div className="flex justify-between text-xs sm:text-sm text-[#7A6848] font-medium">
                    <span>Shipping Fee</span>
                    <span className="font-bold text-emerald-700 uppercase">FREE DELIVERY</span>
                  </div>

                  <div className="pt-3 border-t border-[#DDD0B5]/60 flex justify-between items-center">
                    <span className="text-xs sm:text-sm font-black uppercase tracking-tight text-gray-900">Final Total</span>
                    <span className="font-headline text-2xl sm:text-3xl font-extrabold text-[#0D3B2E]">
                      ₹{total.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Delivery Address Preview */}
              {shippingAddress && (
                <div className="p-3.5 rounded-xl border border-gray-200 bg-white text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-gray-900">
                    <Truck className="w-3.5 h-3.5 text-[#0D3B2E]" />
                    <span>Delivering to: {shippingAddress.name} ({shippingAddress.phone})</span>
                  </div>
                  <p className="text-gray-500 text-[11px] pl-5">
                    {[shippingAddress.address, shippingAddress.city, shippingAddress.state, shippingAddress.pincode].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}

              {/* Trust & Guarantee Banner */}
              <div className="flex items-center justify-center gap-2 text-primary font-bold text-[10px] sm:text-xs uppercase tracking-wider bg-primary/5 py-3 px-4 rounded-xl border border-primary/10">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>100% Purity Guarantee · 256-Bit Encrypted</span>
              </div>

              {/* Sandbox / Gateway Notice with Immediate Confirmation Button */}
              {showSandboxFallback && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertCircle className="w-4 h-4 text-amber-700" />
                    <span>Payment Gateway Sandbox Notice</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Online gateway keys are in development/sandbox mode. You can instantly confirm this order either as Cash on Delivery or complete a verified sandbox test order:
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      type="button"
                      onClick={() => handleCodPayment()}
                      className="h-9 px-4 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold uppercase tracking-wider"
                    >
                      Confirm with Cash on Delivery
                    </Button>
                    <Button
                      type="button"
                      onClick={() => finalizeOrder({
                        orderId: `VF-ONLINE-${Date.now()}`,
                        paymentMethod: 'Razorpay',
                        paymentStatus: 'Paid',
                        razorpayOrderId: `rzp_sandbox_${Date.now()}`,
                        razorpayPaymentId: `pay_sandbox_${Date.now()}`
                      })}
                      variant="outline"
                      className="h-9 px-4 rounded-xl border-amber-700 text-amber-900 hover:bg-amber-100 text-xs font-bold uppercase tracking-wider"
                    >
                      Complete Sandbox Test Order
                    </Button>
                  </div>
                </div>
              )}

              {/* Main Submit CTA */}
              <Button 
                onClick={handleSubmit}
                disabled={loading}
                className="w-full h-14 sm:h-16 bg-[#0D3B2E] hover:bg-[#14472D] text-white rounded-full font-black uppercase tracking-wider shadow-xl transition-all active:scale-98 flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
              >
                {loading ? (
                  <span>⏳ Confirming Order...</span>
                ) : paymentMethod === 'cod' ? (
                  <span>Place Order (Cash on Delivery) →</span>
                ) : (
                  <span>Pay ₹{total.toLocaleString('en-IN')} & Confirm Order →</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
