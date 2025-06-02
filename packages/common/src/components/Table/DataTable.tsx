// Reusable component for data table

"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
  RowSelectionState,
  ColumnFiltersState,
  getFilteredRowModel,
} from "@tanstack/react-table";
import {
  ChevronsUpDown,
  ChevronUpIcon,
  ChevronDown,
  Plus,
  Trash,
  MailPlus,
  Download,
} from "lucide-react";
import { DataTablePagination } from "./DataTablePagination";
import { StatusFilter } from "@rever/common";

import Button from "../Button";
import { TableProps } from "@rever/types";
import Tabs from "../Tabs";
import SearchInput from "../inputFields/searchInput/SearchInput";
import { exportToExcel } from "@rever/utils";
import Image from "next/image";
import IconWrapper from "../IconWrapper";
import { useUserStore } from "@rever/stores";

export default function DataTable<
  T extends { status: string; id?: string | number },
>({
  tableHeading = "",
  addBtnText,
  tableData,
  onActionBtClick,
  columns = [],
  tabNames,
  activeTab,
  setActiveTab,
  statusList,
  setSearch,
  search,
  clearSearch,
  actions = false,
  handleDelete,
  isMembers,
  noStatusFilter,
  filterHeading,
}: TableProps<T>) {
  const user = useUserStore((state) => state.user);

  const [data, setData] = React.useState<T[]>(() => []);

  React.useEffect(() => {
    if (tableData) {
      setData(tableData);
    } else {
      setData([]);
    }
  }, [tableData]);

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const [statusFilter, setStatusFilter] = React.useState<string[]>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );

  const [selectedRowsData, setSelectedRowsData] = React.useState<Partial<T>[]>(
    [],
  );

  React.useEffect(() => {
    setColumnFilters(
      statusFilter.length ? [{ id: "status", value: statusFilter }] : [],
    );
  }, [statusFilter]);

  const table = useReactTable({
    data,
    columns,
    state: {
      columnFilters,
      sorting,
      rowSelection,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: true,
  });

  React.useEffect(() => {
    type AccessorColumn = {
      accessorKey?: string;
    };

    // Extract accessor keys from columns
    const accessorKeys = (columns as AccessorColumn[])
      .map((col) => col.accessorKey)
      .filter((key): key is string => typeof key === "string");

    // Extract only relevant fields from selected rows
    const selectedData: Partial<T>[] = table
      .getSelectedRowModel()
      .rows.map((row) => {
        const filtered: Partial<T> = {};
        accessorKeys.forEach((key) => {
          if (key === "vendor") {
            filtered[key as keyof T] = (
              row.original[key as keyof T] as { name: string }
            )?.name as never;
          } else if (tableHeading === "Members" && key === "status") {
            (filtered as Partial<T> & { role?: T["status"] }).role =
              row.original["status"];
          } else {
            filtered[key as keyof T] = row.original[key as keyof T];
          }
        });
        return filtered;
      });

    setSelectedRowsData(selectedData);
  }, [rowSelection, table, columns, tableHeading]);

  const handleExport = () => {
    exportToExcel(selectedRowsData, `${tableHeading}_export_data`);
  };

  return (
    <>
      <div className="mb-2 flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <p className="text-slate-800 text-lg font-semibold">{tableHeading}</p>

        <div className="flex items-center gap-3">
          {tableHeading === "Bills" && activeTab === "Overview" ? (
            <StatusFilter
              data={data}
              selected={statusFilter}
              onChange={setStatusFilter}
              statusList={statusList}
            />
          ) : null}

          {!noStatusFilter ? (
            <>
              {tableHeading !== "Bills" ? (
                <StatusFilter
                  data={data}
                  selected={statusFilter}
                  onChange={setStatusFilter}
                  statusList={statusList}
                  filterHeading={filterHeading}
                />
              ) : null}
            </>
          ) : null}

          {addBtnText ? (
            <Button
              width="w-auto"
              icon={isMembers ? <MailPlus width={16} /> : <Plus width={16} />}
              text={addBtnText ?? ""}
              className="text-white"
              onClick={onActionBtClick}
            />
          ) : null}
        </div>
      </div>

      <div className="mb-4">
        {tabNames && activeTab && setActiveTab && (
          <Tabs
            tabNames={tabNames}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        )}
      </div>

      {setSearch ? (
        <div className="flex items-center justify-between mb-4">
          <div className="w-60">
            <SearchInput
              clearSearch={clearSearch}
              search={search}
              onChange={(e) => {
                if (setSearch) {
                  setSearch(e.target.value);
                }
              }}
              placeholder={`Search ${tableHeading?.toLocaleLowerCase()}`}
              noCmdIcon
            />
          </div>

          <div>
            <IconWrapper
              isDisabled={!selectedRowsData.length}
              icon={<Download width={16} onClick={handleExport} />}
            />
          </div>
        </div>
      ) : null}

      {!data.length ? (
        <div className="flex flex-col items-center justify-center h-full p-10 text-slate-800 text-sm">
          <Image
            alt="Table data not found"
            src="/images/noDataGif.gif"
            width={160}
            height={160}
          />
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-6 font-medium">
            There&apos;s nothing here to display at the moment.
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-2xs mt-1">
            Feel free to explore other sections in the meantime.
          </p>
        </div>
      ) : (
        <>
          <div className="w-[calc(100vw-60px)] md:w-full rounded-md border bg-white shadow-sm block max-h-[536px]">
            <div className="overflow-x-auto custom_scrollbar w-full">
              <table className="w-full border-separate border-spacing-0">
                <thead className="text-xs text-slate-500 hover:bg-slate-50 transition-all duration-200">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className={`px-3 py-2 font-medium text-left whitespace-nowrap ${
                            (header.column.columnDef.meta as { width?: string })
                              ?.width || "min-w-[100px] sm:min-w-[140px]"
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}

                            {header.column.getCanSort() && (
                              <button
                                onClick={header.column.getToggleSortingHandler()}
                                className="cursor-pointer"
                              >
                                {header.column.getIsSorted() === "asc" ? (
                                  <ChevronUpIcon width={16} />
                                ) : header.column.getIsSorted() === "desc" ? (
                                  <ChevronDown width={16} />
                                ) : (
                                  <ChevronsUpDown width={16} />
                                )}
                              </button>
                            )}
                          </div>
                        </th>
                      ))}
                      {actions && (
                        <th
                          className={`px-3 py-2 font-medium text-center whitespace-nowrap`}
                        >
                          Actions
                        </th>
                      )}
                    </tr>
                  ))}
                </thead>
                <tbody className="text-slate-800 text-xs">
                  {table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-50 transition-all duration-200 border-t"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className={`px-3 py-2.5 border-t whitespace-nowrap`}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </td>
                      ))}

                      {actions ? (
                        <td className="px-3 py-2.5 border-t whitespace-nowrap flex items-center justify-center">
                          <IconWrapper
                            onClick={() => {
                              if (
                                user?.id !== row?.original?.id &&
                                handleDelete
                              ) {
                                handleDelete(row.original);
                              }
                            }}
                            icon={<Trash width={16} />}
                            className={
                              user?.id !== row?.original?.id
                                ? "hover:bg-red-100 hover:text-red-500"
                                : ""
                            }
                            isDisabled={user?.id === row?.original?.id}
                          />
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <DataTablePagination
            table={table}
            tableHeading={tableHeading}
            totalRows={data.length}
            selectedRows={Object.keys(rowSelection).length}
          />
        </>
      )}
    </>
  );
}
