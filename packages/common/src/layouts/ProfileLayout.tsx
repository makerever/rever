// Layout for profile setting screens

"use client";

import { useEffect } from "react";
import { ProfileSidebar } from "./ProfileSidebar";
import { useSidebarStore } from "@rever/stores";
import { Header } from "./Header";

const ProfileLayout = ({ children }: { children: React.ReactNode }) => {
  const { isCollapsed, toggleCollapse, setCollapse } = useSidebarStore();

  const toggleSidebar = () => {
    toggleCollapse();
  };

  // Automatically collapse sidebar on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCollapse(true); // Collapse sidebar on smaller screens
      } else {
        setCollapse(false);
      }
    };

    if (!isCollapsed) {
      handleResize();
    }

    // Set initial state based on current window size

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Clean up event listener on component unmount
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-secondary-200">
      <ProfileSidebar
        isProfileSidebarCollapsed={isCollapsed}
        setIsProfileSidebarCollapsed={toggleSidebar}
      />
      <div
        className={`flex-1 transition-all duration-300 ${
          !isCollapsed ? "md:ml-80 ml-20" : "ml-20"
        }`}
      >
        <Header
          isSidebarCollapsed={isCollapsed}
          setIsSidebarCollapsed={toggleSidebar}
        />
        <main className="">{children}</main>
      </div>
    </div>
  );
};

export default ProfileLayout;
