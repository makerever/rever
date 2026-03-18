// Entry point for the Next.js application

import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import {
  GlobalErrorBoundary,
  HydrationLoader,
  SafeHydrate,
} from "@rever/common";
import { I18nProvider } from "@rever/i18n";


const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Rever | AI Driven Finance Transformation",
  description:
    "Automated invoicing, accounting, approvals, 3-way matching, vendor management, and more. Simplify your accounting and financial workflows.",
  keywords:
    "3-way matching software, automated invoicing, vendor management, purchase order management, receipt tracking, Chart of Accounts software, bill posting integrations, financial reconciliation, accounting SaaS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <meta name="theme-color" content="#1e40af" />
        <link rel="icon" href="/icons/favicon.ico.svg" />
      </head>
      <body className={`${geist.className} scale-wrapper`}>
        <SafeHydrate>
          <HydrationLoader>
            <I18nProvider>
              <GlobalErrorBoundary>{children}</GlobalErrorBoundary>
            </I18nProvider>
          </HydrationLoader>
          {/* <ThemeProvider /> */}
          <Toaster position="bottom-right" duration={2500} />
        </SafeHydrate>
      </body>
    </html>
  );
}
