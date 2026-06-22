'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Store, ShieldAlert, Phone, Check, RefreshCw } from 'lucide-react';

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
  restaurantRating?: number | null;
  deliveryRating?: number | null;
  createdAt: string;
  updatedAt: string;
}

export default function OrderTrackingPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

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
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-3xl p-6 flex gap-3 text-green-800">
                <Check className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-bold">Delivery Completed Successfully</h3>
                  <p className="text-xs text-green-700/90 leading-normal mt-1">
                    Your order has been validated and completed via secure handshake. Enjoy your food!
                  </p>
                </div>
              </div>

              {/* Order Rating Prompt */}
              {order.restaurantRating !== undefined && order.restaurantRating !== null &&
              order.deliveryRating !== undefined && order.deliveryRating !== null ? (
                <div className="bg-slate-55 text-slate-800 border border-slate-200/50 rounded-3xl p-6 space-y-2.5">
                  <h3 className="text-sm font-extrabold flex items-center gap-1">
                    <span className="text-green-600">✓</span> Feedback Submitted
                  </h3>
                  <p className="text-xs text-slate-500 leading-normal">
                    Thank you for your rating. Your feedback helps us maintain secure, high-quality, merchant-fleet delivery.
                  </p>
                  <div className="flex gap-4 text-xs font-semibold pt-1 text-slate-600">
                    <span className="flex items-center gap-1 font-bold">Kitchen: <span className="text-amber-500">{order.restaurantRating} ★</span></span>
                    <span className="flex items-center gap-1 font-bold">Rider: <span className="text-amber-500">{order.deliveryRating} ★</span></span>
                  </div>
                </div>
              ) : (
                <OrderRatingForm orderId={order._id} onSubmitted={fetchOrder} />
              )}
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

function OrderRatingForm({ orderId, onSubmitted }: { orderId: string; onSubmitted: () => void }) {
  const [restRating, setRestRating] = useState(0);
  const [delRating, setDelRating] = useState(0);
  const [hoverRest, setHoverRest] = useState(0);
  const [hoverDel, setHoverDel] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (restRating === 0 || delRating === 0) {
      setError('Please provide a rating for both the restaurant and the delivery rider.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantRating: restRating, deliveryRating: delRating }),
      });
      if (res.ok) {
        onSubmitted();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to submit ratings.');
      }
    } catch (err) {
      setError('Failed to submit ratings. Please check connection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-5">
      <div>
        <h3 className="text-sm font-extrabold text-slate-800">Submit Your Feedback</h3>
        <p className="text-[11px] text-slate-400 mt-0.5">Please rate the restaurant kitchen quality and the rider delivery promptness.</p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold leading-normal">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Restaurant rating */}
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Kitchen Quality
          </label>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRestRating(star)}
                onMouseEnter={() => setHoverRest(star)}
                onMouseLeave={() => setHoverRest(0)}
                className="focus:outline-none transition-transform active:scale-95"
              >
                <StarIcon filled={star <= (hoverRest || restRating)} size={28} />
              </button>
            ))}
            {restRating > 0 && (
              <span className="text-xs font-black text-slate-500 ml-2">{restRating}/5</span>
            )}
          </div>
        </div>

        {/* Rider rating */}
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Rider Delivery
          </label>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setDelRating(star)}
                onMouseEnter={() => setHoverDel(star)}
                onMouseLeave={() => setHoverDel(0)}
                className="focus:outline-none transition-transform active:scale-95"
              >
                <StarIcon filled={star <= (hoverDel || delRating)} size={28} />
              </button>
            ))}
            {delRating > 0 && (
              <span className="text-xs font-black text-slate-500 ml-2">{delRating}/5</span>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-xl shadow-md text-xs font-bold text-white bg-primary-650 hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          {submitting ? 'Submitting Feedback...' : 'Submit Ratings'}
        </button>
      </form>
    </div>
  );
}

function StarIcon({ filled, size = 24 }: { filled: boolean; size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={filled ? '#f59e0b' : 'none'}
      stroke={filled ? '#f59e0b' : '#cbd5e1'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: size, height: size }}
      className="transition-colors duration-150"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
