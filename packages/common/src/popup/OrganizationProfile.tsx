// Popup UI for Organization profile

"use client";

import { getFirstLetter, getLabelForRoles, hasPermission } from "@rever/utils";
import { clearAuthToken } from "@rever/services";
import { useUserStore } from "@rever/stores";
import { SidebarProps } from "@rever/types";
import { LoggedUserProps } from "@rever/types";
import { CirclePlus, Dot, LogOut, UserRoundPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLoader } from "@rever/common";

// OrgProfile component displays a popup with organization actions and profile info
const OrgProfile = ({
  isSidebarCollapsed,
  routeAction,
  user,
}: SidebarProps) => {
  // Get logout function from user store
  const logoutUser = useUserStore((state) => state.logout);
  const { setShow } = useLoader();

  const router = useRouter();

  const [userDetails, setUserDetails] = useState<
    LoggedUserProps | undefined | null
  >(user);

  useEffect(() => {
    if (user) {
      setUserDetails(user);
    }
  }, [user]);

  // Handles user logout: clears token, updates store, redirects to home
  const logOut = () => {
    setShow(true);
    logoutUser();
    clearAuthToken(true);
  };

  return (
    <div
      className={`${
        isSidebarCollapsed ? "left-3 top-14" : "left-3 top-14"
      } popup-slide-down absolute z-20 min-w-60 rounded-md shadow-5xl bg-white p-2`}
    >
      {/* Organization avatar and info */}
      <div
        onClick={() => routeAction && routeAction("/settings/members")}
        className={`flex items-center cursor-pointer mb-3 ${
          !isSidebarCollapsed ? "hover-effect rounded-md py-1 px-1" : ""
        }`}
      >
        {/* Organization initial as avatar */}
        <div
          className={`text-xs text-white w-8 h-8 min-w-8 min-h-8 flex justify-center items-center rounded-md bg-primary-500`}
        >
          {getFirstLetter(userDetails?.organization?.name)}
        </div>
        <div className={`w-full ms-2.5`}>
          <div className="flex whitespace-pre items-center text-slate-800 text-xs">
            <p>{getLabelForRoles(userDetails?.role || "")}</p>
            <Dot width={20} />
            <div>
              {userDetails?.organization?.member_count &&
              userDetails?.organization?.member_count > 1
                ? `${userDetails?.organization?.member_count || 0} members`
                : `${userDetails?.organization?.member_count || 0} member`}
            </div>
          </div>
        </div>
      </div>
      {/* Invite members action */}

      {hasPermission("members", "create") ? (
        <div
          onClick={() => routeAction && routeAction("/settings/members/invite")}
          className="menu-item"
        >
          <UserRoundPlus size={16} />
          <p className="ms-1.5">Invite members</p>
        </div>
      ) : null}

      {/* Create bills action */}
      {hasPermission("bill", "create") ? (
        <div
          onClick={() => routeAction && routeAction("/bill/add")}
          className="menu-item"
        >
          <CirclePlus size={16} />
          <p className="ms-1.5">Create bills</p>
        </div>
      ) : null}

      {/* Logout action */}
      <div onClick={logOut} className="menu-item">
        <LogOut size={16} className="text-red-500" />
        <p className="ms-1.5 text-red-500">Logout</p>
      </div>
    </div>
  );
};

export default OrgProfile;
