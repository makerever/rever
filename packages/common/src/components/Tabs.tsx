// Reusable component for Tabs

"use client";

import { useEffect, useRef, useState } from "react";
import { TabsProps } from "@rever/types";
import { useTranslate } from "@rever/i18n";

// Maps English tab values to i18n keys
const TAB_TRANSLATION_KEYS: Record<string, string> = {
  "All bills": "bills.stage.all_bills",
  "All POs": "purchase_order.stagebar.all_pos",
  "All vendor credits": "vendors.vendor_credit.stagebar.all_vendor_credits",
  "Overview": "bills.stage.overview",
  "Under review": "bills.stage.under_review",
  "Under approval": "bills.stage.under_approval",
  "Approved": "bills.stage.approved",
  "Rejected": "bills.stage.rejected",
  "Draft": "purchase_order.stagebar.draft",
  "Ledger entry": "bills.stage.ledger_entry",
  "Active members": "members.active_members",
  "Invited members": "members.invited_members",
  "PO approval": "members.po_approval",
  "Bill approval": "members.bill_approval",
  "Vendor credit approval": "members.vendor_credit_approval",
  Open: "confirmations.open",
  Closed: "confirmations.closed",
  Revoked: "confirmations.revoked",
};

// Tabs component to render tab navigation UI
const Tabs: React.FC<TabsProps> = ({
  tabNames,
  activeTab,
  setActiveTab,
  separatorAt,
}) => {
  const translate = useTranslate();
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
            {TAB_TRANSLATION_KEYS[tab] ? translate(TAB_TRANSLATION_KEYS[tab]) : tab}
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
