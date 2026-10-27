"use client";

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/vivaan/Header';
import { Footer } from '@/components/vivaan/Footer';
import { Ticker } from '@/components/vivaan/Ticker';
import { BottomNav } from '@/components/vivaan/BottomNav';
import { LoginModal } from '@/components/vivaan/LoginModal';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { useCart } from '@/hooks/use-cart';
import { collection, doc, getDoc, getDocs, query, where, limit } from 'firebase/firestore';
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Search, 
  ArrowRight, 
  Copy, 
  Check, 
  MapPin, 
  CreditCard, 
  AlertCircle, 
  Loader2, 
  X, 
  ShieldCheck, 
  Sparkles, 
  RefreshCw,
  MessageSquare,
  Navigation
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { trackShipment } from '@/actions/shipping-actions';

function TrackOrderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const { totalQty } = useCart();
  const { toast } = useToast();

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [trackingInput, setTrackingInput] = useState('');
  const [lastSavedTracking, setLastSavedTracking] = useState<string | null>(null);

  // Live Search States
  const [isSearching, setIsSearching] = useState(false);
  const [searchedOrder, setSearchedOrder] = useState<any | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchedCode, setSearchedCode] = useState<string>('');
  const [copiedAwb, setCopiedAwb] = useState(false);

  // Live Carrier API Scans
  const [liveCarrierData, setLiveCarrierData] = useState<any | null>(null);
  const [carrierLoading, setCarrierLoading] = useState(false);

  // Helper to construct official tracking URL based on partner
  const getCourierUrl = (partner: string, awb: string) => {
    switch (partner) {
      case 'NimbusPost':
        return `https://ship.nimbuspost.com/shipping/tracking/${encodeURIComponent(awb)}`;
      case 'Delhivery':
        return `https://www.delhivery.com/track/package/${encodeURIComponent(awb)}`;
      case 'Blue Dart':
        return `https://www.bluedart.com/tracking?trackNumber=${encodeURIComponent(awb)}`;
      case 'DTDC':
        return `https://www.dtdc.in/tracking/shipment-tracking.asp?tracking_id=${encodeURIComponent(awb)}`;
      case 'India Post':
      case 'India Post Speed Post':
        return `https://www.indiapost.gov.in/_layouts/15/dpt.cept.tracking/trackconsignment.aspx`;
      case 'Shadowfax':
        return `https://tracker.shadowfax.in/#/track?awb=${encodeURIComponent(awb)}`;
      case 'Vivaan Farm Direct Express':
      case 'Local Vehicle / Hand Delivery':
      case 'Local Tempo / Transport':
      default:
        return `https://vivaanfarms.com/track?code=${encodeURIComponent(awb)}`;
    }
  };

  /**
   * Queries NimbusPost tracking API to load real-time carrier checkpoints
   */
  const fetchLiveCarrierDetails = async (awb: string) => {
    if (!awb) return;
    setCarrierLoading(true);
    try {
      const res = await trackShipment(awb);
      if (res?.success) {
        setLiveCarrierData(res);
      }
    } catch (err) {
      console.warn("Live carrier fetch notice:", err);
    } finally {
      setCarrierLoading(false);
    }
  };

  // Check URL query parameters (e.g. /track?code=AWB123 or /track?orderId=VIVAAN-...)
  useEffect(() => {
    const codeFromUrl = searchParams.get('code') || searchParams.get('orderId') || searchParams.get('awb');
    if (codeFromUrl) {
      setTrackingInput(codeFromUrl);
      executeSearch(codeFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('vivaan_last_tracking');
      if (saved) {
        setLastSavedTracking(saved);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Query orders by userId for logged-in users
  const ordersQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(db, 'orders'), 
      where('userId', '==', user.uid)
    );
  }, [db, user]);

  const { data: rawOrders, isLoading: ordersLoading } = useCollection(ordersQuery);

  // Sort orders client-side by date descending
  const orders = useMemo(() => {
    if (!rawOrders || !Array.isArray(rawOrders)) return [];
    return [...rawOrders].sort((a, b) => {
      const timeA = a.createdAt?.seconds 
        ? a.createdAt.seconds * 1000 
        : new Date(a.orderDate || 0).getTime();
      const timeB = b.createdAt?.seconds 
        ? b.createdAt.seconds * 1000 
        : new Date(b.orderDate || 0).getTime();
      return timeB - timeA;
    });
  }, [rawOrders]);

  const getStatusIcon = (status: string) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'delivered': return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case 'out for delivery': return <Navigation className="w-5 h-5 text-orange-600" />;
      case 'shipped':
      case 'in transit': return <Truck className="w-5 h-5 text-blue-600" />;
      case 'farm packed': return <Package className="w-5 h-5 text-teal-600" />;
      default: return <Clock className="w-5 h-5 text-amber-600" />;
    }
  };

  const handleTabChange = (tab: string) => {
    if (tab === 'home') router.push('/');
    else if (tab === 'shop') router.push('/category/ghee');
    else if (tab === 'cart') router.push('/checkout');
  };

  /**
   * Execute multi-layer order lookup by:
   * 1. Exact document ID (Order ID)
   * 2. Tracking ID / AWB Number (from admin's hand or courier)
   * 3. orderId field
   * 4. Customer Phone Number
   * 5. Fallback: Direct Courier Tracking API Query
   */
  const executeSearch = async (rawCode: string) => {
    const clean = rawCode.trim().replace(/^#/, '');
    if (!clean) return;

    setIsSearching(true);
    setSearchError(null);
    setSearchedOrder(null);
    setLiveCarrierData(null);
    setSearchedCode(clean);

    try {
      // 1. Direct document lookup by Order ID
      const orderDocRef = doc(db, 'orders', clean);
      const docSnap = await getDoc(orderDocRef);
      if (docSnap.exists()) {
        const orderData = { id: docSnap.id, ...docSnap.data() } as any;
        setSearchedOrder(orderData);
        if (orderData.trackingId) {
          fetchLiveCarrierDetails(orderData.trackingId);
        }
        setIsSearching(false);
        return;
      }

      // 2. Query where trackingId == clean (Custom admin AWB or courier AWB)
      const qTracking = query(collection(db, 'orders'), where('trackingId', '==', clean), limit(1));
      const snapTracking = await getDocs(qTracking);
      if (!snapTracking.empty) {
        const found = snapTracking.docs[0];
        const orderData = { id: found.id, ...found.data() } as any;
        setSearchedOrder(orderData);
        if (orderData.trackingId) {
          fetchLiveCarrierDetails(orderData.trackingId);
        }
        setIsSearching(false);
        return;
      }

      // 3. Query where orderId == clean
      const qOrder = query(collection(db, 'orders'), where('orderId', '==', clean), limit(1));
      const snapOrder = await getDocs(qOrder);
      if (!snapOrder.empty) {
        const found = snapOrder.docs[0];
        const orderData = { id: found.id, ...found.data() } as any;
        setSearchedOrder(orderData);
        if (orderData.trackingId) {
          fetchLiveCarrierDetails(orderData.trackingId);
        }
        setIsSearching(false);
        return;
      }

      // 4. Query by 10-digit mobile phone
      const cleanPhone = clean.replace(/\D/g, '').slice(-10);
      if (cleanPhone.length === 10) {
        const qPhone = query(collection(db, 'orders'), where('customerPhone', '==', cleanPhone), limit(1));
        const snapPhone = await getDocs(qPhone);
        if (!snapPhone.empty) {
          const found = snapPhone.docs[0];
          const orderData = { id: found.id, ...found.data() } as any;
          setSearchedOrder(orderData);
          if (orderData.trackingId) {
            fetchLiveCarrierDetails(orderData.trackingId);
          }
          setIsSearching(false);
          return;
        }
      }

      // 5. Direct Courier API Check
      const directCarrierRes = await trackShipment(clean);
      if (directCarrierRes?.success && directCarrierRes.checkpoints?.length > 0) {
        setLiveCarrierData(directCarrierRes);
        setSearchedOrder({
          id: clean,
          status: directCarrierRes.currentStatus || 'In Transit',
          courierPartner: directCarrierRes.courier || 'Vivaan Express',
          trackingId: clean,
          orderDate: new Date().toISOString(),
          customerName: 'Valued Customer',
          items: [],
          isDirectCarrierResult: true,
        });
        setIsSearching(false);
        return;
      }

      // Not found in database or carrier
      setSearchError(`No Vivaan Farms order found for "${clean}". You can verify the code with our farm support team.`);
    } catch (err: any) {
      console.warn("Order lookup notice:", err);
      setSearchError("Unable to query order details at this moment. You can still check directly via the courier link.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const queryCode = trackingInput.trim() || lastSavedTracking;
    if (queryCode) {
      executeSearch(queryCode);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAwb(true);
    toast({ title: "Copied!", description: `Code ${text} copied to clipboard.` });
    setTimeout(() => setCopiedAwb(false), 2000);
  };

  // Helper to determine active step in visual timeline
  const getStepStatus = (orderStatus: string) => {
    const s = (orderStatus || '').toLowerCase();
    if (s === 'delivered') return 4;
    if (s === 'out for delivery' || s === 'out_for_delivery') return 3.5;
    if (s === 'shipped' || s === 'in transit') return 3;
    if (s === 'farm packed' || s === 'processing' || s === 'confirmed') return 2;
    return 1;
  };

  // Combined Checkpoints (From Admin manual updates + carrier scans)
  const combinedCheckpoints = useMemo(() => {
    if (!searchedOrder) return [];
    const manualPoints = Array.isArray(searchedOrder.trackingCheckpoints) ? searchedOrder.trackingCheckpoints : [];
    const carrierPoints = Array.isArray(liveCarrierData?.checkpoints) ? liveCarrierData.checkpoints : [];

    // Merge without exact duplicates
    const combined = [...manualPoints, ...carrierPoints];

    // Sort by timestamp descending
    return combined.sort((a, b) => {
      const timeA = new Date(a.timestamp || 0).getTime();
      const timeB = new Date(b.timestamp || 0).getTime();
      return timeB - timeA;
    });
  }, [searchedOrder, liveCarrierData]);

  return (
    <div className="min-h-screen bg-[#F9F6EF] text-[#100C06] pb-28 md:pb-0">
      <Ticker />
      <Header 
        onOpenCart={() => router.push('/checkout')} 
        cartCount={totalQty} 
        onFilter={(cat) => router.push(`/category/${cat}`)} 
        onSearch={() => router.push('/')} 
      />

      <main className="max-w-[1000px] mx-auto px-3.5 sm:px-6 md:px-8 py-5 sm:py-10 md:py-16">
        <div className="mb-6 sm:mb-8">
          <h1 className="font-headline text-2xl sm:text-4xl md:text-5xl font-extrabold text-primary leading-tight">
            Track Your Package
          </h1>
          <p className="text-[#7A6848] text-xs sm:text-base font-medium mt-1">
            Real-time status, direct farm dispatch notes from our manager, and doorstep delivery updates.
          </p>
        </div>

        {/* ── 1. Search Box (Order ID / Tracking AWB / Phone) ── */}
        <div className="bg-white p-5 sm:p-7 rounded-[24px] sm:rounded-[32px] border border-primary/10 shadow-sm mb-6 sm:mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Truck className="w-4 h-4 text-primary" />
            <h2 className="text-xs sm:text-sm font-extrabold text-primary uppercase tracking-wider">
              Enter Order ID, Tracking Code, or Mobile Number
            </h2>
          </div>
          <p className="text-[11px] sm:text-xs text-[#7A6848] mb-3">
            Use the tracking code shared with you by our farm team or found on your order confirmation.
          </p>
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="e.g. VF14325678IN or VIVAAN-1740294829 or Mobile..."
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value)}
                className="w-full h-12 sm:h-13 pl-11 pr-4 rounded-full border border-gray-200 text-xs sm:text-sm font-bold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-primary transition-all bg-[#FAF8F5]"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching || (!trackingInput.trim() && !lastSavedTracking)}
              className="h-12 sm:h-13 px-7 sm:px-8 bg-primary hover:bg-[#14482D] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Looking up...</span>
                </>
              ) : (
                <>
                  <span>Track Order</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {lastSavedTracking && !searchedOrder && (
            <div className="mt-3.5 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-2 text-xs text-[#7A6848]">
              <span className="font-semibold">Recent Order AWB:</span>
              <button 
                type="button"
                onClick={() => {
                  setTrackingInput(lastSavedTracking);
                  executeSearch(lastSavedTracking);
                }} 
                className="inline-flex items-center gap-1 font-mono font-bold text-primary underline underline-offset-2 hover:text-[#14482D] cursor-pointer"
              >
                <span>{lastSavedTracking}</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* ── 2. Live Searched Order Result Card ── */}
        {searchedOrder && (
          <motion.div 
            initial={{ opacity: 0, y: 12, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="bg-white rounded-[24px] sm:rounded-[36px] border-2 border-primary/20 shadow-xl overflow-hidden mb-8 sm:mb-10"
          >
            {/* Top Header */}
            <div className="bg-primary/5 p-5 sm:p-7 border-b border-primary/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[2px] text-primary">Live Tracking Result</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary text-white">
                    {searchedOrder.status || 'Processing'}
                  </span>
                </div>
                <h3 className="text-lg sm:text-2xl font-black font-headline text-primary mt-1">
                  Order #{searchedOrder.id.substring(0, 12).toUpperCase()}
                </h3>
                <p className="text-xs text-[#7A6848] font-medium mt-0.5">
                  Placed on {searchedOrder.orderDate ? new Date(searchedOrder.orderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently'}
                </p>
              </div>

              <button
                onClick={() => {
                  setSearchedOrder(null);
                  setSearchError(null);
                  setLiveCarrierData(null);
                  setTrackingInput('');
                }}
                className="h-8 px-3 rounded-full border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-100 transition-colors flex items-center gap-1 self-end sm:self-center cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Close</span>
              </button>
            </div>

            {/* 🌿 PROMINENT ADMIN / FARM DISPATCH MESSAGE (From Admin's Hand) 🌿 */}
            {searchedOrder.adminMessage && (
              <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-50 via-teal-50/60 to-emerald-50 border-b border-emerald-200/80">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-900 bg-emerald-200/70 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-700" />
                        <span>Direct Note from Farm Dispatch Manager</span>
                      </span>
                      {searchedOrder.updatedAt && (
                        <span className="text-[10px] text-emerald-700 font-semibold">
                          Updated {new Date(searchedOrder.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} at {new Date(searchedOrder.updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-emerald-950 mt-1 leading-relaxed">
                      &ldquo;{searchedOrder.adminMessage}&rdquo;
                    </p>
                    {searchedOrder.currentLocation && (
                      <div className="text-[11px] font-bold text-emerald-800 flex items-center gap-1.5 mt-2 bg-white/80 px-2.5 py-1 rounded-lg w-fit border border-emerald-200/60 shadow-2xs">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Current Location: {searchedOrder.currentLocation}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Visual Timeline Stepper */}
            <div className="p-5 sm:p-8 border-b border-gray-100 bg-white">
              <div className="grid grid-cols-4 gap-2 text-center relative">
                {/* Connecting Line */}
                <div className="absolute top-4 sm:top-5 left-8 right-8 h-1 bg-gray-200 -z-0">
                  <div 
                    className="h-full bg-emerald-600 transition-all duration-500" 
                    style={{ 
                      width: getStepStatus(searchedOrder.status) === 4 ? '100%' : 
                             getStepStatus(searchedOrder.status) === 3.5 ? '80%' : 
                             getStepStatus(searchedOrder.status) === 3 ? '66%' : 
                             getStepStatus(searchedOrder.status) === 2 ? '33%' : '0%' 
                    }}
                  />
                </div>

                {/* Step 1: Placed */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
                    ✓
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-gray-900 mt-2">Order Placed</span>
                  <span className="text-[9px] text-gray-500 hidden sm:block">Confirmed</span>
                </div>

                {/* Step 2: Packed */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className={cn(
                    "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-md transition-colors",
                    getStepStatus(searchedOrder.status) >= 2 ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-400 border border-gray-200"
                  )}>
                    {getStepStatus(searchedOrder.status) >= 2 ? '✓' : '2'}
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-gray-900 mt-2">Farm Packed</span>
                  <span className="text-[9px] text-gray-500 hidden sm:block">Quality Verified</span>
                </div>

                {/* Step 3: Shipped / Out for Delivery */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className={cn(
                    "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-md transition-colors",
                    getStepStatus(searchedOrder.status) >= 3 ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-400 border border-gray-200"
                  )}>
                    {getStepStatus(searchedOrder.status) === 3.5 ? (
                      <Navigation className="w-4 h-4 text-white" />
                    ) : getStepStatus(searchedOrder.status) >= 3 ? (
                      <Truck className="w-4 h-4 text-white" />
                    ) : '3'}
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-gray-900 mt-2">
                    {searchedOrder.status === 'Out for Delivery' ? 'Out for Delivery' : 'Shipped'}
                  </span>
                  <span className="text-[9px] text-gray-500 hidden sm:block">
                    {searchedOrder.status === 'Out for Delivery' ? 'Arriving Today' : 'In Transit'}
                  </span>
                </div>

                {/* Step 4: Delivered */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className={cn(
                    "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-md transition-colors",
                    getStepStatus(searchedOrder.status) === 4 ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-400 border border-gray-200"
                  )}>
                    {getStepStatus(searchedOrder.status) === 4 ? <CheckCircle2 className="w-4 h-4" /> : '4'}
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-gray-900 mt-2">Delivered</span>
                  <span className="text-[9px] text-gray-500 hidden sm:block">At Doorstep</span>
                </div>
              </div>
            </div>

            {/* Courier Dispatch Box */}
            <div className="p-5 sm:p-8 bg-[#FAF8F5] border-b border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-primary/10 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Carrier / Dispatch Partner</span>
                    <Badge variant="outline" className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border-emerald-200">
                      Active
                    </Badge>
                  </div>
                  <div className="text-base sm:text-lg font-headline font-extrabold text-primary flex items-center gap-2">
                    <Truck className="w-5 h-5 text-secondary" />
                    <span>{searchedOrder.courierPartner || searchedOrder.courierName || 'Vivaan Farm Direct Express'}</span>
                  </div>

                  {searchedOrder.trackingId ? (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-semibold text-gray-500 block">Tracking / Waybill ID:</span>
                        <span className="font-mono text-sm sm:text-base font-bold text-gray-900">{searchedOrder.trackingId}</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(searchedOrder.trackingId)}
                        className="h-8 px-2.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        title="Copy tracking code"
                      >
                        {copiedAwb ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-gray-600" />}
                        <span>{copiedAwb ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-amber-700 mt-2 font-medium">
                      Tracking code is being assigned by our farm dispatch facility.
                    </p>
                  )}
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-primary/10 shadow-xs flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-1">Live Doorstep Tracking</span>
                    <p className="text-xs text-gray-600">
                      Access real-time transit checkpoints, location updates, and delivery notes.
                    </p>
                  </div>

                  {searchedOrder.trackingId ? (
                    <a
                      href={searchedOrder.trackingUrl || getCourierUrl(searchedOrder.courierPartner || 'Vivaan Express', searchedOrder.trackingId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center justify-center gap-2 h-11 px-5 bg-primary text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-secondary transition-all shadow-md active:scale-95"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Open Live Carrier Portal</span>
                    </a>
                  ) : (
                    <button
                      disabled
                      className="mt-3 inline-flex items-center justify-center gap-2 h-11 px-5 bg-gray-100 text-gray-400 rounded-xl font-bold text-xs uppercase tracking-wider cursor-not-allowed"
                    >
                      <span>Link Pending Dispatch</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ── Real-time Checkpoints Timeline (Admin updates + Carrier Scans) ── */}
            <div className="p-5 sm:p-8 bg-white border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-primary">
                    Delivery Progress & Transit Scans
                  </h4>
                </div>
                <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                  {searchedOrder.status || 'Active'}
                </Badge>
              </div>

              {carrierLoading ? (
                <div className="py-6 flex items-center justify-center gap-2 text-xs text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span>Fetching latest progress scans...</span>
                </div>
              ) : combinedCheckpoints.length > 0 ? (
                <div className="space-y-3.5 pl-2">
                  {combinedCheckpoints.map((cp: any, idx: number) => (
                    <div key={idx} className="relative pl-6 pb-3.5 last:pb-0 border-l-2 border-emerald-500/30 last:border-l-transparent">
                      <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-600 ring-4 ring-emerald-50" />
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{cp.status || 'Transit Hub'}</span>
                          {cp.source === 'admin_manual' && (
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                              Farm Dispatch Note
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-500 font-medium">
                          {cp.timestamp ? new Date(cp.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className="text-xs text-gray-700 mt-1">{cp.activity || cp.message}</p>
                      {cp.location && (
                        <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3 text-emerald-600" />
                          <span>{cp.location}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 text-center">
                  <p className="text-xs text-gray-600 font-medium">
                    Order registered at dispatch facility. Checkpoints and transit notes will update as the order progresses.
                  </p>
                </div>
              )}
            </div>

            {/* Purity Coins Loyalty Card */}
            {Number(searchedOrder.coinsEarned) > 0 && (
              <div className="p-5 sm:p-6 bg-gradient-to-r from-amber-50/80 via-white to-emerald-50/80 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-white shadow-xs border border-amber-200/80 flex items-center justify-center text-xl shrink-0">
                    🪙
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-wider text-amber-900">
                      Purity Coins Loyalty Reward
                    </div>
                    <div className="text-sm font-extrabold text-gray-900">
                      +{searchedOrder.coinsEarned} Purity Coins
                    </div>
                    <div className="text-[11px] text-gray-600 font-medium">
                      {searchedOrder.coinsCredited || searchedOrder.status === 'Delivered'
                        ? 'Successfully credited into your wallet.'
                        : 'Will be credited automatically to your wallet upon successful delivery.'}
                    </div>
                  </div>
                </div>
                <div className="self-start sm:self-auto">
                  {searchedOrder.coinsCredited || searchedOrder.status === 'Delivered' ? (
                    <Badge className="bg-emerald-600 text-white font-bold text-xs py-1 px-3 gap-1 shadow-xs">
                      <Check className="w-3.5 h-3.5" />
                      <span>Credited to Wallet ✓</span>
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-900 font-bold text-xs py-1 px-3 gap-1 shadow-xs">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Credited Upon Delivery</span>
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Delivery Address & Items Summary */}
            {!searchedOrder.isDirectCarrierResult && (
              <div className="p-5 sm:p-8 bg-white grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Shipping Address */}
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-primary mb-2 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-secondary" />
                    <span>Delivery Destination</span>
                  </h4>
                  <div className="text-xs text-gray-700 space-y-0.5 bg-gray-50/70 p-3.5 rounded-xl border border-gray-100">
                    <p className="font-bold text-gray-900">{searchedOrder.shippingAddress?.name || searchedOrder.customerName || 'Customer'}</p>
                    <p>{searchedOrder.shippingAddress?.address || searchedOrder.shippingAddress?.addressLine1 || 'Address on file'}</p>
                    <p>
                      {[searchedOrder.shippingAddress?.city, searchedOrder.shippingAddress?.state, searchedOrder.shippingAddress?.pincode].filter(Boolean).join(', ')}
                    </p>
                    {searchedOrder.shippingAddress?.phone && (
                      <p className="text-gray-500 pt-1 font-mono">Mobile: {searchedOrder.shippingAddress.phone}</p>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-primary mb-2 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-secondary" />
                    <span>Farm Package Items ({searchedOrder.items?.length || 0})</span>
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {searchedOrder.items?.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-100 last:border-0">
                        <div>
                          <p className="font-bold text-gray-900">{item.name}</p>
                          <p className="text-[11px] text-gray-500">{item.vol || item.size || 'Standard'} × {item.qty || 1}</p>
                        </div>
                        <span className="font-bold text-primary">₹{((Number(item.price) || 0) * (Number(item.qty) || 1)).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-2 font-bold text-xs text-gray-900">
                      <span>Total Order Value:</span>
                      <span className="text-primary font-headline text-base">₹{(searchedOrder.totalAmount || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── 3. Search Error / External Fallback ── */}
        {searchError && !searchedOrder && (
          <div className="bg-white p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-amber-200 bg-amber-50/40 mb-8 sm:mb-10 text-center">
            <AlertCircle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
            <h3 className="text-sm sm:text-base font-extrabold text-gray-900 mb-1">
              {searchError}
            </h3>
            <p className="text-xs text-gray-600 max-w-md mx-auto mb-4">
              Please double-check the tracking code or reach out to our farm support team on WhatsApp.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <a
                href={`https://ship.nimbuspost.com/shipping/tracking/${encodeURIComponent(searchedCode)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 px-5 bg-primary text-white rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 hover:bg-secondary transition-colors"
              >
                <span>Track on NimbusPost</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent('courier tracking ' + searchedCode)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 px-5 border border-gray-300 bg-white text-gray-800 rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 hover:bg-gray-50 transition-colors"
              >
                <span>Google Carrier Search</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        {/* ── 4. Logged-in Customer Order History ── */}
        {isUserLoading || ordersLoading ? (
          <div className="space-y-4 sm:space-y-6 animate-pulse">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-32 sm:h-40 bg-white rounded-[22px] sm:rounded-[32px] border border-primary/5"></div>
            ))}
          </div>
        ) : !user ? (
          <div className="bg-white p-6 sm:p-10 md:p-12 rounded-[24px] sm:rounded-[40px] text-center border border-primary/5 shadow-md">
            <Package className="w-12 h-12 sm:w-16 sm:h-16 text-primary/20 mx-auto mb-4" />
            <h2 className="text-lg sm:text-2xl font-black text-gray-900 mb-2">Track With Your Account</h2>
            <p className="text-[#7A6848] text-xs sm:text-sm font-medium mb-6 max-w-md mx-auto">
              Sign in to view your complete order history, purity points, and live package status.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button 
                onClick={() => setIsLoginOpen(true)} 
                className="w-full sm:w-auto h-12 sm:h-14 px-8 sm:px-10 bg-primary hover:bg-[#14482D] text-white rounded-full font-black uppercase tracking-widest active:scale-95 transition-transform text-xs sm:text-sm cursor-pointer shadow-md"
              >
                Login Now
              </button>
              <Link 
                href="/category/ghee" 
                prefetch={true}
                className="w-full sm:w-auto h-12 sm:h-14 px-8 sm:px-10 border border-primary/20 text-primary hover:bg-primary/5 rounded-full font-black uppercase tracking-widest active:scale-95 transition-transform text-xs sm:text-sm cursor-pointer flex items-center justify-center"
              >
                Shop Pure Ghee
              </Link>
            </div>
          </div>
        ) : orders && orders.length > 0 ? (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs sm:text-sm font-extrabold text-[#7A6848] uppercase tracking-[2px]">
                Your Order History ({orders.length})
              </h2>
            </div>
            {orders.map((order, idx) => {
              const trackingUrl = order.trackingUrl || (order.trackingId 
                ? getCourierUrl(order.courierPartner || 'Vivaan Express', order.trackingId)
                : null);

              return (
                <motion.div 
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.04 }}
                  className="bg-white rounded-[22px] sm:rounded-[32px] overflow-hidden border border-primary/5 shadow-md hover:shadow-xl transition-all"
                >
                  <div className="p-4 sm:p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
                    <div className="flex items-start md:items-center gap-3.5 sm:gap-5">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#F9F6EF] rounded-xl sm:rounded-2xl flex items-center justify-center text-primary group-hover:scale-105 transition-transform shrink-0">
                        <Package className="w-6 h-6 sm:w-8 sm:h-8" />
                      </div>
                      <div>
                        <div className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-0.5">
                          Order ID: #{order.id.substring(0, 10).toUpperCase()}
                        </div>
                        <div className="text-lg sm:text-xl font-headline font-black text-primary">₹{(order.totalAmount || 0).toLocaleString('en-IN')}</div>
                        <div className="text-[11px] sm:text-xs text-muted-foreground font-medium mt-0.5">Placed on {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A'}</div>
                        
                        {order.trackingId && (
                          <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#F9F6EF] border border-[#E8ECE9] rounded-md text-[10px] sm:text-[11px] font-extrabold text-primary">
                            <Truck className="w-3 h-3 text-secondary" />
                            <span>AWB: {order.trackingId}</span>
                            <button
                              onClick={() => copyToClipboard(order.trackingId)}
                              title="Copy code"
                              className="ml-1 text-gray-500 hover:text-gray-900 cursor-pointer"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        {/* Direct Admin Note displayed on user card */}
                        {order.adminMessage && (
                          <div className="mt-2 text-[11px] text-emerald-900 bg-emerald-50 border border-emerald-200/80 rounded-lg p-2 flex items-start gap-1.5 font-medium max-w-md">
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span><strong>Farm Note:</strong> &ldquo;{order.adminMessage}&rdquo;</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-2 pt-2 md:pt-0 border-t border-[#F9F6EF] md:border-t-0">
                      <div className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-black uppercase tracking-wider",
                        order.status === 'Delivered' ? "bg-emerald-100 text-emerald-800" : 
                        order.status === 'Out for Delivery' ? "bg-purple-100 text-purple-800" :
                        order.status === 'Shipped' || order.status === 'In Transit' ? "bg-blue-100 text-blue-800" : "bg-orange-100 text-orange-700"
                      )}>
                        {getStatusIcon(order.status)}
                        {order.status || 'Processing'}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-bold">{order.paymentMethod || 'Prepaid'} · {order.paymentStatus || 'Paid'}</div>
                    </div>
                  </div>

                  <div className="px-4 sm:px-6 md:px-8 pb-4 sm:pb-6 md:pb-8 pt-3 border-t border-[#F9F6EF] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-white bg-primary/10 flex items-center justify-center text-[9px] sm:text-[10px]">🌿</div>
                        ))}
                      </div>
                      <span className="text-[11px] sm:text-xs font-bold text-[#7A6848] ml-1">Vivaan Farms Pure Dispatch</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => executeSearch(order.id)}
                        className="inline-flex items-center justify-center gap-1.5 h-10 sm:h-11 px-4 sm:px-5 border border-primary/20 text-primary text-[11px] sm:text-xs font-bold rounded-full hover:bg-primary/5 transition-all w-full sm:w-auto cursor-pointer"
                      >
                        <span>View Stepper & Notes</span>
                      </button>

                      {trackingUrl ? (
                        <a
                          href={trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 h-10 sm:h-11 px-5 sm:px-6 bg-primary text-white text-[11px] sm:text-xs font-black uppercase tracking-widest rounded-full hover:bg-secondary transition-all shadow-md active:scale-95 w-full sm:w-auto"
                        >
                          <Truck className="w-3.5 h-3.5 text-secondary" />
                          <span>Track Carrier</span>
                          <ExternalLink className="w-3 h-3 opacity-80" />
                        </a>
                      ) : (
                        <button
                          disabled
                          className="inline-flex items-center justify-center gap-2 h-10 sm:h-11 px-5 sm:px-6 bg-gray-100 text-gray-400 text-[11px] sm:text-xs font-black uppercase tracking-widest rounded-full cursor-not-allowed opacity-80 w-full sm:w-auto"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Dispatch Pending</span>
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white p-6 sm:p-12 md:p-16 rounded-[24px] sm:rounded-[40px] text-center border border-primary/5 shadow-md">
            <Package className="w-12 h-12 sm:w-16 sm:h-16 text-primary/20 mx-auto mb-4" />
            <h2 className="text-lg sm:text-2xl font-black text-gray-900 mb-2">No orders placed yet</h2>
            <p className="text-muted-foreground font-medium text-xs sm:text-sm mb-6 max-w-md mx-auto">
              Start your wellness journey today with our authentic Vedic Gir Cow A2 Bilona Ghee and pure farm harvest.
            </p>
            <Link 
              href="/category/ghee" 
              prefetch={true}
              className="inline-flex items-center gap-2 h-12 sm:h-14 px-8 sm:px-10 bg-primary hover:bg-[#14482D] text-white rounded-full font-black uppercase tracking-widest active:scale-95 transition-transform text-xs sm:text-sm cursor-pointer shadow-md"
            >
              <span>Explore Products</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </main>

      <Footer />
      <BottomNav activeTab="account" onTabChange={handleTabChange} cartCount={totalQty} />
      
      <LoginModal 
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F9F6EF] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <TrackOrderContent />
    </Suspense>
  );
}
