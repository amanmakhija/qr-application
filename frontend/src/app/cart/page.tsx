"use client";

import { useCart } from "@/contexts/CartContext";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, total, tableNumber } = useCart();

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Your cart is empty
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Add some items from our menu to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Your Cart
      </h1>

      {tableNumber && (
        <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
          <p className="text-blue-800 dark:text-blue-100">
            Table Number: {tableNumber}
          </p>
        </div>
      )}

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow"
          >
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {item.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                ₹{item.price.toFixed(2)}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  aria-label={`Decrease quantity of ${item.name}`}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  aria-label={`Increase quantity of ${item.name}`}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={() => removeItem(item.id)}
                aria-label={`Remove ${item.name} from cart`}
                className="p-2 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-semibold text-gray-900 dark:text-white">
            Total
          </span>
          <span className="text-lg font-semibold text-gray-900 dark:text-white">
            ₹{total.toFixed(2)}
          </span>
        </div>
        <button
          onClick={() => router.push("/checkout")}
          className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-3 rounded-full font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors duration-200"
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}
