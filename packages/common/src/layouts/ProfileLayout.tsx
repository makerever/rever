// Layout for profile setting screens

"use client";

import { useEffect } from "react";
import { ProfileSidebar } from "./ProfileSidebar";
import { useSidebarStore } from "@rever/stores";

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
    <div className="flex min-h-screen">
      <ProfileSidebar
        isProfileSidebarCollapsed={isCollapsed}
        setIsProfileSidebarCollapsed={toggleSidebar}
      />
      <div
        className={`flex-1 transition-all duration-300 ${
          !isCollapsed ? "lg:ml-62 md:ml-62 ml-20" : "ml-20"
        }`}
      >
        <main className="pr-6 pt-10 pb-5 ps-0">{children}</main>
      </div>
    </div>
  );
};

export default ProfileLayout;
