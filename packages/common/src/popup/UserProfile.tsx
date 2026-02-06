// Popup UI for account profile

"use client";

import { clearAuthToken } from "@rever/services";
import { useUserStore } from "@rever/stores";
import { SidebarProps } from "@rever/types";
import { useLoader } from "@rever/common";
import { getFirstLetter, getLabelForRoles } from "@rever/utils";

const UserProfile = ({ isSidebarCollapsed, handlClick }: SidebarProps) => {
  const logoutUser = useUserStore((state) => state.logout);
  const user = useUserStore((state) => state.user);
  const { setShow } = useLoader();

  const logOut = () => {
    setShow(true);
    logoutUser();
    clearAuthToken(true);
  };

  return (
    <div
      className={`${
        isSidebarCollapsed ? "left-3" : "left-2"
      } popup-slide-up absolute bottom-12 z-20 w-68 py-3 rounded-[8px] popup-shadow bg-white`}
    >
      {/* User Profile Section */}
      <div
        className={`flex items-center justify-center border-b border-neutral-200 px-3 pb-3`}
      >
        <div
          className={`text-sm font-semibold text-neutral-1100 w-10 h-10 min-w-10 min-h-10 flex justify-center items-center rounded-full bg-purple-100`}
        >
          {getFirstLetter(user?.first_name)}
          {getFirstLetter(user?.last_name)}
        </div>
        <div
          className={`w-full ml-2 transition-all duration-700 opacity-100 scale-100 pointer-events-auto`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-neutral-1100 text-sm font-semibold max-w-32 overflow-hidden">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="mt-1 text-secondary-700 text-xs font-medium w-28 overflow-hidden">
                {getLabelForRoles(user?.role || "")}
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Settings Navigation Section */}
      <div className="px-1.5 py-2 border-b border-neutral-200">
        <div
          className="menu-item menu-item-sidebar"
          onClick={() => {
            handlClick && handlClick("/profile");
          }}
        >
          <p>Profile</p>
        </div>
        <div
          className="menu-item menu-item-sidebar"
          onClick={() => {
            handlClick && handlClick("/settings/general");
          }}
        >
          <p className="">Settings</p>
        </div>
        {/* Stop showing subscription, members and documents fields for lite user */}
        {user?.role !== "lite_user" ? (
          <>
            {/* Members Field */}
            <div
              className="menu-item menu-item-sidebar"
              onClick={() => {
                handlClick && handlClick("/settings/members");
              }}
            >
              <p className="">Members</p>
            </div>
          </>
        ) : null}
      </div>
      <div className="px-1.5 pt-2">
        <div onClick={logOut} className="menu-item menu-item-sidebar-danger">
          <p className="">Logout</p>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
