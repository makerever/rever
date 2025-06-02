// Component for displaying header layout

"use client";

import { CircleHelp } from "lucide-react";
import Image from "next/image";
import { Breadcrumb } from "@rever/common";
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
    <header className="text-slate-800 flex items-center justify-between py-5 pr-6">
      <Breadcrumb />
      {pathname === "/home" ? (
        <div className="flex items-center gap-2">
          {/* <SearchInput /> */}

          <OutsideClickHandler onClose={() => setShowSupport(false)}>
            <IconWrapper
              onClick={() => setShowSupport(!showSupport)}
              icon={<CircleHelp width={16} />}
            />

            {showSupport && (
              <div className="transition-all duration-300 ease-out">
                <HelpSupport />
              </div>
            )}
          </OutsideClickHandler>

          <a href="https://github.com/makerever/rever" target="_blank">
            <Image
              src="/icons/githhubIconDark.svg"
              alt="Star us on github"
              width={15}
              height={15}
              className="cursor-pointer"
            />
          </a>
        </div>
      ) : null}
    </header>
  );
}
