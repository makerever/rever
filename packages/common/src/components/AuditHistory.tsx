"use client";

import { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import DataTable from "./Table/DataTable";
import { AuditHistoryDataProps, AuditHistoryItemsProps } from "@rever/types";
import CheckBox from "./inputFields/checkbox/CheckBox";
import { formatDate, formatNumber, getStatusClass } from "@rever/utils";
import { useUserStore } from "@rever/stores";

const AuditHistory = ({ data }: AuditHistoryDataProps) => {
  const [search, setSearch] = useState<string>("");
  const orgDetails = useUserStore((state) => state.user?.organization);

  const getFilteredAuditData = (
    tableData: AuditHistoryItemsProps[],
    search: string,
  ): AuditHistoryItemsProps[] => {
    if (!search.length) return tableData;

    const searchString = search.toLowerCase();

    return tableData.filter((item) => {
      // Check parent-level fields
      const baseMatch =
        formatDate(
          item.changed_on,
          orgDetails?.date_format,
          undefined,
          false,
          true,
        )
          .toLowerCase()
          .includes(searchString) ||
        String(item.changed_by)?.toLowerCase().includes(searchString) ||
        item?.event?.toLowerCase().includes(searchString);

      // Check inside 'changes' array
      const changesMatch =
        item.changes &&
        item.changes?.some((change) => {
          return (
            change?.field?.toLowerCase().includes(searchString) ||
            String(change?.old)?.toLowerCase().includes(searchString) ||
            String(change.new)?.toLowerCase().includes(searchString)
          );
        });

      return baseMatch || changesMatch;
    });
  };

  const columns: ColumnDef<AuditHistoryItemsProps>[] = useMemo(
    () => [
      {
        accessorKey: "changed_on",
        header: () => (
          <div className="flex items-center gap-4">
            <span>Timestamp</span>
          </div>
        ),
        cell: ({ getValue }) => {
          return (
            <div className="flex items-center gap-4 w-48">
              <span>
                {formatDate(
                  getValue() as string,
                  orgDetails?.date_format,
                  undefined,
                  false,
                  true,
                )}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "changed_by",
        header: "Edited by",
        cell: ({ getValue }) => {
          return (
            <div className="flex items-center gap-4">
              <span className="whitespace-break-spaces w-40">
                {getValue() as string}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "event",
        header: "Event",
        cell: ({ getValue }) => {
          return (
            <div className="flex items-center gap-4">
              <span className="whitespace-break-spaces w-28">
                {getValue() as string}
              </span>
            </div>
          );
        },
      },
      {
        id: "field",
        header: "Field",
        enableSorting: true,
        accessorFn: (row) => row.changes.map((c) => c.field).join(", "),
        cell: ({ row }) => {
          const changes = row.original.changes;
          if (!changes.length) return <div className="text-gray-400">--</div>;

          return (
            <div className="whitespace-pre-line w-28">
              <ul>
                {changes
                  ?.filter((v) => v.field !== "updated_by")
                  .map((c, i) => <li key={i}>{c.field}</li>)}
              </ul>
            </div>
          );
        },
      },
      {
        id: "old",
        header: "Old Value",
        enableSorting: true,
        accessorFn: (row) => row.changes.map((c) => c.old).join(", "),
        cell: ({ row }) => {
          const changes = row.original.changes;
          if (!changes.length) return <div className="text-gray-400">--</div>;

          return (
            <div className="whitespace-pre-line w-28">
              <ul>
                {changes
                  ?.filter((v) => v.field !== "updated_by")
                  .map((c, i) => (
                    <li key={i}>
                      {Number(c.old)
                        ? formatNumber(c.new, orgDetails?.currency)
                        : c.old || "--"}
                    </li>
                  ))}
              </ul>
            </div>
          );
        },
      },
      {
        id: "new",
        header: "New Value",
        enableSorting: true,
        accessorFn: (row) => row.changes.map((c) => c.new).join(", "),
        cell: ({ row }) => {
          const changes = row.original.changes;
          if (!changes.length) return <div className="text-gray-400">--</div>;

          return (
            <div className="whitespace-pre-line w-28">
              <ul>
                {changes
                  ?.filter((v) => v.field !== "updated_by")
                  .map((c, i) => (
                    <li key={i}>
                      {Number(c.new)
                        ? formatNumber(c.new, orgDetails?.currency)
                        : c.new || "--"}
                    </li>
                  ))}
              </ul>
            </div>
          );
        },
      },
    ],
    [],
  );

  return (
    <>
      <DataTable
        tableData={getFilteredAuditData(data, search)}
        columns={columns}
        setSearch={setSearch}
        search={search}
        clearSearch={() => setSearch("")}
        noStatusFilter
        exportKey="Audit-history"
        hideExportIcon
      />
    </>
  );
};

export default AuditHistory;
