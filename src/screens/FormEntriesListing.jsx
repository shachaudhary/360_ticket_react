import React, { useEffect, useState } from "react";
import {
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  CircularProgress,
  InputAdornment,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { createAPIEndPoint } from "../config/api/api";
import CustomTablePagination from "../components/CustomTablePagination";
import { useNavigate } from "react-router-dom";
import { useApp } from "../state/AppContext";
import ModeEditSharpIcon from "@mui/icons-material/ModeEditSharp";

import StatusBadge from "../components/StatusBadge";
import { convertToCST } from "../utils";
import ClearIcon from "@mui/icons-material/Clear";
import LaunchIcon from "@mui/icons-material/Launch";
import { EyeIcon, PlusIcon } from "@heroicons/react/24/solid";
import { toProperCase } from "../utils/formatting";

export default function FormEntries() {
  const navigate = useNavigate();
  const { user } = useApp();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState("");
  const [formTypeFilter, setFormTypeFilter] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [formTypes, setFormTypes] = useState([]);

  // 🔹 Debounce Search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(0);
    }, 500);
    return () => clearTimeout(handler);
  }, [query]);

  // 🔹 Fetch Form Types for Filter
  useEffect(() => {
    const fetchFormTypes = async () => {
      try {
        const res = await createAPIEndPoint("form_types").fetchAll();
        setFormTypes(res.data?.form_types || []);
      } catch (err) {
        console.error("Error fetching form types:", err);
      }
    };
    fetchFormTypes();
  }, []);

  // 🔹 Fetch Entries
  const fetchFormEntries = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedQuery) params.append("search", debouncedQuery);
      if (statusFilter) params.append("status", statusFilter);
      if (formTypeFilter) params.append("form_type", formTypeFilter);
      if (startDate)
        params.append("start_date", startDate.format("YYYY-MM-DD"));
      if (endDate) params.append("end_date", endDate.format("YYYY-MM-DD"));
      params.append("page", page + 1);
      params.append("per_page", rowsPerPage);

      const res = await createAPIEndPoint(`form_entries?${params}`).fetchAll();
      setEntries(res.data?.form_entries || []);
      setTotalCount(res.data?.total || 0);
    } catch (err) {
      console.error("Failed to fetch form entries", err);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFormEntries();
  }, [
    page,
    rowsPerPage,
    debouncedQuery,
    statusFilter,
    formTypeFilter,
    startDate,
    endDate,
  ]);

  const handleClearFilters = () => {
    setQuery("");
    setStatusFilter("");
    setFormTypeFilter("");
    setStartDate(null);
    setEndDate(null);
    setPage(0);
  };

  const handleViewEntry = (id) => {
    window.open(`/form_entries/${id}`, "_blank");
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg md:text-xl font-semibold text-sidebar">
          Form Submissions
        </h2>
        <button
          onClick={() => navigate("/new-hire-form")}
          className="flex items-center gap-1 rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-all"
        >
          <PlusIcon className="h-4 w-4 text-white stroke-[2.5]" />
          New Form
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        {/* Search */}
        <div className="col-span-1 sm:col-span-2 lg:col-span-2">
          <TextField
            label="Search"
            size="small"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            fullWidth
            InputProps={{
              endAdornment: query?.length > 0 && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setQuery("")}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </div>

        {/* Status */}
        <div className="col-span-1">
          <FormControl size="small" fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="New">New</MenuItem>
              <MenuItem value="Reviewed">Reviewed</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
            </Select>
          </FormControl>
        </div>

        {/* Form Type */}
        <div className="col-span-1">
          <FormControl size="small" fullWidth>
            <InputLabel>Form Type</InputLabel>
            <Select
              value={formTypeFilter}
              label="Form Type"
              onChange={(e) => setFormTypeFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {formTypes.map((ft) => (
                <MenuItem key={ft.id} value={ft.name}>
                  {toProperCase(ft.name)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>

        {/* Dates */}
        <div className="col-span-1">
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={(date) => setStartDate(date)}
              maxDate={endDate}
              slotProps={{
                textField: { size: "small", fullWidth: true },
              }}
            />
          </LocalizationProvider>
        </div>

        <div className="col-span-1">
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={(date) => setEndDate(date)}
              minDate={startDate}
              slotProps={{
                textField: { size: "small", fullWidth: true },
              }}
            />
          </LocalizationProvider>
        </div>

        {/* Clear Button */}
        <div className="flex justify-end col-span-1 sm:col-span-2 lg:col-span-6">
          <button
            onClick={handleClearFilters}
            className={`px-3 py-[6.15px] shrink-0 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 transition-all ${
              query || statusFilter || formTypeFilter || startDate || endDate
                ? "border border-red-500 bg-red-500 text-white hover:bg-red-600 focus:ring-red-500"
                : "border border-[#E5E7EB] text-gray-400 hover:border-gray-300 hover:text-gray-600 hover:bg-brand-50 focus:ring-gray-500"
            }`}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="overflow-hidden rounded-lg border border-[#E5E7EB]">
          <div className="h-[calc(100dvh-240px)] flex items-center justify-center rounded-lg bg-purple-50">
            <CircularProgress color="primary" />
          </div>
        </div>
      ) : entries.length === 0 ? (
        <div className="overflow-hidden rounded-lg border border-[#E5E7EB]">
          <div className="h-[calc(100dvh-240px)] flex flex-col items-center justify-center rounded-lg">
            <p className="text-gray-500 font-normal text-md">
              No form submissions found
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="overflow-hidden rounded-lg border border-[#E5E7EB]">
            <div className="overflow-auto h-[calc(100dvh-308.75px)]">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-white sticky top-0 z-10 whitespace-nowrap">
                  <tr className="text-left text-xs text-gray-500">
                    <th className="px-4 py-3 border-b border-r border-[#E5E7EB]">
                      #
                    </th>
                    <th className="px-4 py-3 border-b border-r border-[#E5E7EB]">
                      Form Type
                    </th>
                    <th className="px-4 py-3 border-b border-r border-[#E5E7EB]">
                      Created By
                    </th>
                    <th className="px-4 py-3 border-b border-r border-[#E5E7EB] !font-medium">
                      Employee Info
                    </th>
                    <th className="px-4 py-3 border-b border-r border-[#E5E7EB]">
                      Submitted Date
                    </th>
                    <th className="px-4 py-3 text-center border-b border-[#E5E7EB]">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white text-sm">
                  {entries.map((entry, idx) => {
                    const submitter =
                      entry.submitted_by?.username ||
                      entry.submitted_by?.email ||
                      "N/A";

                    const employeeName =
                      entry.field_values?.find((f) =>
                        [
                          "Employee Name",
                          "employee_name",
                          "full_name",
                        ].includes(f.field_name.toLowerCase())
                      )?.field_value || "N/A";

                    const department =
                      entry.field_values?.find((f) =>
                        ["Department", "department"].includes(
                          f.field_name.toLowerCase()
                        )
                      )?.field_value || "N/A";

                    const firstField =
                      entry.field_values?.find((f) =>
                        [
                          "Employee Name",
                          "employee_name",
                          "full_name",
                        ].includes(f.field_name.toLowerCase())
                      )?.field_value ||
                      entry.field_values?.[0]?.field_value ||
                      "—";

                    return (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 border-b border-[#E5E7EB]">
                          {page * rowsPerPage + idx + 1}
                        </td>

                        {/* ✅ Form Type */}
                        <td className="px-4 py-3 border-b border-[#E5E7EB]">
                          {toProperCase(entry.form_type_name) || "N/A"}
                        </td>

                        {/* ✅ Submitted By */}
                        <td className="px-4 py-3 border-b border-[#E5E7EB] text-gray-700">
                          <Chip
                            label={toProperCase(submitter)}
                            variant="filled"
                            sx={{
                              fontSize: 12.75,
                              borderRadius: "24px",
                              color: "#353b48",
                              backgroundColor: "#f5f6fa",
                              height: 27.5,
                              "& .MuiChip-label": {
                                px: "7px !important",
                              },
                            }}
                          />
                        </td>

                        <td className="px-4 py-3 border-b border-[#E5E7EB] text-gray-700">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">
                              {employeeName}
                            </span>
                            <span className="text-xs text-gray-500">
                              {department}
                            </span>
                          </div>
                        </td>
                        {/* ✅ Field Summary (like "Employee Name") */}
                        {/* <td className="px-4 py-3 border-b border-[#E5E7EB] text-gray-700">
                          {firstField}
                        </td> */}

                        {/* ✅ Created At */}
                        <td className="px-4 py-3 border-b border-[#E5E7EB] text-gray-700">
                          {convertToCST(entry.created_at) || "—"}
                        </td>

                        {/* ✅ Action */}
                        <td className="px-4 py-3 text-center border-b border-[#E5E7EB]">
                          <Tooltip title="View Form Entry">
                            <IconButton
                              size="small"
                              onClick={() => handleViewEntry(entry.id)}
                            >
                              {/* <LaunchIcon
                                fontSize="small"
                                className="text-gray-500"
                              /> */}
                              <EyeIcon
                                fontSize="small"
                                className="!text-[16px] h-4  !text-[#707784]"
                              />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Edit Form Entry">
                            <IconButton
                              size="small"
                              onClick={() =>
                                navigate(`/form_entries/edit/${entry.id}`)
                              }
                            >
                              <ModeEditSharpIcon
                                fontSize="small"
                                className="!text-[16px] !text-[#707784]"
                              />
                              {/* <i className="fa-solid fa-pen text-gray-500 text-[13px]" /> */}
                            </IconButton>
                          </Tooltip>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <CustomTablePagination
            rowsPerPage={rowsPerPage}
            setRowsPerPage={setRowsPerPage}
            page={page}
            setPage={setPage}
            totalCount={totalCount}
          />
        </div>
      )}
    </div>
  );
}
