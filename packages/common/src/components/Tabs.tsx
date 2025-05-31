// Reusable component for Tabs

"use client";

import { useEffect, useRef, useState } from "react";
import { TabsProps } from "@rever/types";

// Tabs component to render tab navigation UI
const Tabs: React.FC<TabsProps> = ({
  tabNames,
  activeTab,
  setActiveTab,
  noLine = false,
  tabStyleBox = false,
}) => {
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  // Update indicator position when activeTab changes
  useEffect(() => {
    if (tabStyleBox || noLine) return;

    const activeEl = tabRefs.current[activeTab || ""];
    if (activeEl) {
      const { offsetLeft, offsetWidth } = activeEl;
      setIndicatorStyle({ left: offsetLeft, width: offsetWidth });
    }
  }, [activeTab, tabStyleBox, noLine]);

  // Render box style tabs if tabStyleBox is true
  if (tabStyleBox) {
    return (
      <div className="flex bg-white dark:bg-gray-900 rounded-lg p-0.5">
        {tabNames?.map((tab) => (
          <div
            key={tab}
            className={`cursor-pointer font-medium text-xs py-2 px-3 text-center ${
              activeTab === tab
                ? "rounded-lg text-primary-600 dark:text-white bg-primary-100 dark:bg-gray-800"
                : "text-slate-500 dark:text-gray-400"
            }`}
            onClick={() => setActiveTab?.(tab)}
          >
            {tab}
          </div>
        ))}
      </div>
    );
  }

  // Render underline style tabs by default
  return (
    <div className="relative">
      <div
        className={`flex relative ${
          !noLine ? "border-b border-slate-100 dark:border-gray-700" : ""
        }`}
      >
        {tabNames?.map((tab) => (
          <button
            key={tab}
            ref={(el) => {
              tabRefs.current[tab] = el;
            }}
            onClick={() => setActiveTab?.(tab)}
            className={`py-1 mr-6 text-xs font-medium ${
              activeTab === tab
                ? "text-primary-600"
                : "hover:text-primary-600 text-slate-500 dark:text-gray-400"
            }`}
          >
            {tab}
          </button>
        ))}

        {!noLine && (
          <div
            className="absolute bottom-0 h-0.5 bg-primary-600 transition-all duration-300 ease-in-out"
            style={{
              width: `${indicatorStyle.width}px`,
              transform: `translateX(${indicatorStyle.left}px)`,
              willChange: "transform",
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Tabs;
