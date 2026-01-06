// Layout for after authentication Screens

"use client";

import { useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useSidebarStore } from "@rever/stores";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
    <div className="flex min-h-screen dark:bg-zinc-900 bg-secondary-200 border-r border-secondary-200">
      <Sidebar
        isSidebarCollapsed={isCollapsed}
        setIsSidebarCollapsed={toggleSidebar}
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
        <main className="flex-1 overflow-auto ps-0">{children}</main>
      </div>
    </div>
  );
}
