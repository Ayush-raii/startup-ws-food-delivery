'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, SlidersHorizontal, Star, Clock, Heart, ArrowRight, ClipboardCheck } from 'lucide-react';

interface Restaurant {
  _id: string;
  name: string;
  bannerImage: string;
  cuisineTags: string[];
  status: string;
  menu: any[];
}

interface Order {
  _id: string;
  restaurantId: {
    _id: string;
    name: string;
  };
  totalAmount: number;
  orderStatus: string;
  createdAt: string;
}

export default function CustomerDashboard() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filterVeg, setFilterVeg] = useState(false);
  const [sortBy, setSortBy] = useState<'rating' | 'cost_asc' | 'cost_desc' | 'default'>('default');

  useEffect(() => {
    async function fetchData() {
      try {
        const [resRest, resOrders] = await Promise.all([
          fetch('/api/restaurants'),
          fetch('/api/orders')
        ]);

        if (resRest.ok) {
          const data = await resRest.json();
          setRestaurants(data.restaurants);
        }
        if (resOrders.ok) {
          const data = await resOrders.json();
          // Filter to show active/non-delivered orders first
          setActiveOrders(data.orders);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();

    // Poll active orders every 5 seconds for status updates
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Filter restaurants based on category and search query
  const filteredRestaurants = restaurants.filter((rest) => {
    const matchesSearch = rest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rest.cuisineTags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Category check
    let matchesCategory = true;
    if (selectedCategory !== 'All') {
      matchesCategory = rest.cuisineTags.some((tag) => tag.toLowerCase() === selectedCategory.toLowerCase());
    }

    return matchesSearch && matchesCategory;
  });

  const categories = ['All', 'North Indian', 'Gourmet Burgers', 'Mexican', 'Fast Food', 'Mughlai', 'Tandoor'];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-10">
      
      {/* Banner Carousel (Promo Block) */}
      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-md border border-orange-400/20 bg-gradient-to-br from-orange-500 via-orange-500 to-amber-500 text-white">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-0">
          {/* Text Content */}
          <div className="space-y-3 z-10 p-6 sm:p-10 flex-1">
            <span className="inline-block bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              🎉 Limited Time Offer
            </span>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black leading-tight tracking-tight">
              Free Delivery on your first order!
            </h1>
            <p className="text-white/80 font-medium text-sm">
              Directly dispatched by the kitchen's own staff for faster, fresher service.
            </p>
            <div className="pt-1">
              <button className="bg-white text-orange-600 font-bold px-5 py-2.5 rounded-xl hover:bg-orange-50 transition-all flex items-center gap-1.5 shadow-lg shadow-orange-900/20 text-sm">
                Explore Top Cuisines <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {/* Banner Image */}
          <div className="w-full sm:w-72 lg:w-80 flex-shrink-0 h-44 sm:h-56 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=600"
              alt="Delicious Food Collage"
              className="object-cover h-full w-full"
            />
          </div>
        </div>
      </div>


      {/* Main Content Area */}
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Popular Kitchens Near You
          </h2>
          
          {/* Search bar & Filter toggles */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-grow sm:flex-grow-0 sm:w-80">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-slate-800 text-sm shadow-sm"
                placeholder="Search restaurants or cuisines..."
              />
            </div>
          </div>
        </div>

        {/* Categories Scroller */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex-shrink-0 ${
                selectedCategory === cat
                  ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-100">
            <p className="text-slate-500 text-sm font-semibold">No kitchens found matching your filters.</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
              className="mt-4 text-xs font-bold text-primary-600 hover:text-primary-500 underline"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Restaurant Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRestaurants.map((restaurant) => (
              <Link
                href={`/customer/restaurant/${restaurant._id}`}
                key={restaurant._id}
                className="group bg-white rounded-2xl overflow-hidden border border-slate-100 hover:shadow-md transition-all flex flex-col h-full"
              >
                {/* Banner */}
                <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                  <img
                    src={restaurant.bannerImage}
                    alt={restaurant.name}
                    className="object-cover h-full w-full group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-black text-slate-800 shadow-sm">
                    4.4 ★
                  </div>
                </div>

                {/* Details */}
                <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary-600 transition-colors">
                      {restaurant.name}
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {restaurant.cuisineTags.map((tag) => (
                        <span key={tag} className="text-[10px] font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-50 flex items-center justify-between text-xs text-slate-500 font-medium">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>25-30 mins</span>
                    </div>
                    <span className="text-primary-600 font-extrabold flex items-center gap-0.5">
                      Order Now <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Orders Section - anchor for My Orders nav */}
      <div id="orders-section" className="scroll-mt-20">
        {/* Active Tracking Bar */}
        {activeOrders.length > 0 && activeOrders.some(o => o.orderStatus !== 'Delivered' && o.orderStatus !== 'Rejected') && (
          <div id="active-orders" className="bg-white border-l-4 border-primary-500 rounded-2xl shadow-sm p-4 sm:p-5 space-y-3 mb-6">
            <h3 className="text-md font-bold text-slate-800 flex items-center gap-1.5">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
              </span>
              Active Order Tracking
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeOrders
                .filter(o => o.orderStatus !== 'Delivered' && o.orderStatus !== 'Rejected')
                .map((order) => (
                  <div key={order._id} className="flex justify-between items-center p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{order.restaurantId.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Placed at {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${
                          order.orderStatus === 'Out for Delivery' ? 'bg-amber-100 text-amber-800' :
                          order.orderStatus === 'Preparing' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {order.orderStatus}
                        </span>
                        {order.orderStatus === 'Out for Delivery' && (
                          <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded animate-pulse">
                            OTP Generated
                          </span>
                        )}
                      </div>
                    </div>
                    <Link
                      href={`/order/${order._id}`}
                      className="flex-shrink-0 flex items-center gap-1 text-xs font-bold text-primary-600 hover:text-primary-500 transition-colors bg-white px-3 py-2 rounded-xl shadow-sm border border-slate-100 ml-2"
                    >
                      Track <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ))}
            </div>
          </div>
        )}
        {/* Order History */}
        {!loading && activeOrders.length > 0 && (
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
              <ClipboardCheck className="h-5 w-5 text-slate-400" />
              Order History
            </h3>
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden divide-y divide-slate-100">
              {activeOrders
                .filter(o => o.orderStatus === 'Delivered' || o.orderStatus === 'Rejected')
                .length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-sm">
                  No completed orders yet.
                </div>
              ) : (
                activeOrders
                  .filter(o => o.orderStatus === 'Delivered' || o.orderStatus === 'Rejected')
                  .map((order) => (
                    <div key={order._id} className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-800 truncate">{order.restaurantId.name}</span>
                          <span className={`flex-shrink-0 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide ${
                            order.orderStatus === 'Delivered' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
                          }`}>
                            {order.orderStatus}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 block mt-1">
                          {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                        <span className="text-sm font-extrabold text-slate-900">₹{order.totalAmount}</span>
                        <Link
                          href={`/order/${order._id}`}
                          className="text-xs font-bold text-slate-500 hover:text-slate-800 border border-slate-200 bg-white rounded-xl px-3 py-1.5 shadow-sm"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
