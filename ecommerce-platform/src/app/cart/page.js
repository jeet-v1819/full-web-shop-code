"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import Navigation from "@/components/navigation";
import Header from "@/components/header";

function CartContent() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load cart items from localStorage for now (demo)
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        setCartItems([]);
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span>Loading cart...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="py-8">
        <Navigation />
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-2xl font-bold mb-6">Shopping Cart</h1>
          {cartItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Your cart is empty</p>
              <Link href="/products" className="text-green-700 hover:underline">
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item, index) => (
                <div key={index} className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm">
                  <div className="w-20 h-20 bg-gray-200 rounded">
                    <img
                      src={item.image || "/placeholder-product.jpg"}
                      alt={item.name}
                      className="w-full h-full object-cover rounded"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function CartPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <CartContent />
    </Suspense>
  );
}
