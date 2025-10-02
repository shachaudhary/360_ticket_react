import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  IconButton,
} from "@mui/material";
import LaunchIcon from "@mui/icons-material/Launch";
import { format } from "date-fns";
import StatusBadge from "./StatusBadge";

export default function TicketsTable({
  currentItems,
  statusColors,
  toProperCase,
  navigate,
}) {
  return (
    <TableContainer
      component={Paper}
      sx={{
        border: "1px solid #ddd",
        borderRadius: "12px",
        overflow: "hidden",
        maxHeight: "calc(100dvh - 297.75px)",
      }}
    >
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow
            sx={{
              backgroundColor: "#fff",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            }}
          >
            <TableCell sx={{ fontSize: 12, color: "#6b7280" }}>
              Ticket Id
            </TableCell>
            <TableCell sx={{ fontSize: 12, color: "#6b7280" }}>Title</TableCell>
            <TableCell sx={{ fontSize: 12, color: "#6b7280" }}>
              Details
            </TableCell>
            <TableCell sx={{ fontSize: 12, color: "#6b7280" }}>
              Priority
            </TableCell>
            <TableCell sx={{ fontSize: 12, color: "#6b7280" }}>
              Category
            </TableCell>
            {/* <TableCell sx={{ fontSize: 12, color: "#6b7280" }}>
              Due Date
            </TableCell> */}
            <TableCell sx={{ fontSize: 12, color: "#6b7280" }}>
              Status
            </TableCell>
            <TableCell sx={{ fontSize: 12, color: "#6b7280" }}>
              Created By
            </TableCell>
            <TableCell sx={{ fontSize: 12, color: "#6b7280" }} align="center">
              Action
            </TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {currentItems.map((t) => (
            <TableRow
              key={t.id}
              hover
              sx={{
                "&:hover": { backgroundColor: "#f9fafb" },
                fontSize: 14,
              }}
            >
              <TableCell sx={{ px: 2, py: 1 }}>{t.id}</TableCell>
              <TableCell sx={{ px: 2, py: 1 }}>{toProperCase(t.title)}</TableCell>
              <TableCell sx={{ px: 2, py: 1 }}>{t.details}</TableCell>

              {/* Priority chip */}
              <TableCell sx={{ px: 2, py: 1 }}>
                <span
                  style={{
                    padding: "2px 8px",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    borderRadius: 12,
                    backgroundColor:
                      t.priority?.toLowerCase() === "high"
                        ? "#fee2e2"
                        : t.priority?.toLowerCase() === "medium"
                        ? "#fef3c7"
                        : "#dcfce7",
                    color:
                      t.priority?.toLowerCase() === "high"
                        ? "#dc2626"
                        : t.priority?.toLowerCase() === "medium"
                        ? "#b45309"
                        : "#166534",
                  }}
                >
                  {t.priority}
                </span>

                <StatusBadge status={t.priority} />
              </TableCell>

              <TableCell sx={{ px: 2, py: 1 }}>
                {toProperCase(t.category?.name) || "—"}
              </TableCell>

              {/* <TableCell sx={{ px: 2, py: 1 }}>
                {t.due_date ? format(new Date(t.due_date), "MM/dd/yyyy") : "-"}
              </TableCell> */}

              <TableCell sx={{ px: 2, py: 1 }}>
                <span
                  style={{
                    padding: "2px 8px",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    borderRadius: 8,
                    backgroundColor:
                      statusColors[t.status?.toLowerCase()]?.bg || "#f3f4f6",
                    color:
                      statusColors[t.status?.toLowerCase()]?.text || "#374151",
                  }}
                >
                  {toProperCase(t.status)}
                </span>
              </TableCell>

              <TableCell sx={{ px: 2, py: 1, color: "#374151" }}>
                {toProperCase(t.created_by?.username) || "—"}
              </TableCell>

              <TableCell sx={{ px: 2, py: 1 }} align="center">
                <Tooltip title="View Ticket">
                  <IconButton
                    size="small"
                    onClick={() => navigate(`/tickets/${t.id}`)}
                  >
                    <LaunchIcon fontSize="small" sx={{ color: "#6b7280" }} />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
