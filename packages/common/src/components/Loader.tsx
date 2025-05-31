// Page level loader to show when user change pages

"use client";

export default function PageLoader() {
  return (
    <div className="w-full h-96 min-h-96 flex items-center justify-center bg-white/60 backdrop-blur-sm">
      <div className="w-8 h-8 border-4 border-gray-300 border-t-primary-500 rounded-full animate-spin" />
    </div>
  );
}
