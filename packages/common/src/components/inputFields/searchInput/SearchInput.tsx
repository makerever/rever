// Reusable component for search input

"use client";

import { SearchInputPropos } from "@rever/types";
import { CircleX, Command, Search } from "lucide-react";

export default function SearchInput({
  onlyIcon,
  noCmdIcon,
  placeholder = "Search anything",
  onChange,
  search,
  clearSearch,
}: SearchInputPropos) {
  // If onlyIcon is true, render just the search icon button
  return onlyIcon ? (
    <div className="text-slate-800 transition-all hover:bg-slate-50 p-2 rounded-md cursor-pointer flex items-center justify-center">
      <Search size={14} />
    </div>
  ) : (
    <>
      {/* Search input with icons */}
      <div className="relative w-full max-w-md">
        {/* Search icon on the left */}
        <Search
          className="absolute z-10 left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={14}
        />
        {/* Search input field */}
        <input
          type="text"
          value={search}
          readOnly={!clearSearch} // Make input readonly if clearSearch is not provided
          onChange={onChange}
          placeholder={placeholder}
          className="px-8 disabled:bg-gray-100 rounded-md font-light h-8 border text-2xs w-full transition duration-200 hover:border-slate-400 focus:outline-none focus:border-primary-500 text-slate-800"
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
              className="absolute cursor-pointer p-1 flex text-2xs items-center justify-center rounded-sm right-1.5 top-1/2 -translate-y-1/2 text-gray-400"
            >
              <CircleX size={14} />
            </div>
          )
        )}
      </div>
    </>
  );
}
