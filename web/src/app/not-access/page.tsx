// Not Access (401 Unauthorized) page

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

// Component for displaying a 401 Unauthorized access page
export default function NotAccess() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 py-12 text-center">
      <h1 className="text-6xl font-bold text-slate-800">401</h1>

      <p className="mt-4 text-lg text-gray-600">
        Uh-oh! Looks like you don’t have permission to view this page.
      </p>

      <p className="mt-1 text-sm text-gray-400">
        Either your role doesn’t give you access, or you’ve taken a wrong turn.
      </p>

      {/* Go back button, triggers router.back() on click */}
      <div onClick={() => router.back()}>
        <Link
          href="#"
          className="mt-6 inline-block rounded-md bg-primary-500 transition duration-200 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600"
        >
          Go back
        </Link>
      </div>
    </div>
  );
}
