// Page level loader to show when user change pages

"use client";

import Image from "next/image";

export default function PageLoader() {
  return (
    <div className="w-full h-96 min-h-96 flex items-center justify-center bg-white/60 backdrop-blur-sm">
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
