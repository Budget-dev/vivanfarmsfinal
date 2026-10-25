"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { ShieldCheck, Lock, Mail, Loader2, KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function AdminLoginPage() {
  const ADMIN_EMAIL = 'vivanfarmsnatural@gmail.com';
  
  const [password, setPassword] = useState('');
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    if (user && user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      const adminRoleData = {
        email: ADMIN_EMAIL,
        role: 'admin',
        lastVerifiedAt: new Date().toISOString()
      };

      setDoc(doc(db, 'adminRoles', user.uid), adminRoleData, { merge: true })
        .catch(async () => {
          const permissionError = new FirestorePermissionError({
            path: `adminRoles/${user.uid}`,
            operation: 'write',
            requestResourceData: adminRoleData,
          });
          errorEmitter.emit('permission-error', permissionError);
        });
      
      router.push('/admin');
    }
  }, [user, router, ADMIN_EMAIL, db]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isSetupMode) {
        await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, password);
        toast({ title: "Admin Initialized", description: "Master credentials set." });
      } else {
        await signInWithEmailAndPassword(auth, ADMIN_EMAIL, password);
        toast({ title: "Admin Verified", description: "Welcome back." });
      }
      router.push('/admin');
    } catch (e: any) {
      if (e.code === 'auth/email-already-in-use') {
        setError("Admin account exists. Please sign in.");
        setIsSetupMode(false);
      } else if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
        setError("Incorrect password.");
      } else {
        setError(e.message || "Access denied.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">Checking credentials...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50/70 dark:bg-zinc-950 p-4 font-sans antialiased text-foreground">
      <Card className="w-full max-w-sm border border-border/80 shadow-lg bg-card">
        <CardHeader className="text-center space-y-2 pb-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-900/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold tracking-tight">
              {isSetupMode ? 'Setup Master Account' : 'Admin Console'}
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              {isSetupMode
                ? 'Initialize super administrator password for Vivaan Farms.'
                : 'Enter your administrator credentials to access the portal.'}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Authorized Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                <Input
                  type="email"
                  value={ADMIN_EMAIL}
                  disabled
                  className="pl-9 h-9 text-xs bg-muted/50 font-mono text-muted-foreground cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                {isSetupMode ? 'Create Password' : 'Password'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9 h-9 text-xs"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-2.5 rounded-md bg-destructive/10 text-destructive text-xs font-medium text-center">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-9 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : isSetupMode ? (
                'Initialize Administrator'
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="pt-0 pb-6 flex justify-center border-t border-border/40 mt-2">
          {!isSetupMode ? (
            <button
              type="button"
              onClick={() => setIsSetupMode(true)}
              className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors mt-4"
            >
              First time setup? Initialize master account
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsSetupMode(false)}
              className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors mt-4"
            >
              Already configured? Back to sign in
            </button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}