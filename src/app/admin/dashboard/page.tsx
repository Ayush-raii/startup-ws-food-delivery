'use client';

import React, { useEffect, useState } from 'react';
import { ShieldAlert, Store, TrendingUp, DollarSign, Plus, Check, Ban, Trash2, ArrowUpDown, RefreshCw, X, PlusCircle, Phone, Settings } from 'lucide-react';

interface RestaurantMetric {
  _id: string;
  name: string;
  bannerImage: string;
  cuisineTags: string[];
  status: 'active' | 'inactive' | 'pending';
  owner: {
    name: string;
    email: string;
    phone?: string;
  };
  stats: {
    totalOrders: number;
    totalRevenue: number;
    commission: number;
  };
}

export default function AdminDashboard() {
  const [restaurants, setRestaurants] = useState<RestaurantMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'restaurants' | 'delivery'>('restaurants');

  // Delivery Config settings states
  const [freeDistance, setFreeDistance] = useState<number | string>(4);
  const [baseFee, setBaseFee] = useState<number | string>(40);
  const [ratePerKm, setRatePerKm] = useState<number | string>(10);
  const [updatingConfig, setUpdatingConfig] = useState(false);

  // Create Restaurant Modal Form States
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRestName, setNewRestName] = useState('');
  const [newRestBanner, setNewRestBanner] = useState('');
  const [newRestCuisines, setNewRestCuisines] = useState('');
  const [newRestPhone, setNewRestPhone] = useState('');
  const [creating, setCreating] = useState(false);

  // Sorting State
  const [sortBy, setSortBy] = useState<'name' | 'orders' | 'revenue' | 'commission'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // CSV Export & Deep-Dive Modal States
  const [exporting, setExporting] = useState(false);
  const [selectedRestId, setSelectedRestId] = useState<string | null>(null);
  const [selectedRestName, setSelectedRestName] = useState<string>('');
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [modalOrders, setModalOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [modalSearch, setModalSearch] = useState('');

  const handleDownloadCSV = async () => {
    setExporting(true);
    try {
      window.location.href = '/api/admin/reports/export';
    } catch (err) {
      console.error('CSV download error:', err);
      alert('Failed to download report.');
    } finally {
      setTimeout(() => setExporting(false), 2000);
    }
  };

  const handleViewRestaurantOrders = async (id: string, name: string) => {
    setSelectedRestId(id);
    setSelectedRestName(name);
    setShowOrdersModal(true);
    setLoadingOrders(true);
    setModalOrders([]);
    setModalSearch('');
    try {
      const res = await fetch(`/api/admin/restaurants/${id}/orders`);
      const data = await res.json();
      if (res.ok) {
        setModalOrders(data.orders || []);
      } else {
        alert(data.error || 'Failed to fetch restaurant orders.');
      }
    } catch (e) {
      console.error('Error fetching restaurant orders:', e);
      alert('Failed to retrieve orders.');
    } finally {
      setLoadingOrders(false);
    }
  };

  const filteredModalOrders = modalOrders.filter((order: any) => {
    const searchLower = modalSearch.toLowerCase();
    const customerName = (order.customerId?.name || '').toLowerCase();
    const orderStatus = (order.orderStatus || '').toLowerCase();
    const orderId = (order._id || '').toLowerCase();
    return customerName.includes(searchLower) || orderStatus.includes(searchLower) || orderId.includes(searchLower);
  });

  const fetchAdminData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/admin/restaurants');
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch admin dashboard statistics.');
      }
      setRestaurants(data.restaurants || []);
    } catch (err: any) {
      setError(err.message || 'Server error loading analytics.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveryConfig = async () => {
    try {
      const res = await fetch('/api/settings/delivery');
      if (res.ok) {
        const data = await res.json();
        setFreeDistance(data.config.deliveryFreeDistance);
        setBaseFee(data.config.deliveryBaseFee);
        setRatePerKm(data.config.deliveryRatePerKm);
      }
    } catch (e) {
      console.error('Failed to fetch delivery settings:', e);
    }
  };

  const handleUpdateDeliveryConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingConfig(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/settings/delivery', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryFreeDistance: Number(freeDistance) || 0,
          deliveryBaseFee: Number(baseFee) || 0,
          deliveryRatePerKm: Number(ratePerKm) || 0
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update delivery settings');
      }
      setSuccess('Delivery rates configuration updated successfully!');
      fetchDeliveryConfig();
    } catch (err: any) {
      setError(err.message || 'Settings update failed.');
    } finally {
      setUpdatingConfig(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
    fetchDeliveryConfig();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: 'active' | 'inactive') => {
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/admin/restaurants/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update restaurant status.');
      }
      setSuccess(`Updated status for "${data.restaurant.name}" successfully!`);
      fetchAdminData(true);
    } catch (err: any) {
      setError(err.message || 'Status update failed.');
    }
  };

  const handleDeleteRestaurant = async (id: string, name: string) => {
    if (!confirm(`Are you absolutely sure you want to permanently remove "${name}"? This action cannot be undone.`)) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/admin/restaurants/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to remove restaurant.');
      }
      setSuccess(`Removed restaurant "${name}" successfully!`);
      fetchAdminData(true);
    } catch (err: any) {
      setError(err.message || 'Deletion failed.');
    }
  };

  const handleCreateRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!newRestName.trim()) {
      alert('Restaurant name is required.');
      return;
    }
    setCreating(true);
    try {
      const cuisines = newRestCuisines
        .split(',')
        .map((c) => c.trim())
        .filter((c) => c !== '');

      const res = await fetch('/api/admin/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRestName.trim(),
          bannerImage: newRestBanner.trim() || undefined,
          cuisineTags: cuisines,
          ownerPhone: newRestPhone.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create restaurant.');
      }

      setSuccess(`Created restaurant "${data.restaurant.name}" successfully!`);
      setShowAddModal(false);
      setNewRestName('');
      setNewRestBanner('');
      setNewRestCuisines('');
      setNewRestPhone('');
      fetchAdminData(true);
    } catch (err: any) {
      setError(err.message || 'Creation failed.');
    } finally {
      setCreating(false);
    }
  };

  // Sort logic
  const handleSort = (field: 'name' | 'orders' | 'revenue' | 'commission') => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  const sortedRestaurants = [...restaurants].sort((a, b) => {
    let valA: any = a.name.toLowerCase();
    let valB: any = b.name.toLowerCase();

    if (sortBy === 'orders') {
      valA = a.stats.totalOrders;
      valB = b.stats.totalOrders;
    } else if (sortBy === 'revenue') {
      valA = a.stats.totalRevenue;
      valB = b.stats.totalRevenue;
    } else if (sortBy === 'commission') {
      valA = a.stats.commission;
      valB = b.stats.commission;
    }

    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Gross Platform Calculations
  const grossStats = restaurants.reduce(
    (acc, cur) => {
      acc.totalRevenue += cur.stats.totalRevenue;
      acc.totalCommission += cur.stats.commission;
      return acc;
    },
    { totalRevenue: 0, totalCommission: 0 }
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 flex justify-center items-center h-[50vh]">
        <div className="text-slate-500 font-bold animate-pulse flex items-center gap-2 text-sm">
          <RefreshCw className="h-4 w-4 animate-spin text-amber-500" />
          Loading Administrative Controls...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl text-white">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-500/20">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Global Platform Infrastructure</span>
            <h1 className="text-2xl font-black mt-0.5">Administrative Dashboard</h1>
          </div>
        </div>

        <div className="flex gap-2.5 w-full sm:w-auto">
          <button
            onClick={handleDownloadCSV}
            disabled={exporting}
            className="bg-slate-800 hover:bg-slate-700 text-amber-550 border border-slate-750 font-bold text-xs px-4 py-3 rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <TrendingUp className="h-4.5 w-4.5" /> {exporting ? 'Downloading...' : 'Download CSV Report'}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-4 py-3 rounded-xl flex items-center gap-1.5 shadow-lg shadow-amber-500/10 transition-colors whitespace-nowrap"
          >
            <Plus className="h-4.5 w-4.5" /> Add New Restaurant
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold">
          {success}
        </div>
      )}

      {/* Global Metrics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Restaurants */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Registered Brands</span>
            <Store className="h-5 w-5 text-indigo-500" />
          </div>
          <div>
            <span className="block text-2xl font-black text-slate-850">{restaurants.length}</span>
            <span className="block text-xs font-bold text-slate-400 mt-1">
              Active: {restaurants.filter(r => r.status === 'active').length} | Pending: {restaurants.filter(r => r.status === 'pending').length}
            </span>
          </div>
        </div>

        {/* Gross Platforms Revenue */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Gross platform Sales</span>
            <TrendingUp className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <span className="block text-2xl font-black text-slate-850">₹{grossStats.totalRevenue.toLocaleString()}</span>
            <span className="block text-xs font-bold text-slate-400 mt-1">Delivered order transactions globally</span>
          </div>
        </div>

        {/* Platform Commission Generated */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-2 bg-gradient-to-r from-amber-500/5 to-amber-500/0 border-l-4 border-l-amber-500">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-black text-amber-600 uppercase tracking-wider">Total platform commission</span>
            <DollarSign className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <span className="block text-2xl font-black text-slate-850">₹{grossStats.totalCommission.toLocaleString()}</span>
            <span className="block text-xs font-bold text-slate-400 mt-1">10% Platform fee collected from merchants</span>
          </div>
        </div>
      </div>

      {/* Tab selection switcher */}
      <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => { setActiveTab('restaurants'); setError(''); setSuccess(''); }}
          className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === 'restaurants'
            ? 'bg-white text-slate-900 shadow-sm font-extrabold'
            : 'text-slate-500 hover:text-slate-800'
            }`}
        >
          <Store className="h-4 w-4" /> Restaurants & Merchants ({restaurants.length})
        </button>
        <button
          onClick={() => { setActiveTab('delivery'); setError(''); setSuccess(''); }}
          className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === 'delivery'
            ? 'bg-white text-slate-900 shadow-sm font-extrabold'
            : 'text-slate-500 hover:text-slate-800'
            }`}
        >
          <Settings className="h-4 w-4" /> Delivery Rate Config
        </button>
      </div>

      {activeTab === 'restaurants' && (
        <>
          {restaurants.filter(r => r.status === 'pending').length > 0 && (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                <h2 className="text-xs font-black text-amber-500 uppercase tracking-widest">Pending Registration Requests</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {restaurants.filter(r => r.status === 'pending').map((rest) => (
                  <div key={rest._id} className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between hover:border-slate-700 transition-all">
                    <div className="space-y-3">
                      <div className="flex gap-3 items-center">
                        <div className="h-12 w-16 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 flex-shrink-0">
                          <img src={rest.bannerImage} alt={rest.name} className="object-cover h-full w-full" onError={(e) => { (e.target as any).src = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1200' }} />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-white text-sm leading-tight">{rest.name}</h4>
                          <span className="text-[10px] text-slate-450 font-bold block mt-1">ID: #{rest._id.substring(18)}</span>
                        </div>
                      </div>
                      <div className="bg-slate-900/50 p-3 rounded-xl space-y-1 text-[11px]">
                        <span className="block text-slate-400 font-bold uppercase tracking-wider text-[9px]">Merchant Owner</span>
                        <div className="text-white font-extrabold">{rest.owner.name}</div>
                        <div className="text-slate-450 truncate">{rest.owner.email}</div>
                      </div>
                    </div>
                    <div className="flex gap-2.5 pt-2 border-t border-slate-800/60 justify-end">
                      <button
                        onClick={() => handleUpdateStatus(rest._id, 'active')}
                        className="bg-green-600 hover:bg-green-700 text-white font-black text-[10px] tracking-wider uppercase px-3 py-2 rounded-xl flex items-center gap-1 shadow-sm transition-all"
                        title="Allow Restaurant Access"
                      >
                        <Check className="h-3.5 w-3.5" /> Allow Access
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(rest._id, 'inactive')}
                        className="bg-red-600 hover:bg-red-700 text-white font-black text-[10px] tracking-wider uppercase px-3 py-2 rounded-xl flex items-center gap-1 shadow-sm transition-all"
                        title="Deny Restaurant"
                      >
                        <Ban className="h-3.5 w-3.5" /> Deny
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Table Panel */}
          <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-extrabold text-slate-800 text-sm">Active & Pending Merchant Listings</h3>
              <button
                onClick={() => fetchAdminData(true)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
                title="Refresh Analytics Table"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-slate-600 font-semibold text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th onClick={() => handleSort('name')} className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-1">Restaurant name <ArrowUpDown className="h-3 w-3" /></div>
                    </th>
                    <th className="px-6 py-4">Owner details</th>
                    <th className="px-6 py-4">Status</th>
                    <th onClick={() => handleSort('orders')} className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-1">Orders <ArrowUpDown className="h-3 w-3" /></div>
                    </th>
                    <th onClick={() => handleSort('revenue')} className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-1">Revenue <ArrowUpDown className="h-3 w-3" /></div>
                    </th>
                    <th onClick={() => handleSort('commission')} className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-1">10% Commission <ArrowUpDown className="h-3 w-3" /></div>
                    </th>
                    <th className="px-6 py-4 text-right">Oversight Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedRestaurants.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400 font-bold">
                        No restaurant listings found. Add a merchant to begin tracking.
                      </td>
                    </tr>
                  ) : (
                    sortedRestaurants.map((rest) => (
                      <tr key={rest._id} className="hover:bg-slate-50/50 transition-colors">
                        {/* Brand Banner + Name */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-16 rounded-lg overflow-hidden bg-slate-50 border border-slate-100 flex-shrink-0">
                              <img src={rest.bannerImage} alt={rest.name} className="object-cover h-full w-full" onError={(e) => { (e.target as any).src = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1200' }} />
                            </div>
                            <div>
                              <span className="font-extrabold text-slate-800 text-sm block leading-none">{rest.name}</span>
                              <span className="text-[9px] text-slate-400 font-medium block mt-1">ID: #{rest._id.substring(18)}</span>
                            </div>
                          </div>
                        </td>

                        {/* Owner Details */}
                        <td className="px-6 py-4">
                          <div className="space-y-0.5">
                            <span className="text-slate-800 block font-bold text-xs">{rest.owner.name}</span>
                            <span className="text-[10px] text-slate-450 font-medium block">{rest.owner.email}</span>
                            {rest.owner.phone && (
                              <span className="text-[10px] text-slate-450 font-semibold flex items-center gap-1">
                                <Phone className="h-3 w-3 text-slate-400" /> {rest.owner.phone}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status badge */}
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${rest.status === 'active' ? 'bg-green-50 border-green-200 text-green-700' :
                            rest.status === 'pending' ? 'bg-orange-50 border-orange-200 text-orange-700 animate-pulse' :
                              'bg-slate-100 border-slate-200 text-slate-600'
                            }`}>
                            {rest.status}
                          </span>
                        </td>

                        {/* Orders count */}
                        <td className="px-6 py-4 text-slate-700 font-bold text-sm">
                          <button
                            onClick={() => handleViewRestaurantOrders(rest._id, rest.name)}
                            className="text-amber-600 hover:text-amber-500 underline font-black text-left focus:outline-none"
                            title={`Click to view all orders for ${rest.name}`}
                          >
                            {rest.stats.totalOrders}
                          </button>
                        </td>

                        {/* Gross Revenue */}
                        <td className="px-6 py-4 text-slate-900 font-black text-sm">
                          ₹{rest.stats.totalRevenue.toLocaleString()}
                        </td>

                        {/* 10% commission */}
                        <td className="px-6 py-4 text-amber-600 font-black text-sm">
                          ₹{rest.stats.commission.toLocaleString()}
                        </td>

                        {/* Control Buttons */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex gap-2.5 justify-end">
                            {/* Approve Accept for Pending */}
                            {rest.status === 'pending' && (
                              <div className="flex gap-1.5 justify-end">
                                <button
                                  onClick={() => handleUpdateStatus(rest._id, 'active')}
                                  className="bg-green-600 hover:bg-green-700 text-white font-black text-[10px] tracking-wider uppercase px-2 py-1.5 rounded-lg flex items-center gap-1 shadow-sm transition-colors"
                                  title="Allow Access to Merchant Store"
                                >
                                  <Check className="h-3 w-3" /> Access
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(rest._id, 'inactive')}
                                  className="bg-red-600 hover:bg-red-700 text-white font-black text-[10px] tracking-wider uppercase px-2 py-1.5 rounded-lg flex items-center gap-1 shadow-sm transition-colors"
                                  title="Deny Merchant Store"
                                >
                                  <Ban className="h-3 w-3" /> Deny
                                </button>
                              </div>
                            )}

                            {/* Block/Deactivate for Active */}
                            {rest.status === 'active' && (
                              <button
                                onClick={() => handleUpdateStatus(rest._id, 'inactive')}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 font-bold text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1"
                                title="Deactivate Store"
                              >
                                <Ban className="h-3 w-3 text-red-500" /> Deactivate
                              </button>
                            )}

                            {/* Reactivate for Inactive */}
                            {rest.status === 'inactive' && (
                              <button
                                onClick={() => handleUpdateStatus(rest._id, 'active')}
                                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1"
                                title="Re-activate Store"
                              >
                                <Check className="h-3 w-3 text-green-400" /> Activate
                              </button>
                            )}

                            {/* Delete Store */}
                            <button
                              onClick={() => handleDeleteRestaurant(rest._id, rest.name)}
                              className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 p-1.5 rounded-lg"
                              title="Permanently Remove Store"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Grid/Card View */}
            <div className="block md:hidden divide-y divide-slate-100">
              {sortedRestaurants.length === 0 ? (
                <div className="text-center py-12 text-slate-400 font-bold text-xs">
                  No restaurant listings found. Add a merchant to begin tracking.
                </div>
              ) : (
                sortedRestaurants.map((rest) => (
                  <div key={rest._id} className="p-5 space-y-4">
                    {/* Brand and Status */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-14 rounded-lg overflow-hidden bg-slate-50 border border-slate-100 flex-shrink-0">
                          <img src={rest.bannerImage} alt={rest.name} className="object-cover h-full w-full" onError={(e) => { (e.target as any).src = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1200' }} />
                        </div>
                        <div>
                          <span className="font-extrabold text-slate-850 text-sm block leading-none">{rest.name}</span>
                          <span className="text-[9px] text-slate-400 font-medium block mt-1">ID: #{rest._id.substring(18)}</span>
                        </div>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${rest.status === 'active' ? 'bg-green-50 border-green-200 text-green-700' :
                        rest.status === 'pending' ? 'bg-orange-50 border-orange-200 text-orange-700 animate-pulse' :
                          'bg-slate-100 border-slate-200 text-slate-600'
                        }`}>
                        {rest.status}
                      </span>
                    </div>

                    {/* Owner details */}
                    <div className="bg-slate-50/70 p-3 rounded-xl text-slate-600 space-y-0.5">
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Owner Details</div>
                      <div className="font-bold text-slate-850 text-xs">{rest.owner.name}</div>
                      <div className="text-[10px] text-slate-500 font-medium">{rest.owner.email}</div>
                      {rest.owner.phone && (
                        <div className="text-[10px] text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
                          <Phone className="h-3 w-3 text-slate-400" /> {rest.owner.phone}
                        </div>
                      )}
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 text-center bg-slate-50/40 p-2.5 rounded-xl border border-slate-100/50">
                      <div>
                        <span className="block text-[8px] font-black text-slate-400 uppercase tracking-wider">Orders</span>
                        <button
                          onClick={() => handleViewRestaurantOrders(rest._id, rest.name)}
                          className="block text-amber-600 hover:text-amber-500 underline font-black text-xs mt-0.5 mx-auto focus:outline-none"
                          title={`Click to view all orders for ${rest.name}`}
                        >
                          {rest.stats.totalOrders}
                        </button>
                      </div>
                      <div>
                        <span className="block text-[8px] font-black text-slate-400 uppercase tracking-wider">Revenue</span>
                        <span className="block text-slate-950 font-black text-xs mt-0.5">₹{rest.stats.totalRevenue.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] font-black text-slate-450 uppercase tracking-wider">Commission</span>
                        <span className="block text-amber-600 font-black text-xs mt-0.5">₹{rest.stats.commission.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Control Actions */}
                    <div className="flex gap-2 justify-end pt-1">
                      {/* Approve Accept/Deny for Pending */}
                      {rest.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(rest._id, 'active')}
                            className="bg-green-600 hover:bg-green-700 text-white font-black text-[10px] tracking-wider uppercase px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow-sm"
                            title="Allow Access to Merchant Store"
                          >
                            <Check className="h-3 w-3" /> Access
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(rest._id, 'inactive')}
                            className="bg-red-600 hover:bg-red-700 text-white font-black text-[10px] tracking-wider uppercase px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow-sm"
                            title="Deny Merchant Store"
                          >
                            <Ban className="h-3 w-3" /> Deny
                          </button>
                        </>
                      )}

                      {/* Block/Deactivate for Active */}
                      {rest.status === 'active' && (
                        <button
                          onClick={() => handleUpdateStatus(rest._id, 'inactive')}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 font-bold text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1"
                          title="Deactivate Store"
                        >
                          <Ban className="h-3 w-3 text-red-500" /> Deactivate
                        </button>
                      )}

                      {/* Reactivate for Inactive */}
                      {rest.status === 'inactive' && (
                        <button
                          onClick={() => handleUpdateStatus(rest._id, 'active')}
                          className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1"
                          title="Re-activate Store"
                        >
                          <Check className="h-3 w-3 text-green-400" /> Activate
                        </button>
                      )}

                      {/* Delete Store */}
                      <button
                        onClick={() => handleDeleteRestaurant(rest._id, rest.name)}
                        className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 p-1.5 rounded-lg"
                        title="Permanently Remove Store"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'delivery' && (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6 max-w-xl">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Settings className="h-5 w-5 text-amber-500" />
              Delivery Rates Configuration
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-normal font-semibold">
              Adjust parameters below to dynamically calculate delivery fees for customer orders based on GPS distance to the kitchen.
            </p>
          </div>

          <form onSubmit={handleUpdateDeliveryConfig} className="space-y-4 text-xs font-semibold text-slate-600">
            <div>
              <label className="block text-slate-450 text-[10px] font-bold uppercase tracking-wider mb-1">
                Free Delivery Distance Limit (KM)
              </label>
              <input
                type="number"
                required
                min={0}
                value={freeDistance}
                onChange={(e) => { const v = e.target.value; setFreeDistance(v === '' ? '' : Number(v)); }}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 text-sm font-semibold"
                placeholder="e.g. 4"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block font-medium">
                Deliveries within this radius are completely free (₹0).
              </span>
            </div>

            <div>
              <label className="block text-slate-455 text-[10px] font-bold uppercase tracking-wider mb-1">
                Base Delivery Fee (INR)
              </label>
              <input
                type="number"
                required
                min={0}
                value={baseFee}
                onChange={(e) => { const v = e.target.value; setBaseFee(v === '' ? '' : Number(v)); }}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 text-sm font-semibold"
                placeholder="e.g. 40"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block font-medium">
                Standard charge applied to orders outside the free delivery range.
              </span>
            </div>

            <div>
              <label className="block text-slate-455 text-[10px] font-bold uppercase tracking-wider mb-1">
                Additional Rate per KM (INR)
              </label>
              <input
                type="number"
                required
                min={0}
                value={ratePerKm}
                onChange={(e) => { const v = e.target.value; setRatePerKm(v === '' ? '' : Number(v)); }}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 text-sm font-semibold"
                placeholder="e.g. 10"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block font-medium">
                Extra charge added per additional kilometer beyond the free limit.
              </span>
            </div>

            <button
              type="submit"
              disabled={updatingConfig}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-5 py-3 rounded-xl shadow-md disabled:opacity-50 transition-colors"
            >
              {updatingConfig ? 'Updating settings...' : 'Save Configuration'}
            </button>
          </form>
        </div>
      )}

      {/* CREATE BRAND MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden border border-slate-100 flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-extrabold text-slate-900 text-base">Add New Merchant Brand</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="h-8 w-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-sm"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleCreateRestaurant} className="p-6 space-y-4 text-xs font-semibold text-slate-600">
              <div>
                <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Restaurant Name *</label>
                <input
                  type="text"
                  required
                  value={newRestName}
                  onChange={(e) => setNewRestName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 text-sm font-semibold"
                  placeholder="e.g. Tasty Pizza Hub"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Banner Image URL</label>
                <input
                  type="text"
                  value={newRestBanner}
                  onChange={(e) => setNewRestBanner(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 text-sm"
                  placeholder="https://images.unsplash.com/photo-..."
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Cuisines (Comma-separated)</label>
                <input
                  type="text"
                  value={newRestCuisines}
                  onChange={(e) => setNewRestCuisines(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 text-sm font-semibold"
                  placeholder="e.g. Pizza, Italian, Fast Food"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Owner / Restaurant Phone Number</label>
                <input
                  type="text"
                  value={newRestPhone}
                  onChange={(e) => setNewRestPhone(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 text-sm font-semibold"
                  placeholder="e.g. 9876543210"
                />
              </div>

              <div className="pt-2 border-t border-slate-50 flex gap-2 justify-end text-sm">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 font-bold text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold shadow-md shadow-amber-500/10 transition-all disabled:opacity-50"
                >
                  {creating ? 'Creating Brand...' : 'Register Restaurant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAILED ORDERS DEEP-DIVE MODAL */}
      {showOrdersModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-xl overflow-hidden border border-slate-100 flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <span className="text-[10px] font-black text-amber-600 uppercase tracking-wider">Restaurant Deep-Dive</span>
                <h3 className="font-extrabold text-slate-900 text-lg mt-0.5">{selectedRestName} — Detailed Orders</h3>
              </div>
              <button
                onClick={() => { setShowOrdersModal(false); setSelectedRestId(null); }}
                className="h-9 w-9 rounded-full bg-white border border-slate-200/50 hover:bg-slate-50 text-slate-405 hover:text-slate-600 flex items-center justify-center font-bold text-sm shadow-sm transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Search Filter */}
            <div className="px-6 py-3 border-b border-slate-100 bg-white flex items-center justify-between gap-4">
              <input
                type="text"
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                placeholder="Search by customer name, status, or order ID..."
                className="w-full max-w-sm px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 shadow-sm"
              />
              <span className="text-[10px] font-bold text-slate-450 uppercase">
                Total Orders: {modalOrders.length}
              </span>
            </div>

            {/* Modal Table Body */}
            <div className="flex-grow overflow-y-auto p-6">
              {loadingOrders ? (
                <div className="flex justify-center items-center py-20 flex-col gap-2">
                  <RefreshCw className="h-6 w-6 animate-spin text-amber-500" />
                  <span className="text-xs text-slate-450 font-bold animate-pulse">Loading transaction records...</span>
                </div>
              ) : filteredModalOrders.length === 0 ? (
                <div className="text-center py-20 text-slate-400 font-bold text-sm bg-slate-50/40 rounded-2xl border border-dashed border-slate-205">
                  No orders found for this restaurant.
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                  <table className="w-full text-left text-slate-600 font-semibold text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">
                        <th className="px-5 py-3">Order ID</th>
                        <th className="px-5 py-3">Date</th>
                        <th className="px-5 py-3">Customer Name</th>
                        <th className="px-5 py-3">Items Purchased</th>
                        <th className="px-5 py-3">Total Amount</th>
                        <th className="px-5 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-750">
                      {filteredModalOrders.map((order: any) => {
                        const totalQty = order.items
                          ? order.items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0)
                          : 0;
                        const dateStr = order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : 'N/A';

                        return (
                          <tr key={order._id} className="hover:bg-slate-50/30 transition-colors">
                            <td className="px-5 py-3.5 font-mono text-[10px] text-slate-400">
                              #{order._id.substring(18)}
                            </td>
                            <td className="px-5 py-3.5 text-slate-550 font-semibold">
                              {dateStr}
                            </td>
                            <td className="px-5 py-3.5">
                              <div>
                                <span className="font-extrabold text-slate-800 text-xs block">{order.customerId?.name || 'Deleted Account'}</span>
                                <span className="text-[9px] text-slate-400 block mt-0.5">{order.customerId?.email || 'N/A'}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="max-w-xs truncate" title={order.items?.map((i: any) => `${i.name} x${i.quantity}`).join(', ')}>
                                <span className="font-bold text-slate-850 block text-xs">{totalQty} {totalQty === 1 ? 'item' : 'items'}</span>
                                <span className="text-[10px] text-slate-450 block truncate mt-0.5">
                                  {order.items?.map((i: any) => i.name).join(', ')}
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 font-black text-slate-900 text-xs font-mono">
                              ₹{order.totalAmount}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${order.orderStatus === 'Delivered' ? 'bg-green-50 border-green-200 text-green-700' :
                                order.orderStatus === 'Rejected' ? 'bg-red-50 border-red-200 text-red-700' :
                                  'bg-primary-50 border-primary-100 text-primary-700'
                                }`}>
                                {order.orderStatus}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end text-xs">
              <button
                onClick={() => { setShowOrdersModal(false); setSelectedRestId(null); }}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-850 text-white rounded-xl font-bold transition-all shadow-sm text-xs"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
