"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
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
  FileText
} from 'lucide-react';

export default function AdminOrdersPage() {
  const db = useFirestore();
  const { toast } = useToast();

  const ordersRef = useMemoFirebase(() => collection(db, 'orders'), [db]);
  const { data: orders, isLoading } = useCollection(ordersRef);

  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Tracking Modal State
  const [trackingOrder, setTrackingOrder] = useState<any | null>(null);
  const [awbInput, setAwbInput] = useState('');
  const [courierPartner, setCourierPartner] = useState('NimbusPost');
  const [autoMarkShipped, setAutoMarkShipped] = useState(true);

  // Order Details Modal State
  const [viewDetailsOrder, setViewDetailsOrder] = useState<any | null>(null);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Delivered': return 'bg-emerald-100 text-emerald-800';
      case 'Pending': return 'bg-amber-100 text-amber-800';
      case 'Processing': return 'bg-blue-100 text-blue-800';
      case 'Shipped': return 'bg-purple-100 text-purple-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      case 'RTO': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
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

  // Open Tracking Modal
  const handleOpenTracking = (order: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTrackingOrder(order);
    setAwbInput(order.trackingId || '');
    setCourierPartner(order.courierPartner || 'NimbusPost');
    setAutoMarkShipped(order.status !== 'Shipped' && order.status !== 'Delivered');
  };

  // Save Tracking Details
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

    const trackingUrl = courierPartner === 'NimbusPost'
      ? `https://ship.nimbuspost.com/shipping/tracking/${encodeURIComponent(cleanAwb)}`
      : `https://www.google.com/search?q=${encodeURIComponent(courierPartner + ' tracking ' + cleanAwb)}`;

    const updates: any = {
      trackingId: cleanAwb,
      courierPartner,
      trackingUrl,
      updatedAt: new Date().toISOString()
    };

    if (autoMarkShipped && trackingOrder.status !== 'Delivered') {
      updates.status = 'Shipped';
    }

    updateDocumentNonBlocking(doc(db, 'orders', trackingOrder.id), updates);

    toast({
      title: "Tracking Details Saved",
      description: `AWB ${cleanAwb} attached via ${courierPartner}.`,
    });

    setTrackingOrder(null);
    setAwbInput('');
  };

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter(o => {
      // Status filter
      if (filter !== 'All' && o.status !== filter) return false;

      // Search filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const id = (o.id || '').toLowerCase();
        const customerName = (o.shippingAddress?.name || o.userName || '').toLowerCase();
        const customerEmail = (o.shippingAddress?.email || o.userEmail || '').toLowerCase();
        const customerPhone = (o.shippingAddress?.phone || '').toLowerCase();
        const city = (o.shippingAddress?.city || '').toLowerCase();
        const tracking = (o.trackingId || '').toLowerCase();

        const matches = id.includes(term) ||
          customerName.includes(term) ||
          customerEmail.includes(term) ||
          customerPhone.includes(term) ||
          city.includes(term) ||
          tracking.includes(term);

        if (!matches) return false;
      }

      return true;
    });
  }, [orders, filter, searchTerm]);

  // Aggregate Metrics
  const orderMetrics = useMemo(() => {
    if (!orders) return { total: 0, revenue: 0, pending: 0, shipped: 0, delivered: 0, rto: 0 };
    return {
      total: orders.length,
      revenue: orders.reduce((acc, o) => acc + (Number(o.totalAmount) || 0), 0),
      pending: orders.filter(o => !o.status || o.status === 'Pending').length,
      shipped: orders.filter(o => o.status === 'Shipped').length,
      delivered: orders.filter(o => o.status === 'Delivered').length,
      rto: orders.filter(o => o.status === 'RTO').length,
    };
  }, [orders]);

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center font-headline text-2xl font-extrabold text-primary animate-pulse">
        Synchronizing Orders...
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* ── Page Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="font-headline text-4xl md:text-5xl font-extrabold text-[#100C06]">
            Order Management & Tracking
          </h1>
          <p className="text-[#7A6848] text-sm mt-2 font-medium">
            Monitor orders, assign NimbusPost tracking numbers, and view customer shipment details.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full lg:w-[360px]">
          <Search className="w-4 h-4 text-[#7A6848] absolute left-4 top-1/2 -translate-y-1/2" />
          <Input 
            placeholder="Search by ID, customer, phone, AWB..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-12 pl-11 rounded-2xl bg-white border-[#DDD0B5] focus-visible:ring-primary focus-visible:border-primary transition-all shadow-xs text-xs font-semibold"
          />
        </div>
      </div>

      {/* ── Status Tab Filter Strip ── */}
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: 'All', label: 'All Orders' },
          { id: 'Pending', label: 'Pending' },
          { id: 'Processing', label: 'Processing' },
          { id: 'Shipped', label: 'Shipped' },
          { id: 'Delivered', label: 'Delivered' },
          { id: 'Cancelled', label: 'Cancelled' },
          { id: 'RTO', label: 'RTO' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={cn(
              "h-10 px-5 rounded-full text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer shadow-2xs",
              filter === tab.id
                ? "bg-primary text-white shadow-md scale-105"
                : "bg-white text-[#7A6848] border border-[#DDD0B5]/60 hover:bg-gray-50"
            )}
          >
            {tab.label} {tab.id === 'All' ? `(${orderMetrics.total})` : ''}
          </button>
        ))}
      </div>

      {/* ── Orders Content Grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-3">
          <Card className="border-none shadow-2xl rounded-[36px] overflow-hidden bg-white">
            <Table>
              <TableHeader className="bg-[#FAF7F0]">
                <TableRow className="border-b-[#DDD0B5]/30">
                  <TableHead className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-[#7A6848]">Order ID</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-[#7A6848]">Customer & Address</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-[#7A6848]">Status</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-[#7A6848]">Tracking (AWB)</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-[#7A6848]">Total</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-[#7A6848]">Date</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-[#7A6848] text-right pr-6">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length > 0 ? filteredOrders.map((order) => {
                  const customerName = order.shippingAddress?.name || order.userName || 'Customer';
                  const city = order.shippingAddress?.city || '';
                  const phone = order.shippingAddress?.phone || '';

                  return (
                    <TableRow 
                      key={order.id} 
                      onClick={() => setViewDetailsOrder(order)}
                      className="border-b-[#DDD0B5]/20 hover:bg-primary/[0.02] transition-colors cursor-pointer group"
                    >
                      {/* Order ID */}
                      <TableCell className="py-4 px-6">
                        <div className="font-headline font-black text-primary text-sm">
                          #{order.id.substring(0, 8).toUpperCase()}
                        </div>
                        <div className="text-[10px] text-gray-400 font-medium mt-0.5">
                          {order.paymentMethod || 'Prepaid'}
                        </div>
                      </TableCell>

                      {/* Customer & Address */}
                      <TableCell>
                        <div className="min-w-0">
                          <div className="text-sm font-extrabold text-[#100C06] truncate">
                            {customerName}
                          </div>
                          <div className="text-[11px] text-gray-500 font-medium truncate flex items-center gap-1 mt-0.5">
                            {city && <span>{city} · </span>}
                            <span>{phone || 'No phone'}</span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider", getStatusStyle(order.status || 'Pending'))}>
                          {order.status || 'Pending'}
                        </span>
                      </TableCell>

                      {/* Tracking ID (AWB) */}
                      <TableCell>
                        {order.trackingId ? (
                          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <a
                              href={order.trackingUrl || `https://ship.nimbuspost.com/shipping/tracking/${encodeURIComponent(order.trackingId)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-mono font-bold transition-colors border border-emerald-200"
                              title="Click to track shipment"
                            >
                              <Truck className="w-3 h-3 text-emerald-600" />
                              <span>{order.trackingId}</span>
                              <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                            </a>
                            <button
                              type="button"
                              onClick={(e) => handleOpenTracking(order, e)}
                              className="text-[10px] text-gray-400 hover:text-gray-700 underline font-semibold"
                            >
                              Edit
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => handleOpenTracking(order, e)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            <Truck className="w-3 h-3" />
                            <span>Add AWB</span>
                          </button>
                        )}
                      </TableCell>

                      {/* Total */}
                      <TableCell className="text-sm font-black text-foreground">
                        ₹{(order.totalAmount || 0).toLocaleString('en-IN')}
                      </TableCell>

                      {/* Date */}
                      <TableCell className="text-xs font-medium text-[#7A6848]">
                        {order.orderDate ? new Date(order.orderDate).toLocaleDateString('en-IN') : 'N/A'}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="w-8 h-8 rounded-xl bg-[#F9F6EF] flex items-center justify-center text-[#7A6848] hover:bg-primary/10 hover:text-primary transition-all cursor-pointer">
                              <i className="fa-solid fa-ellipsis-v text-xs"></i>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-2xl p-2 bg-white border border-gray-100 shadow-2xl min-w-[190px]">
                            <DropdownMenuItem 
                              onClick={() => setViewDetailsOrder(order)} 
                              className="rounded-xl py-2 px-3 text-xs font-bold cursor-pointer hover:bg-gray-100"
                            >
                              <FileText className="w-3.5 h-3.5 mr-2" /> View Order Details
                            </DropdownMenuItem>

                            <DropdownMenuItem 
                              onClick={() => handleOpenTracking(order)} 
                              className="rounded-xl py-2 px-3 text-xs font-bold cursor-pointer hover:bg-emerald-50 text-emerald-800"
                            >
                              <Truck className="w-3.5 h-3.5 mr-2" /> Assign Tracking / AWB
                            </DropdownMenuItem>

                            <div className="border-t border-gray-100 my-1" />

                            <DropdownMenuItem onClick={() => updateStatus(order.id, 'Processing')} className="rounded-xl py-2 px-3 text-xs font-bold cursor-pointer hover:bg-blue-50 text-blue-700">
                              <Clock className="w-3.5 h-3.5 mr-2" /> Mark Processing
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={() => updateStatus(order.id, 'Shipped')} className="rounded-xl py-2 px-3 text-xs font-bold cursor-pointer hover:bg-purple-50 text-purple-700">
                              <Truck className="w-3.5 h-3.5 mr-2" /> Mark Shipped
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={() => updateStatus(order.id, 'Delivered')} className="rounded-xl py-2 px-3 text-xs font-bold cursor-pointer hover:bg-emerald-50 text-emerald-700">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-2" /> Mark Delivered
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={() => updateStatus(order.id, 'RTO')} className="rounded-xl py-2 px-3 text-xs font-bold cursor-pointer hover:bg-orange-50 text-orange-600">
                              <AlertCircle className="w-3.5 h-3.5 mr-2" /> Mark RTO
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={() => updateStatus(order.id, 'Cancelled')} className="rounded-xl py-2 px-3 text-xs font-bold cursor-pointer hover:bg-red-50 text-red-600">
                              <XCircle className="w-3.5 h-3.5 mr-2" /> Cancel Order
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                }) : (
                  <TableRow>
                    <TableCell colSpan={7} className="py-20 text-center text-[#7A6848] font-medium italic">
                      No orders found matching the search and filter criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>

        {/* ── Right Column: Order Metrics & Summary ── */}
        <div className="space-y-6">
          <Card className="border-none shadow-xl rounded-[36px] p-6 sm:p-8 bg-white">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="font-headline text-2xl font-extrabold text-[#100C06]">
                Order Metrics
              </CardTitle>
            </CardHeader>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-gray-600">Total Orders</span>
                <span className="font-extrabold text-gray-900">{orderMetrics.total}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-amber-700 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span> Pending Fulfillment
                </span>
                <span className="font-extrabold text-amber-800">{orderMetrics.pending}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-purple-700 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span> In Transit / Shipped
                </span>
                <span className="font-extrabold text-purple-800">{orderMetrics.shipped}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Successfully Delivered
                </span>
                <span className="font-extrabold text-emerald-800">{orderMetrics.delivered}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-orange-700 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-orange-500"></span> RTO (Returned)
                </span>
                <span className="font-extrabold text-orange-800">{orderMetrics.rto}</span>
              </div>
            </div>

            <div className="mt-8 p-5 bg-[#FAF7F0] rounded-2xl text-center border border-[#EEE0BC]">
              <div className="text-[10px] font-black text-[#7A6848] uppercase tracking-[2px] mb-1">
                Total Revenue
              </div>
              <div className="font-headline text-3xl font-extrabold text-primary">
                ₹{orderMetrics.revenue.toLocaleString('en-IN')}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ── Assign / Edit Tracking Modal ── */}
      <Dialog open={!!trackingOrder} onOpenChange={(open) => !open && setTrackingOrder(null)}>
        <DialogContent className="max-w-md rounded-[36px] p-8 bg-white border-none shadow-2xl">
          <DialogHeader className="mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-primary flex items-center justify-center mx-auto mb-2">
              <Truck className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle className="font-headline text-2xl font-extrabold text-center text-primary">
              Assign Courier Tracking
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-gray-600">
              Attach AWB or tracking ID for Order #{trackingOrder?.id?.substring(0, 8).toUpperCase()}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Courier Partner */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                Courier Partner *
              </label>
              <select
                value={courierPartner}
                onChange={(e) => setCourierPartner(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-[#FAF8F5] border border-gray-200 text-xs font-bold text-gray-800 focus:outline-none focus:border-primary"
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

            {/* AWB Number Input */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                AWB Number / Tracking ID *
              </label>
              <Input
                placeholder="Enter NimbusPost AWB (e.g. 143256789)..."
                value={awbInput}
                onChange={(e) => setAwbInput(e.target.value)}
                className="h-12 rounded-xl bg-[#FAF8F5] border-gray-200 font-mono font-bold text-sm"
              />
            </div>

            {/* Auto-mark Shipped Checkbox */}
            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={autoMarkShipped}
                onChange={(e) => setAutoMarkShipped(e.target.checked)}
                className="w-4 h-4 rounded text-primary accent-primary"
              />
              <span>Automatically update order status to &quot;Shipped&quot;</span>
            </label>
          </div>

          <DialogFooter className="mt-5 flex gap-2">
            <Button
              variant="outline"
              onClick={() => setTrackingOrder(null)}
              className="flex-1 h-11 rounded-2xl text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveTracking}
              className="flex-1 h-11 rounded-2xl bg-primary hover:bg-[#14482D] text-white text-xs font-black uppercase tracking-wider"
            >
              Save Tracking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Order Details Modal ── */}
      <Dialog open={!!viewDetailsOrder} onOpenChange={(open) => !open && setViewDetailsOrder(null)}>
        <DialogContent className="max-w-2xl rounded-[36px] p-8 bg-white border-none shadow-2xl max-h-[88vh] overflow-y-auto">
          <DialogHeader className="mb-4">
            <DialogTitle className="font-headline text-2xl font-extrabold text-primary flex items-center justify-between">
              <span>Order #{viewDetailsOrder?.id?.substring(0, 8).toUpperCase()}</span>
              <span className={cn("px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider", getStatusStyle(viewDetailsOrder?.status || 'Pending'))}>
                {viewDetailsOrder?.status || 'Pending'}
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Placed on {viewDetailsOrder?.orderDate ? new Date(viewDetailsOrder.orderDate).toLocaleString('en-IN') : 'N/A'}
            </DialogDescription>
          </DialogHeader>

          {viewDetailsOrder && (
            <div className="space-y-6">
              {/* Shipping Address */}
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-gray-100">
                <div className="text-[10px] font-black uppercase tracking-wider text-[#7A6848] mb-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary" /> Delivery Destination
                </div>
                <div className="text-sm font-extrabold text-gray-900">
                  {viewDetailsOrder.shippingAddress?.name || viewDetailsOrder.userName || 'Customer'}
                </div>
                <div className="text-xs text-gray-600 mt-1 leading-relaxed">
                  {viewDetailsOrder.shippingAddress?.address || 'Address not specified'}
                </div>
                <div className="text-xs text-gray-700 font-semibold mt-1">
                  {[
                    viewDetailsOrder.shippingAddress?.city,
                    viewDetailsOrder.shippingAddress?.state,
                    viewDetailsOrder.shippingAddress?.pincode
                  ].filter(Boolean).join(', ')}
                </div>
                {viewDetailsOrder.shippingAddress?.phone && (
                  <div className="text-xs text-primary font-bold mt-2 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {viewDetailsOrder.shippingAddress.phone}
                  </div>
                )}
              </div>

              {/* Tracking Information */}
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-gray-100 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-[#7A6848] mb-1 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-secondary" /> Shipment & Tracking
                  </div>
                  {viewDetailsOrder.trackingId ? (
                    <div className="text-xs font-mono font-bold text-gray-800">
                      Carrier: {viewDetailsOrder.courierPartner || 'NimbusPost'} · AWB: {viewDetailsOrder.trackingId}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500 italic">No tracking number assigned yet.</div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenTracking(viewDetailsOrder)}
                    className="h-8 rounded-xl text-xs font-bold"
                  >
                    {viewDetailsOrder.trackingId ? 'Edit AWB' : 'Add AWB'}
                  </Button>
                  {viewDetailsOrder.trackingId && (
                    <a
                      href={viewDetailsOrder.trackingUrl || `https://ship.nimbuspost.com/shipping/tracking/${encodeURIComponent(viewDetailsOrder.trackingId)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 h-8 px-3 rounded-xl bg-primary text-white text-xs font-bold hover:bg-[#14482D]"
                    >
                      <span>Track</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* Items Breakdown */}
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-[#7A6848] mb-3 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-primary" /> Ordered Products ({viewDetailsOrder.items?.length || 0})
                </div>
                <div className="space-y-2 border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-100">
                  {Array.isArray(viewDetailsOrder.items) && viewDetailsOrder.items.length > 0 ? (
                    viewDetailsOrder.items.map((item: any, i: number) => (
                      <div key={i} className="p-3 flex items-center justify-between gap-3 text-xs bg-white">
                        <div className="min-w-0 flex-1">
                          <div className="font-extrabold text-gray-900 truncate">{item.name}</div>
                          <div className="text-[11px] text-gray-500">
                            Volume: {item.vol || item.volume || 'Standard'} · Qty: {item.qty || 1}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-extrabold text-gray-900">
                            ₹{((Number(item.price) || 0) * (Number(item.qty) || 1)).toLocaleString('en-IN')}
                          </div>
                          <div className="text-[10px] text-gray-400">₹{item.price} each</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-gray-500 italic">No item list attached.</div>
                  )}
                </div>
              </div>

              {/* Payment & Financial Breakdown */}
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-gray-100 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-bold text-gray-900">₹{(viewDetailsOrder.subtotal || viewDetailsOrder.totalAmount || 0).toLocaleString('en-IN')}</span>
                </div>
                {viewDetailsOrder.couponDiscount > 0 && (
                  <div className="flex justify-between items-center text-emerald-700">
                    <span>Coupon Discount ({viewDetailsOrder.couponCode || 'APPLIED'}):</span>
                    <span className="font-bold">-₹{viewDetailsOrder.couponDiscount}</span>
                  </div>
                )}
                {viewDetailsOrder.coinsDiscount > 0 && (
                  <div className="flex justify-between items-center text-amber-700">
                    <span>Purity Coins Redeemed:</span>
                    <span className="font-bold">-₹{viewDetailsOrder.coinsDiscount}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-gray-200 flex justify-between items-center text-sm font-extrabold text-primary">
                  <span>Final Total Paid:</span>
                  <span>₹{(viewDetailsOrder.totalAmount || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
