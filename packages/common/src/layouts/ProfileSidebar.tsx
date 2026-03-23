// Component for displaying profile sidebar layout

"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronsUpDown } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  payablePathNameUrl,
  profileSidebarLinks,
  settingPathNameUrl,
  sidebarLinks,
} from "@rever/constants";
import { ProfileSidebarProps, Role } from "@rever/types";
import UserProfile from "../popup/UserProfile";
import { OutsideClickHandler } from "@rever/common";
import { useUserStore } from "@rever/stores";
import {
  filterSidebarByRole,
  getFirstLetter,
  getLabelForRoles,
} from "@rever/utils";
import { useTranslate } from "@rever/i18n";

// Main ProfileSidebar component
export function ProfileSidebar({
  isProfileSidebarCollapsed,
}: ProfileSidebarProps) {
  // State for open sub-menu, user profile popup, and hovered item (for collapsed mode)
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [showUserProfile, setShowUserProfile] = useState<boolean>(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const translate = useTranslate();
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

  // Open "Expenses" sub-menu if on a payable path and sidebar is expanded
  useEffect(() => {
    if (!isProfileSidebarCollapsed && payablePathNameUrl.includes(pathname)) {
      setOpenItem("Expenses");
    } else if (
      !isProfileSidebarCollapsed &&
      settingPathNameUrl.includes(pathname)
    ) {
      setOpenItem("Settings");
    } else {
      setOpenItem(null);
    }
  }, [isProfileSidebarCollapsed, pathname]);

  // Auto-open PERSONAL SETTINGS or ORGANIZATION SETTINGS based on current URL
  useEffect(() => {
    if (isProfileSidebarCollapsed) {
      setOpenItem(null);
      return;
    }

    const normalize = (u?: string) => (u ? u.replace(/\/+$/, "") : "") || "";
    const current = normalize(pathname);

    // ---------- PERSONAL SETTINGS ----------
    const personal = profileSidebarLinks.find(
      (l) => l.name === "PERSONAL SETTINGS",
    );

    if (personal?.subItems) {
      for (const sub of personal.subItems) {
        const urls = Array.isArray(sub.url) ? sub.url : [sub.url];
        if (
          urls.some(
            (u) =>
              normalize(u) === current ||
              current.startsWith(normalize(u) + "/"),
          )
        ) {
          setOpenItem("PERSONAL SETTINGS");
          return;
        }
      }
    }

    // ---------- ORGANIZATION SETTINGS ----------
    const org = profileSidebarLinks.find(
      (l) => l.name === "ORGANIZATION SETTINGS",
    );

    if (org?.subItems) {
      for (const sub of org.subItems) {
        const urls = Array.isArray(sub.url) ? sub.url : [sub.url];
        if (
          urls.some(
            (u) =>
              normalize(u) === current ||
              current.startsWith(normalize(u) + "/"),
          )
        ) {
          setOpenItem("ORGANIZATION SETTINGS");
          return;
        }
      }
    }

    // If nothing matched → close
    setOpenItem(null);
  }, [pathname, isProfileSidebarCollapsed]);

  return (
    <aside
      className={`fixed height_f p-4 flex flex-col justify-between z-20 top-0 left-0 border-r border-secondary-200 rounded-r-[20px] bg-white dark:bg-gray-900 transition-all duration-300 ${
        isProfileSidebarCollapsed ? "w-20" : "w-80"
      }`}
    >
      {/* Top section: Back to home and navigation links */}
      <div>
        {/* Back to home button */}
        <div
          className={`flex items-center ${isProfileSidebarCollapsed ? "justify-center" : "justify-start"} mb-6`}
        >
          {user?.role === "lite_user" ? (
            <div
              className="popup-btn rounded-[8px] size-8 btn-secondary-outline"
              onClick={() => router.push("/request-receipt/list")}
            >
              <ChevronLeft width={16} />
            </div>
          ) : (
            <>
              <div
                className="popup-btn rounded-[8px] size-8 btn-secondary-outline"
                onClick={() => router.push("/home")}
              >
                <ChevronLeft width={16} />
              </div>
            </>
          )}
        </div>
        {/* Navigation links */}
        <nav>
          <ul>
            {filterSidebarByRole(profileSidebarLinks, user?.role as Role).map(
              (link, index) =>
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
                      className={`flex rounded-md items-center p-1.5 text-neutral-1100 hover-effect
                           ${isProfileSidebarCollapsed ? "justify-center" : "justify-between"}`}
                    >
                      <div className="flex items-center justify-center text-neutral-700">
                        {link.icon}
                        {/* Show label if sidebar is expanded */}
                        {!isProfileSidebarCollapsed && (
                          <p className="ps-1.5 font-medium text-sm">
                            {link.i18nKey ? translate(link.i18nKey) : link.name}
                          </p>
                        )}
                      </div>
                      {/* Chevron for expanded/collapsed state */}
                      {!isProfileSidebarCollapsed && (
                        <ChevronDown
                          size={16}
                          className={`text-neutral-1100 duration-300 transform ${
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
                              className={`p-1.5 text-sm font-medium hover-effect text-neutral-1100 ${
                                isActive(sub.url)
                                  ? "bg-secondary-100 font-semibold"
                                  : ""
                              }`}
                              onClick={() => setHoveredItem(null)}
                            >
                              {sub.i18nKey ? translate(sub.i18nKey) : sub.name}
                            </li>
                          </Link>
                        ))}
                      </ul>
                    )}

                    {/* Expandable sub-menu for expanded sidebar */}
                    {!isProfileSidebarCollapsed && (
                      <ul
                        className={`overflow-hidden ms-4 ps-1.5 transition-all duration-700 ease-in-out border-l border-secondary-200 ${
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
                              className={`mt-1 p-1.5 text-sm font-medium flex items-center rounded-md hover-effect text-neutral-1100 ${
                                isActive(subItem.url)
                                  ? "bg-secondary-100 font-semibold"
                                  : ""
                              }`}
                            >
                              <li className="flex font-medium items-center">
                                {subItem.i18nKey ? translate(subItem.i18nKey) : subItem.name}
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
                      className={`p-1.5 text-sm font-medium flex items-center rounded-md hover-effect text-neutral-1100 ${
                        isActive(link.url)
                          ? "bg-secondary-100 font-semibold"
                          : ""
                      } ${isProfileSidebarCollapsed ? "justify-center" : ""}`}
                    >
                      <div className="flex items-center justify-center">
                        {link.icon}
                        {/* Show label if sidebar is expanded */}
                        {!isProfileSidebarCollapsed && (
                          <p className="ps-1.5 font-medium text-xs">
                            {link.i18nKey ? translate(link.i18nKey) : link.name}
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
      <div className="relative">
        {/* User profile section */}
        <OutsideClickHandler onClose={() => setShowUserProfile(false)}>
          <div
            onClick={() => setShowUserProfile(!showUserProfile)}
            className={`flex items-center cursor-pointer justify-center ${
              !isProfileSidebarCollapsed
                ? "hover-effect rounded-md py-1 px-1"
                : ""
            }`}
          >
            <div
              className={`text-sm font-semibold text-neutral-1100 w-10 h-10 min-w-10 min-h-10 flex justify-center items-center rounded-full bg-purple-100`}
            >
              {getFirstLetter(user?.first_name)}
              {getFirstLetter(user?.last_name)}
            </div>
            <div
              className={`w-full ms-2.5 transition-all duration-700 ${
                isProfileSidebarCollapsed
                  ? "hidden opacity-0 scale-95 pointer-events-none"
                  : "opacity-100 scale-100 pointer-events-auto"
              }`}
            >
              {!isProfileSidebarCollapsed && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-neutral-1100 text-sm font-medium max-w-32 overflow-hidden">
                      {user?.first_name} {user?.last_name}
                    </p>
                    <p className="mt-1 text-secondary-700 text-xs font-medium w-28 overflow-hidden">
                      {getLabelForRoles(user?.role || "")}
                    </p>
                  </div>
                  <ChevronsUpDown width={16} className="text-neutral-1100" />
                </div>
              )}
            </div>
          </div>

          {showUserProfile && (
            <div className="transition-all duration-300 ease-out">
              <UserProfile
                handlClick={(url) => {
                  setShowUserProfile(false);
                  router.push(url);
                }}
                isSidebarCollapsed={isProfileSidebarCollapsed}
              />
            </div>
          )}
        </OutsideClickHandler>
      </div>
    </aside>
  );
}
