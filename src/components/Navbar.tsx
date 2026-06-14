'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ShoppingBag, LogOut, User as UserIcon, Store, Truck, ShieldAlert, Menu, X, ClipboardList } from 'lucide-react';
import { useCart } from '@/context/CartContext';

interface UserProfile {
  name: string;
  email?: string;
  phone?: string;
  role: 'customer' | 'owner' | 'staff' | 'admin';
}

export const Navbar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { cartItems } = useCart();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Profile Edit Modal States
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState('');
  const [nameSuccess, setNameSuccess] = useState('');

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Navbar user fetch failed:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [pathname]); // Refresh user whenever the page changes

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        setUser(null);
        router.push('/login');
        router.refresh();
      }
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleOpenProfileModal = () => {
    if (!user) return;
    setNewName(user.name);
    setNameError('');
    setNameSuccess('');
    setShowProfileModal(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError('');
    setNameSuccess('');
    if (!newName.trim()) {
      setNameError('Name is required.');
      return;
    }
    setSavingName(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile.');
      }
      setNameSuccess('Name updated successfully!');
      setUser({ ...user!, name: data.user.name });
      
      // Delay closing modal slightly so the user sees the success state
      setTimeout(() => {
        setShowProfileModal(false);
      }, 1000);
    } catch (err: any) {
      setNameError(err.message || 'An error occurred.');
    } finally {
      setSavingName(false);
    }
  };

  // Hide Navbar on Login/Register pages
  if (pathname === '/login' || pathname === '/register' || pathname === '/login/admin') {
    return null;
  }

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <span className="h-8 w-8 rounded-lg bg-primary-500 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-primary-200">
                D
              </span>
              <span className="font-extrabold text-xl tracking-tight text-slate-800">
                Decentral<span className="text-primary-500">Bites</span>
              </span>
            </Link>
            {user && (
              <span className="hidden sm:inline ml-2 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-slate-50 border border-slate-200 text-slate-600">
                {user.role === 'owner' ? 'Merchant' : user.role === 'staff' ? 'Rider' : user.role === 'admin' ? 'Admin' : 'Customer'}
              </span>
            )}
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            {!loading && user && (
              <>
                {/* Customer Links */}
                {user.role === 'customer' && (
                  <>
                    <Link
                      href="/customer/dashboard"
                      className={`text-sm font-medium transition-colors ${
                        pathname === '/customer/dashboard' ? 'text-primary-600 font-bold' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Browse
                    </Link>
                    <Link
                      href="/customer/dashboard#orders"
                      className={`flex items-center gap-1 text-sm font-medium transition-colors text-slate-600 hover:text-slate-900`}
                      onClick={(e) => {
                        if (pathname === '/customer/dashboard') {
                          e.preventDefault();
                          document.getElementById('orders-section')?.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                    >
                      <ClipboardList className="h-4 w-4" />
                      My Orders
                    </Link>
                    <Link
                      href="/checkout"
                      className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors text-sm font-bold"
                    >
                      <ShoppingBag className="h-4 w-4" />
                      <span>Cart</span>
                      {cartCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-white text-[10px] font-bold border border-white">
                          {cartCount}
                        </span>
                      )}
                    </Link>
                  </>
                )}

                {/* Owner Links */}
                {user.role === 'owner' && (
                  <Link
                    href="/restaurant/dashboard"
                    className={`flex items-center gap-1 text-sm font-semibold transition-colors ${
                      pathname?.includes('/restaurant/dashboard') ? 'text-primary-600' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Store className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                )}

                {/* Staff Links */}
                {user.role === 'staff' && (
                  <Link
                    href="/staff/dashboard"
                    className={`flex items-center gap-1 text-sm font-semibold transition-colors ${
                      pathname?.includes('/staff/dashboard') ? 'text-primary-600' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Truck className="h-4 w-4" />
                    <span>Deliveries</span>
                  </Link>
                )}

                {/* Admin Links */}
                {user.role === 'admin' && (
                  <Link
                    href="/admin/dashboard"
                    className={`flex items-center gap-1 text-sm font-semibold transition-colors ${
                      pathname?.includes('/admin/dashboard') ? 'text-primary-600' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ShieldAlert className="h-4 w-4" />
                    <span>Admin Portal</span>
                  </Link>
                )}

                {/* Profile Badge & Logout */}
                <div className="h-4 w-px bg-slate-200" />
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleOpenProfileModal}
                    className="flex items-center gap-2 hover:bg-slate-50 px-2.5 py-1.5 rounded-xl border border-transparent hover:border-slate-100 transition-all text-left group"
                    title="Edit Profile Settings"
                  >
                    <div className="h-8 w-8 rounded-full bg-slate-100 group-hover:bg-primary-50 border border-slate-200 group-hover:border-primary-200 flex items-center justify-center text-slate-600 group-hover:text-primary-600 transition-colors">
                      <UserIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="block text-sm font-bold text-slate-700 leading-tight group-hover:text-primary-600 transition-colors truncate max-w-[100px]">
                        {user.name}
                      </span>
                      <span className="block text-[9px] text-slate-400 font-medium tracking-wide leading-none mt-0.5">
                        Manage Profile
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 text-slate-500 hover:text-red-600 transition-colors text-sm font-medium"
                    title="Sign Out"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            )}

            {!loading && !user && (
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 transition-colors rounded-lg shadow-sm"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Right Side */}
          <div className="flex md:hidden items-center gap-3">
            {!loading && user?.role === 'customer' && (
              <Link
                href="/checkout"
                className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors text-sm font-bold"
              >
                <ShoppingBag className="h-4 w-4" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-white text-[10px] font-bold border border-white">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}
            {!loading && !user && (
              <Link
                href="/login"
                className="px-3 py-1.5 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 transition-colors rounded-lg shadow-sm"
              >
                Sign In
              </Link>
            )}
            {!loading && user && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && user && (
          <div className="md:hidden border-t border-slate-100 py-3 space-y-1 pb-4">
            {user.role === 'customer' && (
              <>
                <Link
                  href="/customer/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Browse Restaurants
                </Link>
                <Link
                  href="/customer/dashboard#orders"
                  onClick={(e) => {
                    setMobileMenuOpen(false);
                    if (pathname === '/customer/dashboard') {
                      e.preventDefault();
                      document.getElementById('orders-section')?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <ClipboardList className="h-4 w-4 text-slate-400" />
                  My Orders
                </Link>
              </>
            )}
            {user.role === 'owner' && (
              <Link
                href="/restaurant/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Store className="h-4 w-4 text-slate-400" />
                Restaurant Dashboard
              </Link>
            )}
            {user.role === 'staff' && (
              <Link
                href="/staff/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Truck className="h-4 w-4 text-slate-400" />
                My Deliveries
              </Link>
            )}
            {user.role === 'admin' && (
              <Link
                href="/admin/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <ShieldAlert className="h-4 w-4 text-slate-400" />
                Admin Portal
              </Link>
            )}
            <div className="border-t border-slate-100 mt-2 pt-2 px-1 flex items-center justify-between">
              <button
                onClick={() => { handleOpenProfileModal(); setMobileMenuOpen(false); }}
                className="flex items-center gap-2 px-2 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                  <UserIcon className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <span className="block text-sm font-bold text-slate-700 leading-tight">{user.name}</span>
                  <span className="block text-[9px] text-slate-400 font-medium capitalize">{user.role}</span>
                </div>
              </button>
              <button
                onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                className="flex items-center gap-1.5 text-red-500 hover:text-red-600 transition-colors text-sm font-semibold px-3 py-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>

      {/* PROFILE EDIT MODAL */}
      {showProfileModal && user && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-xl overflow-hidden border border-slate-100 flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-extrabold text-slate-900 text-base">Profile Settings</h3>
              <button
                onClick={() => setShowProfileModal(false)}
                className="h-8 w-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-sm"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSaveProfile} className="p-6 space-y-4 text-xs font-semibold text-slate-600">
              {nameError && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[11px] font-bold">
                  {nameError}
                </div>
              )}
              {nameSuccess && (
                <div className="p-2.5 rounded-xl bg-green-50 border border-green-200 text-green-700 text-[11px] font-bold">
                  {nameSuccess}
                </div>
              )}

              <div>
                <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Account Role</label>
                <div className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 text-sm font-bold capitalize">
                  {user.role === 'owner' ? 'Merchant Owner' : user.role}
                </div>
              </div>

              {user.email && (
                <div>
                  <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Registered Email</label>
                  <div className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 text-sm font-medium">
                    {user.email}
                  </div>
                </div>
              )}

              {user.phone && (
                <div>
                  <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Staff Phone</label>
                  <div className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 text-sm font-medium">
                    {user.phone}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Your Full Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 text-slate-800 text-sm font-semibold"
                  placeholder="Enter your name"
                />
              </div>

              <div className="pt-2 border-t border-slate-50 flex gap-2 justify-end text-sm">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 font-bold text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingName}
                  className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-md shadow-primary-200 transition-all disabled:opacity-50"
                >
                  {savingName ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </nav>
  );
};
