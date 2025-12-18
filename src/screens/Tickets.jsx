import React, { useEffect, useState } from "react";
import {
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Pagination,
  CircularProgress,
  InputAdornment,
  Chip,
  Menu,
  Typography,
} from "@mui/material";
import { IconButton, Tooltip } from "@mui/material";
import LaunchIcon from "@mui/icons-material/Launch";
import CheckIcon from "@mui/icons-material/Check";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { createAPIEndPoint } from "../config/api/api";
import CustomTablePagination from "../components/CustomTablePagination";
import { useNavigate } from "react-router-dom";
import { useApp } from "../state/AppContext";
import StatusBadge from "../components/StatusBadge";
import DateWithTooltip from "../components/DateWithTooltip";
import ClearIcon from "@mui/icons-material/Clear";
import { convertToCST } from "../utils";
import { PlusIcon } from "@heroicons/react/24/solid";
import { toProperCase, cleanText } from "../utils/formatting";
import { EyeIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { chipStyle } from "../utils/common";


const MAX_RECENT_TICKETS = 6;

const getRecentTickets = () => {
  try {
    return JSON.parse(localStorage.getItem("recentTickets")) || [];
  } catch {
    return [];
  }
};

const addRecentTicket = (ticket) => {
  const existing = getRecentTickets();

  const filtered = existing.filter((t) => t.id !== ticket.id);
  const updated = [
    {
      id: ticket.id,
      title: ticket.title,
    },
    ...filtered,
  ].slice(0, MAX_RECENT_TICKETS);

  localStorage.setItem("recentTickets", JSON.stringify(updated));
};


export default function Tickets() {
  const navigate = useNavigate();
  const { user } = useApp();
  const [recentTickets, setRecentTickets] = useState([]);

  useEffect(() => {
    const recent = getRecentTickets();
    setRecentTickets(recent);
  }, []);

  // Load filters from localStorage on mount
  const loadFiltersFromStorage = () => {
    try {
      const saved = localStorage.getItem("ticketsFilters");
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          query: parsed.query || "",
          statusFilter: parsed.statusFilter || [],
          categoryFilter: parsed.categoryFilter || "",
          startDate: parsed.startDate ? dayjs(parsed.startDate) : null,
          endDate: parsed.endDate ? dayjs(parsed.endDate) : null,
          userFilter: parsed.userFilter !== undefined ? parsed.userFilter : "assign_to",
          page: parsed.page || 0,
          rowsPerPage: parsed.rowsPerPage || 10,
        };
      }
    } catch (err) {
      console.error("Error loading filters from storage:", err);
    }
    return {
      query: "",
      statusFilter: [],
      categoryFilter: "",
      startDate: null,
      endDate: null,
      userFilter: "assign_to",
      page: 0,
      rowsPerPage: 10,
    };
  };

  const savedFilters = loadFiltersFromStorage();

  const [query, setQuery] = useState(savedFilters.query);
  const [debouncedQuery, setDebouncedQuery] = useState(savedFilters.query); // 🔹 debounced value
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState(savedFilters.statusFilter);
  const [categoryFilter, setCategoryFilter] = useState(savedFilters.categoryFilter);
  const [startDate, setStartDate] = useState(savedFilters.startDate);
  const [endDate, setEndDate] = useState(savedFilters.endDate);
  const [userFilter, setUserFilter] = useState(savedFilters.userFilter);
  const [categories, setCategories] = useState([]);

  // Check if user is admin
  const isAdmin = user?.user_role?.toLowerCase() === "admin";

  // 🔹 Debounce effect
  const isInitialMount = React.useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      setDebouncedQuery(query);
      return;
    }

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
  const [rowsPerPage, setRowsPerPage] = useState(savedFilters.rowsPerPage);
  const [page, setPage] = useState(savedFilters.page);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    const filtersToSave = {
      query,
      statusFilter,
      categoryFilter,
      startDate: startDate ? startDate.toISOString() : null,
      endDate: endDate ? endDate.toISOString() : null,
      userFilter,
      page,
      rowsPerPage,
    };
    localStorage.setItem("ticketsFilters", JSON.stringify(filtersToSave));
  }, [query, statusFilter, categoryFilter, startDate, endDate, userFilter, page, rowsPerPage]);

  // Status update state
  const [statusMenuAnchor, setStatusMenuAnchor] = useState(null);
  const [selectedTicketForStatus, setSelectedTicketForStatus] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // 🔹 Handle Status Update
  const handleStatusUpdate = async (ticketId, newStatus) => {
    setUpdatingStatus(true);
    try {
      await createAPIEndPoint(`ticket/${ticketId}`).patch({
        updated_by: user?.id,
        status: newStatus,
      });

      toast.success(`Status updated to ${toProperCase(newStatus)}`);
      setStatusMenuAnchor(null);
      setSelectedTicketForStatus(null);
      fetchTickets(); // Refresh the list
    } catch (err) {
      console.error("Failed to update status", err);
      toast.error("Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // 🔹 fetchTickets with API filters
  const fetchTickets = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      // params.append("user_id", user?.id);

      if (debouncedQuery) params.append("search", debouncedQuery); // 🔹 use debounced value
      if (statusFilter && statusFilter.length > 0) {
        // Join multiple statuses with commas and normalize them
        const statusParam = statusFilter
          .map(s => s.toLowerCase().replace(/\+/g, " ").replace(/_/g, " "))
          .join(",");
        params.append("status", statusParam);
      }
      if (categoryFilter) params.append("category_id", categoryFilter);
      if (startDate)
        params.append("start_date", startDate.format("YYYY-MM-DD"));
      if (endDate) params.append("end_date", endDate.format("YYYY-MM-DD"));
      if (userFilter === "assign_to") params.append("assign_to", user?.id);
      if (userFilter === "created_by") params.append("created_by", user?.id);
      if (userFilter === "followup") params.append("followup", user?.id);
      if (userFilter === "tag") params.append("tag", user?.id);
      params.append("page", page + 1);
      params.append("per_page", rowsPerPage);

      const res = await createAPIEndPoint(
        `tickets?${params.toString()}`
      ).fetchAll();

      setTickets(res.data.tickets || []);
      setTotalPages(res.data?.pagination?.pages || 1);
      setTotalCount(res.data?.pagination?.total || 0);
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
    userFilter,
  ]);

  const currentItems = tickets;

  return (
    <div className="space-y-3">

      {recentTickets.length > 0 && (
        <div className="!pb-1 flex items-center gap-2 mt-2 overflow-x-auto !scrollbar-hide   
    scrollbar-thin
    scrollbar-thumb-gray-300
    scrollbar-track-transparent 
    [&::-webkit-scrollbar]:h-[4px]
    [&::-webkit-scrollbar-track]:bg-transparent
    [&::-webkit-scrollbar-thumb]:bg-gray-300
    [&::-webkit-scrollbar-thumb]:rounded-full">
          {/* Label */}
          <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide shrink-0">
            Recent
          </span>

          {/* Divider */}
          <span className="h-4 w-px bg-gray-200 shrink-0" />

          {/* Tickets */}
          {recentTickets.slice(0, 6).map((t) => (
            <Tooltip
              key={t.id}
              title={`${toProperCase(t.title)} (#${t.id})`}
              arrow
              placement="top"
            >
              <Chip
                size="small"
                onClick={() => navigate(`/tickets/${t.id}`)}
                label={
                  <span className="max-w-[140px] truncate inline-block">
                    #{t.id} — {toProperCase(t.title)}
                  </span>
                }
                sx={{
                  height: 26,
                  fontSize: "11.5px",
                  fontWeight: 500,
                  borderRadius: "8px",
                  cursor: "pointer",
                  backgroundColor: "#FAFAFA",
                  border: "1px solid #E5E7EB",

                  "&:hover": {
                    backgroundColor: "#F3F4F6",
                  },

                  "& .MuiChip-label": {
                    px: 1.25,
                    color: "#6B7280",
                  },
                }}
              />
            </Tooltip>
          ))}

          {/* More indicator */}
          {recentTickets.length > 6 && (
            <span className="text-[11px] text-gray-400 shrink-0">
              +{recentTickets.length - 6} more
            </span>
          )}

          {/* Clear */}
          <Tooltip title="Clear recent tickets">
            <button
              onClick={() => {
                localStorage.removeItem("recentTickets");
                setRecentTickets([]);
              }}
              className="
      ml-1 px-2 h-[26px] shrink-0
      rounded-lg
      text-[11px] font-medium
      border border-[#E5E7EB]
      text-[#969AA1]
      bg-white
      hover:bg-gray-50
      hover:text-[#6B7280]
      transition-all
      focus:outline-none
      focus:ring-2 focus:ring-gray-200
    "
            >
              Clear
            </button>
          </Tooltip>

        </div>
      )}



      {/* Header */}
      <div className="flex items-center justify-between">
        {/* <h2 className="text-xl font-semibold text-brand-600">Tickets</h2> */}
        <h2 className="text-lg md:text-xl font-semibold text-sidebar">
          Tickets
        </h2>
        <button
          onClick={() => navigate("new")}
          className="flex items-center gap-1 rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-all"
        >
          <PlusIcon className="h-4 w-4 text-white stroke-[2.5]" />
          New Ticket
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
                  <IconButton
                    size="small"
                    onClick={() => setQuery("")}
                    edge="end"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </div>

        {/* Status */}
        <div className="col-span-1">
          <FormControl size="small" fullWidth disabled={loading}>
            <InputLabel>Status</InputLabel>
            <Select
              multiple
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
              disabled={loading}
              renderValue={(selected) => {
                if (selected.length === 0) return "All";
                const displayCount = Math.min(selected.length, 1);
                const remainingCount = selected.length - displayCount;
                return (
                  <div className="flex flex-wrap gap-1 items-center">
                    {selected.slice(0, displayCount).map((value) => (
                      <Chip
                        key={value}
                        label={toProperCase(value.replace(/_/g, " "))}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: "0.7rem",
                          fontWeight: 500,
                          backgroundColor: "#F3E8FF",
                          color: "#824EF2",
                          border: "1px solid #E9D5FF",
                          "& .MuiChip-label": {
                            px: 0.875,
                          },
                        }}
                      />
                    ))}
                    {remainingCount > 0 && (
                      <span className="text-xs text-gray-500 font-medium ml-1">
                        +{remainingCount} more
                      </span>
                    )}
                  </div>
                );
              }}

            >
              <MenuItem
                value="pending"
                sx={{
                  "&.Mui-selected": {
                    backgroundColor: "#F3E8FF",
                    "&:hover": {
                      backgroundColor: "#E9D5FF",
                    },
                  },
                }}
              >
                <div className="flex items-center justify-between w-full">
                  <span>Pending</span>
                  {statusFilter.includes("pending") && (
                    <CheckIcon sx={{ fontSize: 18, color: "#824EF2", ml: 1 }} />
                  )}
                </div>
              </MenuItem>
              <MenuItem
                value="in_progress"
                sx={{
                  "&.Mui-selected": {
                    backgroundColor: "#F3E8FF",
                    "&:hover": {
                      backgroundColor: "#E9D5FF",
                    },
                  },
                }}
              >
                <div className="flex items-center justify-between w-full">
                  <span>In Progress</span>
                  {statusFilter.includes("in_progress") && (
                    <CheckIcon sx={{ fontSize: 18, color: "#824EF2", ml: 1 }} />
                  )}
                </div>
              </MenuItem>
              <MenuItem
                value="completed"
                sx={{
                  "&.Mui-selected": {
                    backgroundColor: "#F3E8FF",
                    "&:hover": {
                      backgroundColor: "#E9D5FF",
                    },
                  },
                }}
              >
                <div className="flex items-center justify-between w-full">
                  <span>Completed</span>
                  {statusFilter.includes("completed") && (
                    <CheckIcon sx={{ fontSize: 18, color: "#824EF2", ml: 1 }} />
                  )}
                </div>
              </MenuItem>
            </Select>
          </FormControl>
        </div>

        {/* Category */}
        <div className="col-span-1">
          <FormControl size="small" fullWidth disabled={loading}>
            <InputLabel>Category</InputLabel>
            <Select
              value={categoryFilter}
              label="Category"
              onChange={(e) => setCategoryFilter(e.target.value)}
              disabled={loading}
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
        <div className="col-span-1 sm:col-span-1 lg:col-span-1">
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={(date) => setStartDate(date)}
              maxDate={endDate}
              disabled={loading}
              slotProps={{
                textField: { size: "small", fullWidth: true, disabled: loading },
              }}
            />
          </LocalizationProvider>
        </div>

        {/* End Date */}
        <div className="col-span-1 sm:col-span-1 lg:col-span-1">
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={(date) => setEndDate(date)}
              minDate={startDate}
              disabled={loading}
              slotProps={{
                textField: { size: "small", fullWidth: true, disabled: loading },
              }}
            />
          </LocalizationProvider>
        </div>

        {/* User Filter + Clear button row */}
        {/* <div className="col-span-1 sm:col-span-2 lg:col-span-6 flex flex-col lg:flex-row items-stretch lg:items-center gap-2">
          <div className="flex-1 lg:flex-initial lg:w-1/6">
            <FormControl size="small" fullWidth>
              <InputLabel>Filter</InputLabel>
              <Select
                value={userFilter}
                label="Filter"
                onChange={(e) => setUserFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="assign_to">Assigned To Me</MenuItem>
                <MenuItem value="created_by">Assigned By Me</MenuItem>
                <MenuItem value="followup">My Followups</MenuItem>
                <MenuItem value="tag">Tagged Me</MenuItem>
              </Select>
            </FormControl>
          </div>

          <div className="flex lg:ml-auto lg:w-auto">
            <button
              onClick={() => {
                setQuery("");
                setStatusFilter("");
                setCategoryFilter("");
                setStartDate(null);
                setEndDate(null);
                setUserFilter("");
                setPage(0);
              }}
              className={`h-9 shrink-0 rounded-lg px-3 text-xs font-medium focus:outline-none focus:ring-2 transition-all ${
                query ||
                statusFilter ||
                categoryFilter ||
                startDate ||
                endDate ||
                userFilter
                  ? "border border-red-500 text-red-500 hover:bg-red-50 focus:ring-red-500"
                  : "border border-[#E5E7EB] hover:border-[#ddd] hover:text-gray-500 text-gray-400 hover:bg-brand-50 focus:ring-gray-500"
              }`}
            >
              Clear
            </button>
          </div>
        </div> */}

        {/* User Filter + Clear button row */}
        <div className="mb-0.5 col-span-1 sm:col-span-2 lg:col-span-6 flex flex-col lg:flex-row items-stretch lg:items-center gap-2">
          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            {(() => {
              // Base filters (without "All")
              const baseFilters = [
                { value: "assign_to", label: "Assigned" },
                { value: "created_by", label: "Created" },
                { value: "followup", label: "Following" },
                { value: "tag", label: "Tagged" },
              ];

              // Add "All" at the end only for admins
              const allFilter = { value: "", label: "All" };
              const filters = isAdmin
                ? [...baseFilters, allFilter]
                : baseFilters;

              return filters.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() =>
                    setUserFilter(userFilter === filter.value ? "assign_to" : filter.value)
                  }
                  disabled={loading}
                  className={`px-3 py-[6.15px] !text-xs font-medium rounded-lg border transition-all duration-500 ${loading
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                    } ${userFilter === filter.value
                      ? "bg-brand-500 text-white border-brand-500 hover:bg-brand-600"
                      : "border border-[#E5E7EB] text-[#969AA1] hover:bg-gray-50"
                    }`}
                >
                  {filter.label}
                </button>
              ));
            })()}
          </div>

          {/* Clear Button on the right */}
          <div className="flex lg:ml-auto lg:w-auto">
            <button
              onClick={() => {
                setQuery("");
                setStatusFilter([]);
                setCategoryFilter("");
                setStartDate(null);
                setEndDate(null);
                setUserFilter("assign_to"); // Reset to default "assigned"
                setPage(0);
              }}
              disabled={loading}
              className={`px-3 py-[6.15px] shrink-0 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 transition-all ${loading
                ? "opacity-50 cursor-not-allowed"
                : ""
                } ${query ||
                  (statusFilter && statusFilter.length > 0) ||
                  categoryFilter ||
                  startDate ||
                  endDate ||
                  (userFilter && userFilter !== "assign_to")
                  ? "border border-red-500 bg-red-500 text-white hover:bg-red-600 focus:ring-red-500"
                  : "border border-[#E5E7EB] text-gray-400 hover:border-gray-300 hover:text-gray-600 hover:bg-brand-50 focus:ring-gray-500"
                }`}
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* ✅ Loader */}
      {loading ? (
        <div className="overflow-hidden rounded-lg border border-[#E5E7EB]">
          <div className="overflow-auto h-[calc(100dvh-274px)] flex items-center justify-center rounded-lg bg-purple-50">
            <CircularProgress color="primary" />
          </div>
        </div>
      ) : currentItems.length === 0 ? (
        // ✅ Not Found Error
        <div className="overflow-hidden rounded-lg border border-[#E5E7EB]">
          <div className="h-[calc(100dvh-274px)] flex-col gap-1 flex items-center justify-center rounded-lg">
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
            <div className="overflow-auto h-[calc(100dvh-342.75px)]">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-white sticky top-0 z-10 whitespace-nowrap">
                  <tr className="text-left !text-xs text-gray-500 ">
                    <th className="px-4 py-3 border-b border-r border-[#E5E7EB]">
                      #
                    </th>
                    <th className="px-4 py-3 border-b border-r border-[#E5E7EB]">
                      Ticket ID
                    </th>
                    <th className="px-4 py-3 border-b border-r border-[#E5E7EB]">
                      Title
                    </th>
                    {/* <th className="px-4 py-3 border-r border-b border-[#E5E7EB] !font-medium">
                      Details
                    </th> */}
                    <th className="px-4 py-3 border-b border-r border-[#E5E7EB]">
                      Priority
                    </th>
                    <th className="px-4 py-3 border-b border-r border-[#E5E7EB] ">
                      Category
                    </th>
                    {/* <th className="px-4 py-3 border-r border-b border-[#E5E7EB] !font-medium">
                      Due Date
                    </th> */}
                    <th className="px-4 py-3 border-b border-r border-[#E5E7EB] ">
                      Status
                    </th>
                    <th className="px-4 py-3 border-b border-r border-[#E5E7EB] ">
                      Created By
                    </th>
                    <th className="px-4 py-3 border-b border-r border-[#E5E7EB] ">
                      Assigned To
                    </th>
                    <th className="px-4 py-3 border-b border-r border-[#E5E7EB] ">
                      Created At
                    </th>
                    <th className="px-4 py-3 border-b border-r border-[#E5E7EB] ">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white text-sm">
                  {currentItems.map((t, idx) => (
                    <tr key={t.id} className="hover:bg-gray-50 ">
                      <td className="px-4 py-3 border-b  border-[#E5E7EB] ">
                        {page * rowsPerPage + idx + 1}
                      </td>
                      <td className="px-4 py-3 border-b border-[#E5E7EB] text-gray-600">
                        #{t.id}
                      </td>
                      <td className="px-4 py-3 border-b border-[#E5E7EB] font-medium text-gray-800 max-w-48">
                        <Tooltip title={toProperCase(cleanText(t.title))} arrow placement="top">
                          <div className="line-clamp-none break-words">
                            {toProperCase(cleanText(t.title))}
                          </div>
                        </Tooltip>
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
                        <Chip
                          label={toProperCase(t.category?.name) || "N/A"}
                          variant="filled"
                          sx={{
                            fontSize: 11.75,
                            fontWeight: 500,
                            borderRadius: "6px",
                            color: "#6B7280",
                            border: "1px solid #E5E7EB",
                            background: "white",
                            height: 27.5,
                            "& .MuiChip-label": {
                              px: "7px !important", // ✅ Correct selector
                            },
                          }}
                        />
                      </td>
                      {/* <td className="px-4 py-3 border-b border-[#E5E7EB]">
                        <DateWithTooltip date={t?.due_date} />
                      </td> */}
                      <td className="px-4 py-3 border-b border-[#E5E7EB]">
                        {t.status?.toLowerCase() === "completed" ? (
                          <div className="inline-block">
                            <StatusBadge
                              isInside
                              status={t.status}
                              showDropdown={false}
                            />
                          </div>
                        ) : (
                          <Tooltip title="Click to change status" arrow>
                            <div
                              onClick={(e) => {
                                setStatusMenuAnchor(e.currentTarget);
                                setSelectedTicketForStatus(t);
                              }}
                              className="cursor-pointer inline-block hover:opacity-80 transition-opacity"
                            >
                              <StatusBadge
                                isInside
                                status={t.status}
                                showDropdown={true}
                              />
                            </div>
                          </Tooltip>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700 border-b border-[#E5E7EB]">
                        {/* {toProperCase(t.created_by?.username) || "—"} */}
                        <Chip
                          label={toProperCase(t.created_by?.username) || "N/A"}
                          variant="filled"
                          sx={chipStyle}
                        />
                      </td>
                      <td className="px-4 py-3 text-gray-700 border-b border-[#E5E7EB]">
                        {/* {t.assignees && t.assignees.length > 0
                          ? t.assignees
                              .map((a) => toProperCase(a.assign_to_username))
                              .join(", ")
                          : "Unassigned"} */}

                        <Chip
                          label={
                            t.assignees && t.assignees.length > 0
                              ? t.assignees
                                .map((a) =>
                                  toProperCase(a.assign_to_username)
                                )
                                .join(", ")
                              : "Unassigned"
                          }
                          variant="filled"
                          sx={chipStyle}
                        // sx={{
                        //   fontSize: 12.75,
                        //   borderRadius: "24px",
                        //   color: "#353b48",
                        //   backgroundColor: "#f5f6fa",
                        //   height: 27.5,
                        //   "& .MuiChip-label": {
                        //     px: "7px !important",
                        //   },
                        // }}
                        />
                      </td>

                      <td className="px-4 py-3 text-gray-700 border-b border-[#E5E7EB]">
                        {convertToCST(t.created_at) || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-center border-b border-[#E5E7EB]">
                        <Tooltip title="View Ticket">
                          <IconButton
                            size="small"
                            onClick={() => {
                              addRecentTicket(t);
                              setRecentTickets(getRecentTickets());
                              navigate(`/tickets/${t.id}`);
                            }}
                          >
                            {/* <LaunchIcon
                              fontSize="small"
                              className="text-gray-500"
                            /> */}
                            <EyeIcon className="h-5 w-5 text-gray-500 hover:text-brand-500 transition-colors" />
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

      {/* Status Update Menu */}
      <Menu
        anchorEl={statusMenuAnchor}
        open={Boolean(statusMenuAnchor)}
        onClose={() => {
          setStatusMenuAnchor(null);
          setSelectedTicketForStatus(null);
        }}
        PaperProps={{
          sx: {
            borderRadius: "12px",
            border: "1px solid #E5E7EB",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
            minWidth: 180,
            mt: 0.5,
          },
        }}
      >
        <div className="px-2 py-1">
          <Typography
            variant="caption"
            className="!px-2 !py-1 !text-gray-500 !font-medium !text-xs"
          >
            Update Status
          </Typography>
        </div>
        {["Pending", "In Progress", "Completed"].map((status) => {
          const isCurrentStatus =
            selectedTicketForStatus?.status?.toLowerCase() ===
            status.toLowerCase().replace(" ", "_");
          return (
            <MenuItem
              key={status}
              onClick={() => {
                if (!isCurrentStatus) {
                  handleStatusUpdate(
                    selectedTicketForStatus?.id,
                    status.toLowerCase().replace(" ", "_")
                  );
                }
              }}
              disabled={isCurrentStatus || updatingStatus}
              sx={{
                fontSize: "14px",
                py: 1,
                px: 2,
                mx: 1,
                my: 0.25,
                borderRadius: "8px",
                "&:hover": {
                  backgroundColor: "#F3F4F6",
                },
                ...(isCurrentStatus && {
                  backgroundColor: "#F3F4F6",
                  color: "#9CA3AF",
                }),
              }}
            >
              <div className="flex items-center justify-between w-full">
                <span className="!text-gray-500"> {status}</span>
                {updatingStatus &&
                  selectedTicketForStatus?.status?.toLowerCase() ===
                  status.toLowerCase().replace(" ", "_") && (
                    <CircularProgress size={14} sx={{ ml: 1 }} />
                  )}
                {isCurrentStatus && (
                  <span className="text-xs !text-gray-800 ml-2">(Current)</span>
                )}
              </div>
            </MenuItem>
          );
        })}
      </Menu>
    </div>
  );
}
