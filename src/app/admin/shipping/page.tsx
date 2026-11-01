"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Truck, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Copy, 
  RefreshCw, 
  Search, 
  Zap, 
  ShieldCheck, 
  MapPin, 
  Calendar, 
  Package, 
  ArrowRight,
  Sparkles,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { 
  checkNimbusConnection, 
  checkServiceability, 
  createShipment 
} from '@/actions/shipping-actions';

export default function AdminShippingPage() {
  const db = useFirestore();
  const { toast } = useToast();

  // Firestore orders
  const ordersRef = useMemoFirebase(() => collection(db, 'orders'), [db]);
  const { data: orders, isLoading: ordersLoading } = useCollection(ordersRef);

  // Diagnostics & Serviceability State
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<any>(null);
  const [pincodeInput, setPincodeInput] = useState('');
  const [isCheckingPincode, setIsCheckingPincode] = useState(false);
  const [serviceabilityResult, setServiceabilityResult] = useState<any>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [bookingOrderId, setBookingOrderId] = useState<string | null>(null);

  // Calculate Shipping KPIs
  const stats = useMemo(() => {
    if (!orders) return { total: 0, manifested: 0, inTransit: 0, delivered: 0 };
    const total = orders.length;
    const manifested = orders.filter(o => o.trackingId && o.status !== 'Delivered').length;
    const inTransit = orders.filter(o => o.status === 'Shipped' || o.courierStatus === 'IN_TRANSIT').length;
    const delivered = orders.filter(o => o.status === 'Delivered').length;
    return { total, manifested, inTransit, delivered };
  }, [orders]);

  // Test NimbusPost API Connection
  const handleTestConnection = async () => {
    setIsCheckingConnection(true);
    try {
      const res = await checkNimbusConnection();
      setConnectionStatus(res);
      if (res?.connected) {
        toast({
          title: "NimbusPost API Connected! 🟢",
          description: "Live courier gateway is responding normally with authenticated access.",
        });
      } else if (res?.configured) {
        toast({
          title: "NimbusPost Auth Error 🟠",
          description: res.message || "Credentials provided but authentication failed.",
        });
      } else {
        toast({
          title: "NimbusPost Standby / Local Mode ⚪",
          description: "Environment credentials not set. Manual dispatch and customer notes are active.",
        });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: err.message || "Failed to reach NimbusPost API.",
      });
    } finally {
      setIsCheckingConnection(false);
    }
  };

  // Test Pincode Serviceability
  const handleCheckServiceability = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pincodeInput.replace(/\D/g, '').slice(0, 6);
    if (cleanPin.length !== 6) {
      toast({
        variant: "destructive",
        title: "Invalid PIN Code",
        description: "Please enter a valid 6-digit Indian postal code.",
      });
      return;
    }

    setIsCheckingPincode(true);
    try {
      const res = await checkServiceability(cleanPin);
      setServiceabilityResult(res);
      toast({
        title: `PIN Code ${cleanPin} Serviceable!`,
        description: `Estimated Delivery: ${res.estimatedDeliveryDays || '3-5 Days'} via ${res.availableCouriers?.[0] || 'NimbusPost Express'}`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Serviceability Check Failed",
        description: err.message || "Could not check courier availability.",
      });
    } finally {
      setIsCheckingPincode(false);
    }
  };

  // 1-Click Book via NimbusPost
  const handleBookNimbus = async (order: any) => {
    if (!order) return;
    setBookingOrderId(order.id);
    toast({
      title: "Connecting to NimbusPost...",
      description: `Manifesting shipment for Order #${order.id.substring(0, 8).toUpperCase()}`,
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
          description: res?.error || "Could not generate AWB automatically. You can assign manual AWB in Orders.",
        });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Booking Error",
        description: err.message || "Network error while connecting to NimbusPost.",
      });
    } finally {
      setBookingOrderId(null);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to Clipboard!",
      description: `${label}: ${text}`,
    });
  };

  // Filtered orders for table
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    if (!searchFilter.trim()) return orders;
    const q = searchFilter.toLowerCase();
    return orders.filter(o => 
      (o.id && o.id.toLowerCase().includes(q)) ||
      (o.customerName && o.customerName.toLowerCase().includes(q)) ||
      (o.trackingId && o.trackingId.toLowerCase().includes(q)) ||
      (o.shippingAddress?.city && o.shippingAddress.city.toLowerCase().includes(q)) ||
      (o.shippingAddress?.pincode && o.shippingAddress.pincode.includes(q))
    );
  }, [orders, searchFilter]);

  const webhookUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/nimbuspost/webhook`
    : 'https://ivanfarmsfinal.vercel.app/api/nimbuspost/webhook';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">NimbusPost Logistics Hub</h1>
            <Badge className="bg-emerald-600/10 text-emerald-600 border-emerald-600/20 text-xs font-semibold">
              Carrier Direct
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Automated courier manifesting, live AWB generation, real-time tracking webhooks, and pincode serviceability.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestConnection}
            disabled={isCheckingConnection}
            className="h-9 gap-1.5 text-xs font-medium border-border hover:bg-accent cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCheckingConnection ? 'animate-spin text-emerald-600' : 'text-muted-foreground'}`} />
            <span>{isCheckingConnection ? 'Testing...' : 'Test NimbusPost API'}</span>
          </Button>

          <Button
            size="sm"
            asChild
            className="h-9 gap-1.5 text-xs font-medium bg-[#0D3B2E] hover:bg-[#144D3D] text-white"
          >
            <a href="https://ship.nimbuspost.com/dashboard" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>NimbusPost Portal</span>
            </a>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border/80 shadow-sm bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Store Orders</CardTitle>
            <Package className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Farm harvest orders recorded</p>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-sm bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active AWBs</CardTitle>
            <Truck className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.manifested}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Manifested via courier partners</p>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-sm bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">In Transit</CardTitle>
            <Clock className="w-4 h-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.inTransit}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Moving through courier hubs</p>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-sm bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Delivered Orders</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.delivered}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Purity Coins credited on delivery</p>
          </CardContent>
        </Card>
      </div>

      {/* Integration Diagnostics & Webhook Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* NimbusPost Architecture Status */}
        <Card className="lg:col-span-2 border border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>NimbusPost Gateway Configuration</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Live architecture details connecting Vivaan Farms to NimbusPost carrier network.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-muted/40 rounded-xl border border-border/50">
                <span className="text-muted-foreground font-medium block">API Gateway Endpoint</span>
                <span className="font-mono font-bold text-foreground mt-1 block">https://api.nimbuspost.com/v1</span>
              </div>
              <div className="p-3 bg-muted/40 rounded-xl border border-border/50">
                <span className="text-muted-foreground font-medium block">Registered Warehouse</span>
                <span className="font-semibold text-foreground mt-1 block">Gujarat Farm Dispatch Facility</span>
              </div>
              <div className="p-3 bg-muted/40 rounded-xl border border-border/50">
                <span className="text-muted-foreground font-medium block">Default Pickup Pincode</span>
                <span className="font-mono font-bold text-foreground mt-1 block">395007 (Gujarat Origin)</span>
              </div>
              <div className="p-3 bg-muted/40 rounded-xl border border-border/50">
                <span className="text-muted-foreground font-medium block">Partner Couriers</span>
                <span className="font-semibold text-foreground mt-1 block">Delhivery, Blue Dart, DTDC, Shadowfax</span>
              </div>
            </div>

            {/* Webhook Configuration Strip */}
            <div className="p-3.5 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">Live Webhook Listener URL</span>
                </div>
                <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-300 font-mono">
                  POST Endpoint
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Add this URL in NimbusPost Seller Panel under <strong>Settings &gt; Webhook</strong> to automatically receive status updates and trigger Purity Coins rewards.
              </p>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={webhookUrl}
                  className="h-8 font-mono text-[11px] bg-background border-border"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(webhookUrl, 'Webhook URL')}
                  className="h-8 px-3 text-xs gap-1 cursor-pointer shrink-0"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PIN Code Serviceability & Delivery Time Calculator */}
        <Card className="border border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Pincode Serviceability</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Check carrier coverage & estimated delivery timeline.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleCheckServiceability} className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={pincodeInput}
                  onChange={(e) => setPincodeInput(e.target.value)}
                  placeholder="e.g. 531204 or 110001"
                  maxLength={6}
                  className="h-9 text-xs font-mono font-bold"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={isCheckingPincode}
                  className="h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 cursor-pointer"
                >
                  {isCheckingPincode ? 'Checking...' : 'Check'}
                </Button>
              </div>
            </form>

            {serviceabilityResult && (
              <div className="p-3 bg-muted/40 rounded-xl border border-border/60 space-y-2 text-xs animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">Delivery Window:</span>
                  <Badge variant="secondary" className="font-mono text-[11px] font-bold text-emerald-700">
                    {serviceabilityResult.estimatedDeliveryDays || '3-5 Days'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Cash on Delivery:</span>
                  <span className="font-semibold text-foreground">
                    {serviceabilityResult.codAvailable ? '✓ Available' : 'Prepaid Only'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">Available Couriers:</span>
                  <div className="flex flex-wrap gap-1">
                    {(serviceabilityResult.availableCouriers || ['NimbusPost Express']).map((c: string) => (
                      <Badge key={c} variant="outline" className="text-[10px] bg-background">
                        {c}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="pt-1 text-[11px] text-muted-foreground">
              ⚡ Orders before 2:00 PM are dispatched same-day from the farm.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Manifested Shipments & Orders Table */}
      <Card className="border border-border/80 shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold">Orders & Courier Shipments</CardTitle>
            <CardDescription className="text-xs">
              Live manifest status, assigned AWBs, and 1-click booking for unmanifested packages.
            </CardDescription>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search ID, customer, AWB, city..."
              className="h-8 pl-8 text-xs"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {ordersLoading ? (
            <div className="min-h-[200px] flex items-center justify-center text-xs text-muted-foreground">
              Loading orders & courier manifests...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="min-h-[200px] flex flex-col items-center justify-center p-6 text-center text-xs text-muted-foreground">
              <Package className="w-8 h-8 text-muted-foreground/40 mb-2" />
              <span>No matching shipments found.</span>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="text-xs">Order ID</TableHead>
                  <TableHead className="text-xs">Customer & Destination</TableHead>
                  <TableHead className="text-xs">Courier Partner</TableHead>
                  <TableHead className="text-xs">AWB / Tracking</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.slice(0, 20).map((order: any) => {
                  const hasAwb = Boolean(order.trackingId);
                  const isBooking = bookingOrderId === order.id;

                  return (
                    <TableRow key={order.id} className="text-xs">
                      <TableCell className="font-mono font-bold text-foreground">
                        #{order.id.substring(0, 8).toUpperCase()}
                      </TableCell>

                      <TableCell>
                        <div className="font-semibold text-foreground">
                          {order.customerName || order.shippingAddress?.name || 'Customer'}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {order.shippingAddress?.city || 'India'} ({order.shippingAddress?.pincode || 'N/A'})
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="font-medium text-foreground">
                          {order.courierPartner || order.courierName || 'NimbusPost Express'}
                        </span>
                      </TableCell>

                      <TableCell>
                        {hasAwb ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-foreground bg-muted px-2 py-0.5 rounded text-[11px]">
                              {order.trackingId}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(order.trackingId, 'AWB Code')}
                              className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground cursor-pointer"
                              title="Copy AWB"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic text-[11px]">Pending Manifest</span>
                        )}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={
                            order.status === 'Delivered' 
                              ? 'default' 
                              : order.status === 'Shipped' 
                              ? 'secondary' 
                              : 'outline'
                          }
                          className="text-[10px] capitalize font-medium"
                        >
                          {order.status || 'Processing'}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        {hasAwb ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="h-7 text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 gap-1 cursor-pointer"
                          >
                            <a
                              href={`https://ship.nimbuspost.com/shipping/tracking/${encodeURIComponent(order.trackingId)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <span>Track</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleBookNimbus(order)}
                            disabled={isBooking}
                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1 cursor-pointer"
                          >
                            <Zap className="w-3 h-3" />
                            <span>{isBooking ? 'Booking...' : 'Ship Nimbus'}</span>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

