import React, { useEffect, useState } from "react";
import {
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Pagination,
  CircularProgress,
} from "@mui/material";
import { IconButton, Tooltip } from "@mui/material";
import LaunchIcon from "@mui/icons-material/Launch";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { createAPIEndPoint } from "../config/api/api";
import CustomTablePagination from "../components/CustomTablePagination";
import { useNavigate } from "react-router-dom";
import { useApp } from "../state/AppContext";
import StatusBadge from "../components/StatusBadge";
import DateWithTooltip from "../components/DateWithTooltip";
import { convertToCST } from "../utils";
import { PlusIcon } from "@heroicons/react/24/solid";
import { toProperCase } from "../utils/formatting";

export default function Tickets() {
  const navigate = useNavigate();
  const { user } = useApp();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState(""); // 🔹 debounced value
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [categories, setCategories] = useState([]);

  // 🔹 Debounce effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(0); // reset to first page when typing new query
    }, 500); // 500ms delay

    return () => clearTimeout(handler);
  }, [query]);

  // Fetch categories once
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await createAPIEndPoint("category").fetchAll();
        setCategories(res.data || []);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setCategories([
          { id: 1, name: "Hardware" },
          { id: 2, name: "Software" },
          { id: 3, name: "Network" },
          { id: 4, name: "Other" },
        ]);
      }
    };
    fetchCategories();
  }, []);

  // State
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // 🔹 fetchTickets with API filters
  const fetchTickets = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      params.append("user_id", user?.id);
      params.append("page", page + 1);
      params.append("per_page", rowsPerPage);

      if (debouncedQuery) params.append("search", debouncedQuery); // 🔹 use debounced value
      if (statusFilter) params.append("status", statusFilter.toLowerCase());
      if (categoryFilter) params.append("category_id", categoryFilter);
      if (startDate)
        params.append("start_date", startDate.format("YYYY-MM-DD"));
      if (endDate) params.append("end_date", endDate.format("YYYY-MM-DD"));

      const res = await createAPIEndPoint(
        `tickets/filter?${params.toString()}`
      ).fetchAll();

      setTickets(res.data.tickets || []);
      setTotalPages(res.data?.pages || 1);
      setTotalCount(res.data?.total || 0);
    } catch (err) {
      console.error("Failed to fetch tickets", err);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Re-fetch when filters or debouncedQuery change
  useEffect(() => {
    fetchTickets();
  }, [
    page,
    rowsPerPage,
    debouncedQuery,
    statusFilter,
    categoryFilter,
    startDate,
    endDate,
  ]);

  const currentItems = tickets;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        {/* <h2 className="text-xl font-semibold text-brand-600">Tickets</h2> */}
        <h2 className="text-lg md:text-xl font-semibold">Tickets</h2>
        <button
          onClick={() => navigate("new")}
          className="flex items-center gap-1 rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-all"
        >
          <PlusIcon className="h-4 w-4 text-white stroke-[2.5]" />
          New Ticket
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
        {/* Search */}
        <div className="col-span-1 sm:col-span-2 md:col-span-2">
          <TextField
            label="Search"
            size="small"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            fullWidth
            // className="!placeholder:font-semibold"
            // sx={{
            //   "&: .MuiInputBase-input::placeholder": { fontWeight: "bold" },
            // }}
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
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="In Progress">In Progress</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
            </Select>
          </FormControl>
        </div>

        {/* Category */}
        <div className="col-span-1">
          <FormControl size="small" fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              value={categoryFilter}
              label="Category"
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>

              {categories.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>

        {/* Start Date */}
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

        {/* End Date */}
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
        <div className="col-span-1 flex items-center">
          <button
            onClick={() => {
              setQuery("");
              setStatusFilter("");
              setCategoryFilter("");
              setStartDate(null);
              setEndDate(null);
              setPage(0);
            }}
            className={`h-9 rounded-lg px-3 text-xs font-medium focus:outline-none focus:ring-2 transition-all ${
              query || statusFilter || categoryFilter || startDate || endDate
                ? "border border-red-500 text-red-500 hover:bg-red-50 focus:ring-red-500"
                : "border border-[#E5E7EB] hover:border-[#ddd] hover:text-gray-500 text-gray-400 hover:bg-brand-50 focus:ring-gray-500"
            }`}
          >
            Clear
          </button>
        </div>
      </div>

      {/* ✅ Loader */}
      {loading ? (
        <div className="overflow-hidden rounded-lg border border-[#E5E7EB]">
          <div className="overflow-auto h-[calc(100vh-240px)] flex items-center justify-center rounded-lg bg-green-50">
            <CircularProgress color="primary" />
          </div>
        </div>
      ) : currentItems.length === 0 ? (
        // ✅ Not Found Error
        <div className="overflow-hidden rounded-lg border border-[#E5E7EB]">
          <div className="h-[calc(100vh-240px)] flex-col gap-1 flex items-center justify-center rounded-lg">
            <p className="text-gray-500 font-normal text-md">
              No tickets found
            </p>
            {/* <button
              onClick={() => {
                setQuery("");
                setStatusFilter("");
                setCategoryFilter("");
                setStartDate(null);
                setEndDate(null);
              }}
              className="h-8 rounded-lg border border-gray-300 px-3 text-xs font-medium text-gray-400 hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Create
            </button> */}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          {/* Table */}
          <div className="overflow-hidden rounded-lg border border-[#E5E7EB]">
            <div className="overflow-auto h-[calc(100vh-307.75px)]">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-white sticky top-0 z-10">
                  <tr className="text-left text-xs text-gray-500 ">
                    <th className="px-4 py-3 border-r border-b border-[#E5E7EB] !font-medium">
                      #
                    </th>
                    <th className="px-4 py-3 border-r border-b border-[#E5E7EB] !font-medium">
                      Title
                    </th>
                    {/* <th className="px-4 py-3 border-r border-b border-[#E5E7EB] !font-medium">
                      Details
                    </th> */}
                    <th className="px-4 py-3 border-r border-b border-[#E5E7EB] !font-medium">
                      Priority
                    </th>
                    <th className="px-4 py-3 border-r border-b border-[#E5E7EB] !font-medium">
                      Category
                    </th>
                    <th className="px-4 py-3 border-r border-b border-[#E5E7EB] !font-medium">
                      Due Date
                    </th>
                    <th className="px-4 py-3 border-r border-b border-[#E5E7EB] !font-medium">
                      Status
                    </th>
                    <th className="px-4 py-3 border-r border-b border-[#E5E7EB] !font-medium">
                      Created By
                    </th>
                    <th className="px-4 py-3 border-r border-b border-[#E5E7EB] !font-medium">
                      Assigned To
                    </th>
                    <th className="px-4 py-3 border-r border-b border-[#E5E7EB] !font-medium">
                      Created At
                    </th>
                    <th className="px-4 py-3 text-center border-b border-[#E5E7EB] !font-medium">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white text-sm">
                  {currentItems.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 border-b border-[#E5E7EB]">
                        {t.id}
                      </td>
                      <td className="px-4 py-3 border-b border-[#E5E7EB]">
                        {t.title}
                      </td>
                      {/* <td className="px-4 py-3 border-b border-[#E5E7EB]">
                        {t.details}
                      </td> */}
                      <td className="px-4 py-3 border-b border-[#E5E7EB]">
                        {/* <span
                          className={`px-2 py-1 text-xs font-semibold rounded-lg ${
                            t.priority?.toLowerCase() === "high"
                              ? "bg-red-100 text-red-500"
                              : t.priority?.toLowerCase() === "medium"
                              ? "bg-yellow-100 text-yellow-500"
                              : "bg-green-100 text-green-500"
                          }`}
                        >
                          {t.priority}
                        </span> */}
                        <StatusBadge
                          status={t.priority === "Medium" ? "High" : t.priority}
                          isInside
                        />
                      </td>
                      <td className="px-4 py-3 border-b border-[#E5E7EB]">
                        {t.category?.name || "—"}
                      </td>
                      <td className="px-4 py-3 border-b border-[#E5E7EB]">
                        <DateWithTooltip date={t?.due_date} />
                      </td>
                      <td className="px-4 py-3 border-b border-[#E5E7EB]">
                        <StatusBadge isInside status={t.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-700 border-b border-[#E5E7EB]">
                        {t.created_by?.username || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-700 border-b border-[#E5E7EB]">
                        {t.assignees && t.assignees.length > 0
                          ? t.assignees
                              .map((a) => toProperCase(a.assign_to_username))
                              .join(", ")
                          : "Unassigned"}
                      </td>

                      <td className="px-4 py-3 text-gray-700 border-b border-[#E5E7EB]">
                        {convertToCST(t.created_at) || "—"}
                      </td>
                      <td className="px-4 py-3 text-center border-b border-[#E5E7EB]">
                        <Tooltip title="View Ticket">
                          <IconButton
                            size="small"
                            // onClick={() => navigate(`/tickets/${t.id}`)}
                            onClick={() =>
                              window.open(`/tickets/${t.id}`, "_blank")
                            }
                          >
                            <LaunchIcon
                              fontSize="small"
                              className="text-gray-500"
                            />
                          </IconButton>
                        </Tooltip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <CustomTablePagination
            rowsPerPage={rowsPerPage}
            setRowsPerPage={setRowsPerPage}
            page={page}
            setPage={setPage}
            totalCount={totalCount}
            // totalCount={filtered.length}
          />
        </div>
      )}
    </div>
  );
}
