// Reusable component for Tabs

"use client";

import { useEffect, useRef, useState } from "react";
import { TabsProps } from "@rever/types";

// Tabs component to render tab navigation UI
const Tabs: React.FC<TabsProps> = ({
  tabNames,
  activeTab,
  setActiveTab,
  separatorAt,
}) => {
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  // Update indicator position when activeTab changes
  useEffect(() => {
    const activeEl = tabRefs.current[activeTab || ""];
    if (activeEl) {
      const { offsetLeft, offsetWidth } = activeEl;
      setIndicatorStyle({ left: offsetLeft, width: offsetWidth });
    }
  }, [activeTab]);

  // Render underline style tabs by default
  return (
    <div className="relative">
      <div className={`flex relative border-b border-secondary-200`}>
        {tabNames?.map((tab, index) => (
          <button
            key={tab}
            ref={(el) => {
              tabRefs.current[tab] = el;
            }}
            onClick={() => setActiveTab?.(tab)}
            className={`my-2.5 px-5 text-sm font-medium cursor-pointer ${
              activeTab === tab
                ? "text-neutral-1100"
                : "hover:text-neutral-1100 text-secondary-700"
            } ${separatorAt && index === separatorAt ? "border-l border-secondary-200" : ""} `}
          >
            {tab}
          </button>
        ))}

        <div
          className="absolute -bottom-px h-0.5 bg-primary-600 transition-all duration-300 ease-in-out"
          style={{
            width: `${indicatorStyle.width}px`,
            transform: `translateX(${indicatorStyle.left}px)`,
            willChange: "transform",
          }}
        />
      </div>
    </div>
  );
};

export default Tabs;
