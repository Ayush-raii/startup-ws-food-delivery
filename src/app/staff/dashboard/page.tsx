'use client';

import React, { useEffect, useState } from 'react';
import { Truck, MapPin, Phone, Lock, CheckCircle, Navigation, RefreshCw, LogOut, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Order {
  _id: string;
  customerId: {
    name: string;
    phone: string;
  };
  restaurantId: {
    name: string;
  };
  items: { name: string; quantity: number }[];
  totalAmount: number;
  deliveryAddress: string;
  orderStatus: 'Out for Delivery' | 'Delivered';
  createdAt: string;
}

export default function StaffDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [otpMap, setOtpMap] = useState<Record<string, string>>({});
  const [errorMap, setErrorMap] = useState<Record<string, string>>({});
  const [successMap, setSuccessMap] = useState<Record<string, string>>({});
  const [staffName, setStaffName] = useState('Rider');
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

  const fetchRiderData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // 1. Fetch staff context
      const resMe = await fetch('/api/auth/me');
      if (resMe.ok) {
        const dataMe = await resMe.json();
        setStaffName(dataMe.user.name);
      }

      // 2. Fetch assigned orders
      const resOrders = await fetch('/api/orders');
      if (resOrders.ok) {
        const dataOrders = await resOrders.json();
        setOrders(dataOrders.orders);
      }
    } catch (err) {
      console.error('Error fetching rider data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiderData();

    // Poll every 4 seconds to check for new assigned orders
    const interval = setInterval(() => {
      fetchRiderData(true);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleVerifyOtp = async (orderId: string) => {
    const otp = otpMap[orderId];
    setErrorMap(prev => ({ ...prev, [orderId]: '' }));
    setSuccessMap(prev => ({ ...prev, [orderId]: '' }));

    if (!otp || otp.length !== 4) {
      setErrorMap(prev => ({ ...prev, [orderId]: 'Please enter a 4-digit OTP.' }));
      return;
    }

    try {
      const res = await fetch('/api/orders/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, otp }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      setSuccessMap(prev => ({ ...prev, [orderId]: 'Delivery Confirmed!' }));
      // Clear OTP field
      setOtpMap(prev => ({ ...prev, [orderId]: '' }));
      
      // Refresh data
      setTimeout(() => {
        fetchRiderData(true);
      }, 1000);
    } catch (err: any) {
      setErrorMap(prev => ({ ...prev, [orderId]: err.message || 'Verification failed. Try again.' }));
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        router.push('/login');
        router.refresh();
      }
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const activeDeliveries = orders.filter(o => o.orderStatus === 'Out for Delivery');
  const completedDeliveries = orders.filter(o => o.orderStatus === 'Delivered');

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-slate-50">
        <div className="text-slate-500 font-bold animate-pulse flex items-center gap-2 text-sm">
          <RefreshCw className="h-4 w-4 animate-spin text-primary-500" />
          Loading deliveries...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 flex flex-col items-center py-6 px-4">
      {/* Mobile container wrapper */}
      <div className="w-full max-w-md space-y-6">
        
        {/* Profile header */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-primary-100 rounded-2xl flex items-center justify-center text-primary-600">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rider Companion</span>
              <h2 className="text-lg font-extrabold text-slate-900 leading-none mt-1">{staffName}</h2>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="p-2.5 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 border border-slate-100 hover:border-red-100 rounded-xl transition-colors"
            title="Log Out"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-slate-200/50 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'active'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Active Deliveries ({activeDeliveries.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'completed'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Completed ({completedDeliveries.length})
          </button>
        </div>

        {/* Deliveries Display */}
        {activeTab === 'active' ? (
          <div className="space-y-4">
            {activeDeliveries.length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center text-slate-400 space-y-2">
                <Truck className="h-8 w-8 mx-auto text-slate-300" />
                <p className="text-sm font-bold text-slate-500">No active delivery tasks</p>
                <p className="text-[10px]">Rest and wait. Once a restaurant owner assigns you an order, it will appear here.</p>
              </div>
            ) : (
              activeDeliveries.map((order) => (
                <div key={order._id} className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
                  
                  {/* Title & Amount */}
                  <div className="flex justify-between items-start pb-3 border-b border-slate-50">
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Restaurant Origin</span>
                      <h3 className="font-extrabold text-slate-800 text-sm">{order.restaurantId.name}</h3>
                      <span className="text-[9px] font-bold text-slate-400 mt-1 block">ID: #{order._id.substring(18)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-slate-900 block">₹{order.totalAmount}</span>
                      <span className="text-[9px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">COD</span>
                    </div>
                  </div>

                  {/* Customer & Address Details */}
                  <div className="space-y-2 text-xs font-medium text-slate-600">
                    <div>
                      <span className="text-slate-400 text-[9px] font-bold uppercase tracking-wider block mb-0.5">Deliver To</span>
                      <p className="font-extrabold text-slate-800">{order.customerId?.name || 'Customer'}</p>
                    </div>

                    <div className="flex items-start gap-2 pt-1">
                      <MapPin className="h-4.5 w-4.5 text-slate-400 flex-shrink-0" />
                      <p className="text-slate-500 font-semibold leading-relaxed leading-normal">{order.deliveryAddress}</p>
                    </div>
                  </div>

                  {/* Action buttons (Maps & Phone) */}
                  <div className="grid grid-cols-2 gap-3">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.deliveryAddress)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold"
                    >
                      <Navigation className="h-4.5 w-4.5 text-blue-500" /> Open Maps
                    </a>
                    <a
                      href={`tel:${order.customerId?.phone}`}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold"
                    >
                      <Phone className="h-4.5 w-4.5 text-green-500" /> Call Customer
                    </a>
                  </div>

                  {/* Secure Handshake OTP Form */}
                  <div className="bg-slate-50/50 p-4 border border-slate-200/50 rounded-2xl space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Lock className="h-3.5 w-3.5 text-slate-400" /> Confirm Handshake (4-digit OTP)
                    </label>
                    
                    {errorMap[order._id] && (
                      <p className="text-[10px] font-bold text-red-500">{errorMap[order._id]}</p>
                    )}
                    
                    {successMap[order._id] && (
                      <p className="text-[10px] font-extrabold text-green-600 flex items-center gap-0.5">
                        <Check className="h-3 w-3" /> {successMap[order._id]}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={4}
                        value={otpMap[order._id] || ''}
                        onChange={(e) => setOtpMap({ ...otpMap, [order._id]: e.target.value.replace(/\D/g, '') })}
                        className="flex-grow p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-500 text-center tracking-widest font-black text-sm w-full bg-white text-slate-900"
                        placeholder="••••"
                      />
                      <button
                        onClick={() => handleVerifyOtp(order._id)}
                        className="bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm"
                      >
                        Verify
                      </button>
                    </div>
                  </div>

                </div>
              ))
            )}
          </div>
        ) : (
          /* COMPLETED DELIVERIES TAB */
          <div className="space-y-3">
            {completedDeliveries.length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center text-slate-400">
                No deliveries completed yet.
              </div>
            ) : (
              completedDeliveries.map((order) => (
                <div key={order._id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center justify-between text-xs font-semibold">
                  <div>
                    <h4 className="font-extrabold text-slate-800">{order.customerId?.name}</h4>
                    <span className="text-[10px] text-slate-400 block mt-0.5">ID: #{order._id.substring(18)}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-slate-900 block">₹{order.totalAmount}</span>
                    <span className="text-[9px] font-black text-green-600 flex items-center gap-0.5 justify-end">
                      <CheckCircle className="h-3 w-3 inline text-green-500" /> Delivered
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}
