import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-3xl text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
          Welcome to Café QR
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          Scan the QR code at your table to browse our menu and place your order
        </p>
        <Link
          href="/menu"
          className="inline-block bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-8 py-3 rounded-full text-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors duration-200"
        >
          View Menu
        </Link>
      </div>
    </div>
  );
}
