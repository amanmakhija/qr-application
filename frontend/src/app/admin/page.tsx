"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/utils/axiosInstance";
import {
  BarChart3,
  DollarSign,
  ShoppingBag,
  Users,
  Clock,
  Plus,
  List,
  Settings,
  TrendingUp,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface Analytics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  totalCustomers: number;
  recentOrders: Array<{
    id: string;
    status: string;
    finalAmount: number;
    createdAt: string;
  }>;
  popularItems: Array<{
    id: number;
    menuItem: {
      name: string;
    };
    totalQuantity: number;
    totalRevenue: number;
  }>;
  dailyOrders: Array<{
    id: string;
    createdAt: string;
    status: string;
    finalAmount: number;
    items: Array<{
      quantity: number;
      menuItem: {
        name: string;
      };
    }>;
  }>;
  monthlyOrders: Array<{
    id: string;
    createdAt: string;
    status: string;
    finalAmount: number;
  }>;
  ordersByStatus: {
    PENDING: number;
    PREPARING: number;
    COMPLETED: number;
    CANCELLED: number;
  };
  hourlyOrderDistribution: Array<{
    hour: number;
    count: number;
  }>;
  qrScans: Array<{
    id: string;
    scannedAt: string;
    tableNumber: string;
  }>;
}

export default function AdminPage() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeRange, setTimeRange] = useState<"day" | "week" | "month">("week");

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        let startDate: string;
        let endDate: string;
        if (timeRange === "day") {
          startDate = new Date().toISOString().split("T")[0];
          endDate = new Date().toISOString().split("T")[0];
        } else if (timeRange === "week") {
          startDate = new Date(new Date().setDate(new Date().getDate() - 7))
            .toISOString()
            .split("T")[0];
          endDate = new Date().toISOString().split("T")[0];
        } else {
          startDate = new Date(new Date().setDate(1))
            .toISOString()
            .split("T")[0];
          endDate = new Date().toISOString().split("T")[0];
        }

        const [
          revenueStats,
          dailyOrders,
          monthlyOrders,
          qrScans,
          popularItems,
        ] = await Promise.all([
          axiosInstance.get(
            `/analytics/revenue-stats?startDate=${startDate}&endDate=${endDate}`
          ),
          axiosInstance.get(`/analytics/daily-orders?date=${endDate}`),
          axiosInstance.get(
            `/analytics/monthly-orders?year=${new Date().getFullYear()}&month=${
              new Date().getMonth() + 1
            }`
          ),
          axiosInstance.get(
            `/analytics/qr-scans?startDate=${startDate}&endDate=${endDate}`
          ),
          axiosInstance.get(
            `/analytics/popular-items?startDate=${startDate}&endDate=${endDate}`
          ),
        ]);

        console.log({
          revenueStats,
          dailyOrders,
          monthlyOrders,
          qrScans,
          popularItems,
        });

        // Process orders by status
        const orderStatusCount = {
          PENDING: 0,
          PREPARING: 0,
          COMPLETED: 0,
          CANCELLED: 0,
        };

        dailyOrders.data.forEach((order: any) => {
          orderStatusCount[order.status as keyof typeof orderStatusCount]++;
        });

        // Process hourly distribution
        const hourlyDistribution = new Array(24).fill(0);
        dailyOrders.data.forEach((order: any) => {
          const hour = new Date(order.createdAt).getHours();
          hourlyDistribution[hour]++;
        });

        const hourlyOrderDist = hourlyDistribution.map((count, hour) => ({
          hour,
          count,
        }));

        setAnalytics({
          ...revenueStats.data,
          dailyOrders: dailyOrders.data,
          monthlyOrders: monthlyOrders.data,
          qrScans: qrScans.data,
          popularItems: popularItems.data,
          ordersByStatus: orderStatusCount,
          hourlyOrderDistribution: hourlyOrderDist,
          recentOrders: dailyOrders.data.slice(0, 5),
        });
      } catch (err) {
        console.error("Error fetching analytics:", err);
        setError("Failed to load analytics data");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [router, timeRange]);

  // Chart configurations
  const revenueChartData = {
    labels:
      analytics?.dailyOrders.map((order) =>
        new Date(order.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      ) || [],
    datasets: [
      {
        label: "Daily Revenue",
        data: analytics?.dailyOrders.map((order) => order.finalAmount) || [],
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1,
        fill: true,
        backgroundColor: "rgba(75, 192, 192, 0.1)",
      },
    ],
  };

  const dailyOrdersChartData = {
    labels:
      analytics?.dailyOrders.map((order) =>
        new Date(order.createdAt).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        })
      ) || [],
    datasets: [
      {
        label: "Orders",
        data:
          analytics?.dailyOrders.map((order) =>
            order.items.reduce((total, item) => total + item.quantity, 0)
          ) || [],
        borderColor: "rgb(99, 102, 241)",
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        tension: 0.1,
        fill: true,
      },
    ],
  };

  const monthlyOrdersChartData = {
    labels:
      analytics?.monthlyOrders.map((order) =>
        new Date(order.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      ) || [],
    datasets: [
      {
        label: "Orders",
        data: analytics?.monthlyOrders.map((order) => order.finalAmount) || [],
        borderColor: "rgb(244, 63, 94)",
        backgroundColor: "rgba(244, 63, 94, 0.1)",
        tension: 0.1,
        fill: true,
      },
    ],
  };

  const orderStatusChartData = {
    labels: ["Pending", "Preparing", "Completed", "Cancelled"],
    datasets: [
      {
        data: analytics
          ? [
              analytics.ordersByStatus.PENDING,
              analytics.ordersByStatus.PREPARING,
              analytics.ordersByStatus.COMPLETED,
              analytics.ordersByStatus.CANCELLED,
            ]
          : [],
        backgroundColor: [
          "rgba(255, 206, 86, 0.8)",
          "rgba(54, 162, 235, 0.8)",
          "rgba(75, 192, 192, 0.8)",
          "rgba(255, 99, 132, 0.8)",
        ],
      },
    ],
  };

  const hourlyOrdersChartData = {
    labels:
      analytics?.hourlyOrderDistribution.map((item) => `${item.hour}:00`) || [],
    datasets: [
      {
        label: "Orders by Hour",
        data:
          analytics?.hourlyOrderDistribution.map((item) => item.count) || [],
        backgroundColor: "rgba(54, 162, 235, 0.8)",
      },
    ],
  };

  const popularItemsChartData = {
    labels:
      analytics?.popularItems.map((item) => item.menuItem.name).slice(0, 5) ||
      [],
    datasets: [
      {
        label: "Orders",
        data:
          analytics?.popularItems
            .map((item) => item.totalQuantity)
            .slice(0, 5) || [],
        backgroundColor: "rgba(75, 192, 192, 0.8)",
      },
      {
        label: "Revenue",
        data:
          analytics?.popularItems
            .map((item) => item.totalRevenue)
            .slice(0, 5) || [],
        backgroundColor: "rgba(255, 159, 64, 0.8)",
      },
    ],
  };

  const qrScansChartData = {
    labels:
      analytics?.qrScans.map((scan) =>
        new Date(scan.scannedAt).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        })
      ) || [],
    datasets: [
      {
        label: "QR Scans",
        data: analytics?.qrScans.map((_, index) => index + 1) || [],
        borderColor: "rgb(147, 51, 234)",
        tension: 0.1,
        fill: false,
      },
    ],
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white" />
      </div>
    );
  }

  const quickActions = [
    {
      title: "Add Menu Item",
      icon: Plus,
      href: "/admin/menu/add",
      color: "bg-green-500",
    },
    {
      title: "View Orders",
      icon: List,
      href: "/admin/orders",
      color: "bg-blue-500",
    },
    {
      title: "Manage Staff",
      icon: Users,
      href: "/admin/staff",
      color: "bg-purple-500",
    },
    {
      title: "Settings",
      icon: Settings,
      href: "/admin/settings",
      color: "bg-gray-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Welcome back, {}
            </p>
          </div>
          <div className="flex gap-4">
            <Link
              href="/admin/generate"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 transition-colors duration-200"
            >
              Generate QR Codes
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-200 transform hover:-translate-y-1"
            >
              <div className="flex items-center">
                <div className={`${action.color} p-3 rounded-lg`}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="ml-4 text-lg font-medium text-gray-900 dark:text-white">
                  {action.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>

        {/* Time Range Selector */}
        <div className="mb-8">
          <div className="inline-flex p-1 space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
            {(["day", "week", "month"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-md transition-all duration-200 ${
                  timeRange === range
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Analytics Overview */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transform transition-all duration-200 hover:shadow-md hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Revenue
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-2">
                    ₹{analytics.totalRevenue.toFixed(2)}
                  </p>
                </div>
                <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
                  <DollarSign className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Orders
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {analytics.totalOrders}
                  </p>
                </div>
                <ShoppingBag className="h-8 w-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Average Order Value
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    ₹{analytics.averageOrderValue.toFixed(2)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-yellow-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Customers
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {analytics.totalCustomers}
                  </p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
            </div>
          </div>
        )}

        {/* Charts Grid */}
        {analytics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Revenue Trend */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Revenue Trend
              </h3>
              <div className="h-80">
                <Line
                  data={revenueChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "top" as const,
                        labels: {
                          boxWidth: 10,
                          usePointStyle: true,
                        },
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: "rgba(156, 163, 175, 0.1)",
                        },
                        ticks: {
                          callback: (value) => `₹${value}`,
                        },
                      },
                      x: {
                        grid: {
                          display: false,
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* Daily Orders Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Daily Orders
              </h3>
              <div className="h-80">
                <Line
                  data={dailyOrdersChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "top" as const,
                        labels: {
                          boxWidth: 10,
                          usePointStyle: true,
                        },
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: "rgba(156, 163, 175, 0.1)",
                        },
                      },
                      x: {
                        grid: {
                          display: false,
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* Monthly Orders Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Monthly Orders
              </h3>
              <div className="h-80">
                <Line
                  data={monthlyOrdersChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "top" as const,
                        labels: {
                          boxWidth: 10,
                          usePointStyle: true,
                        },
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: "rgba(156, 163, 175, 0.1)",
                        },
                        ticks: {
                          callback: (value) => `₹${value}`,
                        },
                      },
                      x: {
                        grid: {
                          display: false,
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* QR Scans Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                QR Code Scans
              </h3>
              <div className="h-80">
                <Line
                  data={qrScansChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "top" as const,
                        labels: {
                          boxWidth: 10,
                          usePointStyle: true,
                        },
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: "rgba(156, 163, 175, 0.1)",
                        },
                      },
                      x: {
                        grid: {
                          display: false,
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* Order Status Distribution */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Order Status Distribution
              </h3>
              <div className="h-80">
                <Doughnut
                  data={orderStatusChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                  }}
                />
              </div>
            </div>

            {/* Hourly Order Distribution */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Orders by Hour
              </h3>
              <div className="h-80">
                <Bar
                  data={hourlyOrdersChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: "rgba(156, 163, 175, 0.1)",
                        },
                      },
                      x: {
                        grid: {
                          display: false,
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* Popular Items */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Top 5 Items Performance
              </h3>
              <div className="h-80">
                <Bar
                  data={popularItemsChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: "rgba(156, 163, 175, 0.1)",
                        },
                      },
                      x: {
                        grid: {
                          display: false,
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Orders
                </h2>
                <Link
                  href="/admin/orders"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  View all
                </Link>
              </div>
              <div className="space-y-4">
                {analytics?.recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Order #{order.id}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(order.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        ₹{order.finalAmount.toFixed(2)}
                      </p>
                      <p
                        className={`text-sm ${
                          order.status === "COMPLETED"
                            ? "text-green-600 dark:text-green-400"
                            : order.status === "PENDING"
                            ? "text-yellow-600 dark:text-yellow-400"
                            : "text-blue-600 dark:text-blue-400"
                        }`}
                      >
                        {order.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Popular Items */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Popular Items
                </h2>
                <Link
                  href="/admin/menu"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  Manage menu
                </Link>
              </div>
              <div className="space-y-4">
                {analytics?.popularItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.menuItem.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {item.totalQuantity} orders
                      </p>
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      ₹{item.totalRevenue.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
