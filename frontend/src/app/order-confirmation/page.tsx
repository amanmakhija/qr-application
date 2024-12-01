"use client";

import Link from "next/link";
import { CheckCircle } from "lucide-react";

export default function OrderConfirmationPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-md">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Order Confirmed!
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          Your order has been successfully placed. We'll start preparing your
          items right away. You'll receive a confirmation email with your order
          details.
        </p>
        <div className="space-y-4">
          <Link
            href="/menu"
            className="block w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-3 rounded-full font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors duration-200"
          >
            Return to Menu
          </Link>
          <Link
            href="/"
            className="block w-full bg-transparent border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white py-3 rounded-full font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
          >
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
