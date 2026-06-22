'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Mail, Lock, Store, ArrowRight, ShieldCheck, Navigation } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();

  const [role, setRole] = useState<'customer' | 'owner'>('customer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantLatitude, setRestaurantLatitude] = useState('28.6139');
  const [restaurantLongitude, setRestaurantLongitude] = useState('77.2090');
  const [isLocatingRestaurant, setIsLocatingRestaurant] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGetRestaurantLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setIsLocatingRestaurant(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setRestaurantLatitude(position.coords.latitude.toFixed(6));
        setRestaurantLongitude(position.coords.longitude.toFixed(6));
        setIsLocatingRestaurant(false);
      },
      (error) => {
        setIsLocatingRestaurant(false);
        let errorMsg = 'Unable to retrieve location.';
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = 'Location permission was denied. Please allow location access in your browser settings to detect your location.';
        }
        alert(errorMsg);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const payload = {
        name,
        email,
        password,
        role,
        ...(role === 'owner' ? { 
          restaurantName, 
          latitude: Number(restaurantLatitude), 
          longitude: Number(restaurantLongitude) 
        } : {}),
      };

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      if (data.requiresVerification) {
        setSuccess('Account created! Please verify your email...');
        setTimeout(() => {
          router.push(`/verify?email=${encodeURIComponent(email)}`);
        }, 1500);
      } else {
        setSuccess('Account created successfully! Redirecting to login...');
        setTimeout(() => {
          router.push('/login');
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
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
          Join Door<span className="text-primary-500">ly</span>
        </h2>
        <p className="mt-2 text-sm text-slate-500 font-medium">
          Create an account to start ordering or manage your deliveries
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-100 rounded-2xl sm:px-10">
          
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm font-medium">
              {success}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            {/* Role Toggle Grid */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                I want to register as a:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('customer')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                    role === 'customer'
                      ? 'border-primary-500 bg-primary-50/20 text-primary-700 font-bold'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <User className="h-5 w-5 mb-1" />
                  <span className="text-xs">Customer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('owner')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                    role === 'owner'
                      ? 'border-primary-500 bg-primary-50/20 text-primary-700 font-bold'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Store className="h-5 w-5 mb-1" />
                  <span className="text-xs">Restaurant Owner</span>
                </button>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Full Name
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-slate-900 text-sm"
                  placeholder="John Doe"
                />
              </div>
            </div>

            {/* Email */}
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
                  placeholder="john@example.com"
                />
              </div>
            </div>

            {/* Password */}
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
                  placeholder="Min 6 characters"
                  minLength={6}
                />
              </div>
            </div>

            {/* Restaurant Name (Conditional for Owner) */}
            {role === 'owner' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Restaurant Name
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Store className="h-5 w-5" />
                    </div>
                    <input
                      type="text"
                      required
                      value={restaurantName}
                      onChange={(e) => setRestaurantName(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-slate-900 text-sm"
                      placeholder="e.g. Royal Burger Joint"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={restaurantLatitude}
                      onChange={(e) => setRestaurantLatitude(e.target.value)}
                      className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-slate-900 text-sm font-semibold"
                      placeholder="e.g. 28.6139"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={restaurantLongitude}
                      onChange={(e) => setRestaurantLongitude(e.target.value)}
                      className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-slate-900 text-sm font-semibold"
                      placeholder="e.g. 77.2090"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGetRestaurantLocation}
                  disabled={isLocatingRestaurant}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 border border-slate-250 hover:border-primary-500 rounded-xl text-xs font-bold text-slate-700 hover:text-primary-500 transition-colors bg-white shadow-sm disabled:opacity-50"
                >
                  <Navigation className={`h-3.5 w-3.5 text-primary-500 ${isLocatingRestaurant ? 'animate-spin' : 'animate-pulse'}`} />
                  {isLocatingRestaurant ? 'Detecting Location...' : 'Detect Restaurant Location (GPS)'}
                </button>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{' '}
              <Link href="/login" className="font-bold text-primary-600 hover:text-primary-500">
                Sign In
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
