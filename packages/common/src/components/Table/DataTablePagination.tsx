// Reusable component for pagination

"use client";

import { Table } from "@tanstack/react-table";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  totalRows: number;
  selectedRows: number;
  tableHeading?: string;
  hideExportIcon?: boolean;
  perPageItemCount: number[];
}

export function DataTablePagination<TData>({
  table,
  totalRows,
  selectedRows,
  tableHeading,
  hideExportIcon,
  perPageItemCount,
}: DataTablePaginationProps<TData>) {
  return (
    <div className="py-4 lg:py-0 md:py-0 font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm text-neutral-1100">
      {!hideExportIcon ? (
        <div>
          {/* {selectedRows} of {totalRows} {tableHeading?.toLocaleLowerCase()}{" "}
          selected */}

          <span className="sm:inline mr-2">Rows per page</span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="border rounded-md px-2 py-1 text-xs"
          >
            {perPageItemCount.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div></div>
      )}

      <div className="flex items-center gap-4 py-3">
        {/* Prev */}
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="hover:cursor-pointer disabled:hover:cursor-default flex items-center gap-1 px-2 py-1 rounded disabled:text-secondary-500"
        >
          <ChevronLeftIcon width={16} /> Prev
        </button>

        {/* Page Dropdown */}
        <select
          className="border rounded-lg px-3 py-1 text-sm"
          value={table.getState().pagination.pageIndex}
          onChange={(e) => table.setPageIndex(Number(e.target.value))}
        >
          {Array.from({ length: table.getPageCount() }).map((_, i) => (
            <option key={i} value={i}>
              {i + 1}
            </option>
          ))}
        </select>

        {/* Page Count */}
        <span className="text-sm">of {table.getPageCount()}</span>

        {/* Next */}
        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="hover:cursor-pointer disabled:hover:cursor-default flex items-center gap-1 px-2 py-1 rounded disabled:text-secondary-500"
        >
          Next <ChevronRightIcon width={16} />
        </button>
      </div>
    </div>
  );
}
