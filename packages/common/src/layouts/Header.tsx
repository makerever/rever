// Component for displaying header layout

"use client";

import { CircleHelp } from "lucide-react";
import Image from "next/image";
import { Breadcrumb, CustomTooltip } from "@rever/common";
import { IconWrapper } from "@rever/common";
import { usePathname } from "next/navigation";
import { OutsideClickHandler } from "@rever/common";
import { useState } from "react";
import HelpSupport from "../popup/HelpSupport";
// import SearchInput from "../common/inputFields/searchInput/SearchInput";

export function Header() {
  const pathname = usePathname();
  const [showSupport, setShowSupport] = useState(false);

  return (
    <header
      className={`text-slate-800 flex items-center justify-between pr-6 ${pathname === "/home" ? "py-4" : "py-5"}`}
    >
      <Breadcrumb />
      {pathname === "/home" ? (
        <div className="flex items-center gap-2">
          {/* <SearchInput /> */}

          <OutsideClickHandler onClose={() => setShowSupport(false)}>
            <CustomTooltip content="Help">
              <div>
                <IconWrapper
                  onClick={() => setShowSupport(!showSupport)}
                  icon={<CircleHelp width={16} />}
                />

                {showSupport && (
                  <div className="transition-all duration-300 ease-out">
                    <HelpSupport />
                  </div>
                )}
              </div>
            </CustomTooltip>
          </OutsideClickHandler>
          <CustomTooltip content="Star us on GitHub">
            <a href="https://github.com/makerever/rever" target="_blank">
              <Image
                src="/icons/githhubIconDark.svg"
                alt="Star us on github"
                width={15}
                height={15}
                className="cursor-pointer"
              />
            </a>
          </CustomTooltip>
        </div>
      ) : null}
    </header>
  );
}
