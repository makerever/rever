// app/not-found.tsx
"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 py-12 text-center">
      <h1 className="text-6xl font-bold text-slate-800">404</h1>
      <p className="mt-4 text-lg text-gray-600">Oops! Page not found.</p>
      <p className="mt-1 text-sm text-gray-400">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-md bg-primary-500 transition duration-200 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600"
      >
        Go back home
      </Link>
    </div>
  );
}
