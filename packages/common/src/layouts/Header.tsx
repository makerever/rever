// Component for displaying header layout

"use client";

import { CircleHelp, PanelLeft } from "lucide-react";
import { Breadcrumb, CustomTooltip } from "@rever/common";
import { usePathname } from "next/navigation";
import { OutsideClickHandler } from "@rever/common";
import { useState } from "react";
import HelpSupport from "../popup/HelpSupport";
import { useUserStore } from "@rever/stores";
import { SidebarProps } from "@rever/types";
// import SearchInput from "../common/inputFields/searchInput/SearchInput";

export function Header({ setIsSidebarCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const [showSupport, setShowSupport] = useState(false);

  return (
    <header className="bg-secondary-200">
      <div
        className={`text-neutral-1100 flex items-center justify-between rounded-t-[20px] border border-b-0 border-secondary-200 bg-white p-4 h-12`}
      >
        <div className="flex items-center">
          <PanelLeft
            size={16}
            onClick={() => {
              if (setIsSidebarCollapsed) setIsSidebarCollapsed();
            }}
            className="text-shadow-neutral-1100 cursor-pointer"
          />
          <span className="text-neutral-200 px-3">/</span>
          <Breadcrumb />
        </div>
        {pathname === "/home" ? (
          <div className="flex items-center gap-3">
            <CustomTooltip content="Star us on GitHub">
              <a href="https://github.com/makerever/rever" target="_blank">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-github-icon lucide-github"
                >
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                  <path d="M9 18c-4.51 2-5-2-7-2" />
                </svg>
              </a>
            </CustomTooltip>
            <OutsideClickHandler onClose={() => setShowSupport(false)}>
              <CustomTooltip content="Help">
                <div>
                  <CircleHelp
                    onClick={() => setShowSupport(!showSupport)}
                    width={16}
                    className="cursor-pointer"
                  />
                </div>
              </CustomTooltip>
              {showSupport && (
                <div className="transition-all duration-300 ease-out">
                  <HelpSupport />
                </div>
              )}
            </OutsideClickHandler>
          </div>
        ) : null}
      </div>
    </header>
  );
}
