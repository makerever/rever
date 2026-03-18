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
  Trash,
  RefreshCcw,
  Copy,
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  ArrowUpDown,
  Info,
} from "lucide-react";
import { DataTablePagination } from "./DataTablePagination";
import {
  CustomTooltip,
  DropdownButton,
  PageLoader,
  StatusFilter,
} from "@rever/common";

import Button from "../Button";
import { TableProps } from "@rever/types";
import Tabs from "../Tabs";
import SearchInput from "../inputFields/searchInput/SearchInput";
import { exportToExcel, hasPermission } from "@rever/utils";
import Image from "next/image";
import IconWrapper from "../IconWrapper";
import { useUserStore } from "@rever/stores";
import { useTranslate } from "@rever/i18n";

export default function DataTable<
  T extends {
    [field: string]: any; status: string; id?: string | number
  },
>({
  isHeader = true,
  roundedBorder,
  tableHeading = "",
  exportKey = "",
  addBtnText,
  uploadBtnText,
  tableData,
  onActionBtClick,
  onUploadBtnClick,
  columns = [],
  tabNames,
  activeTab,
  setActiveTab,
  tabSeparatorAt,
  statusList,
  setSearch,
  search,
  clearSearch,
  actions = false,
  handleDelete,
  isMembers,
  noStatusFilter,
  filterHeading,
  hideExportIcon,
  showSyncIcon,
  flowImageSrc,
  handleSync,
  btnPopupItems,
  onBtnPopupItemsClick,
  isBillEmailConfigured,
  perPageItemCount = [10, 20, 50, 100],
  defaultSelectedStatusFilter,
  isLoading,
}: TableProps<T>) {
  const user = useUserStore((state) => state.user);

  const [data, setData] = React.useState<T[]>(() => []);
  const translate = useTranslate();
  React.useEffect(() => {
    if (tableData) {
      setData(tableData);
    } else {
      setData([]);
    }
  }, [tableData]);

  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: perPageItemCount?.[0] ?? 10,
  });

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const [statusFilter, setStatusFilter] = React.useState<string[]>(
    defaultSelectedStatusFilter || [],
  );
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );

  const [selectedRowsData, setSelectedRowsData] = React.useState<Partial<T>[]>(
    [],
  );

  const [showBtnPopup, setShowBtnPopup] = React.useState<boolean>(false);

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
      pagination,
    },
    onPaginationChange: setPagination,
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
          }
          else if (key === "po_number") {
            filtered["po_number" as keyof T] =
              row.original?.purchase_order?.po_number;
          }
          //in vendor there is not field called stages, so this action can be ignored for vendor
          else if (key === "status" && (!accessorKeys.includes("vendorName"))) {
            filtered["stages" as keyof T] = row.original[key as keyof T];
          }
          else if (key === "match_status") {
            filtered["status" as keyof T] = row.original[key as keyof T]
          }
          else if (tableHeading === "Members" && key === "status") {
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
    exportToExcel(selectedRowsData, `${tableHeading || exportKey}_export_data`);
  };

  return (
    <>
      {isHeader && (
        <div className="bg-secondary-200">
          <div className="rounded-b-[20px] bg-white p-4 h-28 border border-secondary-200 flex items-end justify-start">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 w-full h-8">
              <div className="flex items-center gap-2">
                <p className="text-neutral-1100 text-2xl font-medium">
                  {tableHeading}
                </p>
                {/* {isBillEmailConfigured ? (
                  <>
                    <CustomTooltip
                      content={
                        <div className="flex items-center gap-1 text-xs text-neutral-1100 relative">
                          <span>
                            Forward your bills to create expenses automatically
                            at: <br />
                            <span className="font-semibold text-sec">
                              {isBillEmailConfigured}
                            </span>
                          </span>

                          <IconWrapper
                            onClick={handleCopy}
                            icon={<Copy width={15} />}
                          />

                          {copied && (
                            <span className="absolute -top-4 right-2 text-2xs bg-slate-800 text-white px-2 py-1 rounded shadow-sm">
                              Copied!
                            </span>
                          )}
                        </div>
                      }
                      side="right"
                      sideOffset={10}
                    >
                      <Info
                        width={16}
                        className="cursor-pointer text-neutral-700"
                      />
                    </CustomTooltip>
                  </>
                ) : null} */}
              </div>

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

                <div className="flex items-center gap-3">
                  {uploadBtnText && !btnPopupItems ? (
                    <div className="w-fit">
                      <Button
                        onClick={onUploadBtnClick}
                        name={uploadBtnText ?? ""}
                        button_type="secondary"
                        icon_type="upload"
                      />
                    </div>
                  ) : null}

                  {addBtnText && !btnPopupItems ? (
                    <div className="w-fit">
                      <Button
                        onClick={onActionBtClick}
                        name={addBtnText ?? ""}
                        button_type="primary"
                        icon_type={isMembers ? "plus" : "plus"}
                      />
                    </div>
                  ) : null}
                </div>

                {addBtnText && btnPopupItems ? (
                  <>
                    <DropdownButton
                      name={addBtnText}
                      onActionBtClick={onActionBtClick}
                      onClose={() => setShowBtnPopup(false)}
                      onBtnPopupItemsClick={onBtnPopupItemsClick}
                      onClickArrow={() => setShowBtnPopup(true)}
                      showBtnPopup={showBtnPopup}
                      btnPopupItems={btnPopupItems}
                      button_type="primary"
                    />
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <PageLoader />
      ) : (
        <div className={`bg-secondary-200 ${isHeader ? "pb-px" : ""}`}>
          {/* min-h-[calc(100vh-10rem-2px)] - 2px for mesh UI - border top 1px, padding bottom 1px */}
          <div
            className={`${isHeader ? "rounded-[20px] border" : "border-b-0 border-t"} ${roundedBorder ? "rounded-[20px] border" : ""} border-secondary-200 bg-white min-h-[calc(100vh-10rem-2px)] h-full`}
          >
            {roundedBorder ? (
              <p className="mx-4 mt-4 text-neutral-1100 text-2xl font-medium">
                {tableHeading}
              </p>
            ) : null}
            <div>
              {tabNames && activeTab && setActiveTab && (
                <Tabs
                  tabNames={tabNames}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  separatorAt={tabSeparatorAt}
                />
              )}
            </div>

            <div className="p-4">
              {setSearch ? (
                <div className="flex items-center justify-between mb-4">
                  <div className="w-[514px]">
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

                  <div className="flex items-center gap-1">
                    {showSyncIcon && hasPermission("general", "update") ? (
                      <div>
                        <IconWrapper
                          icon={
                            <CustomTooltip
                              content="Sync"
                              side="bottom"
                              sideOffset={10}
                            >
                              <RefreshCcw width={16} onClick={handleSync} />
                            </CustomTooltip>
                          }
                        />
                      </div>
                    ) : null}

                    {!hideExportIcon ? (
                      <div>
                        {/* <IconWrapper
                      isDisabled={!selectedRowsData.length}
                      icon={
                        <CustomTooltip
                          content="Export"
                          side="bottom"
                          sideOffset={10}
                        >
                          <Download width={16} onClick={handleExport} />
                        </CustomTooltip>
                      }
                    /> */}
                        <Button
                          icon_type="download"
                          button_type="secondary"
                          name={translate('vendors.vendor_credit.export')}
                          onClick={handleExport}
                          disabled={!selectedRowsData.length}
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {!data.length ? (
                <div className="flex flex-col items-center justify-center h-full p-10 text-neutral-1100 text-sm">
                  <p className="text-secondary-800 text-md font-medium">
                    This section is currently empty.
                  </p>

                  <p className="text-gray-500 dark:text-gray-400 text-2xs mt-1">
                    Feel free to explore other sections in the meantime.
                  </p>
                  {flowImageSrc ? (
                    <div className="relative w-full mt-4 h-[400px]">
                      <Image
                        alt="Table data not found"
                        src={flowImageSrc}
                        fill
                        className="object-contain" // or "object-cover"
                      />
                    </div>
                  ) : null}
                </div>
              ) : (
                <>
                  <div className="rounded-xl border bg-white shadow-xs max-h-[506px] overflow-y-auto custom_scrollbar w-full">
                    {/* Horizontal scroll wrapper */}
                    <div className="overflow-x-auto w-full custom_scrollbar">
                      {/* Table stretches to container if small, grows naturally if large */}
                      <table className="w-full min-w-max border-separate border-spacing-0">
                        <thead className="text-sm text-neutral-1100 bg-secondary-100 transition-all duration-200">
                          {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                              {headerGroup.headers.map((header) => (
                                <th
                                  key={header.id}
                                  className={`px-3 py-2.5 font-semibold text-left whitespace-nowrap ${(
                                    header.column.columnDef.meta as {
                                      width?: string;
                                    }
                                  )?.width || "min-w-[120px]"
                                    } ${header.column.columnDef.header === "Total amount" ? "flex justify-end ps-3 pr-10" : ""}`}
                                >
                                  <div className="flex items-center gap-1.5">
                                    {flexRender(
                                      header.column.columnDef.header,
                                      header.getContext(),
                                    )}
                                    {header.column.getCanSort() && (
                                      <button
                                        onClick={header.column.getToggleSortingHandler()}
                                        className="cursor-pointer"
                                      >
                                        {header.column.getIsSorted() ===
                                          "asc" ? (
                                          <ArrowUpWideNarrow width={14} />
                                        ) : header.column.getIsSorted() ===
                                          "desc" ? (
                                          <ArrowDownWideNarrow width={14} />
                                        ) : (
                                          <ArrowUpDown width={14} />
                                        )}
                                      </button>
                                    )}
                                  </div>
                                </th>
                              ))}
                              {actions && (
                                <th className="px-3 py-2.5 font-semibold text-center whitespace-nowrap">
                                  Actions
                                </th>
                              )}
                            </tr>
                          ))}
                        </thead>

                        <tbody className="text-neutral-900 text-sm font-medium">
                          {table.getRowModel().rows.map((row) => (
                            <tr
                              key={row.id}
                              className="hover:bg-secondary-100 transition-all duration-200 border-t"
                            >
                              {row.getVisibleCells().map((cell) => (
                                <td
                                  key={cell.id}
                                  className={`${cell.column.columnDef.header ===
                                    translate('vendors.vendor_credit.table_headers.total_amount')
                                    ? "text-right ps-3 pr-10"
                                    : "px-3"
                                    } py-2.5 border-t whitespace-nowrap max-w-40 overflow-hidden text-ellipsis`}
                                >
                                  {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext(),
                                  )}
                                </td>
                              ))}
                              {actions && (
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
                                        ? "hover:bg-danger-200 hover:text-danger-700"
                                        : ""
                                    }
                                    isDisabled={user?.id === row?.original?.id}
                                  />
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <DataTablePagination
                    table={table}
                    tableHeading={tableHeading}
                    totalRows={table.getFilteredRowModel().rows.length}
                    selectedRows={Object.keys(rowSelection).length}
                    hideExportIcon={hideExportIcon}
                    perPageItemCount={perPageItemCount}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
