'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock, ShoppingBag, Plus, Minus, Info, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

interface MenuItem {
  _id: string;
  name: string;
  price: number;
  description: string;
  category: 'Starters' | 'Main Course' | 'Desserts';
  image: string;
  isAvailable: boolean;
  isVeg: boolean;
}

interface Restaurant {
  _id: string;
  name: string;
  bannerImage: string;
  cuisineTags: string[];
  status: string;
  menu: MenuItem[];
  latitude?: number;
  longitude?: number;
}

export default function RestaurantMenuPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [vegFilter, setVegFilter] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'All' | 'Starters' | 'Main Course' | 'Desserts'>('All');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  const { addToCart, updateQuantity, getItemQuantity, cartItems, getCartTotal, clearCart, restaurantId } = useCart();

  useEffect(() => {
    const saved = localStorage.getItem('user_location');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.lat && parsed.lng) {
          setUserCoords({ lat: parsed.lat, lng: parsed.lng });
        }
      } catch (e) {
        console.error('Failed to parse user location from localStorage:', e);
      }
    }
  }, []);

  useEffect(() => {
    async function fetchRestaurant() {
      try {
        const res = await fetch(`/api/restaurants/${id}`);
        if (res.ok) {
          const data = await res.json();
          setRestaurant(data.restaurant);
        }
      } catch (err) {
        console.error('Failed to fetch restaurant:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchRestaurant();
  }, [id]);

  // Distance calculation helper
  const getDistanceStr = () => {
    if (!restaurant) return '';
    const lat2 = restaurant.latitude !== undefined ? restaurant.latitude : 28.6139;
    const lng2 = restaurant.longitude !== undefined ? restaurant.longitude : 77.2090;

    const lat1 = userCoords ? userCoords.lat : 28.6139;
    const lng1 = userCoords ? userCoords.lng : 77.2090;

    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lng2 - lng1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return ` • ${d.toFixed(1)} km away`;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 flex justify-center items-center h-[50vh]">
        <div className="text-slate-500 font-bold animate-pulse">Loading menu...</div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <h2 className="text-xl font-bold text-slate-800">Restaurant not found</h2>
        <Link href="/customer/dashboard" className="text-primary-600 hover:underline mt-2 inline-block">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  // Filter menu items
  const filteredMenu = restaurant.menu.filter((item) => {
    if (vegFilter && !item.isVeg) return false;
    if (activeCategory !== 'All' && item.category !== activeCategory) return false;
    return true;
  });

  const categories: ('All' | 'Starters' | 'Main Course' | 'Desserts')[] = ['All', 'Starters', 'Main Course', 'Desserts'];

  // Categorize for grouped display
  const starters = filteredMenu.filter((i) => i.category === 'Starters');
  const mainCourses = filteredMenu.filter((i) => i.category === 'Main Course');
  const desserts = filteredMenu.filter((i) => i.category === 'Desserts');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8 items-start">
      
      {/* Menu / Core details (Left Side) */}
      <div className="flex-grow w-full lg:max-w-[calc(100%-24rem)] space-y-6">
        
        {/* Header Navigation */}
        <Link
          href="/customer/dashboard"
          className="inline-flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        {/* Restaurant Banner Card */}
        <div className="relative rounded-3xl overflow-hidden shadow-sm border border-slate-100 h-64 bg-slate-100">
          <img
            src={restaurant.bannerImage}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/35 to-transparent flex flex-col justify-end p-6 sm:p-8 text-white">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{restaurant.name}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs sm:text-sm font-semibold text-white/90">
              <div className="flex items-center gap-1.5">
                {restaurant.cuisineTags.map((tag) => (
                  <span key={tag} className="bg-white/20 px-2 py-0.5 rounded-md">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="h-3 w-px bg-white/30" />
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" /> <span>25-30 mins{getDistanceStr()}</span>
              </div>
              <div className="h-3 w-px bg-white/30" />
              <span>Free delivery by kitchen staff</span>
            </div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
          {/* Categories select pills */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 md:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeCategory === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Veg toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-600">
            <input
              type="checkbox"
              checked={vegFilter}
              onChange={(e) => setVegFilter(e.target.checked)}
              className="h-4 w-4 accent-green-600 rounded cursor-pointer"
            />
            Veg Only
          </label>
        </div>

        {/* Menu Listings Grouped */}
        <div className="space-y-10">
          
          {/* Starters Section */}
          {(activeCategory === 'All' || activeCategory === 'Starters') && starters.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight pb-2 border-b border-slate-100">
                Starters
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {starters.map((item) => (
                  <MenuCard key={item._id} item={item} />
                ))}
              </div>
            </div>
          )}

          {/* Main Course Section */}
          {(activeCategory === 'All' || activeCategory === 'Main Course') && mainCourses.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight pb-2 border-b border-slate-100">
                Main Course
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mainCourses.map((item) => (
                  <MenuCard key={item._id} item={item} />
                ))}
              </div>
            </div>
          )}

          {/* Desserts Section */}
          {(activeCategory === 'All' || activeCategory === 'Desserts') && desserts.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight pb-2 border-b border-slate-100">
                Desserts
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {desserts.map((item) => (
                  <MenuCard key={item._id} item={item} />
                ))}
              </div>
            </div>
          )}

          {filteredMenu.length === 0 && (
            <div className="text-center py-12 bg-white border border-slate-100 rounded-3xl text-slate-500 font-semibold text-sm">
              No menu items available under this category.
            </div>
          )}

        </div>

      </div>

      {/* Cart Summary Panel (Right Side, Sticky) */}
      <div className="w-full lg:w-96 flex-shrink-0 lg:sticky lg:top-24 bg-white border border-slate-100 rounded-3xl shadow-sm p-6 space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
            <ShoppingBag className="h-5 w-5 text-primary-500" />
            Your Cart
          </h3>
          {cartItems.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs font-semibold text-red-500 hover:text-red-700 flex items-center gap-0.5"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear
            </button>
          )}
        </div>

        {cartItems.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="mx-auto h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-slate-500">Cart is empty</p>
            <p className="text-xs text-slate-400">Choose tasty dishes to start your order!</p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Items Scroller */}
            <div className="max-h-64 overflow-y-auto space-y-4 pr-1">
              {cartItems.map((item) => (
                <div key={item.name} className="flex justify-between items-start gap-4">
                  <div className="flex-grow">
                    <div className="flex items-center gap-1.5">
                      <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                      <span className="text-xs font-bold text-slate-800">{item.name}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-bold block mt-0.5">₹{item.price} x {item.quantity}</span>
                  </div>
                  
                  {/* Qty controls */}
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/50 rounded-lg px-2 py-1 flex-shrink-0">
                    <button
                      onClick={() => updateQuantity(item.name, item.quantity - 1)}
                      className="text-slate-500 hover:text-slate-800 p-0.5"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-xs font-black text-slate-800 w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.name, item.quantity + 1)}
                      className="text-slate-500 hover:text-slate-800 p-0.5"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Receipt Summary */}
            <div className="pt-4 border-t border-slate-100 space-y-1.5 text-xs text-slate-500 font-medium">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-slate-700">₹{getCartTotal()}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery (Kitchen Staff)</span>
                <span className="font-bold text-slate-700">₹40</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-slate-50 text-sm font-extrabold text-slate-900">
                <span>Total Amount</span>
                <span>₹{getCartTotal() + 40}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Link
                href="/checkout"
                className="w-full flex justify-center items-center gap-1.5 py-3 rounded-xl bg-primary-600 text-white font-bold text-sm shadow-md hover:bg-primary-700 transition-colors"
              >
                Proceed to Checkout
              </Link>
              <div className="p-3 bg-primary-50/20 border border-primary-100 rounded-2xl flex gap-2">
                <Info className="h-4 w-4 text-primary-600 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-primary-800 leading-normal font-medium">
                  Deliveries are handled entirely by <strong>{restaurant.name}</strong>'s internal team. Fast-tracked and secure.
                </p>
              </div>
            </div>

          </div>
        )}
      </div>

    </div>
  );

  // Reusable sub-component menu card
  function MenuCard({ item }: { item: MenuItem }) {
    const qty = getItemQuantity(item.name);

    return (
      <div className="bg-white p-4 border border-slate-100 rounded-2xl hover:border-slate-200 transition-all flex justify-between gap-4 items-start shadow-sm shadow-slate-100/30">
        <div className="space-y-1.5 flex-grow">
          {/* Veg/Nonveg dot marker */}
          <div className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full border border-white flex-shrink-0 ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              {item.isVeg ? 'Veg' : 'Non-Veg'}
            </span>
          </div>
          <h4 className="text-md font-bold text-slate-900">{item.name}</h4>
          <span className="text-sm font-black text-slate-800 block">₹{item.price}</span>
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {item.description || 'No description available for this delicious menu option.'}
          </p>
        </div>

        {/* Item image and Add-button grid */}
        <div className="flex flex-col items-center gap-3 flex-shrink-0">
          <div className="h-20 w-20 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 shadow-inner">
            <img src={item.image} alt={item.name} className="object-cover h-full w-full" />
          </div>

          {item.isAvailable ? (
            qty > 0 ? (
              <div className="flex items-center gap-2.5 bg-slate-900 text-white rounded-xl px-2.5 py-1.5 shadow-sm">
                <button
                  onClick={() => updateQuantity(item.name, qty - 1)}
                  className="hover:text-primary-400 p-0.5 text-white"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="text-xs font-black w-4 text-center">{qty}</span>
                <button
                  onClick={() => addToCart(item, restaurant!._id, restaurant!.name)}
                  className="hover:text-primary-400 p-0.5 text-white"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => addToCart(item, restaurant!._id, restaurant!.name)}
                className="w-full flex items-center justify-center gap-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs px-3.5 py-2 rounded-xl shadow-sm transition-colors"
              >
                <Plus className="h-3 w-3 text-primary-500" /> ADD
              </button>
            )
          ) : (
            <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2.5 py-1.5 rounded-xl border border-red-100">
              OUT OF STOCK
            </span>
          )}
        </div>
      </div>
    );
  }
}
