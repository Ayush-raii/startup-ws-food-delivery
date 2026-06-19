'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, MapPin, Store, ShieldAlert, Phone, Check, RefreshCw } from 'lucide-react';

interface Order {
  _id: string;
  orderStatus: 'Placed' | 'Accepted' | 'Preparing' | 'Out for Delivery' | 'Delivered' | 'Rejected';
  totalAmount: number;
  deliveryAddress: string;
  deliveryOTP: string | null;
  items: { name: string; price: number; quantity: number }[];
  restaurantId: {
    name: string;
    bannerImage: string;
  };
  assignedStaffId?: {
    name: string;
    phone: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function OrderTrackingPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [nowTime, setNowTime] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getOrderTimerState = (orderCreatedAt: string) => {
    const elapsedMs = nowTime - new Date(orderCreatedAt).getTime();
    const elapsedSec = Math.floor(elapsedMs / 1000);
    const remainingSec = 600 - elapsedSec; // 10 minutes limit (600 seconds)

    const isUrgent = remainingSec > 0 && remainingSec <= 30; // 30 seconds or less
    const isExpired = remainingSec <= 0;

    const formattedTime = () => {
      if (remainingSec <= 0) {
        return `00:00`;
      } else {
        const mins = Math.floor(remainingSec / 60);
        const secs = remainingSec % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      }
    };

    return {
      remainingSec,
      isUrgent,
      isExpired,
      timeStr: formattedTime()
    };
  };

  async function fetchOrder() {
    try {
      const res = await fetch(`/api/orders/${id}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
      }
    } catch (err) {
      console.error('Failed to load order info:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrder();
    
    // Poll order details every 3 seconds for instant UI updates when driver verifies OTP or kitchen accepts
    const interval = setInterval(fetchOrder, 3000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 flex justify-center items-center h-[50vh]">
        <div className="text-slate-500 font-bold animate-pulse flex items-center gap-2">
          <RefreshCw className="h-5 w-5 animate-spin text-primary-500" />
          Loading tracker...
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <h2 className="text-xl font-bold text-slate-800">Order not found</h2>
        <Link href="/customer/dashboard" className="text-primary-600 hover:underline mt-2 inline-block">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  // Define steps
  const steps = [
    { label: 'Placed', description: 'Order sent to restaurant' },
    { label: 'Accepted', description: 'Restaurant confirmed order' },
    { label: 'Preparing', description: 'Chef is cooking your meal' },
    { label: 'Out for Delivery', description: 'Rider is carrying your meal' },
    { label: 'Delivered', description: 'Delivered securely via OTP' },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'Placed': return 0;
      case 'Accepted': return 1;
      case 'Preparing': return 2;
      case 'Out for Delivery': return 3;
      case 'Delivered': return 4;
      case 'Rejected': return -1;
      default: return 0;
    }
  };

  const currentStepIdx = getStepIndex(order.orderStatus);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Navigation */}
      <Link
        href="/customer/dashboard"
        className="inline-flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        
        {/* Status timeline (Left 2 cols) */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Order ID: #{order._id.substring(18)}</span>
                <h2 className="text-xl font-extrabold text-slate-950 mt-1">{order.restaurantId.name}</h2>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                order.orderStatus === 'Delivered' ? 'bg-green-50 border border-green-200 text-green-700' :
                order.orderStatus === 'Rejected' ? 'bg-red-50 border border-red-200 text-red-700' :
                'bg-primary-50 border border-primary-100 text-primary-700 animate-pulse'
              }`}>
                {order.orderStatus}
              </span>
            </div>

            {/* Live Countdown & Delay Alert */}
            {['Placed', 'Accepted', 'Preparing'].includes(order.orderStatus) && (() => {
              const timer = getOrderTimerState(order.createdAt);
              return (
                <div className="space-y-4">
                  {/* Timer Card */}
                  <div className="bg-slate-50 border border-slate-100 p-4.5 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary-500 animate-pulse" />
                      <div>
                        <span className="block text-xs font-extrabold text-slate-700">Estimated Preparation Time</span>
                        <span className="block text-[10px] font-bold text-slate-400">Order is being cooked fresh</span>
                      </div>
                    </div>
                    <span className="text-2xl font-black font-mono text-slate-800 tracking-wider">
                      {timer.timeStr}
                    </span>
                  </div>

                  {/* Polite Delay Notification Alert */}
                  {(timer.isUrgent || timer.isExpired) && (
                    <div className="bg-amber-50/70 border border-amber-200 p-4.5 rounded-2xl flex gap-3 text-amber-900 shadow-sm animate-pulse">
                      <span className="text-lg">⏳</span>
                      <div className="space-y-1">
                        <h4 className="text-xs font-black uppercase tracking-wider text-amber-800">Busy Kitchen Update</h4>
                        <p className="text-xs font-bold leading-normal text-amber-700">
                          We notice a slight delay in preparing your order. Our team is working to get it to you as quickly as possible. Your delivery may be a bit late. We apologize for the inconvenience! 🙏
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Timeline Progress */}
            {order.orderStatus === 'Rejected' ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm font-medium">
                We apologize, but the restaurant had to cancel your order. You will be refunded shortly.
              </div>
            ) : (
              <div className="relative pl-6 space-y-8 border-l border-slate-200 ml-4 py-2">
                {steps.map((step, idx) => {
                  const isDone = idx <= currentStepIdx;
                  const isActive = idx === currentStepIdx;
                  
                  return (
                    <div key={idx} className="relative">
                      {/* Timeline dot marker */}
                      <span className={`absolute -left-[35px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold ${
                        isDone
                          ? 'bg-primary-600 border-primary-600 text-white shadow-sm shadow-primary-200'
                          : 'bg-white border-slate-300 text-slate-400'
                      }`}>
                        {isDone ? <Check className="h-3 w-3" /> : idx + 1}
                      </span>
                      
                      {/* Description */}
                      <div className="ml-2">
                        <h4 className={`text-sm font-bold ${isActive ? 'text-primary-600' : isDone ? 'text-slate-800' : 'text-slate-400'}`}>
                          {step.label}
                        </h4>
                        <p className={`text-xs mt-0.5 ${isActive ? 'text-slate-600' : isDone ? 'text-slate-500' : 'text-slate-400'}`}>
                          {step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>

          {/* Secure Handshake Delivery OTP Component */}
          {order.orderStatus === 'Out for Delivery' && order.deliveryOTP && (
            <div className="bg-gradient-to-r from-primary-500 to-amber-500 text-white rounded-3xl p-6 sm:p-8 shadow-md flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center sm:text-left">
                <h3 className="text-lg font-black tracking-tight flex items-center gap-1.5 justify-center sm:justify-start">
                  Secure Handshake OTP
                </h3>
                <p className="text-xs text-white/90 leading-relaxed max-w-sm">
                  Give this OTP to the rider *only* after they have handed you your fresh, warm delivery.
                </p>
              </div>
              <div className="bg-white/20 border-2 border-white/25 rounded-2xl px-6 py-4 text-center flex-shrink-0">
                <span className="text-xs font-bold block uppercase tracking-widest text-white/80">Rider OTP</span>
                <span className="text-4xl font-extrabold tracking-widest mt-1 block">{order.deliveryOTP}</span>
              </div>
            </div>
          )}

          {/* Delivered Status Note */}
          {order.orderStatus === 'Delivered' && (
            <div className="bg-green-50 border border-green-200 rounded-3xl p-6 flex gap-3 text-green-800">
              <Check className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-bold">Delivery Completed Successfully</h3>
                <p className="text-xs text-green-700/90 leading-normal mt-1">
                  Your order has been validated and completed via secure handshake. Enjoy your food!
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Info panel (Right side) */}
        <div className="space-y-6">
          
          {/* Driver details */}
          {order.assignedStaffId ? (
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-50 pb-2">
                Your Merchant Delivery Rider
              </h3>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-bold text-slate-800">{order.assignedStaffId.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Restaurant Internal Fleet</p>
                </div>
                <a
                  href={`tel:${order.assignedStaffId.phone}`}
                  className="h-10 w-10 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100"
                >
                  <Phone className="h-4 w-4" />
                </a>
              </div>
            </div>
          ) : (
            order.orderStatus !== 'Delivered' && order.orderStatus !== 'Rejected' && (
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-2">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-50 pb-2">
                  Delivery Details
                </h3>
                <p className="text-xs text-slate-500 leading-normal">
                  The restaurant is preparing your food. They will assign one of their internal staff riders to dispatch it shortly.
                </p>
              </div>
            )
          )}

          {/* Address */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-slate-400" />
              Delivery Destination
            </h3>
            <p className="text-xs font-semibold text-slate-600 leading-relaxed">
              {order.deliveryAddress}
            </p>
          </div>

          {/* Item Receipt */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-50">
              Receipt Items
            </h3>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between text-xs font-semibold text-slate-600">
                  <span>{item.name} <span className="text-slate-400">x{item.quantity}</span></span>
                  <span className="text-slate-700">₹{item.price * item.quantity}</span>
                </div>
              ))}
              <div className="border-t border-slate-50 pt-3 flex justify-between text-xs font-bold text-slate-800">
                <span>Grand Total</span>
                <span className="text-primary-600 font-extrabold">₹{order.totalAmount}</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
