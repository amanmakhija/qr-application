"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import axiosInstance from "@/utils/axiosInstance";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Coffee,
  AlertCircle,
  ChefHat,
  Search,
  Filter,
} from "lucide-react";

interface Order {
  id: string;
  tableNumber: string;
  status: "PENDING" | "PREPARING" | "COMPLETED" | "CANCELLED";
  items: {
    id: number;
    name: string;
    quantity: number;
    price: number;
  }[];
  total: number;
  createdAt: string;
}

const statusColors = {
  PENDING:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  PREPARING: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  COMPLETED:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const statusIcons = {
  PENDING: Clock,
  PREPARING: ChefHat,
  COMPLETED: CheckCircle2,
  CANCELLED: XCircle,
};

export default function StaffDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axiosInstance.get("/orders/active");
      setOrders(response.data);
      setError("");
    } catch (err) {
      setError("Failed to fetch orders");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (
    orderId: string,
    newStatus: Order["status"]
  ) => {
    try {
      await axiosInstance.patch(`/orders/${orderId}`, { status: newStatus });
      fetchOrders(); // Refresh orders after update
    } catch (err) {
      console.error(err);
      setError("Failed to update order status");
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      statusFilter === "ALL" || order.status === statusFilter;
    const matchesSearch =
      order.tableNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items.some((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Staff Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Welcome back, {user?.name}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent appearance-none"
              >
                <option value="ALL">All Orders</option>
                <option value="PENDING">Pending</option>
                <option value="PREPARING">Preparing</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-100 dark:bg-red-900 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-800 dark:text-red-200" />
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((order) => {
            const StatusIcon = statusIcons[order.status];
            return (
              <div
                key={order.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Table {order.tableNumber}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full flex items-center gap-1 ${
                        statusColors[order.status]
                      }`}
                    >
                      <StatusIcon className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {order.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
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
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        Total
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        ${order.total.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      {order.status === "PENDING" && (
                        <button
                          onClick={() =>
                            updateOrderStatus(order.id, "PREPARING")
                          }
                          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md transition-colors duration-200"
                        >
                          Start Preparing
                        </button>
                      )}
                      {order.status === "PREPARING" && (
                        <button
                          onClick={() =>
                            updateOrderStatus(order.id, "COMPLETED")
                          }
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-md transition-colors duration-200"
                        >
                          Mark Completed
                        </button>
                      )}
                      {(order.status === "PENDING" ||
                        order.status === "PREPARING") && (
                        <button
                          onClick={() =>
                            updateOrderStatus(order.id, "CANCELLED")
                          }
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-md transition-colors duration-200"
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <Coffee className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
              No orders found
            </h3>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              {searchTerm || statusFilter !== "ALL"
                ? "Try adjusting your filters"
                : "New orders will appear here"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
