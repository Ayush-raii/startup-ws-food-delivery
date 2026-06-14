'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, SlidersHorizontal, Star, Clock, Heart, ArrowRight, ClipboardCheck, MapPin, Navigation } from 'lucide-react';

// Hero background image URL. Customize this URL to change the hero banner background image.
const HERO_BACKGROUND_IMAGE = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=1600';

// Helper functions for distance calculations
function getDistanceInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return Number(d.toFixed(1));
}

const RESTAURANT_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Royal India': { lat: 28.6139, lng: 77.2090 },      // Delhi center
  'The Burger Lab': { lat: 28.6250, lng: 77.2150 },    // 1.5 km North-East
  'Taco Fiesta': { lat: 28.5950, lng: 77.1950 },       // 2.5 km South-West
};

const getRestaurantCoords = (name: string, id: string) => {
  if (RESTAURANT_COORDINATES[name]) {
    return RESTAURANT_COORDINATES[name];
  }
  // Fallback unique but consistent coordinates based on ID string hash
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const latOffset = (hash % 100) / 1000;
  const lngOffset = ((hash >> 8) % 100) / 1000;
  return { lat: 28.6139 + latOffset, lng: 77.2090 + lngOffset };
};

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

  // Location Selector States
  const [selectedAddress, setSelectedAddress] = useState('Select your location');
  const [locationInput, setLocationInput] = useState('');
  const [userCoordinates, setUserCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('user_location');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.address) {
          setSelectedAddress(parsed.address);
          setLocationInput(parsed.address);
        }
        if (parsed.lat && parsed.lng) {
          setUserCoordinates({ lat: parsed.lat, lng: parsed.lng });
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoordinates({ lat: latitude, lng: longitude });
        const coordsStr = `GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
        setLocationInput(`Current Location: ${coordsStr}`);
      },
      (error) => {
        alert('Unable to retrieve your location: ' + error.message);
      }
    );
  };

  const handleConfirmLocation = () => {
    if (!locationInput.trim()) {
      alert('Please enter an address or locate yourself first.');
      return;
    }

    let coords = userCoordinates;
    if (!coords) {
      // Default to Center of Delhi if they manually typed and haven't used GPS
      coords = { lat: 28.6139, lng: 77.2090 };
    }

    const newLocation = {
      address: locationInput.trim(),
      lat: coords.lat,
      lng: coords.lng,
    };

    localStorage.setItem('user_location', JSON.stringify(newLocation));
    setSelectedAddress(newLocation.address);
    setUserCoordinates(coords);
    alert('Location confirmed and saved!');
  };

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

  const calculateDistance = (restName: string, restId: string) => {
    const restCoords = getRestaurantCoords(restName, restId);
    if (!userCoordinates) {
      // Return a simulated consistent distance if location isn't confirmed yet
      const hash = restId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return Number((1.5 + (hash % 4) + ((hash % 10) / 10)).toFixed(1));
    }
    return getDistanceInKm(userCoordinates.lat, userCoordinates.lng, restCoords.lat, restCoords.lng);
  };

  // Filter & Sort restaurants
  const processedRestaurants = restaurants
    .map(rest => {
      const distance = calculateDistance(rest.name, rest._id);
      return { ...rest, distance };
    })
    .filter((rest) => {
      const matchesSearch = rest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rest.cuisineTags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Category check
      let matchesCategory = true;
      if (selectedCategory !== 'All') {
        const hasCuisineTag = rest.cuisineTags.some((tag) => tag.toLowerCase() === selectedCategory.toLowerCase());
        const hasMenuItemCategory = rest.menu && rest.menu.some((item) => item.category?.toLowerCase() === selectedCategory.toLowerCase());
        matchesCategory = hasCuisineTag || hasMenuItemCategory;
      }

      return matchesSearch && matchesCategory;
    })
    // Sort by distance (recommend closest restaurant first)
    .sort((a, b) => a.distance - b.distance);

  const categories = ['All', 'Starters', 'Main Course', 'Desserts'];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-10">
      
      {/* Hero Banner Section */}
      <div 
        className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-md border border-slate-100 bg-cover bg-center h-36 sm:h-64"
        style={{ backgroundImage: `url(${HERO_BACKGROUND_IMAGE})` }}
      />

      {/* Location Selector Bar */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center flex-shrink-0">
            <MapPin className="h-5 w-5 text-orange-500 animate-bounce" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Deliver To</span>
            <p className="text-sm font-bold text-slate-800 truncate">
              {selectedAddress}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
            placeholder="Enter address manually..."
            className="flex-grow md:w-64 px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500 bg-slate-50 focus:bg-white text-slate-800"
          />
          <button
            onClick={handleGetCurrentLocation}
            className="flex items-center gap-1 px-3 py-2 border border-slate-200 hover:border-orange-500 rounded-xl text-xs font-bold text-slate-600 hover:text-orange-500 transition-colors"
            title="Use Current Location (GPS)"
          >
            <Navigation className="h-3.5 w-3.5 animate-pulse" /> Locate Me
          </button>
          <button
            onClick={handleConfirmLocation}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            Confirm
          </button>
        </div>
      </div>


      {/* Main Content Area */}
      <div id="restaurants-section" className="scroll-mt-24 space-y-4 sm:space-y-6">
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
        ) : processedRestaurants.length === 0 ? (
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {processedRestaurants.map((restaurant) => (
              <Link
                href={`/customer/restaurant/${restaurant._id}`}
                key={restaurant._id}
                className="group bg-white rounded-xl sm:rounded-2xl overflow-hidden border border-slate-100 hover:shadow-md transition-all flex flex-row sm:flex-col p-2.5 sm:p-0 gap-3 sm:gap-0 h-auto sm:h-full items-center sm:items-stretch"
              >
                {/* Banner */}
                <div className="relative w-24 h-24 sm:w-full sm:h-44 bg-slate-100 overflow-hidden rounded-lg sm:rounded-none flex-shrink-0">
                  <img
                    src={restaurant.bannerImage}
                    alt={restaurant.name}
                    className="object-cover h-full w-full group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-1.5 right-1.5 bg-white/95 backdrop-blur-sm px-1.5 py-0.5 rounded-full text-[9px] font-black text-slate-800 shadow-sm sm:top-3 sm:right-3 sm:px-2.5 sm:py-1 sm:text-[10px]">
                    4.4 ★
                  </div>
                </div>

                {/* Details */}
                <div className="flex-grow flex flex-col justify-between h-24 sm:h-auto py-1 sm:p-5 min-w-0 sm:space-y-4">
                  <div className="space-y-1 sm:space-y-1.5 min-w-0">
                    <h3 className="text-sm sm:text-lg font-bold text-slate-900 group-hover:text-primary-600 transition-colors truncate">
                      {restaurant.name}
                    </h3>
                    <div className="flex flex-wrap gap-1">
                      {restaurant.cuisineTags.slice(0, 2).map((tag) => (
                        <span key={tag} className="text-[9px] sm:text-[10px] font-semibold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                          {tag}
                        </span>
                      ))}
                      {restaurant.cuisineTags.length > 2 && (
                        <span className="text-[9px] sm:text-[10px] font-semibold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 sm:inline hidden">
                          +{restaurant.cuisineTags.length - 2}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-1.5 sm:pt-2 border-t border-slate-50 flex items-center justify-between text-[10px] sm:text-xs text-slate-500 font-medium">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-slate-400" />
                        <span>25-30 mins</span>
                      </div>
                      <div className="flex items-center gap-0.5 text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded font-bold">
                        <MapPin className="h-3 w-3" />
                        <span>{restaurant.distance} km</span>
                      </div>
                    </div>
                    <span className="text-primary-600 font-extrabold flex items-center gap-0.5">
                      Order <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
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
