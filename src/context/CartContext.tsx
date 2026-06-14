'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  name: string;
  price: number;
  quantity: number;
  isVeg: boolean;
}

interface CartContextType {
  cartItems: CartItem[];
  restaurantId: string | null;
  restaurantName: string | null;
  addToCart: (item: { name: string; price: number; isVeg: boolean }, restId: string, restName: string) => void;
  removeFromCart: (itemName: string) => void;
  updateQuantity: (itemName: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getItemQuantity: (itemName: string) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    const savedRestId = localStorage.getItem('cart_restaurant_id');
    const savedRestName = localStorage.getItem('cart_restaurant_name');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse cart');
      }
    }
    if (savedRestId) setRestaurantId(savedRestId);
    if (savedRestName) setRestaurantName(savedRestName);
    setIsLoaded(true);
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('cart', JSON.stringify(cartItems));
    if (restaurantId) {
      localStorage.setItem('cart_restaurant_id', restaurantId);
    } else {
      localStorage.removeItem('cart_restaurant_id');
    }
    if (restaurantName) {
      localStorage.setItem('cart_restaurant_name', restaurantName);
    } else {
      localStorage.removeItem('cart_restaurant_name');
    }
  }, [cartItems, restaurantId, restaurantName, isLoaded]);

  const addToCart = (item: { name: string; price: number; isVeg: boolean }, restId: string, restName: string) => {
    // If adding from a new restaurant, confirm or clear the cart
    if (restaurantId && restaurantId !== restId) {
      if (confirm('Clear your cart to add items from this restaurant?')) {
        setCartItems([{ ...item, quantity: 1 }]);
        setRestaurantId(restId);
        setRestaurantName(restName);
      }
      return;
    }

    if (!restaurantId) {
      setRestaurantId(restId);
      setRestaurantName(restName);
    }

    setCartItems((prevItems) => {
      const existing = prevItems.find((i) => i.name === item.name);
      if (existing) {
        return prevItems.map((i) =>
          i.name === item.name ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prevItems, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemName: string) => {
    setCartItems((prevItems) => {
      const filtered = prevItems.filter((i) => i.name !== itemName);
      if (filtered.length === 0) {
        setRestaurantId(null);
        setRestaurantName(null);
      }
      return filtered;
    });
  };

  const updateQuantity = (itemName: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemName);
      return;
    }
    setCartItems((prevItems) =>
      prevItems.map((i) => (i.name === itemName ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setRestaurantId(null);
    setRestaurantName(null);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getItemQuantity = (itemName: string) => {
    const item = cartItems.find((i) => i.name === itemName);
    return item ? item.quantity : 0;
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        restaurantId,
        restaurantName,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getItemQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
