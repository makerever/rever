// Layout for authentication Screens

"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const AuthLayout = ({
  children,
  mainTitle,
  subTitle,
}: Readonly<{
  children: React.ReactNode;
  mainTitle: string;
  subTitle: string;
}>) => {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted ? (
    <div className="relative height_f flex flex-col items-start justify-center lg:p-10 p-4 overflow-hidden">
      {/* Background - Light: Image, Dark: Color */}
      <div className="absolute inset-0 z-0">
        {/* Light Mode Background Image */}
        <div className="h-full w-full bg-[url('/images/authBackground2.png')] bg-[length:100%_100%] bg-no-repeat opacity-30 dark:hidden" />
        {/* Dark Mode Background Color */}
        <div className="h-full w-full hidden dark:block bg-zinc-900" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex justify-center items-center flex-1 w-full lg:p-10">
        <div className="card w-full max-w-[450px] rounded-xl lg:p-10 lg:pb-6 p-4">
          <div className="flex">
            <Image
              src="/images/reverLogo.svg"
              alt="Rever Logo"
              width={40}
              height={40}
            />
          </div>

          <div className="mt-6 mb-10">
            <h3 className="mb-1 text-slate-800 dark:text-slate-100 text-2xl font-semibold">
              {mainTitle}
            </h3>
            <h3 className="text-slate-500 dark:text-slate-300 text-sm font-light">
              {subTitle}
            </h3>
          </div>

          {children}
        </div>
      </div>
    </div>
  ) : null;
};

export default AuthLayout;
