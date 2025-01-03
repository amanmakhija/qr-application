"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle, AlertCircle, Coffee, ArrowLeft } from "lucide-react";
import axiosInstance from "@/utils/axiosInstance";

interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  tableNumber: string;
  status: "PENDING" | "PREPARING" | "COMPLETED" | "CANCELLED";
  items: OrderItem[];
  total: number;
  customerName: string;
  customerEmail: string;
  specialInstructions?: string;
  createdAt: string;
}

export default function OrderConfirmationPage({
  params,
}: {
  params: { orderId: string };
}) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await axiosInstance.get(`/orders/${params.orderId}`);
        if (response.status === 200) {
          setOrder(response.data);
        } else {
          throw new Error("Failed to fetch order");
        }
      } catch (err) {
        console.error("Error fetching order:", err);
        setError("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [params.orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Error Loading Order
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
          <Link
            href="/menu"
            className="inline-flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to Menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Order Confirmed!
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Thank you for your order, {order.customerName}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Order Details
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Order ID: {order.id}
                </p>
                {order.tableNumber && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Table: {order.tableNumber}
                  </p>
                )}
              </div>
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium
                ${
                  order.status === "PENDING"
                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                    : order.status === "PREPARING"
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    : order.status === "COMPLETED"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                }`}
              >
                {order.status}
              </div>
            </div>

            <div className="space-y-4">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center"
                >
                  <div className="flex items-center gap-2">
                    <Coffee className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">
                      {item.name}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      x{item.quantity}
                    </span>
                  </div>
                  <span className="text-gray-900 dark:text-white">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    Total
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    ${order.total.toFixed(2)}
                  </span>
                </div>
              </div>

              {order.specialInstructions && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Special Instructions
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {order.specialInstructions}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/menu"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
          >
            Order More
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
