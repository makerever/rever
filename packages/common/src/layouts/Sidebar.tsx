// Component for displaying sidebar layout

"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, ChevronDown, Ellipsis } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  payablePathNameUrl,
  settingPathNameUrl,
  sidebarLinks,
} from "@rever/constants";
import { Role, SidebarProps } from "@rever/types";
import UserProfile from "../popup/UserProfile";
import { OutsideClickHandler } from "@rever/common";
import { SearchInput } from "@rever/common";
import OrgProfile from "../popup/OrganizationProfile";
import { useUserStore } from "@rever/stores";
import { getFirstLetter } from "@rever/utils";
import { Modal } from "@rever/common";
import { CommandDemo } from "@rever/common";
import { filterSidebarByRole } from "@rever/utils";

// Sidebar component definition
export function Sidebar({
  isSidebarCollapsed,
  setIsSidebarCollapsed,
}: SidebarProps) {
  // State for tracking which sidebar item is open (expanded)
  const [openItem, setOpenItem] = useState<string | null>(null);
  // State for showing/hiding user profile popup
  const [showUserProfile, setShowUserProfile] = useState<boolean>(false);
  // State for showing/hiding organization profile popup
  const [showOrgProfile, setShowOrgProfile] = useState<boolean>(false);
  // State for tracking hovered sidebar item (for collapsed sidebar)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // State for global search modal visibility
  const [openGlobalSearchModal, setOpenGlobalSearchModal] =
    useState<boolean>(false);

  // Get current pathname and router instance
  const pathname = usePathname();
  const router = useRouter();

  // Get user data from store
  const user = useUserStore((state) => state.user);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdK = e.metaKey && e.key.toLowerCase() === "k";
      const isCtrlK = e.ctrlKey && e.key.toLowerCase() === "k";

      if (isCmdK || isCtrlK) {
        e.preventDefault();
        setOpenGlobalSearchModal(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Reset open item when sidebar is collapsed/expanded
  useEffect(() => {
    setOpenItem(null);
  }, [isSidebarCollapsed]);

  // Set open item based on current pathname and sidebar state
  useEffect(() => {
    const activeUrl =
      pathname?.split("/") && pathname?.split("/").length
        ? pathname?.split("/")[1]
        : "";
    if (!isSidebarCollapsed && payablePathNameUrl.includes(activeUrl)) {
      setOpenItem("Payables");
    } else if (!isSidebarCollapsed && settingPathNameUrl.includes(pathname)) {
      setOpenItem("Settings");
    } else {
      setOpenItem(null);
    }
  }, [isSidebarCollapsed, pathname]);

  // Toggle sidebar item open/close
  const toggleItem = (index: string) => {
    setOpenItem(openItem === index ? null : index);
  };

  // Check if a sidebar link is active based on current pathname
  const isActive = (url: string | string[], name?: string) => {
    if (Array.isArray(url)) {
      return name
        ? pathname.split("/").includes(name)
        : url.some((u) => pathname === u);
    }
    return pathname === url;
  };

  // Redirect to a route and close global search modal
  const redirectRoute = (url: string) => {
    setOpenGlobalSearchModal(false);
    router.push(url);
  };

  return (
    <>
      {/* Sidebar container */}
      <aside
        className={`fixed height_f px-3 pt-4 pb-2.5 flex flex-col justify-between z-20 top-0 left-0 bg-white dark:bg-gray-900 shadow-md transition-all duration-300 ${
          isSidebarCollapsed ? "w-14" : "w-56"
        }`}
      >
        <div>
          {/* Organization profile section */}
          <OutsideClickHandler onClose={() => setShowOrgProfile(false)}>
            <div
              onClick={() => setShowOrgProfile(!showOrgProfile)}
              className={`flex items-center cursor-pointer ${
                !isSidebarCollapsed
                  ? "hover-effect rounded-md py-1 px-1"
                  : "py-1"
              }`}
            >
              <div
                className={`text-xs text-white w-8 h-8 min-w-8 min-h-8 flex justify-center items-center rounded-md bg-primary-500`}
              >
                {getFirstLetter(user?.organization?.name)}
              </div>
              <div
                className={`w-full ms-2.5 transition-all duration-700 ${
                  isSidebarCollapsed
                    ? "opacity-0 scale-95 pointer-events-none"
                    : "opacity-100 scale-100 pointer-events-auto"
                }`}
              >
                {!isSidebarCollapsed && (
                  <div className="flex items-center justify-between">
                    <p className="text-slate-800 text-xs font-semibold mr-2 w-28 overflow-hidden">
                      {user?.organization?.name}
                    </p>
                    <ChevronDown width={16} className="text-gray-600" />
                  </div>
                )}
              </div>
            </div>
            {showOrgProfile && (
              <div className="transition-all duration-300 ease-out">
                <OrgProfile
                  user={user}
                  routeAction={(url) => {
                    router.push(url);
                    setShowOrgProfile(false);
                  }}
                  isSidebarCollapsed={isSidebarCollapsed}
                />
              </div>
            )}
          </OutsideClickHandler>

          {/* Global search input */}
          <div
            onClick={() => setOpenGlobalSearchModal(true)}
            className={`cursor-pointer mt-2 mb-3`}
          >
            <SearchInput onlyIcon={isSidebarCollapsed} />
          </div>

          {/* Sidebar navigation links */}
          <nav>
            <ul>
              {filterSidebarByRole(sidebarLinks, user?.role as Role).map(
                (link, index) =>
                  link.subItems ? (
                    // Sidebar item with sub-items (dropdown)
                    <li
                      key={index}
                      className="my-1 relative"
                      onMouseEnter={() =>
                        isSidebarCollapsed && setHoveredItem(link.name)
                      }
                      onMouseLeave={() =>
                        isSidebarCollapsed && setHoveredItem(null)
                      }
                    >
                      <div
                        onClick={() => {
                          if (!isSidebarCollapsed) toggleItem(link.name);
                        }}
                        className={`duration-1000 ease-in-out cursor-pointer flex rounded-md items-center p-2 transition-all hover:bg-slate-50 dark:hover:bg-gray-700 ${
                          isActive(link.url)
                            ? "text-primary-600 dark:text-white"
                            : "text-slate-800 dark:text-white"
                        } ${isSidebarCollapsed ? "justify-center" : "justify-between"}`}
                      >
                        <div className="flex items-center">
                          {link.icon}
                          {!isSidebarCollapsed && (
                            <p className="ps-1.5 font-medium text-xs">
                              {link.name}
                            </p>
                          )}
                        </div>
                        {!isSidebarCollapsed && (
                          <ChevronDown
                            size={16}
                            className={`text-slate-800 duration-300 transform ${
                              openItem === link.name ? "" : "-rotate-90"
                            }`}
                          />
                        )}
                      </div>

                      {/* Sub-items popup for collapsed sidebar */}
                      {isSidebarCollapsed && hoveredItem === link.name && (
                        <ul className="absolute popup-slide-left left-full top-0 mt-0 overflow-hidden w-36 bg-white dark:bg-gray-900 shadow-md rounded z-30">
                          {link.subItems.map((sub, i) => (
                            <Link
                              key={i}
                              href={
                                Array.isArray(sub.url) ? sub.url[0] : sub.url
                              }
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

                      {/* Sub-items dropdown for expanded sidebar */}
                      {!isSidebarCollapsed && (
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
                                  isActive(subItem.url, subItem?.key)
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
                    // Sidebar item without sub-items
                    <Link
                      key={index}
                      href={Array.isArray(link.url) ? link.url[0] : link.url}
                    >
                      <li
                        className={`p-2 flex items-center rounded-md transition-all dark:hover:bg-gray-700 ${
                          isActive(link.url)
                            ? "text-primary-600 bg-primary-100 hover:bg-primary-100 dark:text-white"
                            : "text-slate-800 dark:text-white hover:bg-slate-50"
                        } ${isSidebarCollapsed ? "justify-center" : ""}`}
                      >
                        <div className="flex items-center">
                          {link.icon}
                          {!isSidebarCollapsed && (
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

        {/* Sidebar footer: collapse button and user profile */}
        <div>
          {/* Sidebar collapse/expand button */}
          <div
            onClick={() => {
              if (setIsSidebarCollapsed) setIsSidebarCollapsed();
            }}
            className={`flex items-center ${
              isSidebarCollapsed
                ? "justify-center w-8 h-8 min-w-8 min-h-8"
                : "px-2 py-1 justify-between"
            } cursor-pointer rounded-md text-slate-800 text-xs mb-1`}
          >
            {isSidebarCollapsed ? (
              <ArrowRight width={16} />
            ) : (
              <ArrowLeft width={16} />
            )}
          </div>

          {/* User profile section */}
          <OutsideClickHandler onClose={() => setShowUserProfile(false)}>
            <div
              onClick={() => setShowUserProfile(!showUserProfile)}
              className={`flex items-center cursor-pointer ${
                !isSidebarCollapsed ? "hover-effect rounded-md py-1 px-1" : ""
              }`}
            >
              <div
                className={`text-xs text-slate-800 w-8 h-8 min-w-8 min-h-8 flex justify-center items-center rounded-md bg-gray-200`}
              >
                {getFirstLetter(user?.first_name)}
                {getFirstLetter(user?.last_name)}
              </div>
              <div
                className={`w-full ms-2.5 transition-all duration-700 ${
                  isSidebarCollapsed
                    ? "opacity-0 scale-95 pointer-events-none"
                    : "opacity-100 scale-100 pointer-events-auto"
                }`}
              >
                {!isSidebarCollapsed && (
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

            {showUserProfile && (
              <div className="transition-all  duration-300 ease-out">
                <UserProfile isSidebarCollapsed={isSidebarCollapsed} />
              </div>
            )}
          </OutsideClickHandler>
        </div>
      </aside>

      {/* Global search modal */}
      <Modal
        isOpen={openGlobalSearchModal}
        onClose={() => setOpenGlobalSearchModal(false)}
      >
        <CommandDemo redirectRoute={redirectRoute} />
      </Modal>
    </>
  );
}
