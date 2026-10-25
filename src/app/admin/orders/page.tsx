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
  Share2
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
import { collection, doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function AdminOrdersPage() {
  const db = useFirestore();
  const { toast } = useToast();

  const ordersRef = useMemoFirebase(() => collection(db, 'orders'), [db]);
  const { data: orders, isLoading } = useCollection(ordersRef);

  const [activeTab, setActiveTab] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Tracking Modal State
  const [trackingOrder, setTrackingOrder] = useState<any | null>(null);
  const [awbInput, setAwbInput] = useState('');
  const [courierPartner, setCourierPartner] = useState('NimbusPost');
  const [autoMarkShipped, setAutoMarkShipped] = useState(true);

  // Order Details Modal State
  const [viewDetailsOrder, setViewDetailsOrder] = useState<any | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Delivered':
        return <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-emerald-500/30">Delivered</Badge>;
      case 'Shipped':
        return <Badge className="bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 border-blue-500/30">Shipped</Badge>;
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

  const updateStatus = (orderId: string, newStatus: string) => {
    updateDocumentNonBlocking(doc(db, 'orders', orderId), {
      status: newStatus,
      updatedAt: new Date().toISOString()
    });
    toast({
      title: "Order Status Updated",
      description: `Order marked as ${newStatus}.`,
    });
  };

  const handleOpenTracking = (order: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTrackingOrder(order);
    setAwbInput(order.trackingId || '');
    setCourierPartner(order.courierPartner || 'NimbusPost');
    setAutoMarkShipped(order.status !== 'Shipped' && order.status !== 'Delivered');
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
        return `https://www.indiapost.gov.in/_layouts/15/dpt.cept.tracking/trackconsignment.aspx`;
      case 'Shadowfax':
        return `https://tracker.shadowfax.in/#/track?awb=${encodeURIComponent(awb)}`;
      default:
        return `https://ship.nimbuspost.com/shipping/tracking/${encodeURIComponent(awb)}`;
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

  const handleCopyCustomerMessage = (order: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const orderNum = order.id?.substring(0, 8).toUpperCase();
    const awb = order.trackingId || '';
    const name = order.shippingAddress?.name || order.customerName || 'Customer';
    const courier = order.courierPartner || order.courierName || 'NimbusPost';
    const msg = `Namaste ${name}! Your Vivaan Farms order #${orderNum} has been shipped via ${courier}. Your tracking code is: ${awb}. You can track your package anytime at: https://vivaanfarms.com/track?code=${encodeURIComponent(awb)}`;
    navigator.clipboard.writeText(msg);
    toast({
      title: "Customer Message Copied!",
      description: "WhatsApp update message copied. Ready to send to customer.",
    });
  };

  const handleSaveTracking = () => {
    if (!trackingOrder) return;
    const cleanAwb = awbInput.trim();

    if (!cleanAwb) {
      toast({
        variant: "destructive",
        title: "AWB Required",
        description: "Please enter a valid tracking ID or AWB number.",
      });
      return;
    }

    const trackingUrl = getOfficialCourierUrl(courierPartner, cleanAwb);

    const updates: any = {
      trackingId: cleanAwb,
      courierPartner,
      courierName: courierPartner,
      trackingUrl,
      updatedAt: new Date().toISOString()
    };

    if (autoMarkShipped && trackingOrder.status !== 'Delivered') {
      updates.status = 'Shipped';
    }

    updateDocumentNonBlocking(doc(db, 'orders', trackingOrder.id), updates);

    toast({
      title: "Tracking Details Saved",
      description: `AWB ${cleanAwb} attached via ${courierPartner}. Customer can now track it on /track.`,
    });

    setTrackingOrder(null);
    setAwbInput('');
  };

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter(o => {
      // Status filter
      if (activeTab !== 'All' && o.status !== activeTab) return false;

      // Search filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const id = (o.id || '').toLowerCase();
        const customerName = (o.shippingAddress?.name || o.userName || '').toLowerCase();
        const customerEmail = (o.shippingAddress?.email || o.userEmail || '').toLowerCase();
        const customerPhone = (o.shippingAddress?.phone || '').toLowerCase();
        const city = (o.shippingAddress?.city || '').toLowerCase();
        const tracking = (o.trackingId || '').toLowerCase();

        return (
          id.includes(term) ||
          customerName.includes(term) ||
          customerEmail.includes(term) ||
          customerPhone.includes(term) ||
          city.includes(term) ||
          tracking.includes(term)
        );
      }

      return true;
    });
  }, [orders, activeTab, searchTerm]);

  // Aggregate Metrics
  const orderMetrics = useMemo(() => {
    if (!orders) return { total: 0, revenue: 0, pending: 0, shipped: 0, delivered: 0, rto: 0 };
    return {
      total: orders.length,
      revenue: orders.reduce((acc, o) => acc + (Number(o.totalAmount) || 0), 0),
      pending: orders.filter(o => !o.status || o.status === 'Pending' || o.status === 'Processing').length,
      shipped: orders.filter(o => o.status === 'Shipped').length,
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
            Track customer orders, assign courier AWB labels, and manage delivery status.
          </p>
        </div>
        <div className="flex items-center gap-2">
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
          <div className="text-xs font-medium text-amber-600">Pending Fulfillment</div>
          <div className="text-2xl font-bold mt-1 text-amber-700">{orderMetrics.pending}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Awaiting dispatch</div>
        </Card>
        <Card className="border border-border/80 shadow-sm p-4">
          <div className="text-xs font-medium text-blue-600">In Transit</div>
          <div className="text-2xl font-bold mt-1 text-blue-700">{orderMetrics.shipped}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">With courier partner</div>
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
              placeholder="Search by ID, customer, phone, AWB..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="overflow-x-auto w-full md:w-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="h-9">
                <TabsTrigger value="All" className="text-xs">All ({orderMetrics.total})</TabsTrigger>
                <TabsTrigger value="Pending" className="text-xs">Pending</TabsTrigger>
                <TabsTrigger value="Processing" className="text-xs">Processing</TabsTrigger>
                <TabsTrigger value="Shipped" className="text-xs">Shipped</TabsTrigger>
                <TabsTrigger value="Delivered" className="text-xs">Delivered</TabsTrigger>
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
              <TableHead className="px-4 text-xs font-semibold">Tracking (AWB)</TableHead>
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
                        <div className="flex items-center gap-1.5">
                          <a
                            href={order.trackingUrl || `https://ship.nimbuspost.com/shipping/tracking/${encodeURIComponent(order.trackingId)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-emerald-300 bg-emerald-50 text-emerald-800 text-[11px] font-mono hover:bg-emerald-100 transition-colors"
                          >
                            <Truck className="w-3 h-3 text-emerald-600" />
                            <span>{order.trackingId}</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                          </a>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleCopyTrackingCode(order.trackingId, e)}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                            title="Copy tracking code for customer"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleCopyCustomerMessage(order, e)}
                            className="h-6 w-6 p-0 text-emerald-600 hover:text-emerald-700"
                            title="Copy customer WhatsApp shipping message"
                          >
                            <Share2 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleOpenTracking(order, e)}
                            className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
                          >
                            Edit
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => handleOpenTracking(order, e)}
                          className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                        >
                          <Truck className="w-3 h-3" />
                          <span>Add AWB</span>
                        </Button>
                      )}
                    </TableCell>

                    <TableCell className="px-4 py-3 text-xs font-semibold text-foreground">
                      ₹{(order.totalAmount || 0).toLocaleString('en-IN')}
                    </TableCell>

                    <TableCell className="px-4 py-3 text-xs text-muted-foreground">
                      {order.orderDate 
                        ? new Date(order.orderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                        : 'N/A'
                      }
                    </TableCell>

                    <TableCell className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 font-sans">
                          <DropdownMenuLabel className="text-xs">Order Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => setViewDetailsOrder(order)} className="text-xs cursor-pointer">
                            <FileText className="w-3.5 h-3.5 mr-2" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenTracking(order)} className="text-xs cursor-pointer text-emerald-700">
                            <Truck className="w-3.5 h-3.5 mr-2" /> Assign Tracking
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => updateStatus(order.id, 'Processing')} className="text-xs cursor-pointer">
                            <Clock className="w-3.5 h-3.5 mr-2 text-blue-600" /> Mark Processing
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus(order.id, 'Shipped')} className="text-xs cursor-pointer">
                            <Truck className="w-3.5 h-3.5 mr-2 text-purple-600" /> Mark Shipped
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
                <TableCell colSpan={7} className="py-12 text-center text-xs text-muted-foreground">
                  No orders found matching the filter criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Assign Tracking Dialog */}
      <Dialog open={!!trackingOrder} onOpenChange={(open) => !open && setTrackingOrder(null)}>
        <DialogContent className="max-w-md p-6 font-sans">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-600" />
              Assign Tracking ID
            </DialogTitle>
            <DialogDescription className="text-xs">
              Attach NimbusPost or courier AWB to Order #{trackingOrder?.id?.substring(0, 8).toUpperCase()}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Courier Partner</label>
              <select
                value={courierPartner}
                onChange={(e) => setCourierPartner(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="NimbusPost">NimbusPost (Standard)</option>
                <option value="Delhivery">Delhivery</option>
                <option value="Blue Dart">Blue Dart</option>
                <option value="DTDC">DTDC</option>
                <option value="India Post">India Post Speed Post</option>
                <option value="Shadowfax">Shadowfax</option>
                <option value="Other">Other Carrier</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">AWB Number / Waybill ID</label>
              <Input
                placeholder="e.g. 1432567890"
                value={awbInput}
                onChange={(e) => setAwbInput(e.target.value)}
                className="h-9 text-xs font-mono"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="autoShip"
                checked={autoMarkShipped}
                onChange={(e) => setAutoMarkShipped(e.target.checked)}
                className="rounded border-input text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="autoShip" className="text-xs text-muted-foreground cursor-pointer">
                Automatically mark order status as &quot;Shipped&quot;
              </label>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-border/60">
            <Button variant="outline" size="sm" onClick={() => setTrackingOrder(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveTracking} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Save Tracking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Details & Invoice Dialog */}
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
              <div className="grid grid-cols-2 gap-4 p-3 rounded-lg border border-border bg-muted/20 text-xs">
                <div>
                  <span className="font-semibold text-foreground block mb-1">Shipping Address:</span>
                  <p className="font-medium text-foreground">{viewDetailsOrder.shippingAddress?.name || viewDetailsOrder.userName}</p>
                  <p className="text-muted-foreground">{viewDetailsOrder.shippingAddress?.addressLine1}</p>
                  <p className="text-muted-foreground">
                    {viewDetailsOrder.shippingAddress?.city}, {viewDetailsOrder.shippingAddress?.state} - {viewDetailsOrder.shippingAddress?.pincode}
                  </p>
                  <p className="text-muted-foreground mt-1">Phone: {viewDetailsOrder.shippingAddress?.phone || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-semibold text-foreground block mb-1">Payment & Shipment:</span>
                  <p className="text-muted-foreground">Method: <span className="font-medium text-foreground">{viewDetailsOrder.paymentMethod || 'Online'}</span></p>
                  <p className="text-muted-foreground">Payment ID: <span className="font-mono text-foreground">{viewDetailsOrder.paymentId || 'N/A'}</span></p>
                  {viewDetailsOrder.trackingId && (
                    <div className="mt-2 space-y-1.5">
                      <p className="text-muted-foreground">
                        AWB: <span className="font-mono font-medium text-emerald-700">{viewDetailsOrder.trackingId}</span> ({viewDetailsOrder.courierPartner || 'Courier'})
                      </p>
                      <div className="flex items-center gap-1.5 pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyTrackingCode(viewDetailsOrder.trackingId)}
                          className="h-6 text-[10px] gap-1 px-2 border-border"
                        >
                          <Copy className="w-2.5 h-2.5" />
                          <span>Copy AWB</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyCustomerMessage(viewDetailsOrder)}
                          className="h-6 text-[10px] gap-1 px-2 border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                        >
                          <Share2 className="w-2.5 h-2.5 text-emerald-600" />
                          <span>WhatsApp Update</span>
                        </Button>
                      </div>
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
              </div>
            </div>
          )}

          <DialogFooter className="pt-4 border-t border-border/60">
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="w-3.5 h-3.5 mr-1" /> Print Invoice
            </Button>
            <Button size="sm" onClick={() => setViewDetailsOrder(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
