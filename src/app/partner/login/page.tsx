'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, Phone, Store, Truck, ArrowRight, ShieldCheck, Info } from 'lucide-react';
import { useRouter as useNextRouter } from 'next/navigation';

export default function PartnerLoginPage() {
  const router = useNextRouter();

  // Tabs: 'owner' (Restaurant Owner) or 'rider' (Delivery Rider Staff)
  const [activeTab, setActiveTab] = useState<'owner' | 'rider'>('owner');

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  // UI States
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');

  const handleOwnerLogin = async (e: React.FormEvent) => {
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

      if (data.user.role !== 'owner' && data.user.role !== 'admin') {
        throw new Error('This portal is restricted to Restaurant Partners & Admins');
      }

      router.push(data.user.role === 'admin' ? '/admin/dashboard' : '/restaurant/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRiderLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResetSuccess('');

    if (!phone.trim()) {
      setError('Please enter your registered phone number');
      return;
    }
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Rider authentication failed');
      }

      router.push('/staff/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Rider login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillOwnerDemo = (type: 'royal' | 'burger' | 'taco') => {
    setError('');
    setResetSuccess('');
    setActiveTab('owner');
    if (type === 'royal') {
      setEmail('owner@example.com');
    } else if (type === 'burger') {
      setEmail('burger_owner@example.com');
    } else {
      setEmail('taco_owner@example.com');
    }
    setPassword('password123');
  };

  const fillRiderDemo = (type: 'royal' | 'burger' | 'taco') => {
    setError('');
    setResetSuccess('');
    setActiveTab('rider');
    if (type === 'royal') {
      setPhone('9876543210');
    } else if (type === 'burger') {
      setPhone('9876543211');
    } else {
      setPhone('9876543212');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50/50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-600 mb-4 shadow-inner">
          <Store className="h-7 w-7" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Partner Portal — Door<span className="text-primary-500">ly</span>
        </h2>
        <p className="mt-2 text-sm text-slate-500 font-medium">
          Access your restaurant merchant panel or rider dashboard
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-100 rounded-2xl sm:px-10">
          
          {/* Tabs header */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
            <button
              onClick={() => { setActiveTab('owner'); setError(''); }}
              className={`flex-1 flex justify-center items-center py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'owner'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Store className="h-4 w-4 mr-1.5" /> Restaurant Owner
            </button>
            <button
              onClick={() => { setActiveTab('rider'); setError(''); }}
              className={`flex-1 flex justify-center items-center py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'rider'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Truck className="h-4 w-4 mr-1.5" /> Delivery Rider
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}

          {activeTab === 'owner' ? (
            <form onSubmit={handleOwnerLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Merchant Email Address
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
                    placeholder="merchant@example.com"
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
                <div className="flex justify-end mt-1.5">
                  <Link
                    href="/forgot-password"
                    className="text-xs font-bold text-primary-600 hover:text-primary-500 transition-colors"
                  >
                    Forgot Password?
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {loading ? 'Authenticating Merchant...' : 'Access Owner Dashboard'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleRiderLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Rider Phone Number
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

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {loading ? 'Authenticating Rider...' : 'Access Rider Companion'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}

          {/* Registration Redirect CTA */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center space-y-2">
            <p className="text-xs font-extrabold text-slate-450 uppercase tracking-wider">
              Want to grow your business?
            </p>
            <Link
              href="/register"
              className="inline-block px-4 py-2 border border-slate-200 hover:border-primary-500 text-slate-700 hover:text-primary-600 rounded-xl text-xs font-bold transition-all w-full"
            >
              Register a New Business: Add Restaurant / Rider
            </Link>
          </div>

          {/* Quick Demo Autofill section for partners */}
          <div className="mt-8 pt-6 border-t border-slate-100 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Info className="h-3.5 w-3.5 text-slate-400" />
              Quick Partner Demo Accounts
            </h4>

            <div className="grid grid-cols-1 gap-2.5">
              {/* Royal India */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-700 block">Royal India</span>
                  <span className="text-[9.5px] text-slate-400">owner@example.com | 9876543210</span>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => fillOwnerDemo('royal')} className="text-[9px] font-bold text-primary-600 hover:underline">Fill Owner</button>
                  <button type="button" onClick={() => fillRiderDemo('royal')} className="text-[9px] font-bold text-primary-600 hover:underline">Fill Rider</button>
                </div>
              </div>

              {/* Burger Lab */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-700 block">The Burger Lab</span>
                  <span className="text-[9.5px] text-slate-400">burger_owner@example.com | 9876543211</span>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => fillOwnerDemo('burger')} className="text-[9px] font-bold text-primary-600 hover:underline">Fill Owner</button>
                  <button type="button" onClick={() => fillRiderDemo('burger')} className="text-[9px] font-bold text-primary-600 hover:underline">Fill Rider</button>
                </div>
              </div>

              {/* Taco Fiesta */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-700 block">Taco Fiesta</span>
                  <span className="text-[9.5px] text-slate-400">taco_owner@example.com | 9876543212</span>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => fillOwnerDemo('taco')} className="text-[9px] font-bold text-primary-600 hover:underline">Fill Owner</button>
                  <button type="button" onClick={() => fillRiderDemo('taco')} className="text-[9px] font-bold text-primary-600 hover:underline">Fill Rider</button>
                </div>
              </div>
            </div>
          </div>

          {/* Customer login link */}
          <div className="mt-6 text-center">
            <Link href="/login" className="text-xs font-bold text-primary-600 hover:text-primary-500 transition-colors">
              Customer Sign In Portal
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
