"use client";

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { 
  Truck, 
  Search, 
  ExternalLink, 
  Package, 
  MapPin, 
  Phone, 
  User, 
  Calendar, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  XCircle,
  Coins,
  FileText,
  Printer,
  ChevronRight,
  MoreVertical,
  RotateCcw,
  ShoppingBag,
  IndianRupee,
  Layers,
  Copy,
  Share2,
  Loader2,
  Zap,
  RefreshCw,
  Tag,
  Check,
  MessageSquare,
  Send,
  Sparkles,
  Navigation,
  Edit3
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, arrayUnion, setDoc, addDoc, updateDoc, increment } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { 
  createShipment, 
  trackShipment, 
  getShippingLabel, 
  checkNimbusConnection 
} from '@/actions/shipping-actions';

export default function AdminOrdersPage() {
  const db = useFirestore();
  const { toast } = useToast();

  const ordersRef = useMemoFirebase(() => collection(db, 'orders'), [db]);
  const { data: orders, isLoading } = useCollection(ordersRef);

  const [activeTab, setActiveTab] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // 1-Click NimbusPost Booking State
  const [bookingOrderId, setBookingOrderId] = useState<string | null>(null);

  // Live Tracking Modal State
  const [trackingModal, setTrackingModal] = useState<{
    isOpen: boolean;
    loading: boolean;
    awb: string;
    order: any | null;
    data: any | null;
    error: string | null;
  }>({
    isOpen: false,
    loading: false,
    awb: '',
    order: null,
    data: null,
    error: null,
  });

  // Manual Tracking & Customer Progress Note Dialog State
  const [trackingOrder, setTrackingOrder] = useState<any | null>(null);
  const [awbInput, setAwbInput] = useState('');
  const [courierPartner, setCourierPartner] = useState('Vivaan Farm Direct Express');
  const [statusInput, setStatusInput] = useState('Shipped');
  const [adminMessageInput, setAdminMessageInput] = useState('');
  const [locationInput, setLocationInput] = useState('');

  // Order Details Modal State
  const [viewDetailsOrder, setViewDetailsOrder] = useState<any | null>(null);

  // Label downloading state
  const [downloadingLabelAwb, setDownloadingLabelAwb] = useState<string | null>(null);

  // NimbusPost Connection Diagnostic State
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Delivered':
        return <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-emerald-500/30">Delivered</Badge>;
      case 'Out for Delivery':
        return <Badge className="bg-purple-500/10 text-purple-700 hover:bg-purple-500/20 border-purple-500/30">Out for Delivery</Badge>;
      case 'In Transit':
      case 'Shipped':
        return <Badge className="bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 border-blue-500/30">Shipped</Badge>;
      case 'Farm Packed':
        return <Badge className="bg-teal-500/10 text-teal-700 hover:bg-teal-500/20 border-teal-500/30">Farm Packed</Badge>;
      case 'Processing':
        return <Badge className="bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 border-amber-500/30">Processing</Badge>;
      case 'Pending':
        return <Badge className="bg-orange-500/10 text-orange-700 hover:bg-orange-500/20 border-orange-500/30">Pending</Badge>;
      case 'Cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'RTO':
        return <Badge variant="outline" className="text-red-700 border-red-300 bg-red-50">RTO</Badge>;
      default:
        return <Badge variant="outline">{status || 'Pending'}</Badge>;
    }
  };

  // Helper to credit purity coins into the customer's wallet upon delivery
  const creditPurityCoinsOnDelivery = async (targetOrder: any) => {
    if (!targetOrder || targetOrder.coinsCredited) return;
    const coins = Number(targetOrder.coinsEarned) || 0;
    const uid = targetOrder.userId;
    if (!uid || coins <= 0) return;

    try {
      const userProfileRef = doc(db, 'userProfiles', uid);
      await setDoc(userProfileRef, {
        purityCoins: increment(coins),
        updatedAt: new Date().toISOString()
      }, { merge: true });

      await addDoc(collection(db, 'coinTransactions'), {
        userId: uid,
        orderId: targetOrder.id,
        type: 'credit',
        amount: coins,
        description: `Purity Coins reward for Order #${targetOrder.id.substring(0, 8).toUpperCase()} delivered`,
        createdAt: new Date().toISOString()
      });

      await updateDoc(doc(db, 'orders', targetOrder.id), {
        coinsCredited: true,
        coinsCreditedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      toast({
        title: "Purity Coins Credited! 🪙",
        description: `+${coins} Purity Coins successfully credited to customer wallet.`,
      });
    } catch (err: any) {
      console.error("Failed to credit purity coins:", err);
    }
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    const targetOrder = orders?.find((o: any) => o.id === orderId);
    const updates: any = {
      status: newStatus,
      updatedAt: new Date().toISOString()
    };

    if (newStatus === 'Delivered' && targetOrder && !targetOrder.coinsCredited && Number(targetOrder.coinsEarned) > 0) {
      updates.coinsCredited = true;
      updates.coinsCreditedAt = new Date().toISOString();
    }

    updateDocumentNonBlocking(doc(db, 'orders', orderId), updates);

    if (newStatus === 'Delivered' && targetOrder) {
      await creditPurityCoinsOnDelivery(targetOrder);
    }

    toast({
      title: "Order Status Updated",
      description: `Order marked as ${newStatus}.`,
    });
  };

  /**
   * 1-Click "Book with NimbusPost" (Generate Live Courier AWB)
   */
  const handleBookNimbusPost = async (order: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!order) return;

    setBookingOrderId(order.id);
    toast({
      title: "Connecting to NimbusPost...",
      description: `Booking courier shipment for Order #${order.id.substring(0, 8).toUpperCase()}`,
    });

    try {
      const orderPayload = {
        orderId: order.id,
        userEmail: order.userEmail || order.customerEmail || '',
        totalAmount: Number(order.totalAmount) || 0,
        paymentMethod: order.paymentMethod || 'Prepaid',
        shippingAddress: order.shippingAddress || {
          name: order.customerName,
          phone: order.customerPhone,
          address: order.shippingAddress?.address || 'Delivery Address',
          city: order.shippingAddress?.city || '',
          state: order.shippingAddress?.state || '',
          pincode: order.shippingAddress?.pincode || '',
        },
        items: order.items || [],
      };

      const res = await createShipment(orderPayload);

      if (res?.success) {
        const updates: any = {
          trackingId: res.trackingId,
          courierPartner: res.courierName || 'NimbusPost',
          courierName: res.courierName || 'NimbusPost Express',
          trackingUrl: res.trackingUrl || `https://ship.nimbuspost.com/shipping/tracking/${encodeURIComponent(res.trackingId)}`,
          shipmentId: res.shipmentId || null,
          labelUrl: res.labelUrl || null,
          status: 'Shipped',
          courierStatus: 'MANIFESTED',
          updatedAt: new Date().toISOString(),
        };

        updateDocumentNonBlocking(doc(db, 'orders', order.id), updates);

        toast({
          title: "NimbusPost AWB Generated! 📦",
          description: `AWB ${res.trackingId} assigned via ${res.courierName}. Order marked Shipped.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "NimbusPost Notice",
          description: res?.error || "Could not generate AWB automatically. You can assign manual AWB & message.",
        });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Shipment Booking Error",
        description: err.message || "Network error while connecting to NimbusPost.",
      });
    } finally {
      setBookingOrderId(null);
    }
  };

  /**
   * Opens Live Tracking Dialog and fetches real-time carrier scans
   */
  const handleOpenLiveTracking = async (order: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!order || !order.trackingId) return;

    setTrackingModal({
      isOpen: true,
      loading: true,
      awb: order.trackingId,
      order: order,
      data: null,
      error: null,
    });

    try {
      const trackingResult = await trackShipment(order.trackingId);
      if (trackingResult?.success) {
        setTrackingModal(prev => ({
          ...prev,
          loading: false,
          data: trackingResult,
          error: null,
        }));
      } else {
        setTrackingModal(prev => ({
          ...prev,
          loading: false,
          error: trackingResult?.error || 'Unable to load carrier checkpoints.',
        }));
      }
    } catch (err: any) {
      setTrackingModal(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'Tracking service query failed.',
      }));
    }
  };

  /**
   * Downloads or opens official printable NimbusPost shipping label
   */
  const handleDownloadLabel = async (awb: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!awb) return;

    setDownloadingLabelAwb(awb);
    toast({
      title: "Generating Shipping Label...",
      description: `Fetching barcode label for AWB ${awb}`,
    });

    try {
      const res = await getShippingLabel(awb);
      if (res?.success && res.labelUrl) {
        window.open(res.labelUrl, '_blank');
        toast({
          title: "Shipping Label Ready!",
          description: "Opened printable label in a new tab.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Label Notice",
          description: res?.error || "Label not yet available from courier. Please check carrier portal.",
        });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Label Error",
        description: err.message || "Failed to download label.",
      });
    } finally {
      setDownloadingLabelAwb(null);
    }
  };

  /**
   * Diagnostics: Test NimbusPost API & Warehouse configuration
   */
  const handleTestNimbusConnection = async () => {
    setIsCheckingConnection(true);
    try {
      const res = await checkNimbusConnection();
      if (res.connected) {
        toast({
          title: "NimbusPost Connected! 🟢",
          description: `API active. Pickup Warehouse: "${res.warehouse}". Ready to dispatch shipments.`,
        });
      } else if (res.configured) {
        toast({
          variant: "destructive",
          title: "NimbusPost Auth Error 🟠",
          description: res.message,
        });
      } else {
        toast({
          title: "NimbusPost Offline Mode ⚪",
          description: "NIMBUSPOST_TOKEN not set. Manual tracking & custom notes are 100% active.",
        });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Connection Test Failed",
        description: err.message,
      });
    } finally {
      setIsCheckingConnection(false);
    }
  };

  /**
   * Opens the Manual Tracking & Customer Progress Note Modal.
   * Can be opened anytime to set/change AWB, status, location, and message to the customer.
   */
  const handleOpenTracking = (order: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTrackingOrder(order);
    setAwbInput(order.trackingId || `VF${Date.now().toString().slice(-8)}IN`);
    setCourierPartner(order.courierPartner || order.courierName || 'Vivaan Farm Direct Express');
    setStatusInput(order.status || 'Shipped');
    setAdminMessageInput(order.adminMessage || '');
    setLocationInput(order.currentLocation || 'Gujarat Vedic Farm Facility');
  };

  const getOfficialCourierUrl = (partner: string, awb: string) => {
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

  const handleCopyTrackingCode = (trackingId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(trackingId);
    toast({
      title: "Tracking Code Copied!",
      description: `AWB ${trackingId} copied. You can give this code to the customer.`,
    });
  };

  /**
   * Generates WhatsApp message incorporating tracking ID, status, and custom admin message
   */
  const handleCopyCustomerMessage = (order: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const orderNum = order.id?.substring(0, 8).toUpperCase();
    const awb = order.trackingId || '';
    const name = order.shippingAddress?.name || order.customerName || 'Customer';
    const courier = order.courierPartner || order.courierName || 'Vivaan Farm Direct Express';
    const status = order.status || 'Shipped';
    const note = order.adminMessage ? `\n\n🌿 Farm Dispatch Note: "${order.adminMessage}"` : '';
    const loc = order.currentLocation ? ` (Location: ${order.currentLocation})` : '';

    const msg = `Namaste ${name}! Your Vivaan Farms order #${orderNum} status is: ${status}${loc}. Dispatch via: ${courier} (Tracking ID: ${awb}).${note}\n\nYou can track live progress anytime at: https://vivaanfarms.com/track?code=${encodeURIComponent(awb)}`;
    
    navigator.clipboard.writeText(msg);
    toast({
      title: "Customer Message Copied!",
      description: "WhatsApp update message copied with your custom note. Ready to send.",
    });
  };

  /**
   * Saves tracking ID, order status, location, and the admin's personal message to the user.
   * This immediately reflects on the customer's `/track` page.
   */
  const handleSaveTracking = () => {
    if (!trackingOrder) return;
    const cleanAwb = awbInput.trim() || `VF${Date.now().toString().slice(-8)}IN`;
    const cleanMessage = adminMessageInput.trim();
    const cleanLocation = locationInput.trim();

    const trackingUrl = getOfficialCourierUrl(courierPartner, cleanAwb);

    // Create a new checkpoint record for the chronological tracking history
    const newCheckpoint = {
      status: statusInput.toUpperCase(),
      activity: cleanMessage || `Order status updated to ${statusInput} by farm manager`,
      location: cleanLocation || (courierPartner.includes('Farm') ? 'Gujarat Vedic Farm' : courierPartner),
      timestamp: new Date().toISOString(),
      source: 'admin_manual',
    };

    const updates: any = {
      trackingId: cleanAwb,
      courierPartner,
      courierName: courierPartner,
      status: statusInput,
      adminMessage: cleanMessage || null,
      currentLocation: cleanLocation || null,
      trackingUrl,
      updatedAt: new Date().toISOString(),
      trackingCheckpoints: arrayUnion(newCheckpoint),
    };

    if (statusInput === 'Delivered' && trackingOrder) {
      if (!trackingOrder.coinsCredited && Number(trackingOrder.coinsEarned) > 0) {
        updates.coinsCredited = true;
        updates.coinsCreditedAt = new Date().toISOString();
      }
      creditPurityCoinsOnDelivery(trackingOrder);
    }

    updateDocumentNonBlocking(doc(db, 'orders', trackingOrder.id), updates);

    toast({
      title: "Tracking & Progress Saved! 📦",
      description: `AWB ${cleanAwb} updated to "${statusInput}". Customer will see your note on /track.`,
    });

    setTrackingOrder(null);
    setAwbInput('');
    setAdminMessageInput('');
    setLocationInput('');
  };

  // Helper to extract timestamp ms safely from ISO string or Firestore Timestamp
  const getOrderTimestamp = (o: any): number => {
    if (o.orderDate) {
      const ms = new Date(o.orderDate).getTime();
      if (!isNaN(ms)) return ms;
    }
    if (o.createdAt) {
      if (typeof o.createdAt.toMillis === 'function') return o.createdAt.toMillis();
      if (typeof o.createdAt.seconds === 'number') return o.createdAt.seconds * 1000;
      const ms = new Date(o.createdAt).getTime();
      if (!isNaN(ms)) return ms;
    }
    return 0;
  };

  // Filter and Sort Orders
  const filteredOrders = useMemo(() => {
    if (!orders) return [];

    let list = [...orders];

    // Status filter
    if (activeTab !== 'All') {
      if (activeTab === 'Pending') {
        list = list.filter((o) => !o.status || o.status === 'Pending');
      } else {
        list = list.filter((o) => o.status === activeTab);
      }
    }

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      list = list.filter((o) => {
        const id = (o.id || '').toLowerCase();
        const customerName = (o.shippingAddress?.name || o.userName || o.customerName || '').toLowerCase();
        const city = (o.shippingAddress?.city || '').toLowerCase();
        const phone = (o.shippingAddress?.phone || o.customerPhone || '').toLowerCase();
        const email = (o.userEmail || o.customerEmail || '').toLowerCase();
        const tracking = (o.trackingId || '').toLowerCase();
        const courier = (o.courierPartner || o.courierName || '').toLowerCase();
        const note = (o.adminMessage || '').toLowerCase();

        return (
          id.includes(term) ||
          customerName.includes(term) ||
          city.includes(term) ||
          phone.includes(term) ||
          email.includes(term) ||
          tracking.includes(term) ||
          courier.includes(term) ||
          note.includes(term)
        );
      });
    }

    // Sort by Date Descending
    return list.sort((a, b) => getOrderTimestamp(b) - getOrderTimestamp(a));
  }, [orders, activeTab, searchTerm]);

  // Aggregate Metrics
  const orderMetrics = useMemo(() => {
    if (!orders) return { total: 0, revenue: 0, pending: 0, shipped: 0, delivered: 0, rto: 0 };
    return {
      total: orders.length,
      revenue: orders.reduce((acc, o) => acc + (Number(o.totalAmount) || 0), 0),
      pending: orders.filter(o => !o.status || o.status === 'Pending' || o.status === 'Processing').length,
      shipped: orders.filter(o => o.status === 'Shipped' || o.status === 'In Transit' || o.status === 'Out for Delivery').length,
      delivered: orders.filter(o => o.status === 'Delivered').length,
      rto: orders.filter(o => o.status === 'RTO').length,
    };
  }, [orders]);

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">Syncing orders data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Orders & Logistics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Book via NimbusPost or manually dispatch from your hand with tracking codes and personal notes for customers.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleTestNimbusConnection}
            disabled={isCheckingConnection}
            className="h-9 gap-1.5 text-xs font-semibold border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100"
          >
            {isCheckingConnection ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
            <span>NimbusPost Status</span>
          </Button>

          <Button variant="outline" size="sm" onClick={() => window.print()} className="h-9 gap-1.5 text-xs font-medium">
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border/80 shadow-sm p-4">
          <div className="text-xs font-medium text-muted-foreground">Total Orders</div>
          <div className="text-2xl font-bold mt-1">{orderMetrics.total}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">All time orders</div>
        </Card>
        <Card className="border border-border/80 shadow-sm p-4">
          <div className="text-xs font-medium text-amber-600">Pending Dispatch</div>
          <div className="text-2xl font-bold mt-1 text-amber-700">{orderMetrics.pending}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Ready for booking / manual dispatch</div>
        </Card>
        <Card className="border border-border/80 shadow-sm p-4">
          <div className="text-xs font-medium text-blue-600">In Transit & Out for Delivery</div>
          <div className="text-2xl font-bold mt-1 text-blue-700">{orderMetrics.shipped}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">With courier or farm delivery</div>
        </Card>
        <Card className="border border-border/80 shadow-sm p-4">
          <div className="text-xs font-medium text-emerald-600">Total Revenue</div>
          <div className="text-2xl font-bold mt-1 text-emerald-700">₹{orderMetrics.revenue.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Gross order value</div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border border-border/80 shadow-sm">
        <CardContent className="p-3 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by ID, customer, phone, AWB, note..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="overflow-x-auto w-full md:w-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="h-9">
                <TabsTrigger value="All" className="text-xs">All ({orderMetrics.total})</TabsTrigger>
                <TabsTrigger value="Pending" className="text-xs">Pending ({orderMetrics.pending})</TabsTrigger>
                <TabsTrigger value="Processing" className="text-xs">Processing</TabsTrigger>
                <TabsTrigger value="Shipped" className="text-xs">Shipped ({orderMetrics.shipped})</TabsTrigger>
                <TabsTrigger value="Delivered" className="text-xs">Delivered ({orderMetrics.delivered})</TabsTrigger>
                <TabsTrigger value="Cancelled" className="text-xs">Cancelled</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="border border-border/80 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/60 hover:bg-transparent">
              <TableHead className="px-4 text-xs font-semibold">Order ID</TableHead>
              <TableHead className="px-4 text-xs font-semibold">Customer & Address</TableHead>
              <TableHead className="px-4 text-xs font-semibold">Status</TableHead>
              <TableHead className="px-4 text-xs font-semibold">Tracking, Method & Note</TableHead>
              <TableHead className="px-4 text-xs font-semibold">Total Amount</TableHead>
              <TableHead className="px-4 text-xs font-semibold">Date</TableHead>
              <TableHead className="px-4 text-xs font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => {
                const customerName = order.shippingAddress?.name || order.userName || 'Customer';
                const city = order.shippingAddress?.city || '';
                const phone = order.shippingAddress?.phone || '';
                const isBooking = bookingOrderId === order.id;

                return (
                  <TableRow 
                    key={order.id} 
                    className="border-b border-border/40 hover:bg-muted/40 transition-colors cursor-pointer"
                    onClick={() => setViewDetailsOrder(order)}
                  >
                    <TableCell className="px-4 py-3 font-mono text-xs font-medium text-foreground">
                      #{order.id.substring(0, 8).toUpperCase()}
                      <div className="text-[10px] text-muted-foreground font-sans mt-0.5">
                        {order.paymentMethod || 'Online'}
                      </div>
                    </TableCell>

                    <TableCell className="px-4 py-3">
                      <div className="text-xs font-medium text-foreground truncate max-w-[180px]">
                        {customerName}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {city ? `${city} • ` : ''}{phone || 'No phone'}
                      </div>
                    </TableCell>

                    <TableCell className="px-4 py-3">
                      {getStatusBadge(order.status || 'Pending')}
                    </TableCell>

                    <TableCell className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {order.trackingId ? (
                        <div className="flex flex-col gap-1 max-w-[280px]">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Clickable AWB that opens Live Tracking Dialog */}
                            <button
                              type="button"
                              onClick={(e) => handleOpenLiveTracking(order, e)}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border border-emerald-300 bg-emerald-50 text-emerald-800 text-[11px] font-mono hover:bg-emerald-100 transition-colors cursor-pointer"
                              title="Click to view real-time courier checkpoints"
                            >
                              <Truck className="w-3 h-3 text-emerald-600" />
                              <span className="font-bold">{order.trackingId}</span>
                              <span className="text-[9px] text-emerald-700 bg-white/80 px-1 py-0.2 rounded font-sans uppercase">
                                {order.courierPartner || 'Direct'}
                              </span>
                            </button>

                            {/* Quick copy code */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleCopyTrackingCode(order.trackingId, e)}
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                              title="Copy tracking code for customer"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>

                            {/* WhatsApp Customer share */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleCopyCustomerMessage(order, e)}
                              className="h-6 w-6 p-0 text-emerald-600 hover:text-emerald-700 cursor-pointer"
                              title="Copy customer WhatsApp shipping message with note"
                            >
                              <Share2 className="w-3 h-3" />
                            </Button>

                            {/* Quick Edit Note & Status */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleOpenTracking(order, e)}
                              className="h-6 px-1.5 text-[10px] text-blue-700 hover:bg-blue-50 cursor-pointer font-semibold"
                              title="Update Progress, Location, or Message"
                            >
                              <Edit3 className="w-2.5 h-2.5 mr-0.5" />
                              <span>Update</span>
                            </Button>
                          </div>

                          {/* Live Customer Note Snippet */}
                          {order.adminMessage && (
                            <div 
                              className="text-[10px] text-emerald-900 bg-emerald-50 border border-emerald-200/80 rounded px-1.5 py-0.5 flex items-center gap-1 truncate"
                              title={order.adminMessage}
                            >
                              <MessageSquare className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                              <span className="truncate italic">&ldquo;{order.adminMessage}&rdquo;</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* 1-Click "Book with NimbusPost" Button */}
                          <Button
                            size="sm"
                            onClick={(e) => handleBookNimbusPost(order, e)}
                            disabled={isBooking}
                            className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs cursor-pointer"
                          >
                            {isBooking ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>Booking...</span>
                              </>
                            ) : (
                              <>
                                <Zap className="w-3 h-3 fill-amber-300 text-amber-300" />
                                <span>Ship Nimbus</span>
                              </>
                            )}
                          </Button>

                          {/* Manual Dispatch & Message Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => handleOpenTracking(order, e)}
                            className="h-7 text-xs px-2.5 gap-1 border-primary/30 text-primary hover:bg-primary/5 cursor-pointer font-medium"
                            title="Dispatch from hand with manual tracking ID & message"
                          >
                            <Edit3 className="w-3 h-3 text-secondary" />
                            <span>Manual Dispatch</span>
                          </Button>
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="px-4 py-3 text-xs font-semibold text-foreground">
                      <div>₹{(order.totalAmount || 0).toLocaleString('en-IN')}</div>
                      {Number(order.coinsEarned) > 0 && (
                        <div className="text-[10px] mt-0.5 font-medium">
                          {order.coinsCredited || order.status === 'Delivered' ? (
                            <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                              🪙 +{order.coinsEarned} (Credited)
                            </span>
                          ) : (
                            <span className="text-amber-700 flex items-center gap-0.5">
                              🪙 +{order.coinsEarned} (On Delivery)
                            </span>
                          )}
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {(() => {
                        const ms = getOrderTimestamp(order);
                        return ms > 0
                          ? new Date(ms).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                          : 'Recently';
                      })()}
                    </TableCell>

                    <TableCell className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 font-sans">
                          <DropdownMenuLabel className="text-xs">Order Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => setViewDetailsOrder(order)} className="text-xs cursor-pointer">
                            <FileText className="w-3.5 h-3.5 mr-2" /> View Details & Invoice
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => handleOpenTracking(order)} className="text-xs cursor-pointer text-emerald-800 font-semibold">
                            <Edit3 className="w-3.5 h-3.5 mr-2 text-emerald-600" /> 
                            {order.trackingId ? 'Update Tracking & Note' : 'Manual Dispatch & Note'}
                          </DropdownMenuItem>

                          {!order.trackingId && (
                            <DropdownMenuItem 
                              onClick={() => handleBookNimbusPost(order)} 
                              className="text-xs cursor-pointer text-blue-700"
                            >
                              <Zap className="w-3.5 h-3.5 mr-2 text-blue-600" /> Book via NimbusPost
                            </DropdownMenuItem>
                          )}

                          {order.trackingId && (
                            <>
                              <DropdownMenuItem 
                                onClick={() => handleOpenLiveTracking(order)} 
                                className="text-xs cursor-pointer text-blue-700"
                              >
                                <RefreshCw className="w-3.5 h-3.5 mr-2 text-blue-600" /> Track Live Checkpoints
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDownloadLabel(order.trackingId)} 
                                className="text-xs cursor-pointer"
                              >
                                <Tag className="w-3.5 h-3.5 mr-2" /> Print Shipping Label
                              </DropdownMenuItem>
                            </>
                          )}

                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => updateStatus(order.id, 'Processing')} className="text-xs cursor-pointer">
                            <Clock className="w-3.5 h-3.5 mr-2 text-blue-600" /> Mark Processing
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus(order.id, 'Farm Packed')} className="text-xs cursor-pointer">
                            <Package className="w-3.5 h-3.5 mr-2 text-teal-600" /> Mark Farm Packed
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus(order.id, 'Shipped')} className="text-xs cursor-pointer">
                            <Truck className="w-3.5 h-3.5 mr-2 text-purple-600" /> Mark Shipped
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus(order.id, 'Out for Delivery')} className="text-xs cursor-pointer">
                            <Navigation className="w-3.5 h-3.5 mr-2 text-orange-600" /> Mark Out for Delivery
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus(order.id, 'Delivered')} className="text-xs cursor-pointer">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-emerald-600" /> Mark Delivered
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus(order.id, 'Cancelled')} className="text-xs cursor-pointer text-destructive">
                            <XCircle className="w-3.5 h-3.5 mr-2" /> Cancel Order
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-xs text-muted-foreground">
                  No orders found matching the filter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* ── LIVE CARRIER TRACKING DIALOG ── */}
      <Dialog 
        open={trackingModal.isOpen} 
        onOpenChange={(open) => !open && setTrackingModal(prev => ({ ...prev, isOpen: false }))}
      >
        <DialogContent className="max-w-lg p-6 font-sans">
          <DialogHeader className="border-b border-border/60 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                  <Truck className="w-5 h-5 text-emerald-600" />
                  <span>Carrier & Dispatch Progress</span>
                </DialogTitle>
                <DialogDescription className="text-xs mt-0.5">
                  Real-time GPS scans, transit checkpoints, and farm dispatch notes.
                </DialogDescription>
              </div>
              <Badge variant="outline" className="text-xs font-mono bg-emerald-50 text-emerald-800 border-emerald-300">
                AWB: {trackingModal.awb}
              </Badge>
            </div>
          </DialogHeader>

          {trackingModal.loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-7 h-7 text-emerald-600 animate-spin" />
              <p className="text-xs font-medium text-muted-foreground animate-pulse">
                Querying carrier network...
              </p>
            </div>
          ) : trackingModal.error ? (
            <div className="py-6 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
              <p className="text-xs text-foreground font-medium">{trackingModal.error}</p>
              <div className="pt-2">
                <a
                  href={`https://ship.nimbuspost.com/shipping/tracking/${encodeURIComponent(trackingModal.awb)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-md text-xs font-semibold hover:bg-primary/90"
                >
                  <span>Open in NimbusPost Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              {/* Status Header */}
              <div className="p-3.5 bg-muted/30 rounded-xl border border-border/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Carrier Partner</span>
                  <div className="text-sm font-bold text-foreground flex items-center gap-1.5 mt-0.5">
                    <Truck className="w-4 h-4 text-emerald-600" />
                    <span>{trackingModal.data?.courier || 'Vivaan Farm Direct Express'}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Current Status</span>
                  <Badge className="bg-emerald-600 text-white text-xs mt-0.5">
                    {trackingModal.data?.currentStatus || trackingModal.order?.status || 'In Transit'}
                  </Badge>
                </div>
              </div>

              {/* Checkpoints Timeline */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-foreground block">Transit Checkpoints</span>
                <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
                  {trackingModal.data?.checkpoints && trackingModal.data.checkpoints.length > 0 ? (
                    trackingModal.data.checkpoints.map((cp: any, idx: number) => (
                      <div key={idx} className="relative pl-6 pb-3 last:pb-0 border-l-2 border-emerald-500/30 last:border-l-transparent">
                        <div className="absolute -left-[5px] top-0.5 w-2 h-2 rounded-full bg-emerald-600 ring-4 ring-emerald-50" />
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-foreground">{cp.status || 'Transit Hub'}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {cp.timestamp ? new Date(cp.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{cp.activity}</p>
                        {cp.location && (
                          <div className="text-[10px] text-emerald-700 font-medium flex items-center gap-1 mt-1">
                            <MapPin className="w-2.5 h-2.5" />
                            <span>{cp.location}</span>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-muted-foreground py-4 text-center">
                      Package registered. Scans will appear as soon as the courier scans the barcode at the dispatch hub.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadLabel(trackingModal.awb)}
                className="h-8 text-xs gap-1 cursor-pointer"
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Print Label</span>
              </Button>
              <a
                href={`https://ship.nimbuspost.com/shipping/tracking/${encodeURIComponent(trackingModal.awb)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 h-8 px-3 rounded-md border border-input text-xs font-medium hover:bg-muted"
              >
                <span>Carrier Portal</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <Button size="sm" onClick={() => setTrackingModal(prev => ({ ...prev, isOpen: false }))}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── MANUAL DISPATCH & CUSTOM NOTE DIALOG (From Admin's Hand) ── */}
      <Dialog open={!!trackingOrder} onOpenChange={(open) => !open && setTrackingOrder(null)}>
        <DialogContent className="max-w-lg p-6 font-sans">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              <Truck className="w-5 h-5 text-emerald-600" />
              <span>Manual Dispatch & Customer Progress Note</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Give tracking details from your hand and send a progress message that directly appears on the customer&apos;s tracking page.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Courier Service & Tracking Code */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Courier / Dispatch Method</label>
                <select
                  value={courierPartner}
                  onChange={(e) => setCourierPartner(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="Vivaan Farm Direct Express">🌿 Vivaan Farm Direct Express</option>
                  <option value="Local Vehicle / Hand Delivery">🛵 Local Vehicle / Hand Delivery</option>
                  <option value="India Post Speed Post">📮 India Post Speed Post</option>
                  <option value="Delhivery">📦 Delhivery Express</option>
                  <option value="Blue Dart">✈️ Blue Dart Express</option>
                  <option value="DTDC">🚚 DTDC Courier</option>
                  <option value="Shadowfax">⚡ Shadowfax Logistics</option>
                  <option value="NimbusPost">📦 NimbusPost (Manual AWB)</option>
                  <option value="Local Tempo / Transport">🚛 Local Tempo / Transport</option>
                  <option value="Other Carrier">Other Carrier</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">Tracking ID / AWB Code</label>
                  <button
                    type="button"
                    onClick={() => setAwbInput(`VF${Date.now().toString().slice(-8)}IN`)}
                    className="text-[10px] text-emerald-700 hover:underline font-semibold cursor-pointer"
                  >
                    Auto-Generate
                  </button>
                </div>
                <Input
                  placeholder="e.g. VF14325678IN or LocalSlip#04"
                  value={awbInput}
                  onChange={(e) => setAwbInput(e.target.value)}
                  className="h-9 text-xs font-mono font-bold"
                />
              </div>
            </div>

            {/* Status Progress & Current Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Order Progress Status</label>
                <select
                  value={statusInput}
                  onChange={(e) => setStatusInput(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="Processing">⏳ Processing (Confirming order)</option>
                  <option value="Farm Packed">🌿 Farm Packed (Quality checked)</option>
                  <option value="Shipped">📦 Shipped (Dispatched from farm)</option>
                  <option value="In Transit">🚚 In Transit (En route to destination)</option>
                  <option value="Out for Delivery">🛵 Out for Delivery (Arriving today)</option>
                  <option value="Delivered">✅ Delivered (Doorstep delivery complete)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Current Hub / Location (Optional)</label>
                <Input
                  placeholder="e.g. Gujarat Farm Facility, Surat Hub"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Custom Message to Customer Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Personal Progress Message for Customer</span>
                </label>
                <span className="text-[10px] text-muted-foreground">Directly visible on customer /track page</span>
              </div>
              <textarea
                rows={3}
                placeholder="e.g. Your Vedic Gir cow ghee has been freshly hand-churned and packed with natural insulation. Driver Ramesh (98765-43210) is out for delivery today."
                value={adminMessageInput}
                onChange={(e) => setAdminMessageInput(e.target.value)}
                className="w-full p-2.5 text-xs rounded-md border border-input bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none text-foreground placeholder:text-muted-foreground/60"
              />

              {/* Quick Preset Message Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-semibold text-muted-foreground">Quick Presets:</span>
                <button
                  type="button"
                  onClick={() => {
                    setAdminMessageInput("Your authentic Vedic Bilona Ghee package has been fresh-packed and verified for purity.");
                    setStatusInput("Farm Packed");
                  }}
                  className="text-[10px] px-2 py-0.5 rounded-full border border-teal-200 bg-teal-50 text-teal-800 hover:bg-teal-100 cursor-pointer"
                >
                  🌿 Farm Packed
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdminMessageInput("Dispatched in temperature-safe packaging via direct courier express. Heading to your city hub.");
                    setStatusInput("Shipped");
                  }}
                  className="text-[10px] px-2 py-0.5 rounded-full border border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100 cursor-pointer"
                >
                  🚚 Dispatched
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdminMessageInput("Your package is out for delivery with our delivery executive. Please keep your phone handy.");
                    setStatusInput("Out for Delivery");
                  }}
                  className="text-[10px] px-2 py-0.5 rounded-full border border-orange-200 bg-orange-50 text-orange-800 hover:bg-orange-100 cursor-pointer"
                >
                  🛵 Out for Delivery
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdminMessageInput("Package delivered safely at your doorstep. We hope you cherish this pure Vedic goodness!");
                    setStatusInput("Delivered");
                  }}
                  className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 cursor-pointer"
                >
                  ✅ Delivered
                </button>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-border/60">
            <Button variant="outline" size="sm" onClick={() => setTrackingOrder(null)} className="cursor-pointer">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveTracking} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 cursor-pointer font-semibold">
              <Send className="w-3.5 h-3.5" />
              <span>Save & Update Customer</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── ORDER DETAILS & INVOICE DIALOG ── */}
      <Dialog open={!!viewDetailsOrder} onOpenChange={(open) => !open && setViewDetailsOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6 font-sans">
          <DialogHeader className="border-b border-border/60 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-lg font-bold">
                  Order #{viewDetailsOrder?.id?.substring(0, 8).toUpperCase()}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Placed on {viewDetailsOrder?.orderDate ? new Date(viewDetailsOrder.orderDate).toLocaleString('en-IN') : 'N/A'}
                </DialogDescription>
              </div>
              <div>
                {viewDetailsOrder && getStatusBadge(viewDetailsOrder.status || 'Pending')}
              </div>
            </div>
          </DialogHeader>

          {viewDetailsOrder && (
            <div className="space-y-5 pt-2">
              {/* Customer & Shipping Summary */}
              <div className="grid grid-cols-2 gap-4 p-3.5 rounded-lg border border-border bg-muted/20 text-xs">
                <div>
                  <span className="font-semibold text-foreground block mb-1">Shipping Address:</span>
                  <p className="font-medium text-foreground">{viewDetailsOrder.shippingAddress?.name || viewDetailsOrder.userName || viewDetailsOrder.customerName}</p>
                  <p className="text-muted-foreground">{viewDetailsOrder.shippingAddress?.address || viewDetailsOrder.shippingAddress?.addressLine1}</p>
                  <p className="text-muted-foreground">
                    {[viewDetailsOrder.shippingAddress?.city, viewDetailsOrder.shippingAddress?.state, viewDetailsOrder.shippingAddress?.pincode].filter(Boolean).join(', ')}
                  </p>
                  <p className="text-muted-foreground mt-1">Phone: {viewDetailsOrder.shippingAddress?.phone || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-semibold text-foreground block mb-1">Payment & Logistics:</span>
                  <p className="text-muted-foreground">Method: <span className="font-medium text-foreground">{viewDetailsOrder.paymentMethod || 'Online'}</span></p>
                  <p className="text-muted-foreground">Payment ID: <span className="font-mono text-foreground">{viewDetailsOrder.paymentId || viewDetailsOrder.razorpayPaymentId || 'N/A'}</span></p>
                  
                  {viewDetailsOrder.trackingId ? (
                    <div className="mt-2 space-y-1.5">
                      <p className="text-muted-foreground">
                        AWB: <span className="font-mono font-medium text-emerald-700">{viewDetailsOrder.trackingId}</span> ({viewDetailsOrder.courierPartner || 'Vivaan Express'})
                      </p>
                      
                      {viewDetailsOrder.adminMessage && (
                        <div className="text-[11px] text-emerald-900 bg-emerald-50 border border-emerald-200/80 rounded p-1.5 my-1">
                          <span className="font-bold block">Live Farm Note:</span>
                          <span className="italic">&ldquo;{viewDetailsOrder.adminMessage}&rdquo;</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyTrackingCode(viewDetailsOrder.trackingId)}
                          className="h-6 text-[10px] gap-1 px-2 border-border cursor-pointer"
                        >
                          <Copy className="w-2.5 h-2.5" />
                          <span>Copy AWB</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyCustomerMessage(viewDetailsOrder)}
                          className="h-6 text-[10px] gap-1 px-2 border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 cursor-pointer"
                        >
                          <Share2 className="w-2.5 h-2.5 text-emerald-600" />
                          <span>WhatsApp Update</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenTracking(viewDetailsOrder)}
                          className="h-6 text-[10px] gap-1 px-2 border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100 cursor-pointer"
                        >
                          <Edit3 className="w-2.5 h-2.5 text-blue-600" />
                          <span>Edit Note</span>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleOpenTracking(viewDetailsOrder)}
                        className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Manual Dispatch & Note</span>
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-foreground">Purchased Items</span>
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-border/60 hover:bg-transparent">
                        <TableHead className="text-xs h-8">Product</TableHead>
                        <TableHead className="text-xs h-8">Size</TableHead>
                        <TableHead className="text-xs h-8 text-center">Qty</TableHead>
                        <TableHead className="text-xs h-8 text-right">Price</TableHead>
                        <TableHead className="text-xs h-8 text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewDetailsOrder.items?.map((item: any, idx: number) => (
                        <TableRow key={idx} className="border-b border-border/40">
                          <TableCell className="py-2 text-xs font-medium text-foreground">
                            {item.name}
                          </TableCell>
                          <TableCell className="py-2 text-xs text-muted-foreground">
                            {item.vol || item.size || 'Standard'}
                          </TableCell>
                          <TableCell className="py-2 text-xs text-center text-foreground font-medium">
                            {item.quantity || item.qty || 1}
                          </TableCell>
                          <TableCell className="py-2 text-xs text-right text-muted-foreground">
                            ₹{item.price}
                          </TableCell>
                          <TableCell className="py-2 text-xs text-right font-medium text-foreground">
                            ₹{(item.price || 0) * (item.quantity || item.qty || 1)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Pricing Breakdown */}
              <div className="border-t border-border/60 pt-3 flex flex-col items-end space-y-1 text-xs">
                <div className="flex justify-between w-48 text-muted-foreground">
                  <span>Subtotal:</span>
                  <span>₹{viewDetailsOrder.subtotal || viewDetailsOrder.totalAmount}</span>
                </div>
                {viewDetailsOrder.purityCoinsRedeemed > 0 && (
                  <div className="flex justify-between w-48 text-emerald-600">
                    <span>Coins Redeemed:</span>
                    <span>-₹{viewDetailsOrder.purityCoinsRedeemed}</span>
                  </div>
                )}
                {viewDetailsOrder.discountAmount > 0 && (
                  <div className="flex justify-between w-48 text-emerald-600">
                    <span>Discount:</span>
                    <span>-₹{viewDetailsOrder.discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between w-48 font-bold text-foreground text-sm border-t border-border/60 pt-1">
                  <span>Grand Total:</span>
                  <span>₹{viewDetailsOrder.totalAmount}</span>
                </div>
                {Number(viewDetailsOrder.coinsEarned) > 0 && (
                  <div className="flex justify-between w-64 text-amber-800 dark:text-amber-400 font-semibold pt-1 border-t border-border/40 text-[11px]">
                    <span>Purity Coins Reward:</span>
                    <span>
                      +{viewDetailsOrder.coinsEarned} Coins {viewDetailsOrder.coinsCredited || viewDetailsOrder.status === 'Delivered' ? ' (Credited ✓)' : ' (On Delivery)'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="pt-4 border-t border-border/60">
            <Button variant="outline" size="sm" onClick={() => window.print()} className="cursor-pointer">
              <Printer className="w-3.5 h-3.5 mr-1" /> Print Invoice
            </Button>
            <Button size="sm" onClick={() => setViewDetailsOrder(null)} className="cursor-pointer">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
