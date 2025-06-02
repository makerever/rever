// Reusable component for pagination

"use client";

import { Table } from "@tanstack/react-table";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  totalRows: number;
  selectedRows: number;
  tableHeading?: string;
}

export function DataTablePagination<TData>({
  table,
  totalRows,
  selectedRows,
  tableHeading,
}: DataTablePaginationProps<TData>) {
  return (
    <div className="py-4 font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
      <div>
        {selectedRows} of {totalRows} {tableHeading?.toLocaleLowerCase()}{" "}
        selected
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="hidden sm:inline">Items per page</span>
        <select
          value={table.getState().pagination.pageSize}
          onChange={(e) => table.setPageSize(Number(e.target.value))}
          className="border rounded-md px-2 py-1 text-xs"
        >
          {[10, 20, 50, 100].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <span className="mx-4">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="px-2 py-1 border rounded disabled:opacity-50"
          >
            ≪
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-2 py-1 border rounded disabled:opacity-50"
          >
            ‹
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-2 py-1 border rounded disabled:opacity-50"
          >
            ›
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="px-2 py-1 border rounded disabled:opacity-50"
          >
            ≫
          </button>
        </div>
      </div>
    </div>
  );
}
