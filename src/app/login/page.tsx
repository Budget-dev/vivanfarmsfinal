"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/vivaan/Header';
import { Footer } from '@/components/vivaan/Footer';
import { Ticker } from '@/components/vivaan/Ticker';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  sendPasswordResetEmail,
  getAdditionalUserInfo
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { LogIn, Mail, Lock, User as UserIcon } from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const returnTo = searchParams.get('returnTo') || '/';
  
  const auth = useAuth();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();

  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && !isUserLoading) {
      router.push(returnTo);
    }
  }, [user, isUserLoading, router, returnTo]);

  const validateEmail = (emailStr: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr);
  };

  const syncProfile = (u: any, isNewUser = false) => {
    const profileData: any = {
      id: u.uid,
      firstName: u.displayName?.split(' ')[0] || (name ? name.split(' ')[0] : ''),
      lastName: u.displayName?.split(' ').slice(1).join(' ') || (name ? name.split(' ').slice(1).join(' ') : ''),
      email: u.email?.toLowerCase().trim(),
      updatedAt: new Date().toISOString()
    };
    if (isNewUser) {
      profileData.purityCoins = 500;
      profileData.createdAt = new Date().toISOString();
    }
    setDoc(doc(db, 'userProfiles', u.uid), profileData, { merge: true }).catch((err: any) => {
      console.warn("Background profile sync notice:", err);
    });
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email above to reset password.");
      return;
    }
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      toast({ title: "Password Reset Sent", description: `Check your inbox at ${email}` });
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to send reset email.");
    }
  };

  const handleSignInOrSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (isSignUp && !name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        if (name) {
          updateProfile(result.user, { displayName: name }).catch(console.warn);
        }
        syncProfile(result.user, true);
        toast({ title: "Welcome!", description: "Account created successfully." });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: "Welcome Back", description: "Logged in successfully." });
      }
      router.push(returnTo);
    } catch (err: any) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError("Invalid email or password.");
      } else if (err.code === 'auth/email-already-in-use') {
        setError("This email is already registered. Please sign in.");
      } else if (err.code === 'auth/weak-password') {
        setError("Password should be at least 6 characters.");
      } else {
        setError(err.message || "Authentication error.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError("");
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const isNewUser = getAdditionalUserInfo(result)?.isNewUser ?? false;
      syncProfile(result.user, isNewUser);
      toast({ title: "Welcome!", description: `Signed in as ${result.user.displayName || result.user.email}` });
      router.push(returnTo);
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || "Google sign in failed.");
        toast({ variant: "destructive", title: "Google Login Failed", description: err.message });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialDemo = (providerName: string) => {
    toast({
      title: `${providerName} Sign In`,
      description: `Please use Google or Email Sign In. ${providerName} login is in demo mode.`,
    });
  };

  if (isUserLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-primary font-bold animate-pulse">Authenticating...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm bg-gradient-to-b from-sky-50/50 to-white rounded-3xl shadow-xl shadow-opacity-10 p-8 flex flex-col items-center border border-blue-100 text-black">
      <div className="relative w-40 h-11 mb-5">
        <Image
          src="/images/logo.png"
          alt="Vivaan Farms"
          fill
          className="object-contain"
        />
      </div>

      <h2 className="text-2xl font-semibold mb-2 text-center">
        {isSignUp ? "Sign up with email" : "Sign in with email"}
      </h2>
      <p className="text-gray-500 text-sm mb-6 text-center leading-relaxed">
        {isSignUp 
          ? "Create your Vivaan Farms account to manage orders and track purity points." 
          : "Access your Vivaan Farms account, orders & purity rewards."}
      </p>

      <form onSubmit={handleSignInOrSignUp} className="w-full flex flex-col gap-3 mb-2">
        {isSignUp && (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <UserIcon className="w-4 h-4" />
            </span>
            <input
              placeholder="Full Name"
              type="text"
              value={name}
              className="w-full pl-10 pr-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-50 text-black text-sm"
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        )}

        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Mail className="w-4 h-4" />
          </span>
          <input
            placeholder="Email"
            type="email"
            value={email}
            className="w-full pl-10 pr-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-50 text-black text-sm"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Lock className="w-4 h-4" />
          </span>
          <input
            placeholder="Password"
            type="password"
            value={password}
            className="w-full pl-10 pr-10 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-50 text-black text-sm"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <div className="text-xs text-red-500 text-left font-medium w-full">{error}</div>
        )}

        <div className="w-full flex justify-between items-center text-xs">
          <button 
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
            }}
            className="hover:underline font-medium text-blue-600 cursor-pointer"
          >
            {isSignUp ? "Already have an account? Sign in" : "New here? Create account"}
          </button>

          {!isSignUp && (
            <button 
              type="button" 
              onClick={handleForgotPassword}
              className="hover:underline font-medium text-gray-500 cursor-pointer"
            >
              Forgot password?
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-b from-gray-700 to-gray-900 text-white font-medium py-2.5 rounded-xl shadow hover:brightness-105 cursor-pointer transition mb-2 mt-2 flex items-center justify-center gap-2"
        >
          {loading ? "Processing..." : (isSignUp ? "Get Started" : "Sign In")}
        </button>
      </form>

      <div className="flex items-center w-full my-2">
        <div className="flex-grow border-t border-dashed border-gray-200"></div>
        <span className="mx-2 text-xs text-gray-400">Or sign in with</span>
        <div className="flex-grow border-t border-dashed border-gray-200"></div>
      </div>

      <div className="flex gap-3 w-full justify-center mt-2">
        <button 
          type="button"
          onClick={handleGoogleAuth}
          disabled={loading}
          title="Sign in with Google"
          className="flex items-center justify-center w-12 h-12 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 transition grow cursor-pointer"
        >
          {/* eslint-disable-next-html-element-for-a11y */}
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google"
            className="w-6 h-6"
          />
        </button>
        <button 
          type="button"
          onClick={() => handleSocialDemo("Facebook")}
          title="Sign in with Facebook"
          className="flex items-center justify-center w-12 h-12 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 transition grow cursor-pointer"
        >
          {/* eslint-disable-next-html-element-for-a11y */}
          <img
            src="https://www.svgrepo.com/show/448224/facebook.svg"
            alt="Facebook"
            className="w-6 h-6"
          />
        </button>
        <button 
          type="button"
          onClick={() => handleSocialDemo("Apple")}
          title="Sign in with Apple"
          className="flex items-center justify-center w-12 h-12 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 transition grow cursor-pointer"
        >
          {/* eslint-disable-next-html-element-for-a11y */}
          <img
            src="https://www.svgrepo.com/show/511330/apple-173.svg"
            alt="Apple"
            className="w-6 h-6"
          />
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#F9F6EF] text-[#100C06]">
      <Ticker />
      <Header onOpenCart={() => {}} cartCount={0} onFilter={() => {}} onSearch={() => {}} />

      <main className="max-w-[1200px] mx-auto px-5 py-12 md:py-20 flex flex-col items-center justify-center">
        <Suspense fallback={<div className="w-full max-w-sm h-[500px] bg-white rounded-3xl animate-pulse" />}>
          <LoginContent />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}

