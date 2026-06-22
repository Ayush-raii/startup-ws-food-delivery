'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, ArrowRight, ShieldCheck, Mail } from 'lucide-react';

function VerifyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (!email) {
      setError('No email address provided for verification. Please register first.');
    }
  }, [email]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      setSuccess('Email verified successfully! Redirecting to login...');
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || resendCooldown > 0) return;

    setError('');
    setSuccess('');
    setResending(true);

    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to resend verification code');
      }

      setSuccess('A new 6-digit verification code has been sent.');
      setResendCooldown(60); // 60 seconds cooldown
    } catch (err: any) {
      setError(err.message || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50/50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-600 mb-4 shadow-inner">
          <Lock className="h-6 w-6 animate-pulse" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Verify Your Email
        </h2>
        {email && (
          <p className="mt-2 text-sm text-slate-500 font-medium flex items-center justify-center gap-1.5">
            <Mail className="h-4 w-4 text-slate-400" />
            Sent to <span className="font-bold text-slate-700">{email}</span>
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-100 rounded-2xl sm:px-10 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold leading-normal">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs font-bold leading-normal">
              {success}
            </div>
          )}

          {email && (
            <form onSubmit={handleVerify} className="space-y-5">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest text-center mb-2">
                  Enter 6-Digit OTP Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="block w-full text-center tracking-[0.75em] text-3xl font-black py-3 border border-slate-200 rounded-2xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 shadow-inner"
                  placeholder="000000"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify & Activate'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}

          <div className="flex flex-col items-center gap-4 pt-4 border-t border-slate-100 text-xs">
            <button
              onClick={handleResend}
              disabled={resending || resendCooldown > 0 || !email}
              className="text-primary-600 hover:text-primary-550 font-bold transition-all disabled:opacity-40"
            >
              {resending
                ? 'Requesting code...'
                : resendCooldown > 0
                ? `Resend code in ${resendCooldown}s`
                : 'Resend Verification Code'}
            </button>

            <Link href="/login" className="text-slate-400 hover:text-slate-600 font-semibold flex items-center gap-1 transition-all">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-4rem)] flex justify-center items-center bg-slate-50/50">
        <div className="text-slate-500 font-bold animate-pulse text-sm">Loading verification...</div>
      </div>
    }>
      <VerifyPageContent />
    </Suspense>
  );
}
