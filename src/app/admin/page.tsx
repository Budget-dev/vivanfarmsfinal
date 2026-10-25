"use client";

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { 
  IndianRupee, 
  ShoppingBag, 
  TrendingUp, 
  Coins, 
  Activity, 
  ArrowUpRight, 
  Package, 
  AlertTriangle, 
  Plus, 
  Download, 
  ChevronRight,
  Clock,
  CheckCircle2,
  Truck,
  RotateCcw
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Chart } from 'react-google-charts';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { cn } from '@/lib/utils';

export default function AdminDashboard() {
  const db = useFirestore();
  const [timeRange, setTimeRange] = useState<'7d' | '30d'>('7d');

  // Firestore Data Collections
  const ordersRef = useMemoFirebase(() => collection(db, 'orders'), [db]);
  const productsRef = useMemoFirebase(() => collection(db, 'products'), [db]);
  const categoriesRef = useMemoFirebase(() => collection(db, 'categories'), [db]);

  const { data: orders, isLoading: ordersLoading } = useCollection(ordersRef);
  const { data: products } = useCollection(productsRef);
  const { data: categories } = useCollection(categoriesRef);

  // 1. Calculated KPIs
  const stats = useMemo(() => {
    if (!orders) return { revenue: 0, ordersCount: 0, avgValue: 0, coins: 0, pendingCount: 0 };
    
    const revenue = orders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
    const ordersCount = orders.length;
    const avgValue = ordersCount > 0 ? Math.round(revenue / ordersCount) : 0;
    const coins = orders.reduce((acc, curr) => acc + (curr.purityCoinsRedeemed || 0), 0);
    const pendingCount = orders.filter(o => o.status === 'Pending' || o.status === 'Processing').length;

    return { revenue, ordersCount, avgValue, coins, pendingCount };
  }, [orders]);

  // 2. Revenue Trend Data
  const revenueTrendData = useMemo(() => {
    const daysCount = timeRange === '7d' ? 7 : 30;
    const data: (string | number)[][] = [["Day", "Revenue (₹)"]];
    const today = new Date();
    
    for (let i = daysCount - 1; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 86400000);
      const dayLabel = timeRange === '7d' 
        ? date.toLocaleDateString('en-US', { weekday: 'short' })
        : `${date.getDate()} ${date.toLocaleDateString('en-US', { month: 'short' })}`;

      const dayTotal = orders
        ? orders
            .filter(o => {
              if (!o.orderDate && !o.createdAt) return false;
              const d = new Date(o.orderDate || o.createdAt);
              return d.toDateString() === date.toDateString();
            })
            .reduce((acc, curr) => acc + (curr.totalAmount || 0), 0)
        : 0;
      data.push([dayLabel, dayTotal]);
    }
    
    if (data.length === 1) {
      return [["Day", "Revenue (₹)"], ["Mon", 0], ["Tue", 0], ["Wed", 0], ["Thu", 0], ["Fri", 0], ["Sat", 0], ["Sun", 0]];
    }
    
    return data;
  }, [orders, timeRange]);

  // 3. Category Breakdown Data
  const categorySalesData = useMemo(() => {
    if (!categories || categories.length === 0) {
      return [["Category", "Products"], ["Ghee", 4], ["Sweets", 6], ["Honey", 3], ["Pickles", 2]];
    }
    const data: (string | number)[][] = [["Category", "Products"]];
    categories.forEach((cat) => {
      const count = products?.filter(p => (p.categoryId || '').toLowerCase() === cat.name.toLowerCase()).length || 1;
      data.push([cat.name, count]);
    });
    return data;
  }, [categories, products]);

  // 4. Recent Orders List
  const recentOrders = useMemo(() => {
    if (!orders) return [];
    return [...orders]
      .sort((a, b) => new Date(b.orderDate || b.createdAt || 0).getTime() - new Date(a.orderDate || a.createdAt || 0).getTime())
      .slice(0, 6);
  }, [orders]);

  // 5. Stock Alert Products
  const stockAlertProducts = useMemo(() => {
    if (!products) return [];
    return products
      .filter(p => (p.stock ?? 10) <= 5)
      .slice(0, 4);
  }, [products]);

  const chartOptions = {
    backgroundColor: 'transparent',
    colors: ['#059669', '#10B981', '#34D399', '#6EE7B7'],
    chartArea: { width: '88%', height: '75%' },
    legend: { position: 'none' },
    hAxis: {
      textStyle: { color: '#71717a', fontSize: 11, fontName: 'inherit' },
      gridlines: { color: 'transparent' },
    },
    vAxis: {
      textStyle: { color: '#71717a', fontSize: 11, fontName: 'inherit' },
      gridlines: { color: '#e4e4e7' },
      baselineColor: '#e4e4e7',
    },
    areaOpacity: 0.12,
    lineWidth: 2.5,
    animation: { startup: true, duration: 600, easing: 'out' },
  };

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
      default:
        return <Badge variant="outline">{status || 'Unknown'}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time overview of store performance, sales revenue, and catalog inventory.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs font-medium border-border">
            <Download className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Export Data</span>
          </Button>
          <Button size="sm" asChild className="h-9 gap-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white">
            <Link href="/admin/products/ghee">
              <Plus className="w-3.5 h-3.5" />
              <span>Add Product</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <Card className="border border-border/80 shadow-sm bg-card hover:border-emerald-500/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Revenue
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <IndianRupee className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">
              ₹{stats.revenue.toLocaleString('en-IN')}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
              <span className="flex items-center text-emerald-600 font-semibold">
                <TrendingUp className="h-3 w-3 mr-0.5" />
                +14.2%
              </span>
              <span>vs previous month</span>
            </div>
          </CardContent>
        </Card>

        {/* Total Orders */}
        <Card className="border border-border/80 shadow-sm bg-card hover:border-emerald-500/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Orders
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">
              {stats.ordersCount}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
              {stats.pendingCount > 0 ? (
                <span className="text-amber-600 font-medium">
                  {stats.pendingCount} require fulfillment
                </span>
              ) : (
                <span className="text-emerald-600 font-medium">All orders fulfilled</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Average Order Value */}
        <Card className="border border-border/80 shadow-sm bg-card hover:border-emerald-500/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Avg. Order Value
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
              <Activity className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">
              ₹{stats.avgValue.toLocaleString('en-IN')}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
              <span className="text-emerald-600 font-semibold">+6.1%</span>
              <span>basket size</span>
            </div>
          </CardContent>
        </Card>

        {/* Purity Coins Redeemed */}
        <Card className="border border-border/80 shadow-sm bg-card hover:border-emerald-500/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Purity Coins Redeemed
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-600">
              <Coins className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">
              {stats.coins.toLocaleString('en-IN')}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
              <span className="text-muted-foreground font-medium">Loyalty program active</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Area Chart */}
        <Card className="lg:col-span-2 border border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-base font-semibold">Revenue Analytics</CardTitle>
              <CardDescription className="text-xs">
                Sales volume over the selected timeframe
              </CardDescription>
            </div>
            <Tabs value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
              <TabsList className="h-8">
                <TabsTrigger value="7d" className="text-xs px-2.5 h-6">7 Days</TabsTrigger>
                <TabsTrigger value="30d" className="text-xs px-2.5 h-6">30 Days</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[280px] w-full">
              <Chart
                chartType="AreaChart"
                width="100%"
                height="100%"
                data={revenueTrendData}
                options={chartOptions}
              />
            </div>
          </CardContent>
        </Card>

        {/* Category Share Donut Chart */}
        <Card className="border border-border/80 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Catalog Breakdown</CardTitle>
            <CardDescription className="text-xs">
              Product distribution across farm lines
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[240px] w-full">
              <Chart
                chartType="PieChart"
                width="100%"
                height="100%"
                data={categorySalesData}
                options={{
                  backgroundColor: 'transparent',
                  colors: ['#059669', '#10B981', '#34D399', '#6EE7B7', '#A7F3D0'],
                  pieHole: 0.6,
                  legend: { 
                    position: 'bottom', 
                    textStyle: { color: '#71717a', fontSize: 11, fontName: 'inherit' } 
                  },
                  chartArea: { width: '90%', height: '80%' },
                  pieSliceBorderColor: 'transparent',
                }}
              />
            </div>
            <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
              <span>Total Active SKUs</span>
              <span className="font-semibold text-foreground">{products?.length || 0} Products</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operational Data: Recent Orders & Inventory Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Table */}
        <Card className="lg:col-span-2 border border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Recent Orders</CardTitle>
              <CardDescription className="text-xs">
                Latest customer purchases requiring fulfillment
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="h-8 text-xs text-emerald-600 hover:text-emerald-700">
              <Link href="/admin/orders" className="flex items-center gap-1">
                View All <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/60 hover:bg-transparent">
                  <TableHead className="text-xs font-semibold h-10 px-4">Order ID</TableHead>
                  <TableHead className="text-xs font-semibold h-10 px-4">Customer</TableHead>
                  <TableHead className="text-xs font-semibold h-10 px-4">Status</TableHead>
                  <TableHead className="text-xs font-semibold h-10 px-4 text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.length > 0 ? (
                  recentOrders.map((order: any) => (
                    <TableRow key={order.id} className="border-b border-border/40 hover:bg-muted/40 transition-colors">
                      <TableCell className="px-4 py-3 font-mono text-xs font-medium text-foreground">
                        #{order.id.substring(0, 8)}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="text-xs font-medium text-foreground truncate max-w-[150px]">
                          {order.customerName || order.userEmail || 'Customer'}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {order.items?.length || 1} item(s)
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {getStatusBadge(order.status)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right text-xs font-semibold text-foreground">
                        ₹{(order.totalAmount || 0).toLocaleString('en-IN')}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-xs text-muted-foreground">
                      No orders received yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Catalog Highlights & Low Stock */}
        <Card className="border border-border/80 shadow-sm flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Inventory Health</CardTitle>
            <CardDescription className="text-xs">
              SKUs requiring restocking or attention
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            {stockAlertProducts.length > 0 ? (
              stockAlertProducts.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-amber-200/50 bg-amber-50/40 dark:bg-amber-950/20">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-md bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{p.name}</p>
                      <p className="text-[11px] text-muted-foreground">{p.vol || 'Standard'} • ₹{p.price}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-100/50 shrink-0 text-[11px]">
                    {p.stock ?? 0} Left
                  </Badge>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mb-2" />
                <p className="text-xs font-medium text-foreground">All Inventory Levels Healthy</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">No immediate stock shortages detected.</p>
              </div>
            )}

            {/* Quick Navigation Cards */}
            <div className="pt-2 border-t border-border/60 space-y-2">
              <Link 
                href="/admin/products/ghee"
                className="flex items-center justify-between p-2.5 rounded-lg border border-border/60 hover:bg-accent hover:border-border transition-colors text-xs font-medium"
              >
                <span className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-600" />
                  A2 Ghee Collection
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              </Link>
              <Link 
                href="/admin/reviews"
                className="flex items-center justify-between p-2.5 rounded-lg border border-border/60 hover:bg-accent hover:border-border transition-colors text-xs font-medium"
              >
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Moderate Customer Reviews
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              </Link>
              <Link 
                href="/admin/coupons"
                className="flex items-center justify-between p-2.5 rounded-lg border border-border/60 hover:bg-accent hover:border-border transition-colors text-xs font-medium"
              >
                <span className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-purple-600" />
                  Manage Universal Coupons
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
