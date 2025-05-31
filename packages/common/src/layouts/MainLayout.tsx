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
    <div className="flex min-h-screen dark:bg-zinc-900">
      <Sidebar
        isSidebarCollapsed={isCollapsed}
        setIsSidebarCollapsed={toggleSidebar}
      />
      <div
        className={`flex-1 transition-all duration-300 ${
          !isCollapsed ? "lg:ml-62 md:ml-62 ml-20" : "ml-20"
        }`}
      >
        <Header />
        <main className="pr-6 pb-5 ps-0">{children}</main>
      </div>
    </div>
  );
}
