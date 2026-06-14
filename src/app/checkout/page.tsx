'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ShoppingBag, MapPin, CreditCard, ChevronRight, Check } from 'lucide-react';
import { useCart } from '@/context/CartContext';

interface UserProfile {
  name: string;
  savedAddresses: string[];
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, getCartTotal, restaurantId, restaurantName, clearCart } = useCart();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState('');

  // Address states
  const [selectedAddressIndex, setSelectedAddressIndex] = useState<number>(0);
  const [customAddress, setCustomAddress] = useState('');
  const [useCustomAddress, setUseCustomAddress] = useState(false);
  const [gpsCoordinates, setGpsCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  // Price calculations
  const subtotal = getCartTotal();
  const gst = Math.round(subtotal * 0.18);
  const deliveryFee = 40;
  const grandTotal = subtotal + gst + deliveryFee;

  useEffect(() => {
    // Try to load confirmed location from dashboard
    const savedLocation = localStorage.getItem('user_location');
    if (savedLocation) {
      try {
        const parsed = JSON.parse(savedLocation);
        if (parsed && parsed.address) {
          setCustomAddress(parsed.address);
          setUseCustomAddress(true);
        }
        if (parsed && parsed.lat && parsed.lng) {
          setGpsCoordinates({ lat: parsed.lat, lng: parsed.lng });
        }
      } catch (e) {
        console.error('Failed to parse saved location from localStorage:', e);
      }
    }

    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          if (!savedLocation) { // Only override if there is no confirmed session location
            if (data.user.savedAddresses && data.user.savedAddresses.length > 0) {
              setSelectedAddressIndex(0);
            } else {
              setUseCustomAddress(true);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load user info:', err);
      } finally {
        setLoading(false);
      }
    }

    if (cartItems.length > 0) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [cartItems]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    let deliveryAddress = '';
    if (useCustomAddress) {
      if (!customAddress.trim()) {
        setError('Please enter a delivery address.');
        return;
      }
      deliveryAddress = customAddress.trim();
      if (gpsCoordinates) {
        deliveryAddress += ` | GPS: ${gpsCoordinates.lat.toFixed(6)},${gpsCoordinates.lng.toFixed(6)}`;
      }
    } else {
      if (!user || !user.savedAddresses[selectedAddressIndex]) {
        setError('Please select an address.');
        return;
      }
      deliveryAddress = user.savedAddresses[selectedAddressIndex];
    }

    setPlacingOrder(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId,
          items: cartItems.map(item => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            isVeg: item.isVeg,
          })),
          totalAmount: grandTotal,
          deliveryAddress,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to place order');
      }

      // Clear the persistent cart
      clearCart();
      
      // Redirect to live tracking
      router.push(`/order/${data.orderId}`);
    } catch (err: any) {
      setError(err.message || 'Server error');
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 flex justify-center items-center h-[50vh]">
        <div className="text-slate-500 font-bold animate-pulse">Loading checkout details...</div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="mx-auto h-16 w-16 bg-slate-50 flex items-center justify-center rounded-full text-slate-400">
          <ShoppingBag className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-800">Your Cart is empty</h2>
        <p className="text-slate-500 text-sm">Add delicious items to proceed with checking out.</p>
        <Link
          href="/customer/dashboard"
          className="inline-flex items-center gap-1.5 px-6 py-3 rounded-xl bg-primary-600 text-white font-bold text-sm shadow-md hover:bg-primary-700 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Navigation Header */}
      <Link
        href={restaurantId ? `/customer/restaurant/${restaurantId}` : '/customer/dashboard'}
        className="inline-flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Restaurant Menu
      </Link>

      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
        Review Your Order
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Address and payment options (Left side) */}
        <form onSubmit={handlePlaceOrder} className="lg:col-span-2 space-y-6">
          
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
              {error}
            </div>
          )}

          {/* 1. Address Section */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary-500" />
              Delivery Address
            </h3>

            {user && user.savedAddresses.length > 0 && !useCustomAddress ? (
              <div className="space-y-3">
                {user.savedAddresses.map((addr, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedAddressIndex(idx)}
                    className={`p-4 border rounded-2xl cursor-pointer flex items-start gap-3 transition-all ${
                      selectedAddressIndex === idx
                        ? 'border-primary-500 bg-primary-50/10'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`mt-0.5 h-4 w-4 rounded-full flex items-center justify-center flex-shrink-0 border ${
                      selectedAddressIndex === idx ? 'border-primary-600 bg-primary-600' : 'border-slate-300'
                    }`}>
                      {selectedAddressIndex === idx && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Address Option {idx + 1}</p>
                      <p className="text-sm font-semibold text-slate-700 mt-1">{addr}</p>
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={() => setUseCustomAddress(true)}
                  className="text-xs font-bold text-primary-600 hover:text-primary-500"
                >
                  + Add a new delivery address
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <textarea
                  required
                  value={customAddress}
                  onChange={(e) => setCustomAddress(e.target.value)}
                  className="block w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-slate-900 text-sm leading-relaxed"
                  placeholder="Enter full flat address, street name, pincode, landmark..."
                  rows={3}
                />
                {user && user.savedAddresses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setUseCustomAddress(false)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800"
                  >
                    Cancel and use a saved address
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 2. Payment Section (Simulator) */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary-500" />
              Payment Method
            </h3>
            <div className="p-4 border border-primary-500 bg-primary-50/10 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Cash on Delivery (COD)</p>
                  <p className="text-xs text-slate-400">Pay directly to the restaurant rider</p>
                </div>
              </div>
              <Check className="h-5 w-5 text-primary-600" />
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Note: Decentralized orders support COD or restaurant-specific terminals handled by the merchant staff. Complete payment upon verification of the secure delivery OTP.
            </p>
          </div>

          {/* Checkout Button */}
          <button
            type="submit"
            disabled={placingOrder}
            className="w-full py-4 rounded-2xl bg-primary-600 text-white font-extrabold text-md shadow-lg shadow-primary-200 hover:bg-primary-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {placingOrder ? 'Processing Order...' : `Place Order (COD) • ₹${grandTotal}`}
            <ChevronRight className="h-5 w-5" />
          </button>

        </form>

        {/* Order Bill Summary (Right side) */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-slate-900 pb-3 border-b border-slate-100">
            Bill Summary
          </h3>

          <div className="divide-y divide-slate-50 max-h-56 overflow-y-auto pr-1">
            {cartItems.map((item) => (
              <div key={item.name} className="py-2.5 flex justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-800">{item.name}</span>
                  <span className="text-slate-400 block mt-0.5">₹{item.price} x {item.quantity}</span>
                </div>
                <span className="font-extrabold text-slate-700">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2 text-xs text-slate-500 font-semibold border-t border-slate-100 pt-4">
            <div className="flex justify-between">
              <span>Item Subtotal</span>
              <span className="text-slate-700">₹{subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span>GST (18%)</span>
              <span className="text-slate-700">₹{gst}</span>
            </div>
            <div className="flex justify-between">
              <span>Merchant Delivery Fee</span>
              <span className="text-slate-700">₹{deliveryFee}</span>
            </div>
            <div className="flex justify-between pt-4 border-t border-slate-100 text-sm font-black text-slate-900">
              <span>Grand Total</span>
              <span>₹{grandTotal}</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl text-[10px] text-slate-400 leading-normal">
            Ordering from <strong className="text-slate-600">{restaurantName || 'Restaurant'}</strong>. If you need modifications, please call the kitchen directly after placing.
          </div>
        </div>

      </div>
    </div>
  );
}
