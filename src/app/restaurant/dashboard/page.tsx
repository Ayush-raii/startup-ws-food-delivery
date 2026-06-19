'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Store, Plus, Edit, Trash2, Check, X, ShieldAlert, Phone, Users, UserPlus, Volume2, ShoppingBag, PlusCircle, AlertCircle, Sparkles, Clock } from 'lucide-react';

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

interface Order {
  _id: string;
  customerId: {
    name: string;
    phone: string;
  };
  items: { name: string; price: number; quantity: number }[];
  totalAmount: number;
  deliveryAddress: string;
  orderStatus: 'Placed' | 'Accepted' | 'Preparing' | 'Out for Delivery' | 'Delivered' | 'Rejected';
  deliveryOTP: string | null;
  assignedStaffId?: {
    _id: string;
    name: string;
    phone: string;
  };
  createdAt: string;
}

interface Staff {
  _id: string;
  name: string;
  phone: string;
}

export default function OwnerDashboard() {
  // Tabs: 'orders' | 'menu' | 'staff' | 'profile'
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'staff' | 'profile'>('orders');
  const [restaurantStatus, setRestaurantStatus] = useState<'active' | 'inactive' | 'pending'>('active');

  // Restaurant Profile editing states
  const [restFormName, setRestFormName] = useState('');
  const [restFormBanner, setRestFormBanner] = useState('');
  const [restFormCuisines, setRestFormCuisines] = useState('');
  const [savingRest, setSavingRest] = useState(false);
  const [restSuccess, setRestSuccess] = useState('');
  const [restError, setRestError] = useState('');

  // Owner Profile editing states (within dashboard)
  const [ownerFormName, setOwnerFormName] = useState('');
  const [savingOwner, setSavingOwner] = useState(false);
  const [ownerSuccess, setOwnerSuccess] = useState('');
  const [ownerError, setOwnerError] = useState('');

  const handleUpdateRestaurantProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setRestError('');
    setRestSuccess('');
    if (!restFormName.trim()) {
      setRestError('Restaurant name is required.');
      return;
    }
    setSavingRest(true);
    try {
      const parsedCuisines = restFormCuisines
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag !== '');

      const res = await fetch(`/api/restaurants/${restaurantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: restFormName.trim(),
          bannerImage: restFormBanner.trim(),
          cuisineTags: parsedCuisines,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update restaurant details.');
      }
      setRestSuccess('Restaurant details updated successfully!');
      setRestaurantName(data.restaurant.name);
    } catch (err: any) {
      setRestError(err.message || 'An error occurred.');
    } finally {
      setSavingRest(false);
    }
  };

  const handleUpdateOwnerName = async (e: React.FormEvent) => {
    e.preventDefault();
    setOwnerError('');
    setOwnerSuccess('');
    if (!ownerFormName.trim()) {
      setOwnerError('Owner name is required.');
      return;
    }
    setSavingOwner(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: ownerFormName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile.');
      }
      setOwnerSuccess('Profile name updated successfully!');
    } catch (err: any) {
      setOwnerError(err.message || 'An error occurred.');
    } finally {
      setSavingOwner(false);
    }
  };

  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [restaurantName, setRestaurantName] = useState('My Restaurant');
  const [restaurantId, setRestaurantId] = useState('');

  // Audio Alerts State
  const prevPlacedCount = useRef<number>(0);
  const [audioPermissionAlert, setAudioPermissionAlert] = useState(true);

  // Modal / Form States for Menu CRUD
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [menuFormName, setMenuFormName] = useState('');
  const [menuFormPrice, setMenuFormPrice] = useState('');
  const [menuFormCategory, setMenuFormCategory] = useState<'Starters' | 'Main Course' | 'Desserts'>('Starters');
  const [menuFormDescription, setMenuFormDescription] = useState('');
  const [menuFormImage, setMenuFormImage] = useState('');
  const [menuFormIsVeg, setMenuFormIsVeg] = useState(true);

  // Form States for Staff
  const [staffName, setStaffName] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffError, setStaffError] = useState('');
  const [staffSuccess, setStaffSuccess] = useState('');

  // Staff assignment selection state
  const [assignedRiderMap, setAssignedRiderMap] = useState<Record<string, string>>({});

  // AI Menu Scanner States
  const [aiScanning, setAiScanning] = useState(false);
  const [aiError, setAiError] = useState('');
  const [scannedItems, setScannedItems] = useState<{
    category: 'Starters' | 'Main Course' | 'Desserts';
    item_name: string;
    price: number;
    description: string;
    food_type: 'Veg' | 'Non-Veg' | 'Unknown';
  }[]>([]);
  const [scannerSuccess, setScannerSuccess] = useState('');
  const [isSavingScanned, setIsSavingScanned] = useState(false);

  // Smooth ticking for countdown timers
  const [nowTime, setNowTime] = useState<number>(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Visual warning for new order notification
  const [showNewOrderToast, setShowNewOrderToast] = useState(false);
  const [newOrderToastMsg, setNewOrderToastMsg] = useState('');

  // Helper to get order timer state (10 mins = 600s preparation window)
  const getOrderTimerState = (orderCreatedAt: string) => {
    const elapsedMs = nowTime - new Date(orderCreatedAt).getTime();
    const elapsedSec = Math.floor(elapsedMs / 1000);
    const remainingSec = 600 - elapsedSec; // 10 minutes limit (600 seconds)

    const isUrgent = remainingSec > 0 && remainingSec <= 30; // 30 seconds or less
    const isExpired = remainingSec <= 0;

    const formattedTime = () => {
      if (remainingSec <= 0) {
        const overdueSec = Math.abs(remainingSec);
        const mins = Math.floor(overdueSec / 60);
        const secs = overdueSec % 60;
        return `-${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

  // Helper to calculate analytics
  const getAnalytics = () => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let todayOrdersCount = 0;
    let todayRevenue = 0;
    let monthOrdersCount = 0;
    let monthRevenue = 0;

    orders.forEach((order) => {
      const orderDate = new Date(order.createdAt);
      
      // Today Check
      if (orderDate >= startOfToday) {
        todayOrdersCount++;
        if (order.orderStatus === 'Delivered') {
          todayRevenue += order.totalAmount;
        }
      }

      // Month Check
      if (orderDate >= startOfMonth) {
        monthOrdersCount++;
        if (order.orderStatus === 'Delivered') {
          monthRevenue += order.totalAmount;
        }
      }
    });

    const todayCommission = Number((todayRevenue * 0.1).toFixed(2));
    const monthCommission = Number((monthRevenue * 0.1).toFixed(2));

    return {
      todayOrdersCount,
      todayRevenue,
      todayCommission,
      monthOrdersCount,
      monthRevenue,
      monthCommission,
    };
  };

  const stats = getAnalytics();

  // Web Audio API chime synthesis for new incoming orders
  const playAudioAlert = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      // Dual note chime: D5 (587.33Hz) followed by A5 (880Hz)
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
      
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.65);
    } catch (e) {
      console.warn('Web Audio API play failed:', e);
    }
  };

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // Fetch user profile first to get restaurant ID
      const resMe = await fetch('/api/auth/me');
      if (resMe.ok) {
        const dataMe = await resMe.json();
        const rId = dataMe.user.associatedRestaurantId;
        setRestaurantId(rId);
        if (!silent) {
          setOwnerFormName(dataMe.user.name);
        }

        // Fetch Restaurant details
        const resRest = await fetch(`/api/restaurants/${rId}`);
        if (resRest.ok) {
          const dataRest = await resRest.json();
          setRestaurantName(dataRest.restaurant.name);
          setRestaurantStatus(dataRest.restaurant.status || 'pending');
          setMenuItems(dataRest.restaurant.menu || []);
          if (!silent) {
            setRestFormName(dataRest.restaurant.name);
            setRestFormBanner(dataRest.restaurant.bannerImage || '');
            setRestFormCuisines(dataRest.restaurant.cuisineTags?.join(', ') || '');
          }
        }

        // Fetch Orders
        const resOrders = await fetch('/api/orders');
        if (resOrders.ok) {
          const dataOrders = await resOrders.json();
          setOrders(dataOrders.orders);

          // Audio Alert check for new "Placed" orders
          const placedCount = dataOrders.orders.filter((o: Order) => o.orderStatus === 'Placed').length;
          if (placedCount > prevPlacedCount.current) {
            playAudioAlert();
            setNewOrderToastMsg(`New Order Placed! Attend immediately.`);
            setShowNewOrderToast(true);
            setTimeout(() => setShowNewOrderToast(false), 8000);
          }
          prevPlacedCount.current = placedCount;
        }

        // Fetch Staff
        const resStaff = await fetch('/api/staff');
        if (resStaff.ok) {
          const dataStaff = await resStaff.json();
          setStaffList(dataStaff.staff);
        }
      }
    } catch (err) {
      console.error('Error loading restaurant dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Poll orders every 3 seconds for instant notifications and status changes
    const interval = setInterval(() => {
      loadData(true);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Accept Order
  const handleUpdateStatus = async (orderId: string, status: 'Accepted' | 'Preparing' | 'Rejected') => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        loadData(true);
      }
    } catch (err) {
      console.error('Update status failed:', err);
    }
  };

  // Assign Rider and Dispatch
  const handleAssignRider = async (orderId: string) => {
    const staffId = assignedRiderMap[orderId];
    if (!staffId) {
      alert('Please select a delivery rider first.');
      return;
    }

    try {
      const res = await fetch(`/api/orders/${orderId}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId }),
      });
      if (res.ok) {
        // Clear assignment mapping for this order
        setAssignedRiderMap(prev => {
          const updated = { ...prev };
          delete updated[orderId];
          return updated;
        });
        loadData(true);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to dispatch order');
      }
    } catch (err) {
      console.error('Assign rider failed:', err);
    }
  };

  // Register Delivery Staff
  const handleRegisterStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError('');
    setStaffSuccess('');

    if (!staffName || !staffPhone) {
      setStaffError('Please fill out name and phone number.');
      return;
    }

    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: staffName, phone: staffPhone }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setStaffSuccess(`Registered ${staffName} successfully!`);
      setStaffName('');
      setStaffPhone('');
      loadData(true);
    } catch (err: any) {
      setStaffError(err.message || 'Failed to register rider');
    }
  };

  // AI Menu Scanner Handlers
  const handleMenuImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAiScanning(true);
    setAiError('');
    setScannerSuccess('');
    setScannedItems([]);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64String = reader.result as string;
        const res = await fetch('/api/upload-menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: base64String,
            mimeType: file.type
          })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to scan menu.');
        }

        if (data.restaurant_menu && Array.isArray(data.restaurant_menu)) {
          const normalized = data.restaurant_menu.map((item: any) => {
            let cat: 'Starters' | 'Main Course' | 'Desserts' = 'Main Course';
            if (item.category === 'Starters' || item.category === 'Desserts' || item.category === 'Main Course') {
              cat = item.category;
            } else if (typeof item.category === 'string') {
              const lower = item.category.toLowerCase();
              if (lower.includes('starter') || lower.includes('appetiz') || lower.includes('drink') || lower.includes('beverag') || lower.includes('soup') || lower.includes('mocktail')) {
                cat = 'Starters';
              } else if (lower.includes('dessert') || lower.includes('sweet') || lower.includes('ice cream') || lower.includes('cake') || lower.includes('shake')) {
                cat = 'Desserts';
              }
            }
            return {
              category: cat,
              item_name: item.item_name || 'Unnamed Dish',
              price: typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0,
              description: item.description || '',
              food_type: item.food_type === 'Veg' || item.food_type === 'Non-Veg' ? item.food_type : 'Unknown'
            };
          });
          setScannedItems(normalized);
          setScannerSuccess(`AI successfully extracted ${normalized.length} items. Please review and tweak below!`);
        } else {
          throw new Error('Menu format from AI did not match expected structure.');
        }
      } catch (err: any) {
        setAiError(err.message || 'An error occurred while scanning.');
      } finally {
        setAiScanning(false);
      }
    };
    reader.onerror = () => {
      setAiError('FileReader failed to read the file.');
      setAiScanning(false);
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateScannedItemField = (index: number, field: string, value: any) => {
    setScannedItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleDeleteScannedItem = (index: number) => {
    setScannedItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddScannedRow = () => {
    setScannedItems(prev => [
      ...prev,
      {
        category: 'Main Course',
        item_name: '',
        price: 0,
        description: '',
        food_type: 'Unknown'
      }
    ]);
  };

  const handleSaveScannedMenu = async () => {
    if (scannedItems.length === 0) return;
    setIsSavingScanned(true);
    setScannerSuccess('');
    setAiError('');

    let savedCount = 0;
    try {
      for (const item of scannedItems) {
        const payload = {
          name: item.item_name || 'Unnamed Item',
          price: Number(item.price) || 0,
          description: item.description,
          category: item.category,
          isVeg: item.food_type === 'Veg',
        };

        const res = await fetch(`/api/restaurants/${restaurantId}/menu`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          savedCount++;
        } else {
          console.warn(`Failed to save item: ${item.item_name}`);
        }
      }

      setScannerSuccess(`Successfully saved ${savedCount} menu items to your catalog!`);
      setScannedItems([]);
      loadData(true);
    } catch (err: any) {
      setAiError(err.message || 'An error occurred while saving.');
    } finally {
      setIsSavingScanned(false);
    }
  };

  // Menu Form Submit
  const handleMenuSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuFormName || !menuFormPrice) {
      alert('Name and price are required.');
      return;
    }

    const payload = {
      name: menuFormName,
      price: Number(menuFormPrice),
      description: menuFormDescription,
      category: menuFormCategory,
      image: menuFormImage || undefined,
      isVeg: menuFormIsVeg,
    };

    try {
      let res;
      if (editingItemId) {
        // Edit Item
        res = await fetch(`/api/restaurants/${restaurantId}/menu`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId: editingItemId, ...payload }),
        });
      } else {
        // Add Item
        res = await fetch(`/api/restaurants/${restaurantId}/menu`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        setShowMenuModal(false);
        resetMenuForm();
        loadData(true);
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to save menu item');
      }
    } catch (err) {
      console.error('Menu save error:', err);
    }
  };

  const handleEditItem = (item: MenuItem) => {
    setEditingItemId(item._id);
    setMenuFormName(item.name);
    setMenuFormPrice(item.price.toString());
    setMenuFormCategory(item.category);
    setMenuFormDescription(item.description);
    setMenuFormImage(item.image);
    setMenuFormIsVeg(item.isVeg);
    setShowMenuModal(true);
  };

  // Delete Menu Item
  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/menu?itemId=${itemId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        loadData(true);
      }
    } catch (err) {
      console.error('Failed to delete menu item:', err);
    }
  };

  // Toggle Availability
  const handleToggleAvailability = async (item: MenuItem) => {
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/menu`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item._id, isAvailable: !item.isAvailable }),
      });
      if (res.ok) {
        loadData(true);
      }
    } catch (err) {
      console.error('Failed to toggle availability:', err);
    }
  };

  const resetMenuForm = () => {
    setEditingItemId(null);
    setMenuFormName('');
    setMenuFormPrice('');
    setMenuFormCategory('Starters');
    setMenuFormDescription('');
    setMenuFormImage('');
    setMenuFormIsVeg(true);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 flex justify-center items-center h-[50vh]">
        <div className="text-slate-500 font-bold animate-pulse">Loading dashboard...</div>
      </div>
    );
  }

  // Filter orders by status categories
  const activeIncomingOrders = orders.filter((o) => ['Placed', 'Accepted', 'Preparing'].includes(o.orderStatus));
  const dispatchedOrders = orders.filter((o) => o.orderStatus === 'Out for Delivery');
  const pastOrders = orders.filter((o) => ['Delivered', 'Rejected'].includes(o.orderStatus));

  const renderLockoutView = () => (
    <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center max-w-2xl mx-auto shadow-sm space-y-6 my-4">
      <div className="mx-auto w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center border border-amber-200">
        <ShieldAlert className="h-8 w-8 text-amber-500 animate-pulse" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-black text-slate-800">
          {restaurantStatus === 'pending' ? 'Registration Under Review' : 'Store Access Deactivated'}
        </h2>
        <p className="text-slate-500 text-sm leading-relaxed font-semibold">
          {restaurantStatus === 'pending' 
            ? 'Your store account is currently awaiting administrative approval. Once approved, you can start managing orders, menu catalog, and your delivery staff.'
            : 'Your merchant store access has been deactivated by the system administrator. Please contact operations support to reactivate your listing.'}
        </p>
      </div>
      <div className="pt-2">
        <button 
          onClick={() => setActiveTab('profile')}
          className="bg-primary-600 hover:bg-primary-750 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-md shadow-primary-200"
        >
          Configure Store Profile
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-8">
      
      {/* Real-time Order Notification Toast */}
      {showNewOrderToast && (
        <div className="fixed top-6 right-6 z-[100] max-w-sm w-full bg-slate-900 border border-slate-750 text-white rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4 animate-bounce">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary-600/25 border border-primary-500/25 rounded-xl flex items-center justify-center text-primary-500 animate-pulse flex-shrink-0">
              <Volume2 className="h-5 w-5 text-primary-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-primary-400">Order Alert</p>
              <p className="text-sm font-extrabold">{newOrderToastMsg}</p>
            </div>
          </div>
          <button 
            onClick={() => setShowNewOrderToast(false)} 
            className="text-slate-400 hover:text-white font-bold text-lg bg-slate-800 hover:bg-slate-700 h-7 w-7 rounded-full flex items-center justify-center"
          >
            ×
          </button>
        </div>
      )}
      {/* Header bar */}
      <div className="bg-white border border-slate-100 p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-primary-100 rounded-xl sm:rounded-2xl flex items-center justify-center text-primary-600 flex-shrink-0">
              <Store className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Merchant Control</span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 leading-tight">{restaurantName}</h1>
            </div>
          </div>
          
          {/* Audio Alert Status Info */}
          <div className="flex items-center gap-2 bg-primary-50 px-3 py-2 rounded-xl text-xs font-bold text-primary-800 self-start sm:self-auto">
            <Volume2 className="h-4 w-4 text-primary-600 animate-pulse flex-shrink-0" />
            <span className="whitespace-nowrap">Kitchen Alerts Active</span>
            {audioPermissionAlert && (
              <button
                onClick={() => { playAudioAlert(); setAudioPermissionAlert(false); }}
                className="ml-1 bg-primary-600 hover:bg-primary-700 text-white px-2 py-0.5 rounded text-[10px] uppercase font-black whitespace-nowrap"
              >
                Test Sound
              </button>
            )}
          </div>
        </div>
      </div>

      {restaurantStatus !== 'active' && (
        <div className={`p-4.5 rounded-2xl border flex items-center gap-3.5 ${
          restaurantStatus === 'pending'
            ? 'bg-amber-50 border-amber-200 text-amber-900 shadow-sm'
            : 'bg-red-50 border-red-200 text-red-900 shadow-sm'
        }`}>
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            restaurantStatus === 'pending' ? 'bg-amber-500/10 text-amber-600' : 'bg-red-500/10 text-red-600'
          }`}>
            <ShieldAlert className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold">
              {restaurantStatus === 'pending' 
                ? 'Store Setup - Awaiting Approval'
                : 'Service Interrupted - Deactivated'}
            </h4>
            <p className="text-xs font-semibold opacity-90 mt-0.5 leading-relaxed">
              {restaurantStatus === 'pending'
                ? 'Your registration has been submitted successfully and is currently pending review by the platform administrator. You can configure your store brand identity below.'
                : 'Your storefront service is currently disabled. Active customers cannot find your store or place orders at this time.'}
            </p>
          </div>
        </div>
      )}

      {/* Tabs list */}
      <div className="flex border-b border-slate-200 gap-1 sm:gap-6 overflow-x-auto scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 sm:pb-4 px-2 sm:px-0 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap flex-shrink-0 ${
            activeTab === 'orders'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Active Orders ({activeIncomingOrders.length + dispatchedOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('menu')}
          className={`pb-3 sm:pb-4 px-2 sm:px-0 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap flex-shrink-0 ${
            activeTab === 'menu'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Menu ({menuItems.length})
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          className={`pb-3 sm:pb-4 px-2 sm:px-0 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap flex-shrink-0 ${
            activeTab === 'staff'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Riders ({staffList.length})
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 sm:pb-4 px-2 sm:px-0 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap flex-shrink-0 ${
            activeTab === 'profile'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Profile
        </button>
      </div>

      {/* 1. ORDERS TAB */}
      {activeTab === 'orders' && (
        restaurantStatus !== 'active' ? renderLockoutView() : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
          {/* Active Incoming / Cooking (Col 1-2) */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-lg font-bold text-slate-900">Incoming & Preparation Queue</h3>
            
            {activeIncomingOrders.length === 0 ? (
            <div className="bg-white border border-slate-100 p-8 sm:p-16 rounded-2xl sm:rounded-3xl text-center space-y-3">
              <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <p className="text-sm font-bold text-slate-500">No active orders in preparation</p>
              <p className="text-xs text-slate-400">New customer orders will appear here automatically.</p>
            </div>
            ) : (
              <div className="space-y-4">
                {activeIncomingOrders.map((order) => (
                  <div key={order._id} className="bg-white border border-slate-100 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-4">
                    
                    {/* Top Meta */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-400">Order #{order._id.substring(18)}</span>
                          <span className={`px-2.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide ${
                            order.orderStatus === 'Placed' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                            order.orderStatus === 'Accepted' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                            'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          }`}>
                            {order.orderStatus === 'Placed' ? 'NEW' : order.orderStatus}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-slate-800 mt-1 truncate">{order.customerId?.name || 'Guest Customer'}</h4>
                        <span className="text-xs font-medium text-slate-400">{new Date(order.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <span className="text-base sm:text-lg font-black text-slate-900 flex-shrink-0">₹{order.totalAmount}</span>
                    </div>

                    {/* Bill details */}
                    <div className="bg-slate-50 p-4 rounded-2xl space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs text-slate-600 font-semibold">
                          <span>{item.name} <span className="text-slate-400">x{item.quantity}</span></span>
                          <span>₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    {/* Address details */}
                    <div className="text-xs text-slate-500 leading-normal font-semibold">
                      <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider mb-1">Delivery Address</span>
                      {order.deliveryAddress}
                    </div>

                    {/* Countdown Timer */}
                    {['Placed', 'Accepted', 'Preparing'].includes(order.orderStatus) && (() => {
                      const timer = getOrderTimerState(order.createdAt);
                      return (
                        <div className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                          timer.isExpired 
                            ? 'bg-red-50 border-red-200 text-red-800 animate-pulse'
                            : timer.isUrgent
                            ? 'bg-amber-50 border-amber-350 text-amber-900 animate-bounce'
                            : 'bg-slate-50 border-slate-100 text-slate-700'
                        }`}>
                          <div className="flex items-center gap-2">
                            <Clock className={`h-4.5 w-4.5 ${timer.isExpired ? 'text-red-500 animate-spin' : 'text-slate-400'}`} />
                            <span className="text-xs font-extrabold">
                              {timer.isExpired 
                                ? '🚨 Order Delayed! Long delay detected.' 
                                : timer.isUrgent 
                                ? '🚨 Urgent! Deliver as soon as possible!' 
                                : 'Time Remaining to Prepare & Deliver'}
                            </span>
                          </div>
                          <span className={`text-sm font-black font-mono tracking-wider ${
                            timer.isExpired ? 'text-red-600' : timer.isUrgent ? 'text-amber-700' : 'text-slate-900'
                          }`}>
                            {timer.timeStr}
                          </span>
                        </div>
                      );
                    })()}

                    {/* Status Controllers */}
                    <div className="pt-3 border-t border-slate-100 flex flex-col gap-3">
                      <div className="flex flex-wrap gap-2">
                        {order.orderStatus === 'Placed' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(order._id, 'Accepted')}
                              className="bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs px-3 py-2 rounded-xl shadow-sm flex items-center gap-1"
                            >
                              <Check className="h-4 w-4" /> Accept
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(order._id, 'Rejected')}
                              className="bg-white hover:bg-red-50 text-red-600 border border-red-200 font-bold text-xs px-3 py-2 rounded-xl"
                            >
                              <X className="h-4 w-4 inline mr-0.5" /> Reject
                            </button>
                          </>
                        )}
                        {order.orderStatus === 'Accepted' && (
                          <button
                            onClick={() => handleUpdateStatus(order._id, 'Preparing')}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-2 rounded-xl"
                          >
                            🍳 Start Preparing
                          </button>
                        )}
                      </div>

                      {/* Dispatch Controls (Visible for Accepted/Preparing) */}
                      {['Accepted', 'Preparing'].includes(order.orderStatus) && (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-slate-50">
                          <select
                            value={assignedRiderMap[order._id] || ''}
                            onChange={(e) => setAssignedRiderMap({ ...assignedRiderMap, [order._id]: e.target.value })}
                            className="flex-1 text-xs p-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 font-bold text-slate-700"
                          >
                            <option value="">-- Choose Staff Rider --</option>
                            {staffList.map((rider) => (
                              <option key={rider._id} value={rider._id}>
                                {rider.name} ({rider.phone})
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleAssignRider(order._id)}
                            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm whitespace-nowrap"
                          >
                            Dispatch Rider 🚀
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Rider Staff Status and Dispatched list (Col 3) */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-900">Out For Delivery ({dispatchedOrders.length})</h3>
            
            {dispatchedOrders.length === 0 ? (
              <div className="bg-white border border-slate-100 p-8 rounded-3xl text-center text-xs text-slate-400">
                No active riders currently out delivering.
              </div>
            ) : (
              <div className="space-y-3">
                {dispatchedOrders.map((order) => (
                  <div key={order._id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700">ID: #{order._id.substring(18)}</span>
                      <span className="text-amber-700 font-bold bg-amber-50 border border-amber-100 px-2 py-0.5 rounded">
                        Transit
                      </span>
                    </div>
                    <div className="text-xs space-y-1">
                      <p className="font-extrabold text-slate-800">To: {order.customerId?.name}</p>
                      <p className="font-bold text-slate-500 flex items-center gap-1 mt-1">
                        Rider: <strong className="text-slate-700">{order.assignedStaffId?.name}</strong>
                      </p>
                    </div>
                    {/* Display OTP for reference */}
                    <div className="pt-2 border-t border-slate-50 flex justify-between items-center text-[10px] font-bold text-slate-400">
                      <span>Secure Handshake OTP:</span>
                      <span className="bg-slate-100 px-2.5 py-1 text-slate-800 font-black rounded-lg text-xs tracking-wider">
                        {order.deliveryOTP}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Past Deliveries summary */}
            <h3 className="text-lg font-bold text-slate-900 pt-4">Past Deliveries</h3>
            <div className="bg-white border border-slate-100 rounded-3xl p-4 divide-y divide-slate-100 max-h-56 overflow-y-auto pr-1">
              {pastOrders.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No completed orders today.</p>
              ) : (
                pastOrders.map((o) => (
                  <div key={o._id} className="py-2.5 flex justify-between text-xs font-semibold">
                    <div>
                      <span className="text-slate-800 font-bold block">{o.customerId?.name}</span>
                      <span className="text-[10px] text-slate-400">ID: #{o._id.substring(18)}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-slate-700 block">₹{o.totalAmount}</span>
                      <span className={`text-[9px] font-black uppercase ${
                        o.orderStatus === 'Delivered' ? 'text-green-600' : 'text-red-500'
                      }`}>{o.orderStatus}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>

          </div>
        )
      )}
{/* 2. MENU CRUD TAB */}
      {activeTab === 'menu' && (
        restaurantStatus !== 'active' ? renderLockoutView() : (
          <div className="space-y-6">
            
            {/* AI Menu Scanner Section */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="bg-primary-500/20 text-primary-300 border border-primary-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                      AI Powered
                    </span>
                    <h3 className="text-lg font-black tracking-tight flex items-center gap-1.5">
                      <Sparkles className="h-5 w-5 text-primary-400 animate-pulse" />
                      AI Restaurant Menu Scanner
                    </h3>
                  </div>
                  <p className="text-xs text-slate-300 font-medium max-w-xl leading-relaxed">
                    Instantly extract menu items, categories, and prices from an image of your physical menu instead of manually typing them out.
                  </p>
                </div>
                
                <label className="bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs px-5 py-3.5 rounded-xl transition-all shadow-md shadow-primary-500/10 hover:shadow-primary-500/25 flex items-center gap-2 cursor-pointer border border-primary-400/25 self-start sm:self-auto">
                  <PlusCircle className="h-4.5 w-4.5" />
                  Scan Menu Image
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleMenuImageUpload}
                    disabled={aiScanning || isSavingScanned}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Loader */}
              {aiScanning && (
                <div className="flex flex-col items-center justify-center py-10 space-y-4 border border-dashed border-slate-700/60 rounded-2xl bg-slate-950/20">
                  <div className="relative flex items-center justify-center">
                    <div className="h-10 w-10 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
                    <Sparkles className="h-4 w-4 text-primary-400 absolute animate-ping" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-xs font-bold text-slate-200">AI is scanning your menu, please wait...</p>
                    <p className="text-[10px] text-slate-400 font-semibold animate-pulse">Analyzing menu structure & extracting categories...</p>
                  </div>
                </div>
              )}

              {/* Scan Errors */}
              {aiError && (
                <div className="p-4 bg-red-500/10 border border-red-500/35 rounded-2xl text-red-300 text-xs font-semibold flex items-center gap-2.5">
                  <AlertCircle className="h-4.5 w-4.5 text-red-450 flex-shrink-0" />
                  <span>{aiError}</span>
                </div>
              )}

              {/* Scan Success */}
              {scannerSuccess && (
                <div className="p-4 bg-green-500/10 border border-green-500/35 rounded-2xl text-green-300 text-xs font-semibold flex items-center gap-2.5">
                  <Check className="h-4.5 w-4.5 text-green-450 flex-shrink-0" />
                  <span>{scannerSuccess}</span>
                </div>
              )}

              {scannedItems.length > 0 && (
                <div className="space-y-4 pt-2">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
                      Extracted Menu Preview (Verify & edit details before saving)
                    </span>
                    <button
                      onClick={handleAddScannedRow}
                      className="text-xs text-primary-300 hover:text-primary-200 font-extrabold flex items-center gap-1"
                    >
                      <Plus className="h-4 w-4" /> Add Item
                    </button>
                  </div>

                  {/* Editable Preview Table */}
                  <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/30 text-slate-300 overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[700px]">
                      <thead>
                        <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                          <th className="p-3 w-1/4">Item Name *</th>
                          <th className="p-3 w-20">Price (₹) *</th>
                          <th className="p-3 w-28">Category *</th>
                          <th className="p-3 w-28">Food Type</th>
                          <th className="p-3">Description / Details</th>
                          <th className="p-3 w-12 text-center">Delete</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/65 font-medium">
                        {scannedItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-900/20">
                            <td className="p-2">
                              <input
                                type="text"
                                required
                                value={item.item_name}
                                onChange={(e) => handleUpdateScannedItemField(idx, 'item_name', e.target.value)}
                                className="w-full bg-slate-900/80 border border-slate-800 p-2 rounded-lg text-white focus:outline-none focus:border-primary-500 font-bold text-xs"
                                placeholder="Dish name"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                required
                                value={item.price}
                                onChange={(e) => handleUpdateScannedItemField(idx, 'price', parseFloat(e.target.value) || 0)}
                                className="w-full bg-slate-900/80 border border-slate-800 p-2 rounded-lg text-white focus:outline-none focus:border-primary-500 font-bold text-xs"
                                placeholder="0"
                              />
                            </td>
                            <td className="p-2">
                              <select
                                value={item.category}
                                onChange={(e) => handleUpdateScannedItemField(idx, 'category', e.target.value)}
                                className="w-full bg-slate-900/80 border border-slate-800 p-2 rounded-lg text-white focus:outline-none focus:border-primary-500 text-xs bg-slate-950 font-bold"
                              >
                                <option value="Starters">Starters</option>
                                <option value="Main Course">Main Course</option>
                                <option value="Desserts">Desserts</option>
                              </select>
                            </td>
                            <td className="p-2">
                              <select
                                value={item.food_type}
                                onChange={(e) => handleUpdateScannedItemField(idx, 'food_type', e.target.value)}
                                className="w-full bg-slate-900/80 border border-slate-800 p-2 rounded-lg text-white focus:outline-none focus:border-primary-500 text-xs bg-slate-950 font-bold"
                              >
                                <option value="Veg">Veg</option>
                                <option value="Non-Veg">Non-Veg</option>
                                <option value="Unknown">Unknown</option>
                              </select>
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => handleUpdateScannedItemField(idx, 'description', e.target.value)}
                                className="w-full bg-slate-900/80 border border-slate-800 p-2 rounded-lg text-white focus:outline-none focus:border-primary-500 text-xs font-semibold"
                                placeholder="E.g., Spiced cottage cheese skewers..."
                              />
                            </td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteScannedItem(idx)}
                                className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex justify-end gap-3 pt-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setScannedItems([])}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl border border-slate-700/50"
                    >
                      Discard Scanner Data
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveScannedMenu}
                      disabled={isSavingScanned}
                      className="px-6 py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-primary-500/15"
                    >
                      {isSavingScanned ? (
                        <>
                          <div className="h-3.5 w-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                          Saving Menu Items...
                        </>
                      ) : (
                        'Confirm & Save Menu'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-900">Items Catalog</h3>
            <button
              onClick={() => { resetMenuForm(); setShowMenuModal(true); }}
              className="bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-md shadow-primary-200 flex items-center gap-1.5"
            >
              <PlusCircle className="h-4.5 w-4.5" /> Add Menu Item
            </button>
          </div>

          {menuItems.length === 0 ? (
            <div className="bg-white border border-slate-100 p-16 rounded-3xl text-center space-y-3">
              <p className="text-sm font-semibold text-slate-400">No dishes created yet.</p>
              <button
                onClick={() => setShowMenuModal(true)}
                className="text-xs font-bold text-primary-600 hover:underline"
              >
                Create your first dish
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuItems.map((item) => (
                <div key={item._id} className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex flex-col justify-between h-full space-y-4">
                  <div className="space-y-3">
                    <div className="relative h-36 w-full rounded-2xl overflow-hidden bg-slate-50 border border-slate-100">
                      <img src={item.image} alt={item.name} className="object-cover h-full w-full" />
                      <div className="absolute top-2.5 right-2.5 flex gap-1">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black text-white ${
                          item.category === 'Starters' ? 'bg-blue-500' :
                          item.category === 'Main Course' ? 'bg-orange-500' : 'bg-pink-500'
                        }`}>
                          {item.category}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black text-white ${
                          item.isVeg ? 'bg-green-600' : 'bg-red-600'
                        }`}>
                          {item.isVeg ? 'VEG' : 'NON-VEG'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-base">{item.name}</h4>
                      <span className="text-sm font-black text-slate-900 block mt-0.5">₹{item.price}</span>
                      <p className="text-xs text-slate-400 leading-normal line-clamp-2 mt-1">{item.description || 'No description provided.'}</p>
                    </div>
                  </div>

                  {/* Actions & toggle */}
                  <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-500">
                      <input
                        type="checkbox"
                        checked={item.isAvailable}
                        onChange={() => handleToggleAvailability(item)}
                        className="h-4 w-4 accent-primary-600 cursor-pointer rounded"
                      />
                      Available
                    </label>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditItem(item)}
                        className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl border border-slate-100"
                        title="Edit Item"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item._id)}
                        className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl border border-red-100"
                        title="Delete Item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}

          {/* ADD / EDIT ITEM MODAL */}
          {showMenuModal && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
                
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-extrabold text-slate-900 text-lg">
                    {editingItemId ? 'Edit Dish Option' : 'Add New Dish Option'}
                  </h3>
                  <button
                    onClick={() => { setShowMenuModal(false); resetMenuForm(); }}
                    className="h-8 w-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 flex items-center justify-center font-bold"
                  >
                    ×
                  </button>
                </div>

                {/* Modal Body / Form */}
                <form onSubmit={handleMenuSubmit} className="p-6 overflow-y-auto space-y-4 flex-grow text-xs">
                  
                  <div>
                    <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Dish Name *</label>
                    <input
                      type="text"
                      required
                      value={menuFormName}
                      onChange={(e) => setMenuFormName(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-500 text-slate-800 text-sm font-semibold"
                      placeholder="e.g. Creamy Paneer Lababdar"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Price (INR) *</label>
                      <input
                        type="number"
                        required
                        value={menuFormPrice}
                        onChange={(e) => setMenuFormPrice(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-500 text-slate-800 text-sm font-semibold"
                        placeholder="e.g. 290"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Category *</label>
                      <select
                        value={menuFormCategory}
                        onChange={(e) => setMenuFormCategory(e.target.value as any)}
                        className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-500 text-slate-800 text-sm font-semibold bg-white"
                      >
                        <option value="Starters">Starters</option>
                        <option value="Main Course">Main Course</option>
                        <option value="Desserts">Desserts</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Image URL</label>
                    <input
                      type="text"
                      value={menuFormImage}
                      onChange={(e) => setMenuFormImage(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-500 text-slate-800 text-sm"
                      placeholder="https://images.unsplash.com/photo-..."
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 cursor-pointer select-none font-bold text-slate-600 text-sm">
                      <input
                        type="checkbox"
                        checked={menuFormIsVeg}
                        onChange={(e) => setMenuFormIsVeg(e.target.checked)}
                        className="h-4.5 w-4.5 accent-green-600 cursor-pointer"
                      />
                      Veg Option (Green indicator dot)
                    </label>
                  </div>

                  <div>
                    <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Description</label>
                    <textarea
                      value={menuFormDescription}
                      onChange={(e) => setMenuFormDescription(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-500 text-slate-800 text-sm"
                      placeholder="Ingredients, spice level, serving size..."
                      rows={3}
                    />
                  </div>

                  {/* Submit button */}
                  <div className="pt-4 border-t border-slate-50 flex gap-3 justify-end text-sm">
                    <button
                      type="button"
                      onClick={() => { setShowMenuModal(false); resetMenuForm(); }}
                      className="px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 font-bold text-slate-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-md shadow-primary-200"
                    >
                      {editingItemId ? 'Save Changes' : 'Create Item'}
                    </button>
                  </div>

                </form>

              </div>
            </div>
          )}

          </div>
        )
      )}

      {/* 3. STAFF / RIDERS TAB */}
      {activeTab === 'staff' && (
        restaurantStatus !== 'active' ? renderLockoutView() : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Register Rider Form (Col 1) */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
              <UserPlus className="h-5 w-5 text-primary-500" />
              Register Internal Rider
            </h3>
            <p className="text-xs text-slate-400 leading-normal">
              Register a member of your kitchen/internal staff as a delivery rider. They can log in immediately from the login screen using their phone number.
            </p>

            {staffError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                {staffError}
              </div>
            )}

            {staffSuccess && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs font-semibold">
                {staffSuccess}
              </div>
            )}

            <form onSubmit={handleRegisterStaff} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Rider Name</label>
                <input
                  type="text"
                  required
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-500 text-slate-800 text-sm font-semibold"
                  placeholder="e.g. Mike Rider"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={staffPhone}
                  onChange={(e) => setStaffPhone(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-500 text-slate-800 text-sm font-semibold"
                  placeholder="e.g. 9876543210"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl shadow-md shadow-primary-200 transition-colors"
              >
                Register Rider Staff
              </button>
            </form>
          </div>

          {/* Staff List (Col 2-3) */}
          <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
              <Users className="h-5 w-5 text-slate-400" />
              Active Delivery Fleet
            </h3>

            {staffList.length === 0 ? (
              <p className="text-sm font-semibold text-slate-400 text-center py-8">No delivery staff members registered yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {staffList.map((rider) => (
                  <div key={rider._id} className="py-4 flex justify-between items-center first:pt-0 last:pb-0">
                    <div>
                      <p className="font-extrabold text-slate-800 text-sm">{rider.name}</p>
                      <p className="text-xs text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {rider.phone}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wider bg-green-50 border border-green-200 text-green-700 uppercase">
                      Online / Active
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          </div>
        )
      )}

      {/* 4. PROFILE & ANALYTICS TAB */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left: Analytics and Restaurant Profile Settings */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Analytics Performance Cards */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Performance Analytics</h3>
                <p className="text-xs text-slate-400 mt-1 leading-normal font-semibold">
                  Real-time statistics for your restaurant. Platform commission is calculated at a flat 10% rate on all Delivered orders.
                </p>
              </div>

              {/* Stats Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Today Cards */}
                <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Today's Performance</span>
                  <div className="space-y-1">
                    <span className="block text-2xl font-black text-slate-800">₹{stats.todayRevenue}</span>
                    <span className="block text-xs font-semibold text-slate-500">Revenue (Delivered)</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200/50 flex justify-between text-[11px] text-slate-400 font-bold">
                    <span>Orders Today: <strong className="text-slate-700">{stats.todayOrdersCount}</strong></span>
                    <span>10% Commission: <strong className="text-primary-600">₹{stats.todayCommission}</strong></span>
                  </div>
                </div>

                {/* Monthly Cards */}
                <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">This Month's Performance</span>
                  <div className="space-y-1">
                    <span className="block text-2xl font-black text-slate-800">₹{stats.monthRevenue}</span>
                    <span className="block text-xs font-semibold text-slate-500">Revenue (Delivered)</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200/50 flex justify-between text-[11px] text-slate-400 font-bold">
                    <span>Orders Month: <strong className="text-slate-700">{stats.monthOrdersCount}</strong></span>
                    <span>10% Commission: <strong className="text-primary-600">₹{stats.monthCommission}</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Restaurant Profile Edit Form */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Restaurant Settings</h3>
                <p className="text-xs text-slate-400 mt-1 leading-normal font-semibold">
                  Customize how your restaurant is displayed to customers on the landing page catalog.
                </p>
              </div>

              {restError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                  {restError}
                </div>
              )}

              {restSuccess && (
                <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs font-semibold">
                  {restSuccess}
                </div>
              )}

              <form onSubmit={handleUpdateRestaurantProfile} className="space-y-4 text-xs font-semibold text-slate-600">
                <div>
                  <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Restaurant Name</label>
                  <input
                    type="text"
                    required
                    value={restFormName}
                    onChange={(e) => setRestFormName(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-500 text-slate-800 text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Banner Image URL</label>
                  <input
                    type="text"
                    required
                    value={restFormBanner}
                    onChange={(e) => setRestFormBanner(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-500 text-slate-850 text-sm"
                  />
                  {restFormBanner && (
                    <div className="mt-2 h-24 w-full rounded-xl overflow-hidden bg-slate-50 border border-slate-100">
                      <img src={restFormBanner} alt="Banner Preview" className="object-cover h-full w-full" onError={(e) => { (e.target as any).src = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1200' }} />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Cuisine Tags (Comma-separated)</label>
                  <input
                    type="text"
                    value={restFormCuisines}
                    onChange={(e) => setRestFormCuisines(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-500 text-slate-850 text-sm font-semibold"
                    placeholder="e.g. North Indian, Tandoor, Mughlai"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingRest}
                  className="bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md shadow-primary-200 disabled:opacity-50 transition-colors"
                >
                  {savingRest ? 'Saving Settings...' : 'Save Restaurant Settings'}
                </button>
              </form>
            </div>

          </div>

          {/* Right: Owner Personal Profile Settings */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Owner Profile</h3>
              <p className="text-xs text-slate-400 mt-1 leading-normal font-semibold">
                Manage your personal merchant owner account profile details.
              </p>
            </div>

            {ownerError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                {ownerError}
              </div>
            )}

            {ownerSuccess && (
              <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs font-semibold">
                {ownerSuccess}
              </div>
            )}

            <form onSubmit={handleUpdateOwnerName} className="space-y-4 text-xs font-semibold text-slate-600">
              <div>
                <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Your Full Name</label>
                <input
                  type="text"
                  required
                  value={ownerFormName}
                  onChange={(e) => setOwnerFormName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-500 text-slate-800 text-sm font-semibold"
                />
              </div>

              <button
                type="submit"
                disabled={savingOwner}
                className="w-full bg-slate-900 hover:bg-slate-850 text-white font-bold text-xs py-3 rounded-xl shadow-md disabled:opacity-50 transition-colors"
              >
                {savingOwner ? 'Saving Profile...' : 'Save Profile Changes'}
              </button>
            </form>
          </div>

        </div>
      )}

    </div>
  );
}
