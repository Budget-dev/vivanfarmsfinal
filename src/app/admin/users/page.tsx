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
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { updateDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { 
  Users, 
  Coins, 
  Search, 
  Filter, 
  PlusCircle, 
  MinusCircle, 
  ShoppingBag, 
  ExternalLink, 
  History, 
  ShieldCheck, 
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Phone
} from 'lucide-react';
import { UserProfile } from '@/types';

export default function AdminUsersPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const { user: currentAdmin } = useUser();

  // Firestore references
  const usersRef = useMemoFirebase(() => collection(db, 'userProfiles'), [db]);
  const ordersRef = useMemoFirebase(() => collection(db, 'orders'), [db]);
  const transactionsRef = useMemoFirebase(() => collection(db, 'coinTransactions'), [db]);

  const { data: users, isLoading: usersLoading } = useCollection<UserProfile>(usersRef);
  const { data: orders, isLoading: ordersLoading } = useCollection(ordersRef);
  const { data: coinLogs } = useCollection(transactionsRef);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'high_coins' | 'has_orders' | 'zero_coins'>('all');

  // Coin Adjustment Modal State
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [adjustType, setAdjustType] = useState<'credit' | 'debit'>('credit');
  const [coinAmount, setCoinAmount] = useState<string>('100');
  const [reason, setReason] = useState<string>('');
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);

  // User Orders Modal State
  const [viewOrdersUser, setViewOrdersUser] = useState<UserProfile | null>(null);

  // Compute orders count and total spent map per user
  const userOrderStats = useMemo(() => {
    const stats: Record<string, { count: number; totalSpent: number; lastOrderDate?: string; phone?: string }> = {};
    if (!orders) return stats;

    orders.forEach((o) => {
      const uid = o.userId || 'guest';
      if (!stats[uid]) {
        stats[uid] = { count: 0, totalSpent: 0 };
      }
      stats[uid].count += 1;
      stats[uid].totalSpent += Number(o.totalAmount) || 0;
      if (o.orderDate && (!stats[uid].lastOrderDate || new Date(o.orderDate) > new Date(stats[uid].lastOrderDate!))) {
        stats[uid].lastOrderDate = o.orderDate;
      }
      if (o.shippingAddress?.phone && !stats[uid].phone) {
        stats[uid].phone = o.shippingAddress.phone;
      }
    });

    return stats;
  }, [orders]);

  // Aggregate Dashboard Metrics
  const metrics = useMemo(() => {
    const totalUsers = users?.length || 0;
    const totalCoinsCirculation = users?.reduce((acc, u) => acc + (Number(u.purityCoins) || 0), 0) || 0;
    const totalCoinsRedeemed = orders?.reduce((acc, o) => acc + (Number(o.purityCoinsRedeemed) || Number(o.coinsRedeemed) || 0), 0) || 0;
    const totalOrdersCount = orders?.length || 0;
    return {
      totalUsers,
      totalCoinsCirculation,
      totalCoinsRedeemed,
      totalOrdersCount,
    };
  }, [users, orders]);

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter((u) => {
      const name = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
      const email = (u.email || '').toLowerCase();
      const id = (u.id || '').toLowerCase();
      const phone = (u.phoneNumber || userOrderStats[u.id]?.phone || '').toLowerCase();
      const term = searchTerm.toLowerCase().trim();

      const matchesSearch = !term || name.includes(term) || email.includes(term) || id.includes(term) || phone.includes(term);
      if (!matchesSearch) return false;

      const userStats = userOrderStats[u.id];
      const coins = Number(u.purityCoins) || 0;

      if (filterType === 'high_coins') return coins >= 500;
      if (filterType === 'has_orders') return (userStats?.count || 0) > 0;
      if (filterType === 'zero_coins') return coins === 0;

      return true;
    });
  }, [users, searchTerm, filterType, userOrderStats]);

  // Handle Coin Adjustment Submit
  const handleCoinAdjustment = () => {
    if (!selectedUser) return;
    const delta = Math.abs(parseInt(coinAmount, 10));
    if (isNaN(delta) || delta <= 0) {
      toast({ variant: "destructive", title: "Invalid Amount", description: "Please enter a valid positive number of coins." });
      return;
    }

    const currentCoins = Number(selectedUser.purityCoins) || 0;
    const newCoins = adjustType === 'credit' 
      ? currentCoins + delta 
      : Math.max(0, currentCoins - delta);

    // 1. Update user profile
    updateDocumentNonBlocking(doc(db, 'userProfiles', selectedUser.id), {
      purityCoins: newCoins,
      updatedAt: new Date().toISOString(),
    });

    // 2. Add audit transaction log
    addDocumentNonBlocking(collection(db, 'coinTransactions'), {
      userId: selectedUser.id,
      userEmail: selectedUser.email || '',
      userName: `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim() || 'Valued Member',
      delta: adjustType === 'credit' ? delta : -delta,
      type: adjustType,
      reason: reason.trim() || (adjustType === 'credit' ? 'Admin Loyalty Credit' : 'Admin Balance Adjustment'),
      previousBalance: currentCoins,
      newBalance: newCoins,
      adminEmail: currentAdmin?.email || 'vivanfarmsnatural@gmail.com',
      createdAt: new Date().toISOString(),
    });

    toast({
      title: "Purity Coins Updated",
      description: `${adjustType === 'credit' ? 'Credited' : 'Debited'} ${delta} coins. New balance: ${newCoins}.`,
    });

    setIsAdjustOpen(false);
    setSelectedUser(null);
    setReason('');
    setCoinAmount('100');
  };

  const ordersOfSelectedUser = useMemo(() => {
    if (!viewOrdersUser || !orders) return [];
    return orders.filter(o => o.userId === viewOrdersUser.id);
  }, [viewOrdersUser, orders]);

  if (usersLoading || ordersLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center font-headline text-2xl font-extrabold text-primary animate-pulse">
        Synchronizing Customer Directory...
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* ── Page Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="font-headline text-4xl md:text-5xl font-extrabold text-[#100C06]">
            Customers & Purity Coins
          </h1>
          <p className="text-[#7A6848] text-sm mt-2 font-medium">
            Inspect verified customer profiles, purchase history, and manage reward coin balances.
          </p>
        </div>

        {/* Global Quick Search */}
        <div className="relative w-full lg:w-[360px]">
          <Search className="w-4 h-4 text-[#7A6848] absolute left-4 top-1/2 -translate-y-1/2" />
          <Input 
            placeholder="Search by name, email, phone, or UID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-12 pl-11 rounded-2xl bg-white border-[#DDD0B5] focus-visible:ring-primary focus-visible:border-primary transition-all shadow-xs text-xs font-semibold"
          />
        </div>
      </div>

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-xl rounded-[32px] overflow-hidden bg-white">
          <CardContent className="p-7">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-primary">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                Active
              </span>
            </div>
            <div className="text-[11px] font-black text-[#7A6848] uppercase tracking-wider">Total Registered</div>
            <div className="font-headline text-3xl font-extrabold text-primary mt-1">
              {metrics.totalUsers}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl rounded-[32px] overflow-hidden bg-white">
          <CardContent className="p-7">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700">
                <Coins className="w-6 h-6 text-[#EBB847]" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full">
                In Wallets
              </span>
            </div>
            <div className="text-[11px] font-black text-[#7A6848] uppercase tracking-wider">Purity Coins In Circulation</div>
            <div className="font-headline text-3xl font-extrabold text-[#B8860B] mt-1">
              {metrics.totalCoinsCirculation.toLocaleString('en-IN')}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl rounded-[32px] overflow-hidden bg-white">
          <CardContent className="p-7">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-700">
                <Sparkles className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-800 bg-blue-50 px-2.5 py-1 rounded-full">
                Discounted
              </span>
            </div>
            <div className="text-[11px] font-black text-[#7A6848] uppercase tracking-wider">Coins Redeemed by Shoppers</div>
            <div className="font-headline text-3xl font-extrabold text-blue-700 mt-1">
              {metrics.totalCoinsRedeemed.toLocaleString('en-IN')}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl rounded-[32px] overflow-hidden bg-white">
          <CardContent className="p-7">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#EBF5EE] flex items-center justify-center text-primary">
                <ShoppingBag className="w-6 h-6 text-primary" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-primary bg-emerald-50 px-2.5 py-1 rounded-full">
                Orders
              </span>
            </div>
            <div className="text-[11px] font-black text-[#7A6848] uppercase tracking-wider">Lifetime Orders Placed</div>
            <div className="font-headline text-3xl font-extrabold text-primary mt-1">
              {metrics.totalOrdersCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Filters Strip ── */}
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: 'all', label: 'All Customers' },
          { id: 'high_coins', label: 'High Coins (500+)' },
          { id: 'has_orders', label: 'Placed Orders' },
          { id: 'zero_coins', label: 'Zero Coins' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterType(tab.id as any)}
            className={cn(
              "h-10 px-5 rounded-full text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer shadow-2xs",
              filterType === tab.id
                ? "bg-primary text-white shadow-md scale-105"
                : "bg-white text-[#7A6848] border border-[#DDD0B5]/60 hover:bg-gray-50"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Users Table Card ── */}
      <Card className="border-none shadow-2xl rounded-[36px] overflow-hidden bg-white">
        <Table>
          <TableHeader className="bg-[#FAF7F0]">
            <TableRow className="border-b-[#DDD0B5]/40">
              <TableHead className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-[#7A6848]">Customer</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-[#7A6848]">Contact</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-[#7A6848]">Purity Coins</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-[#7A6848]">Orders</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-[#7A6848]">Total Spent</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-[#7A6848]">Member Since</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-[#7A6848] text-right pr-6">Manage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((u) => {
                const stats = userOrderStats[u.id] || { count: 0, totalSpent: 0 };
                const coins = Number(u.purityCoins) || 0;
                const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Verified Customer';

                return (
                  <TableRow key={u.id} className="border-b-[#DDD0B5]/20 hover:bg-primary/[0.02] transition-colors">
                    {/* Customer Info */}
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#1B5E3B] to-[#0D3520] flex items-center justify-center font-black text-xs text-white shrink-0 shadow-xs">
                          {fullName.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-extrabold text-[#100C06] truncate">{fullName}</div>
                          <div className="text-[11px] text-gray-500 font-medium truncate">{u.email || 'No email registered'}</div>
                          <div className="text-[9.5px] font-mono text-gray-400 mt-0.5">UID: {u.id?.substring(0, 10)}...</div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Contact */}
                    <TableCell>
                      <div className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-[#7A6848]" />
                        <span>{u.phoneNumber || stats.phone || 'N/A'}</span>
                      </div>
                    </TableCell>

                    {/* Purity Coins Balance */}
                    <TableCell>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 shadow-2xs">
                        <Coins className="w-3.5 h-3.5 text-[#EBB847] shrink-0" />
                        <span className="text-xs font-black text-amber-900">
                          {coins.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </TableCell>

                    {/* Orders Count */}
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => setViewOrdersUser(u)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline cursor-pointer"
                      >
                        <span>{stats.count} {stats.count === 1 ? 'order' : 'orders'}</span>
                        {stats.count > 0 && <ExternalLink className="w-3 h-3" />}
                      </button>
                    </TableCell>

                    {/* Total Spent */}
                    <TableCell>
                      <span className="text-sm font-extrabold text-gray-900">
                        ₹{stats.totalSpent.toLocaleString('en-IN')}
                      </span>
                    </TableCell>

                    {/* Member Since */}
                    <TableCell>
                      <span className="text-xs font-medium text-gray-500">
                        {u.updatedAt || u.createdAt ? new Date(u.updatedAt || u.createdAt!).toLocaleDateString('en-IN') : 'Active Member'}
                      </span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedUser(u);
                            setAdjustType('credit');
                            setIsAdjustOpen(true);
                          }}
                          className="h-8 px-3 rounded-xl bg-primary text-white text-xs font-bold hover:bg-[#14482D] cursor-pointer shadow-xs"
                        >
                          <Coins className="w-3 h-3 mr-1" />
                          <span>Coins</span>
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="w-8 h-8 rounded-xl bg-[#F9F6EF] flex items-center justify-center text-[#7A6848] hover:bg-primary/10 hover:text-primary transition-all cursor-pointer">
                              <i className="fa-solid fa-ellipsis-v text-xs"></i>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-2xl p-2 bg-white shadow-2xl border border-gray-100 min-w-[190px]">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(u);
                                setAdjustType('credit');
                                setIsAdjustOpen(true);
                              }}
                              className="rounded-xl py-2 px-3 text-xs font-bold cursor-pointer hover:bg-emerald-50 text-emerald-800"
                            >
                              <PlusCircle className="w-3.5 h-3.5 mr-2" /> Credit Coins (+)
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(u);
                                setAdjustType('debit');
                                setIsAdjustOpen(true);
                              }}
                              className="rounded-xl py-2 px-3 text-xs font-bold cursor-pointer hover:bg-red-50 text-red-700"
                            >
                              <MinusCircle className="w-3.5 h-3.5 mr-2" /> Debit Coins (-)
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => setViewOrdersUser(u)}
                              className="rounded-xl py-2 px-3 text-xs font-bold cursor-pointer hover:bg-gray-100 text-gray-800"
                            >
                              <ShoppingBag className="w-3.5 h-3.5 mr-2" /> View Order History
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="py-16 text-center text-[#7A6848] font-medium italic">
                  No customers found matching your search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* ── Coin Transaction Audit Trail ── */}
      {coinLogs && coinLogs.length > 0 && (
        <Card className="border-none shadow-xl rounded-[32px] overflow-hidden bg-white p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              <h2 className="font-headline text-xl font-extrabold text-[#100C06]">
                Recent Purity Coins Transactions Log
              </h2>
            </div>
            <span className="text-xs text-gray-400 font-medium">{coinLogs.length} entries</span>
          </div>

          <div className="space-y-3">
            {coinLogs.slice(0, 6).map((log) => (
              <div key={log.id} className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-gray-100 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0",
                    log.type === 'credit' ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                  )}>
                    {log.type === 'credit' ? '+' : '-'}
                  </div>
                  <div>
                    <div className="font-extrabold text-gray-900">{log.userName || log.userEmail}</div>
                    <div className="text-[11px] text-gray-500 font-medium">{log.reason || 'Admin Adjustment'}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className={cn(
                    "font-extrabold text-sm",
                    log.type === 'credit' ? "text-emerald-700" : "text-red-700"
                  )}>
                    {log.type === 'credit' ? `+${log.delta}` : `${log.delta}`} Coins
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {log.createdAt ? new Date(log.createdAt).toLocaleDateString() : 'Recent'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Coin Adjustment Modal ── */}
      <Dialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
        <DialogContent className="max-w-md rounded-[36px] p-8 bg-white border-none shadow-2xl">
          <DialogHeader className="mb-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-2">
              <Coins className="w-6 h-6 text-[#EBB847]" />
            </div>
            <DialogTitle className="font-headline text-2xl font-extrabold text-center text-primary">
              Adjust Purity Coins
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-gray-600">
              Update coin wallet for <span className="font-bold text-gray-900">{selectedUser?.firstName} {selectedUser?.lastName}</span> ({selectedUser?.email})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Current Balance */}
            <div className="p-3 bg-[#FAF7EF] rounded-2xl border border-[#EEE0BC] flex items-center justify-between text-xs">
              <span className="font-bold text-[#7A6848]">Current Wallet Balance:</span>
              <span className="font-black text-amber-900 text-sm">{selectedUser?.purityCoins || 0} Coins</span>
            </div>

            {/* Action Type Toggle */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setAdjustType('credit')}
                className={cn(
                  "py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                  adjustType === 'credit' 
                    ? "bg-[#1B5E3B] text-white shadow-sm" 
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                Credit (+)
              </button>
              <button
                type="button"
                onClick={() => setAdjustType('debit')}
                className={cn(
                  "py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                  adjustType === 'debit' 
                    ? "bg-red-600 text-white shadow-sm" 
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                Debit (-)
              </button>
            </div>

            {/* Amount Input */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                Number of Coins *
              </label>
              <Input
                type="number"
                min="1"
                value={coinAmount}
                onChange={(e) => setCoinAmount(e.target.value)}
                className="h-12 rounded-xl bg-[#FAF8F5] border-gray-200 font-extrabold text-sm"
              />
            </div>

            {/* Reason / Note */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                Reason / Internal Note
              </label>
              <Input
                placeholder="e.g. Festival Loyalty Bonus, Delivery Compensation..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="h-12 rounded-xl bg-[#FAF8F5] border-gray-200 text-xs font-medium"
              />
            </div>

            {/* Summary Preview */}
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
              <span>New Balance After Adjustment:</span>
              <span className="font-extrabold text-sm">
                {adjustType === 'credit'
                  ? (Number(selectedUser?.purityCoins || 0) + (parseInt(coinAmount, 10) || 0))
                  : Math.max(0, Number(selectedUser?.purityCoins || 0) - (parseInt(coinAmount, 10) || 0))} Coins
              </span>
            </div>
          </div>

          <DialogFooter className="mt-4 flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsAdjustOpen(false)}
              className="flex-1 h-11 rounded-2xl text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCoinAdjustment}
              className="flex-1 h-11 rounded-2xl bg-primary hover:bg-[#14482D] text-white text-xs font-black uppercase tracking-wider"
            >
              Confirm Adjustment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── User Orders Modal ── */}
      <Dialog open={!!viewOrdersUser} onOpenChange={(open) => !open && setViewOrdersUser(null)}>
        <DialogContent className="max-w-2xl rounded-[36px] p-8 bg-white border-none shadow-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="mb-4">
            <DialogTitle className="font-headline text-2xl font-extrabold text-primary flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" />
              <span>Order History: {viewOrdersUser?.firstName} {viewOrdersUser?.lastName}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-600">
              Customer Email: {viewOrdersUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {ordersOfSelectedUser.length > 0 ? (
              ordersOfSelectedUser.map((order) => (
                <div key={order.id} className="p-4 rounded-2xl bg-[#FAF8F5] border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-extrabold text-primary text-sm">Order #{order.id.substring(0, 8).toUpperCase()}</div>
                    <div className="text-gray-500 mt-0.5">Date: {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A'}</div>
                    {order.trackingId && (
                      <div className="text-[11px] font-mono text-emerald-800 font-bold mt-1">
                        AWB: {order.trackingId}
                      </div>
                    )}
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1">
                    <span className="font-extrabold text-gray-900 text-sm">₹{(order.totalAmount || 0).toLocaleString('en-IN')}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary">
                      {order.status || 'Processing'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-10 text-center text-gray-500 italic">No orders found for this customer.</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
