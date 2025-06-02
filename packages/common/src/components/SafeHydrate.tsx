"use client";

import { useEffect, useState } from "react";

export default function SafeHydrate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null; // skip render on server
  }

  return <>{children}</>;
}
