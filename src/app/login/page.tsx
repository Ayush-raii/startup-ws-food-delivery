'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Phone, User, Store, ArrowRight, ShieldCheck, Info } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  
  // Tabs: 'credentials' (customer/owner) or 'phone' (staff)
  const [activeTab, setActiveTab] = useState<'credentials' | 'phone'>('credentials');
  
  // Credentials Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Phone Form States
  const [phone, setPhone] = useState('');
  
  // General UI States
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResetSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.requiresVerification) {
          setError(data.error || 'Account not verified.');
          setTimeout(() => {
            router.push(`/verify?email=${encodeURIComponent(data.email || email)}`);
          }, 1500);
          return;
        }
        throw new Error(data.error || 'Invalid credentials');
      }

      // Redirect depending on role
      router.push(data.user.role === 'owner' ? '/restaurant/dashboard' : '/customer/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResetSuccess('');
    if (!phone) {
      setError('Please enter your registered phone number');
      return;
    }
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to authenticate phone number');
      }

      router.push('/staff/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetDatabase = async () => {
    setError('');
    setResetSuccess('');
    setResetting(true);
    try {
      const res = await fetch('/api/auth/reset', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset database');
      }
      setResetSuccess('Database reset and re-seeded successfully! All demo accounts are ready.');
    } catch (err: any) {
      setError(err.message || 'Database reset failed');
    } finally {
      setResetting(false);
    }
  };

  const fillDemoAccount = (type: 'customer' | 'owner_india' | 'owner_burger' | 'owner_taco' | 'staff_india' | 'staff_burger' | 'staff_taco') => {
    setError('');
    setResetSuccess('');
    if (type === 'customer') {
      setActiveTab('credentials');
      setEmail('customer@example.com');
      setPassword('password123');
    } else if (type === 'owner_india') {
      setActiveTab('credentials');
      setEmail('owner@example.com');
      setPassword('password123');
    } else if (type === 'owner_burger') {
      setActiveTab('credentials');
      setEmail('burger_owner@example.com');
      setPassword('password123');
    } else if (type === 'owner_taco') {
      setActiveTab('credentials');
      setEmail('taco_owner@example.com');
      setPassword('password123');
    } else if (type === 'staff_india') {
      setActiveTab('phone');
      setPhone('9876543210');
    } else if (type === 'staff_burger') {
      setActiveTab('phone');
      setPhone('9876543211');
    } else if (type === 'staff_taco') {
      setActiveTab('phone');
      setPhone('9876543212');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50/50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Decorative Badge */}
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-600 mb-4 shadow-inner">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Decentral<span className="text-primary-500">Bites</span> Auth
        </h2>
        <p className="mt-2 text-sm text-slate-500 font-medium">
          Decentralized merchant-managed delivery fleet portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-100 rounded-2xl sm:px-10">
          
          {/* Tabs header */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
            <button
              onClick={() => { setActiveTab('credentials'); setError(''); setResetSuccess(''); }}
              className={`flex-1 flex justify-center items-center py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'credentials'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Customer / Owner
            </button>
            <button
              onClick={() => { setActiveTab('phone'); setError(''); setResetSuccess(''); }}
              className={`flex-1 flex justify-center items-center py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'phone'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Delivery Rider Staff
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-start gap-2">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}

          {resetSuccess && (
            <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm font-medium flex items-start gap-2">
              <span className="font-bold">Success:</span> {resetSuccess}
            </div>
          )}

          {activeTab === 'credentials' ? (
            /* Email & Password Form */
            <form onSubmit={handleCredentialsLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-slate-900 text-sm"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-slate-900 text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Authenticating...' : 'Sign In'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          ) : (
            /* Phone Number Form */
            <form onSubmit={handlePhoneLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Delivery Phone Number
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-slate-900 text-sm"
                    placeholder="Enter registered 10-digit number"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Logging in...' : 'Access Delivery Dashboard'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          )}

          {/* Registration Redirect */}
          {activeTab === 'credentials' && (
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-500">
                New merchant or customer?{' '}
                <Link href="/register" className="font-bold text-primary-600 hover:text-primary-500">
                  Create Account
                </Link>
              </p>
            </div>
          )}

          {/* Quick Seeder Demo Accounts */}
          <div className="mt-8 pt-6 border-t border-slate-100 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Info className="h-3.5 w-3.5 text-slate-400" />
                Quick Demo Accounts (Click to Autofill)
              </h4>
              <button
                type="button"
                onClick={handleResetDatabase}
                disabled={resetting}
                className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-2 py-1 rounded transition-colors disabled:opacity-50"
              >
                {resetting ? 'Resetting...' : 'Reset Database'}
              </button>
            </div>

            {/* Customer Account */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary-500" />
                <div>
                  <span className="text-[11px] font-bold text-slate-700 block leading-tight">Alice Customer</span>
                  <span className="text-[9px] text-slate-400">customer@example.com (password123)</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => fillDemoAccount('customer')}
                className="text-[10px] font-bold text-primary-600 hover:underline px-2"
              >
                Autofill
              </button>
            </div>

            {/* Restaurant Accounts */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Grouped by Restaurant (Isolation Test)</span>
              
              {/* Royal India */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-2">
                <div className="flex justify-between items-center border-b border-slate-200/50 pb-1.5">
                  <span className="text-[11px] font-extrabold text-slate-800 flex items-center gap-1">
                    <Store className="h-3.5 w-3.5 text-orange-500" /> Royal India
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <div className="text-[9.5px]">
                    <span className="font-semibold text-slate-600 block">Owner: <span className="text-slate-400">owner@example.com</span></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => fillDemoAccount('owner_india')}
                    className="text-[9.5px] font-bold text-primary-600 hover:underline"
                  >
                    Fill Owner
                  </button>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <div className="text-[9.5px]">
                    <span className="font-semibold text-slate-600 block">Rider Phone: <span className="text-slate-400">9876543210</span></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => fillDemoAccount('staff_india')}
                    className="text-[9.5px] font-bold text-primary-600 hover:underline"
                  >
                    Fill Rider
                  </button>
                </div>
              </div>

              {/* The Burger Lab */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-2">
                <div className="flex justify-between items-center border-b border-slate-200/50 pb-1.5">
                  <span className="text-[11px] font-extrabold text-slate-800 flex items-center gap-1">
                    <Store className="h-3.5 w-3.5 text-blue-500" /> The Burger Lab
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <div className="text-[9.5px]">
                    <span className="font-semibold text-slate-600 block">Owner: <span className="text-slate-400">burger_owner@example.com</span></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => fillDemoAccount('owner_burger')}
                    className="text-[9.5px] font-bold text-primary-600 hover:underline"
                  >
                    Fill Owner
                  </button>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <div className="text-[9.5px]">
                    <span className="font-semibold text-slate-600 block">Rider Phone: <span className="text-slate-400">9876543211</span></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => fillDemoAccount('staff_burger')}
                    className="text-[9.5px] font-bold text-primary-600 hover:underline"
                  >
                    Fill Rider
                  </button>
                </div>
              </div>

              {/* Taco Fiesta */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-2">
                <div className="flex justify-between items-center border-b border-slate-200/50 pb-1.5">
                  <span className="text-[11px] font-extrabold text-slate-800 flex items-center gap-1">
                    <Store className="h-3.5 w-3.5 text-pink-500" /> Taco Fiesta
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <div className="text-[9.5px]">
                    <span className="font-semibold text-slate-600 block">Owner: <span className="text-slate-400">taco_owner@example.com</span></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => fillDemoAccount('owner_taco')}
                    className="text-[9.5px] font-bold text-primary-600 hover:underline"
                  >
                    Fill Owner
                  </button>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <div className="text-[9.5px]">
                    <span className="font-semibold text-slate-600 block">Rider Phone: <span className="text-slate-400">9876543212</span></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => fillDemoAccount('staff_taco')}
                    className="text-[9.5px] font-bold text-primary-600 hover:underline"
                  >
                    Fill Rider
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

