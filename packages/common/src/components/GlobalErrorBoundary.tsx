"use client";

import React from "react";
import { ErrorBoundary } from "react-error-boundary";
import { AlertTriangle } from "lucide-react";

function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div className="mt-24 flex flex-col items-center justify-center min-h-[60vh] px-6 py-12 text-center bg-white dark:bg-zinc-900 rounded-lg shadow-md border border-red-200 dark:border-red-400 max-w-2xl mx-auto">
      <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-100">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-semibold text-red-700 dark:text-red-100 mb-2">
        Something went wrong
      </h2>
      <p className="text-gray-700 dark:text-gray-300 mb-4">
        An unexpected error occurred while rendering the application. <br /> Our
        devs have already been notified (probably).
      </p>
      <pre className="text-sm text-left whitespace-pre-wrap bg-red-50 dark:bg-red-900 text-red-800 dark:text-red-200 p-4 rounded w-full overflow-x-auto mb-6">
        {error.message}
      </pre>
      <button
        onClick={resetErrorBoundary}
        className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded transition"
      >
        Refresh and try again
      </button>
    </div>
  );
}

export function GlobalErrorBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => window.location.reload()}
      onError={(error, info) => {
        console.error("Global error boundary caught:", error, info);
        // Optional: Integrate with logging service here
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
