// Reusable component for table filter

import * as React from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@rever/common";
import { PlusCircle, Search, X } from "lucide-react";
import { CheckBox } from "@rever/common";
import { getStatusClass } from "@rever/utils";

export interface StatusFilterProps<T extends { status: string }> {
  data: T[];
  selected: string[];
  onChange: (next: string[]) => void;
  statusList?: string[];
  filterHeading?: string;
}

export function StatusFilter<T extends { status: string }>({
  data,
  selected,
  onChange,
  statusList,
  filterHeading = "Status",
}: StatusFilterProps<T>) {
  const [search, setSearch] = React.useState("");

  // Compute counts for each status
  const counts = React.useMemo(() => {
    const c: Record<string, number> = {};
    data.forEach((row) => {
      const key = row.status;
      c[key] = (c[key] || 0) + 1;
    });
    return c;
  }, [data]);

  // All possible statuses in your dataset
  const allStatuses = React.useMemo(
    () => Array.from(new Set(data.map((d) => d.status))),
    [data],
  );

  // Filter statuses by the search term
  const visible = (statusList ? statusList : allStatuses).filter(
    (s) => s && (s as string).toLowerCase().includes(search.toLowerCase()),
  );

  const toggle = (status: string) => {
    const next = selected.includes(status)
      ? selected.filter((s) => s !== status)
      : [...selected, status];
    onChange(next);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="gap-1 cursor-pointer flex items-center hover:bg-slate-50 text-xs border border-slate-300 border-dashed h-8 rounded-md px-2">
          <PlusCircle width={14} />
          {filterHeading}
          {selected.length > 0 && (
            <>
              <span className="text-slate-300 mx-2">|</span>
              {selected.map((v, i) => {
                return (
                  <span
                    key={i}
                    className={`${getStatusClass(v)} inline-flex border px-1 py-0.5 rounded-md items-center justify-center`}
                  >
                    {v}
                  </span>
                );
              })}
            </>
          )}
          {selected.length > 0 ? (
            <X
              onClick={(e) => {
                e.stopPropagation();
                onChange([]); // Clear all filters
              }}
              width={16}
            />
          ) : null}
        </div>
      </PopoverTrigger>

      <PopoverContent className="w-[220px] status_filter_popup">
        {/* Search box */}
        <div className="flex relative items-center">
          <Search
            className="absolute z-10 left-2 top-1/2 -translate-y-1/2 text-gray-400"
            size={14}
          />
          <input
            type="text"
            placeholder="Search filters"
            onChange={(e) => setSearch(e.target.value)}
            className="px-7 disabled:bg-gray-100 rounded-md font-light h-8 border text-2xs w-full focus:outline-none text-slate-800"
          />
        </div>

        {/* Status list */}
        {visible.map((status) => (
          <div
            key={String(status)}
            className="flex items-center justify-between mt-1 py-1.5 px-2 hover:bg-slate-50 rounded"
          >
            <label className="flex items-center space-x-2">
              <CheckBox
                checked={selected.includes(String(status))}
                onChange={() => toggle(String(status))}
              />
              <span className="text-xs">{String(status)}</span>
            </label>
            <span className="text-xs text-gray-500">
              {counts[String(status)] || 0}
            </span>
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
}
