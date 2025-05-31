// Component to render vendor side view list

"use client";

import { useState } from "react";
import { AlphabetFilter } from "@rever/common";
import { SearchInput } from "@rever/common";
import { ListSideVendorViewProps } from "@rever/types";

// ListSideVendorView displays a searchable, filterable list of vendors
const ListSideVendorView = ({
  vendorData,
  vendorId,
  changeVendor,
}: ListSideVendorViewProps) => {
  // State for selected alphabet letter filter
  const [selectedLetter, setSelectedLetter] = useState("");
  // State for search input value
  const [search, setSearch] = useState("");

  // Filter vendor data based on search and selected letter
  const filteredData = search
    ? vendorData
        .filter((item) => {
          // Filter by search input (case-insensitive)
          return item?.vendorName
            ?.toLowerCase()
            .includes(search.toLocaleLowerCase());
        })
        .filter((data) =>
          // Further filter by selected letter if present
          data.vendorName?.toUpperCase().startsWith(selectedLetter),
        )
    : selectedLetter
      ? vendorData.filter((data) =>
          // Filter by selected letter only
          data.vendorName?.toUpperCase().startsWith(selectedLetter),
        )
      : vendorData;

  return (
    <div className="flex">
      {/* Main vendor list card */}
      <div className="relative bg-white text-slate-600 rounded-md overflow-hidden w-full shadow">
        {/* Header with title and search input */}
        <div className="flex items-center justify-between gap-4 mx-4">
          <p className="text-slate-800 py-3 text-sm font-semibold">Vendors</p>
          <SearchInput
            clearSearch={() => setSearch("")}
            search={search}
            onChange={(e) => {
              if (setSearch) {
                setSearch(e.target.value);
              }
            }}
            placeholder="Search vendors"
            noCmdIcon
          />
        </div>

        {/* Vendor List */}
        <div className="h-[640px] overflow-auto custom_scrollbar">
          {filteredData.length > 0 ? (
            filteredData.map((data, i) => (
              <div
                key={i}
                onClick={() => changeVendor && changeVendor(data.id)}
                className={`${vendorId === data.id ? "bg-slate-50" : ""} border-t px-4 transition cursor-pointer duration-300 hover:bg-slate-50 py-2`}
              >
                {/* Vendor name */}
                <p className="text-slate-800 font-medium text-xs">
                  {data.vendorName}
                </p>
                {/* Vendor tax ID or placeholder */}
                <p className="text-slate-500 text-2xs">
                  {data.taxId ? data.taxId : "--"}
                </p>
              </div>
            ))
          ) : (
            // Show message if no vendors found
            <div className="px-4 py-4 text-xs text-slate-500">
              No vendors found
            </div>
          )}
        </div>
      </div>
      {/* Vertical A-Z filter component */}
      <AlphabetFilter
        selectedLetter={selectedLetter}
        onSelect={setSelectedLetter}
        onClear={() => setSelectedLetter("")}
      />
    </div>
  );
};

export default ListSideVendorView;
