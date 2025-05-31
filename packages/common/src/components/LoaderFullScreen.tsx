// Full screen loader to show when user refresh page

"use client";

import { useEffect, useState } from "react";

export default function HydrationLoader({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setHydrated(true);
    }, 300);
    return () => clearTimeout(timeout);
  }, []);

  if (!hydrated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
