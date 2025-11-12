import React from "react";
import {
  Box,
  FormControl,
  Select,
  MenuItem,
  Typography,
  IconButton,
} from "@mui/material";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";

const CustomTablePagination = ({
  rowsPerPage,
  setRowsPerPage,
  page,
  setPage,
  totalCount,
}) => {
  const start = totalCount === 0 ? 0 : page * rowsPerPage + 1;
  const end = Math.min((page + 1) * rowsPerPage, totalCount);
  const totalPages = Math.ceil(totalCount / rowsPerPage);

  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      flexDirection={{ xs: "column",sm:"row" }}
      mt={2}
      px={1.5}
      py={1}
      sx={{
        border: "1px solid #E5E7EB",
        borderRadius: "8px",
        backgroundColor: "#FFF",
      }}
    >
      {/* Rows per page selector */}
      <Box display="flex" alignItems="center" gap={1}>
        <Typography variant="body2" color="text.secondary">
          Rows per page:
        </Typography>
        <FormControl size="small">
          <Select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(e.target.value);
              setPage(0); // reset to first page (0-indexed)
            }}
            disabled={totalCount === 0}
            variant="standard" // removes the filled bg + box
            disableUnderline
            sx={{
              // minWidth: 70,
              color: "#6B7280",
              fontSize: "0.875rem", // Tailwind text-sm
              "& .MuiSelect-select": {
                paddingY: 0.5, // tighter vertical padding
              },
            }}
          >
            {[10, 25, 50].map((num) => (
              <MenuItem key={num} value={num} sx={{ fontSize: "0.875rem" }}>
                {num}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Pagination controls */}
      <Box display="flex" alignItems="center" gap={1} width={{ xs: "100%",sm:"auto" }} >
        <Typography variant="body2" color="text.secondary" marginRight={{ xs: "auto",sm:"unset" }}>
          {start}-{end} of {totalCount}
        </Typography>

        <IconButton
          size="small"
          disabled={page === 0}
          onClick={() => setPage(page - 1)}
        >
          <ChevronLeft fontSize="small" />
        </IconButton>

        <Typography variant="body2" color="#6B7280" fontWeight={500}>
          Page {page + 1} / {totalPages || 1}
        </Typography>

        <IconButton
          size="small"
          disabled={page >= totalPages - 1}
          onClick={() => setPage(page + 1)}
        >
          <ChevronRight fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
};

export default CustomTablePagination;
