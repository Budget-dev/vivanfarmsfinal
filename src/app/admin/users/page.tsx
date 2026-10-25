"use client";

import React, { useState, useMemo } from 'react';
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
  Phone,
  MoreVertical,
  Plus,
  Minus
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { updateDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { UserProfile } from '@/types';

export default function AdminUsersPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const { user: currentAdmin } = useUser();

  const usersRef = useMemoFirebase(() => collection(db, 'userProfiles'), [db]);
  const ordersRef = useMemoFirebase(() => collection(db, 'orders'), [db]);
  const transactionsRef = useMemoFirebase(() => collection(db, 'coinTransactions'), [db]);

  const { data: users, isLoading: usersLoading } = useCollection<UserProfile>(usersRef);
  const { data: orders, isLoading: ordersLoading } = useCollection(ordersRef);
  const { data: coinLogs } = useCollection(transactionsRef);

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

  const metrics = useMemo(() => {
    const totalUsers = users?.length || 0;
    const totalCoinsCirculation = users?.reduce((acc, u) => acc + (Number(u.purityCoins) || 0), 0) || 0;
    const totalCoinsRedeemed = orders?.reduce((acc, o) => acc + (Number(o.purityCoinsRedeemed) || 0), 0) || 0;
    const totalOrdersCount = orders?.length || 0;
    return {
      totalUsers,
      totalCoinsCirculation,
      totalCoinsRedeemed,
      totalOrdersCount,
    };
  }, [users, orders]);

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

    updateDocumentNonBlocking(doc(db, 'userProfiles', selectedUser.id), {
      purityCoins: newCoins,
      updatedAt: new Date().toISOString(),
    });

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
      title: "Coins Balance Updated",
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
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">Syncing customer profiles...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Customers & Purity Coins</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage customer accounts, purchase history, and loyalty coin balances.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border/80 shadow-sm p-4">
          <div className="text-xs font-medium text-muted-foreground">Registered Customers</div>
          <div className="text-2xl font-bold mt-1 text-foreground">{metrics.totalUsers}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Verified user accounts</div>
        </Card>
        <Card className="border border-border/80 shadow-sm p-4">
          <div className="text-xs font-medium text-amber-600">Coins in Circulation</div>
          <div className="text-2xl font-bold mt-1 text-amber-700">{metrics.totalCoinsCirculation.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Active customer wallet balances</div>
        </Card>
        <Card className="border border-border/80 shadow-sm p-4">
          <div className="text-xs font-medium text-emerald-600">Total Coins Redeemed</div>
          <div className="text-2xl font-bold mt-1 text-emerald-700">{metrics.totalCoinsRedeemed.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Used at checkout discounts</div>
        </Card>
        <Card className="border border-border/80 shadow-sm p-4">
          <div className="text-xs font-medium text-foreground">Store Orders Placed</div>
          <div className="text-2xl font-bold mt-1 text-foreground">{metrics.totalOrdersCount}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Across all members</div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border border-border/80 shadow-sm">
        <CardContent className="p-3 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 p-0.5 rounded-lg border border-border bg-muted/40 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={cn("px-3 py-1 rounded-md font-medium transition-colors", filterType === 'all' ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground")}
            >
              All ({users?.length || 0})
            </button>
            <button
              onClick={() => setFilterType('high_coins')}
              className={cn("px-3 py-1 rounded-md font-medium transition-colors", filterType === 'high_coins' ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground")}
            >
              High Coins (≥500)
            </button>
            <button
              onClick={() => setFilterType('has_orders')}
              className={cn("px-3 py-1 rounded-md font-medium transition-colors", filterType === 'has_orders' ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground")}
            >
              Shoppers
            </button>
            <button
              onClick={() => setFilterType('zero_coins')}
              className={cn("px-3 py-1 rounded-md font-medium transition-colors", filterType === 'zero_coins' ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground")}
            >
              Zero Coins
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border border-border/80 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/60 hover:bg-transparent">
              <TableHead className="px-4 text-xs font-semibold">Customer</TableHead>
              <TableHead className="px-4 text-xs font-semibold">Contact & Phone</TableHead>
              <TableHead className="px-4 text-xs font-semibold">Orders</TableHead>
              <TableHead className="px-4 text-xs font-semibold">Total Spent</TableHead>
              <TableHead className="px-4 text-xs font-semibold">Purity Coins</TableHead>
              <TableHead className="px-4 text-xs font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((u) => {
                const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Valued Shopper';
                const initials = fullName.substring(0, 2).toUpperCase();
                const stats = userOrderStats[u.id] || { count: 0, totalSpent: 0 };
                const coins = Number(u.purityCoins) || 0;

                return (
                  <TableRow key={u.id} className="border-b border-border/40 hover:bg-muted/40 transition-colors">
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs font-bold bg-muted text-foreground">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-xs text-foreground">{fullName}</p>
                          <p className="text-[11px] text-muted-foreground truncate max-w-[150px]">{u.email}</p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="px-4 py-3 text-xs text-muted-foreground">
                      {u.phoneNumber || stats.phone || 'No phone recorded'}
                    </TableCell>

                    <TableCell className="px-4 py-3">
                      <Badge variant="outline" className="text-xs font-mono">
                        {stats.count} {stats.count === 1 ? 'Order' : 'Orders'}
                      </Badge>
                    </TableCell>

                    <TableCell className="px-4 py-3 font-semibold text-xs text-foreground">
                      ₹{stats.totalSpent.toLocaleString('en-IN')}
                    </TableCell>

                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 w-fit">
                        <Coins className="w-3.5 h-3.5 text-amber-600" />
                        <span>{coins.toLocaleString('en-IN')}</span>
                      </div>
                    </TableCell>

                    <TableCell className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(u);
                            setAdjustType('credit');
                            setCoinAmount('100');
                            setIsAdjustOpen(true);
                          }}
                          className="h-7 text-xs px-2.5 gap-1 border-border"
                        >
                          <Coins className="w-3 h-3 text-amber-600" />
                          <span>Adjust Coins</span>
                        </Button>

                        {stats.count > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewOrdersUser(u)}
                            className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground"
                          >
                            Orders
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-xs text-muted-foreground">
                  No customers found matching the search criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Coin Adjustment Dialog */}
      <Dialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
        <DialogContent className="max-w-md p-6 font-sans">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-600" />
              Adjust Purity Coins
            </DialogTitle>
            <DialogDescription className="text-xs">
              Modify loyalty balance for {selectedUser?.firstName || selectedUser?.email} (Current: {selectedUser?.purityCoins || 0} coins)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={adjustType === 'credit' ? "default" : "outline"}
                size="sm"
                onClick={() => setAdjustType('credit')}
                className={cn("h-8 text-xs gap-1", adjustType === 'credit' ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "")}
              >
                <Plus className="w-3.5 h-3.5" /> Credit Coins
              </Button>
              <Button
                type="button"
                variant={adjustType === 'debit' ? "destructive" : "outline"}
                size="sm"
                onClick={() => setAdjustType('debit')}
                className="h-8 text-xs gap-1"
              >
                <Minus className="w-3.5 h-3.5" /> Debit Coins
              </Button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Amount of Coins</label>
              <Input
                type="number"
                value={coinAmount}
                onChange={(e) => setCoinAmount(e.target.value)}
                placeholder="100"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Reason / Audit Note</label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Goodwill credit, Festival gift, Correction"
                className="h-9 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-border/60">
            <Button variant="outline" size="sm" onClick={() => setIsAdjustOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCoinAdjustment} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Apply Adjustment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Orders History Dialog */}
      <Dialog open={!!viewOrdersUser} onOpenChange={(open) => !open && setViewOrdersUser(null)}>
        <DialogContent className="max-w-2xl p-6 font-sans">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              Orders History - {viewOrdersUser?.firstName || viewOrdersUser?.email}
            </DialogTitle>
            <DialogDescription className="text-xs">
              All past orders placed by this registered customer.
            </DialogDescription>
          </DialogHeader>

          <div className="pt-2 max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/60">
                  <TableHead className="text-xs h-8">Order ID</TableHead>
                  <TableHead className="text-xs h-8">Date</TableHead>
                  <TableHead className="text-xs h-8">Status</TableHead>
                  <TableHead className="text-xs h-8 text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordersOfSelectedUser.map((o) => (
                  <TableRow key={o.id} className="border-b border-border/40">
                    <TableCell className="py-2 text-xs font-mono font-medium">#{o.id.substring(0, 8).toUpperCase()}</TableCell>
                    <TableCell className="py-2 text-xs text-muted-foreground">
                      {o.orderDate ? new Date(o.orderDate).toLocaleDateString('en-IN') : 'N/A'}
                    </TableCell>
                    <TableCell className="py-2">
                      <Badge variant="outline" className="text-[10px]">{o.status || 'Pending'}</Badge>
                    </TableCell>
                    <TableCell className="py-2 text-xs font-bold text-right text-foreground">
                      ₹{o.totalAmount}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DialogFooter className="pt-4 border-t border-border/60">
            <Button size="sm" onClick={() => setViewOrdersUser(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
