// Component for displaying sidebar layout

"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronsUpDown } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { payablePathNameUrl, sidebarLinks } from "@rever/constants";
import { Role, SidebarProps } from "@rever/types";
import UserProfile from "../popup/UserProfile";
import { OutsideClickHandler } from "@rever/common";
import { SearchInput } from "@rever/common";
import OrgProfile from "../popup/OrganizationProfile";
import { useUserStore } from "@rever/stores";
import { getFirstLetter, getLabelForRoles } from "@rever/utils";
import { Modal } from "@rever/common";
import { CommandDemo } from "@rever/common";
import { filterSidebarByRole } from "@rever/utils";
import Image from "next/image";
import { useTranslate } from "@rever/i18n";

// Sidebar component definition
export function Sidebar({ isSidebarCollapsed }: SidebarProps) {
  const translate = useTranslate();

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

  // Get org data from store
  const orgDetails = useUserStore((state) => state?.user?.organization);

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
      setOpenItem("Expenses");
    } else {
      setOpenItem(null);
    }
    // else if (!isSidebarCollapsed && settingPathNameUrl.includes(pathname)) {
    //   setOpenItem("Settings");
    // }
  }, [isSidebarCollapsed, pathname]);

  // Toggle sidebar item open/close
  const toggleItem = (index: string) => {
    setOpenItem(openItem === index ? null : index);
  };

  const stripTrailing = (s: string) => (s !== "/" ? s.replace(/\/+$/, "") : s);

  // Check if a sidebar link is active based on current pathname
  const isActive = (url: string | string[], name?: string) => {
    const current = stripTrailing(pathname);

    if (Array.isArray(url)) {
      return name
        ? pathname.split("/").includes(name)
        : url.some((u) => {
            const prefixMode = u.endsWith("/");
            const base = stripTrailing(u);

            if (prefixMode) {
              return current === base || current.startsWith(base + "/");
            }
            return current === base;
          });
    }

    const prefixMode = url.endsWith("/");
    const base = stripTrailing(url);
    return prefixMode
      ? current === base || current.startsWith(base + "/")
      : current === base;
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
        className={`fixed height_f p-4 flex flex-col justify-between z-20 top-0 left-0 border-r border-secondary-200 rounded-r-[20px] bg-white dark:bg-gray-900 transition-all duration-300 ${
          isSidebarCollapsed ? "w-20" : "w-80"
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
              {/* <div
                className={`text-xs text-white w-12 h-12 min-w-12 min-h-12 flex justify-center items-center rounded-md bg-primary-500`}
              >
                {getFirstLetter(user?.organization?.name)}
              </div> */}
              <div className="flex justify-center">
                <Image
                  src="/images/reverLogoGreenIcon.svg"
                  alt="Rever Logo"
                  width={54}
                  height={54}
                  className="w-12 h-12 min-w-12 min-h-12"
                />
              </div>
              <div
                className={`w-full ms-3 transition-all duration-700 ${
                  isSidebarCollapsed
                    ? "opacity-0 scale-95 pointer-events-none"
                    : "opacity-100 scale-100 pointer-events-auto"
                }`}
              >
                {!isSidebarCollapsed && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-neutral-1100 text-sm font-semibold w-28 overflow-hidden">
                        {user?.organization?.name}
                      </p>
                    </div>
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
            className={`cursor-pointer mt-4 mb-3`}
          >
            <SearchInput onlyIcon={isSidebarCollapsed} noCmdIcon />
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
                        className={`flex rounded-md items-center p-1.5 text-neutral-1100 hover-effect
                           ${isSidebarCollapsed ? "justify-center" : "justify-between"}`}
                      >
                        <div className="flex items-center">
                          {link.icon}
                          {!isSidebarCollapsed && (
                            <p className="ps-1.5 font-medium text-sm">
                              {link.i18nKey ? translate(link.i18nKey) : link.name}
                            </p>
                          )}
                        </div>
                        {!isSidebarCollapsed && (
                          <ChevronDown
                            size={16}
                            className={`text-neutral-1100 duration-300 transform ${
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

                      {/* Sub-items dropdown for expanded sidebar */}
                      {!isSidebarCollapsed && (
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
                                  isActive(subItem.url, subItem?.key)
                                    ? "bg-secondary-100 font-semibold"
                                    : ""
                                }`}
                              >
                                <li className="flex items-center">
                                  {subItem.i18nKey ? translate(subItem.i18nKey) : subItem.name}
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
                        className={`p-1.5 text-sm font-medium flex items-center rounded-md hover-effect text-neutral-1100 ${
                          isActive(link.url)
                            ? "bg-secondary-100 font-semibold"
                            : ""
                        } ${isSidebarCollapsed ? "justify-center" : ""}`}
                      >
                        <div className="flex items-center">
                          {link.icon}
                          {!isSidebarCollapsed && (
                            <p className="ps-1.5">{link.i18nKey ? translate(link.i18nKey) : link.name}</p>
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
        <div className="relative">
          {/* User profile section */}
          <OutsideClickHandler onClose={() => setShowUserProfile(false)}>
            <div
              onClick={() => setShowUserProfile(!showUserProfile)}
              className={`flex items-center cursor-pointer justify-center ${
                !isSidebarCollapsed ? "hover-effect rounded-md py-1 px-1" : ""
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
                  isSidebarCollapsed
                    ? "hidden opacity-0 scale-95 pointer-events-none"
                    : "opacity-100 scale-100 pointer-events-auto"
                }`}
              >
                {!isSidebarCollapsed && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-neutral-1100 text-sm font-semibold max-w-32 overflow-hidden">
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
                  isSidebarCollapsed={isSidebarCollapsed}
                />
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
