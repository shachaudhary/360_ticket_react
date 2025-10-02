import React from "react";
import { IconButton, Tooltip } from "@mui/material";
import LaunchIcon from "@mui/icons-material/Launch";

export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = "No records found",
  onRowClick,
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#E5E7EB]">
      <div className="overflow-auto h-[calc(100dvh-307.75px)]">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            Loading...
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-gray-500">
            {emptyMessage}
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-white sticky top-0 z-10">
              <tr className="text-left text-xs text-gray-500">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-4 py-3 border-r border-b border-[#E5E7EB]"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white text-sm">
              {data.map((row, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-4 py-3 border-b border-[#E5E7EB]"
                    >
                      {col.render
                        ? col.render(row[col.key], row)
                        : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
