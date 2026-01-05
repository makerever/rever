// Reusable component for search input

"use client";

import { SearchInputPropos } from "@rever/types";
import { CircleX, Command, Search } from "lucide-react";
import { CustomTooltip } from "@rever/common";

export default function SearchInput({
  onlyIcon,
  noCmdIcon,
  placeholder = "Search",
  onChange,
  search,
  clearSearch,
}: SearchInputPropos) {
  // If onlyIcon is true, render just the search icon button
  return onlyIcon ? (
    <CustomTooltip content="Global search" side="right">
      <div className="text-slate-800 transition-all hover:bg-slate-50 p-2 rounded-md cursor-pointer flex items-center justify-center">
        <Search size={14} />
      </div>
    </CustomTooltip>
  ) : (
    <>
      {/* Search input with icons */}
      <div className="relative w-full max-w-md">
        {/* Search icon on the left */}
        <Search
          className={`absolute z-10 left-3 top-1/2 -translate-y-1/2 text-neutral-700`}
          size={14}
        />
        {/* Search input field */}
        <input
          type="text"
          value={search}
          readOnly={!clearSearch} // Make input readonly if clearSearch is not provided
          onChange={onChange}
          placeholder={placeholder}
          className="input input-default input-shadow px-8"
        />
        {!noCmdIcon ? (
          <div className="absolute p-1 bg-gray-100 flex text-xs items-center justify-center rounded-sm right-1.5 top-1/2 -translate-y-1/2 text-gray-400">
            <Command size={12} />
            +k
          </div>
        ) : (
          search &&
          search.length && (
            <div
              onClick={clearSearch}
              className={`absolute cursor-pointer p-1 flex text-2xs items-center justify-center rounded-sm right-1.5 top-1/2 -translate-y-1/2 text-neutral-1000`}
            >
              <CircleX size={14} />
            </div>
          )
        )}
      </div>
    </>
  );
}
