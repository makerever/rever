// Component for displaying profile sidebar layout

"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  Ellipsis,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { payablePathNameUrl, profileSidebarLinks } from "@rever/constants";
import { ProfileSidebarProps } from "@rever/types";
import UserProfile from "../popup/UserProfile";
import { OutsideClickHandler } from "@rever/common";
import { useUserStore } from "@rever/stores";
import { getFirstLetter } from "@rever/utils";

// Main ProfileSidebar component
export function ProfileSidebar({
  isProfileSidebarCollapsed,
  setIsProfileSidebarCollapsed,
}: ProfileSidebarProps) {
  // State for open sub-menu, user profile popup, and hovered item (for collapsed mode)
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [showUserProfile, setShowUserProfile] = useState<boolean>(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const pathname = usePathname(); // Current route path
  const user = useUserStore((state) => state.user); // Get user info from store
  const router = useRouter();

  // Toggle open/close for sub-menu items
  const toggleItem = (index: string) => {
    setOpenItem(openItem === index ? null : index);
  };

  // Check if a link is active based on current path
  const isActive = (url: string | string[]) => {
    if (Array.isArray(url)) {
      return url.some((u) => pathname === u);
    }
    return pathname === url;
  };

  // Close all sub-menus when sidebar is collapsed
  useEffect(() => {
    setOpenItem(null);
  }, [isProfileSidebarCollapsed]);

  // Open "Payables" sub-menu if on a payable path and sidebar is expanded
  useEffect(() => {
    if (!isProfileSidebarCollapsed && payablePathNameUrl.includes(pathname)) {
      setOpenItem("Payables");
    } else {
      setOpenItem(null);
    }
  }, [isProfileSidebarCollapsed, pathname]);

  return (
    <aside
      className={`fixed height_f px-3 pt-4 pb-2.5 flex flex-col justify-between z-20 top-0 left-0 bg-white dark:bg-gray-900 shadow-md transition-all duration-300 ${
        isProfileSidebarCollapsed ? "w-14" : "w-56"
      }`}
    >
      {/* Top section: Back to home and navigation links */}
      <div>
        {/* Back to home button */}
        <div
          onClick={() => router.push("/home")}
          className={`${!isProfileSidebarCollapsed ? "justify-normal" : "justify-center"} cursor-pointer flex items-center mb-4 text-sm text-slate-800 font-medium`}
        >
          <ChevronLeft width={16} />
          <p className={`${isProfileSidebarCollapsed ? "hidden" : ""}`}>
            Back to home
          </p>
        </div>
        {/* Navigation links */}
        <nav>
          <ul>
            {profileSidebarLinks.map((link, index) =>
              link.subItems ? (
                // If link has sub-items, render as expandable/collapsible menu
                <li
                  key={index}
                  className="my-1 relative"
                  onMouseEnter={() =>
                    isProfileSidebarCollapsed && setHoveredItem(link.name)
                  }
                  onMouseLeave={() =>
                    isProfileSidebarCollapsed && setHoveredItem(null)
                  }
                >
                  {/* Main menu item */}
                  <div
                    onClick={() => {
                      if (!isProfileSidebarCollapsed) toggleItem(link.name);
                    }}
                    className={`duration-1000 ease-in-out cursor-pointer flex justify-between rounded-md items-center p-2 transition-all hover:bg-slate-50 dark:hover:bg-gray-700 ${
                      isActive(link.url)
                        ? "text-primary-600 dark:text-white"
                        : "text-slate-800 dark:text-white"
                    }`}
                  >
                    <div className="flex items-center">
                      {link.icon}
                      {/* Show label if sidebar is expanded */}
                      {!isProfileSidebarCollapsed && (
                        <p className="ps-1.5 font-medium text-xs">
                          {link.name}
                        </p>
                      )}
                    </div>
                    {/* Chevron for expanded/collapsed state */}
                    {!isProfileSidebarCollapsed && (
                      <ChevronDown
                        size={16}
                        className={`text-slate-800 duration-300 transform ${
                          openItem === link.name ? "" : "-rotate-90"
                        }`}
                      />
                    )}
                  </div>

                  {/* Popup sub-menu for collapsed sidebar */}
                  {isProfileSidebarCollapsed && hoveredItem === link.name && (
                    <ul className="absolute popup-slide-left left-full top-0 mt-0 overflow-hidden w-36 bg-white dark:bg-gray-900 shadow-md rounded z-30">
                      {link.subItems.map((sub, i) => (
                        <Link
                          key={i}
                          href={Array.isArray(sub.url) ? sub.url[0] : sub.url}
                        >
                          <li
                            className={`px-4 py-2 text-xs font-medium cursor-pointer transition-colors ${
                              isActive(sub.url)
                                ? "bg-primary-100 text-primary-600 dark:text-white"
                                : "text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-gray-700"
                            }`}
                            onClick={() => setHoveredItem(null)}
                          >
                            {sub.name}
                          </li>
                        </Link>
                      ))}
                    </ul>
                  )}

                  {/* Expandable sub-menu for expanded sidebar */}
                  {!isProfileSidebarCollapsed && (
                    <ul
                      className={`overflow-hidden ms-5 ps-2 transition-all duration-700 ease-in-out ${
                        openItem === link.name
                          ? "max-h-64 opacity-100"
                          : "max-h-0 opacity-0"
                      }`}
                    >
                      {link.subItems.map((subItem, idx) => (
                        <Link
                          key={idx}
                          href={
                            Array.isArray(subItem.url)
                              ? subItem.url[0]
                              : subItem.url
                          }
                        >
                          <div
                            className={`flex items-center p-2 my-1 rounded-md transition-all ${
                              isActive(subItem.url)
                                ? "text-primary-600 bg-primary-100 dark:bg-gray-700 dark:text-white"
                                : "text-slate-800 dark:text-white hover:bg-slate-50"
                            }`}
                          >
                            <li className="flex font-medium items-center text-xs">
                              {subItem.name}
                            </li>
                          </div>
                        </Link>
                      ))}
                    </ul>
                  )}
                </li>
              ) : (
                // If link has no sub-items, render as a single link
                <Link
                  key={index}
                  href={Array.isArray(link.url) ? link.url[0] : link.url}
                >
                  <li
                    className={`p-2 mb-1 flex items-center rounded-md transition-all dark:hover:bg-gray-700 ${
                      isActive(link.url)
                        ? "text-primary-600 bg-primary-100 hover:bg-primary-100 dark:text-white"
                        : "text-slate-800 dark:text-white hover:bg-slate-50"
                    } ${isProfileSidebarCollapsed ? "justify-center" : ""}`}
                  >
                    <div className="flex items-center">
                      {link.icon}
                      {/* Show label if sidebar is expanded */}
                      {!isProfileSidebarCollapsed && (
                        <p className="ps-1.5 font-medium text-xs">
                          {link.name}
                        </p>
                      )}
                    </div>
                  </li>
                </Link>
              ),
            )}
          </ul>
        </nav>
      </div>

      {/* Bottom section: Collapse button and user profile */}
      <div>
        {/* Collapse/Expand sidebar button */}
        <div
          onClick={() => {
            if (setIsProfileSidebarCollapsed) setIsProfileSidebarCollapsed();
          }}
          className={`flex items-center ${
            isProfileSidebarCollapsed
              ? "justify-center w-8 h-8 min-w-8 min-h-8"
              : "px-2 py-1 justify-between"
          } cursor-pointer rounded-md text-slate-800 text-xs mb-1`}
        >
          {isProfileSidebarCollapsed ? (
            <ArrowRight width={16} />
          ) : (
            <ArrowLeft width={16} />
          )}
        </div>

        {/* User profile avatar and popup */}
        <OutsideClickHandler onClose={() => setShowUserProfile(false)}>
          <div
            onClick={() => setShowUserProfile(!showUserProfile)}
            className={`flex items-center cursor-pointer ${
              !isProfileSidebarCollapsed
                ? "hover-effect rounded-md py-1 px-1"
                : ""
            }`}
          >
            {/* User initials avatar */}
            <div
              className={`text-xs text-slate-800 w-8 h-8 min-w-8 min-h-8 flex justify-center items-center rounded-md bg-gray-200`}
            >
              {getFirstLetter(user?.first_name)}
              {getFirstLetter(user?.last_name)}
            </div>
            {/* User name and ellipsis (only if expanded) */}
            <div
              className={`w-full ms-2.5 transition-all duration-700 ${
                isProfileSidebarCollapsed
                  ? "opacity-0 scale-95 pointer-events-none"
                  : "opacity-100 scale-100 pointer-events-auto"
              }`}
            >
              {!isProfileSidebarCollapsed && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-800 text-xs font-semibold w-28 overflow-hidden">
                      {user?.first_name} {user?.last_name}
                    </p>
                  </div>
                  <Ellipsis width={16} className="text-gray-600" />
                </div>
              )}
            </div>
          </div>

          {/* User profile popup */}
          {showUserProfile && (
            <div className="transition-all  duration-300 ease-out">
              <UserProfile isSidebarCollapsed={isProfileSidebarCollapsed} />
            </div>
          )}
        </OutsideClickHandler>
      </div>
    </aside>
  );
}
