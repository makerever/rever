// Popup UI for account profile

"use client";

import { clearAuthToken } from "@rever/services";
import { useUserStore } from "@rever/stores";
import { SidebarProps } from "@rever/types";
import { useLoader } from "@rever/common";
import { LogOut, Settings } from "lucide-react";
import { useRouter } from "next/navigation";

const UserProfile = ({ isSidebarCollapsed }: SidebarProps) => {
  const logoutUser = useUserStore((state) => state.logout);
  const { setShow } = useLoader();

  const router = useRouter();
  const logOut = () => {
    setShow(true);
    logoutUser();
    clearAuthToken(true);
  };

  return (
    <div
      className={`${
        isSidebarCollapsed ? "left-3" : "left-2"
      } popup-slide-up absolute bottom-14 z-20 w-44 rounded-md shadow-5xl bg-white p-2`}
    >
      <div className="menu-item" onClick={() => router.push("/profile")}>
        <Settings size={16} className="text-slate-800" />
        <p className="ms-1.5">Profile settings</p>
      </div>
      <div onClick={logOut} className="menu-item">
        <LogOut size={16} className="text-red-500" />
        <p className="ms-1.5 text-red-500">Logout</p>
      </div>
    </div>
  );
};

export default UserProfile;
