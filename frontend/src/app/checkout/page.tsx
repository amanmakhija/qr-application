"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import { AlertCircle } from "lucide-react";
import axiosInstance from "@/utils/axiosInstance";

interface CheckoutForm {
  name: string;
  email: string;
  specialInstructions: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, tableNumber, clearCart } = useCart();
  const [formData, setFormData] = useState<CheckoutForm>({
    name: "",
    email: "",
    specialInstructions: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (items.length === 0) {
    router.push("/menu");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      // Create order in backend
      const response = await axiosInstance.post("/orders", {
        items: items.map((item) => ({
          menuItemId: item.id.toString(),
          quantity: item.quantity,
        })),
        tableNumber,
        specialNotes: formData.specialInstructions,
      });

      if (response.status === 201) {
        clearCart();
        router.push(`/order-confirmation/${response.data.id}`);
      } else {
        throw new Error("Failed to create order");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setError("Failed to process your order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Checkout
        </h1>

        {tableNumber && (
          <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
            <p className="text-blue-800 dark:text-blue-100">
              Table Number: {tableNumber}
            </p>
          </div>
        )}

        {error && (
          <div className="mb-8 p-4 bg-red-100 dark:bg-red-900 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-800 dark:text-red-200" />
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Order Summary
            </h2>
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center"
                >
                  <div>
                    <span className="text-gray-900 dark:text-white">
                      {item.name}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 ml-2">
                      x{item.quantity}
                    </span>
                  </div>
                  <span className="text-gray-900 dark:text-white">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    Total
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    ₹{total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Name
            </label>
            <input
              type="text"
              id="name"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="specialInstructions"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Special Instructions (Optional)
            </label>
            <textarea
              id="specialInstructions"
              rows={3}
              value={formData.specialInstructions}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  specialInstructions: e.target.value,
                })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-3 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white dark:border-gray-900 mr-2" />
                Processing...
              </>
            ) : (
              "Place Order"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
