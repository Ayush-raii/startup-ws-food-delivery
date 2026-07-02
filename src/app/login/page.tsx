'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, ArrowRight, ShieldCheck, Info } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // General UI States
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
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

      // Customer goes to customer dashboard
      router.push('/customer/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50/50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-600 mb-4 shadow-inner">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Welcome back to Door<span className="text-primary-500">ly</span>
        </h2>
        <p className="mt-2 text-sm text-slate-500 font-medium">
          Sign in to your customer account to start ordering
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-100 rounded-2xl sm:px-10">
          
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-start gap-2">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}


          <form onSubmit={handleLogin} className="space-y-5">
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
              <div className="flex justify-end mt-1.5">
                <Link
                  href="/forgot-password"
                  className="text-xs font-bold text-primary-600 hover:text-primary-500 transition-colors"
                >
                  Forgot Password?
                </Link>
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

          {/* Quick Demo Login Autofills */}
          <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="h-4 w-4 text-slate-400" />
              Demo Phase Autofills
            </h4>
            <button
              onClick={() => {
                setEmail('customer@example.com');
                setPassword('password123');
              }}
              className="w-full text-left bg-white hover:bg-slate-50 border border-slate-200/60 p-2.5 rounded-lg text-xs font-bold text-slate-700 flex justify-between items-center transition-all shadow-sm"
            >
              <span>Customer Demo Account</span>
              <span className="text-[10px] text-slate-400 font-medium">Click to Autofill</span>
            </button>
          </div>

          {/* Registration Redirect */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              New to Doorly?{' '}
              <Link href="/register" className="font-bold text-primary-600 hover:text-primary-500">
                Create Account
              </Link>
            </p>
          </div>


          {/* Footer Partner Link */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <Link
              href="/partner/login"
              className="text-xs font-bold text-slate-400 hover:text-primary-500 transition-colors tracking-wide uppercase"
            >
              Are you a Partner? Restaurant & Delivery Portal
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
