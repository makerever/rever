// Page level loader to show when user change pages

"use client";

import Image from "next/image";

interface LoaderProps {
  className?: string;
}

export default function PageLoader({ className }: LoaderProps) {
  return (
    <div
      className={`${className ? className : "h-96 min-h-96"} w-full flex items-center justify-center backdrop-blur-xs`}
    >
      <Image
        src="/images/loaderGif.gif"
        alt="Rever loader"
        width={200}
        height={200}
        unoptimized
      />
    </div>
  );
}
