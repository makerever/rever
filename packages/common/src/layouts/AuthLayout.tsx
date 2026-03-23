// Layout for authentication Screens

"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslate } from "@rever/i18n";

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
  const translate = useTranslate();
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted ? (
    <div className="px-4 lg:px-0 relative h-[calc(100vh-1px)] flex flex-col items-center justify-center">
      {/* Background - Light: Image, Dark: Color */}
      <div className="absolute inset-0 z-0">
        {/* Light Mode Background Image */}
        <div className="top-0 right-0 h-full w-full bg-[url('/images/authBackground.svg')] bg-no-repeat bg-right bg-cover dark:hidden" />
        {/* Dark Mode Background Color */}
        <div className="h-full w-full hidden dark:block bg-zinc-900" />
      </div>

      {/* Main Content */}
      <div className="auth-background-shadow rounded-2xl relative mx-6 lg:mx-0 w-full lg:w-162.5 bg-white z-10 flex justify-center items-center">
        <div className="px-4 py-12 md:px-16 md:py-12 w-full">
          <div className="flex justify-center">
            <Image
              src="/images/reverLogoGreen.svg"
              alt="Rever Logo"
              width={105}
              height={105}
            />
          </div>

          <div className="my-10">
            <h3 className="text-center text-neutral-1100 text-[28px] font-medium">
              {mainTitle}
            </h3>
            <h3 className="mt-1 text-base text-secondary-700 font-medium text-center">
              {subTitle}
            </h3>
          </div>

          {children}

          <div>
            {/* Terms and privacy policy notice */}
            <p className="text-secondary-700 font-medium text-xs text-center mt-8">
              {translate("auth.terms_notice")}
              the&nbsp;
              <a
                href="https://rever.ai/legal/terms-and-conditions"
                target="_blank"
              >
                <span className="underline font-medium cursor-pointer">
                  {translate("auth.terms_of_service")}
                </span>
              </a>
              ,&nbsp;
              <br />
              <a href="https://rever.ai/legal/eula" target="_blank">
                <span className="underline font-medium cursor-pointer">
                  {translate("auth.eula")}
                </span>{" "}
              </a>
              {translate("auth.and")}{" "}
              <a href="https://rever.ai/legal/privacy-policy" target="_blank">
                <span className="underline font-medium cursor-pointer">
                  {translate("auth.privacy_policy")}
                </span>
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  ) : null;
};

export default AuthLayout;
