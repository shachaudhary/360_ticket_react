import React, { useEffect, useState } from "react";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import {
  TicketIcon,
  CheckCircleIcon,
  WrenchScrewdriverIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { checkTokenAndAuth } from "../utils/checkTokenAndAuth";
import { useNavigate } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import dayjs from "dayjs";
import { createAPIEndPoint } from "../config/api/api";
import moment from "moment-timezone";
import { toProperCase } from "../utils/formatting";
import Divider from "@mui/material/Divider";

const url = `/dashboard`;

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [startDate, setStartDate] = useState(dayjs());
  const [endDate, setEndDate] = useState(dayjs());
  const [timeView, setTimeView] = useState("week");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchAuth = async () => {
      setLoading(true);
      const result = await checkTokenAndAuth(navigate, url);
      setLoading(false);

      // Optional: log state
      console.log("Auth check result:", result);
    };

    fetchAuth();
  }, [navigate]);

  const getChartData = () =>
    statsData?.daily_ticket_stats?.map((d) => ({
      name: moment(d.date).format("MM/DD/YYYY"),
      tickets: d.count,
    })) || [];

  // Fetch categories once
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await createAPIEndPoint("category").fetchAll();
        setCategories(res.data || []);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  const handleClearFilters = () => {
    setTimeView("week");
    setStartDate(dayjs());
    setEndDate(dayjs());
    setCategoryFilter("");
  };

  const hasActiveFilters = timeView !== "week" || categoryFilter !== "";

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoadingStats(true);

        let apiUrl = "tickets/stats";
        const params = [];

        // build query by timeView
        if (timeView === "today") {
          params.push("timeframe=today");
        } else if (timeView === "week") {
          params.push("timeframe=last_7_days");
        } else if (timeView === "month") {
          params.push("timeframe=last_30_days");
        } else if (timeView === "custom") {
          params.push(`start_date=${startDate.format("YYYY-MM-DD")}`);
          params.push(`end_date=${endDate.format("YYYY-MM-DD")}`);
        }

        // Add category filter if selected
        if (categoryFilter) {
          params.push(`category_id=${categoryFilter}`);
        }

        if (params.length > 0) {
          apiUrl += `?${params.join("&")}`;
        }

        const res = await createAPIEndPoint(apiUrl).fetchAll();
        setStatsData(res.data || null);
      } catch (err) {
        console.error("Error fetching ticket stats:", err);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, [timeView, startDate, endDate, categoryFilter]);

  // Pie chart data
  const statusData = Object.entries(statsData?.by_status || {})
    .map(([name, value]) => ({ name, value }))
    .filter((i) => i.value > 0);

  const priorityData = Object.entries(statsData?.by_priority || {})
    .map(([name, value]) => ({ name, value }))
    .filter((i) => i.value > 0);

  const PRIORITY_COLORS = {
    Low: "#3B82F6", // Blue
    High: "#F59E0B", // Amber/Orange
    Urgent: "#EF4444", // Red
  };

  const COLORS = ["#60a5fa", "#fbbf24", "#34d399", "#f87171"];

  // Format resolution time (value is in hours from API)
  const formatResolutionTime = (timeInHours) => {
    // Handle null, undefined, or 0
    if (!timeInHours || timeInHours === 0) return "N/A";

    // Compact Format: Convert to days, hours, minutes
    const days = Math.floor(timeInHours / 24);
    const hours = Math.floor(timeInHours % 24);
    const minutes = Math.round((timeInHours % 1) * 60);

    // Build compact string (e.g., "2d 5h 30m")
    const parts = [];
    if (days > 0) {
      parts.push(`${days}d`);
    }
    if (hours > 0) {
      parts.push(`${hours}h`);
    }
    if (minutes > 0) {
      parts.push(`${minutes}m`);
    }

    // If no parts (shouldn't happen, but safety check)
    if (parts.length === 0) {
      return "< 1m";
    }

    return parts.join(" ");
  };

  const stats = [
    {
      label: "Open Tickets",
      value: statsData?.by_status?.Pending ?? 0,
      total: statsData?.total_tickets ?? 0,
      icon: <TicketIcon className="h-6 w-6 text-blue-400" />,
    },
    {
      label: "In Progress",
      value: statsData?.by_status?.["In Progress"] ?? 0,
      icon: <WrenchScrewdriverIcon className="h-6 w-6 text-yellow-400" />,
      resolutionTime: formatResolutionTime(statsData?.avg_resolution_time_hours),
    },
    {
      label: "Completed",
      value: statsData?.by_status?.Completed ?? 0,
      icon: <CheckCircleIcon className="h-6 w-6 text-green-400" />,
    },
  ];

  return (
    <div className="dashbaord-pg">
      {loadingStats && (
        <div className="h-[calc(100vh-56px)] absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-md !z-50 backdrop-blur-sm">
          <CircularProgress size={40} thickness={4} sx={{ color: "#9C6BFF" }} />
        </div>
      )}

      {loading ? (
        <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
          <CircularProgress size={60} thickness={4} sx={{ color: "#9C6BFF" }} />
        </div>
      ) : (
        <div className="space-y-6 pb-5">
          {/* Header with Date Filters */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Left: Heading */}
            <h2 className="text-lg md:text-xl font-semibold text-sidebar">
              Overview
            </h2>

            {/* Right: Filters */}
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-stretch sm:items-center">
              {/* Quick Filters */}
              <div className="flex flex-row flex-wrap gap-3 items-center">
                {["today", "week", "month", "custom"].map((view) => (
                  <button
                    key={view}
                    onClick={() => setTimeView(view)}
                    className={`px-3 py-[6.15px] text-xs font-medium rounded-lg border transition-all duration-300 shrink-0
          ${timeView === view
                        ? "bg-brand-500 text-white border-brand-500 hover:bg-brand-600"
                        : "border border-gray-200 text-gray-500 hover:bg-gray-50"
                      }
        `}
                  >
                    {toProperCase(view)}
                  </button>
                ))}
              </div>

              {/* Show DatePickers only if custom */}
              {timeView === "custom" && (
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="Start Date"
                      value={startDate}
                      onChange={(date) => setStartDate(date)}
                      maxDate={endDate}
                      slotProps={{
                        textField: {
                          size: "small",
                          fullWidth: true,
                          sx: {
                            minWidth: { xs: "100%", sm: 200 },
                            maxWidth: { md: 150 },
                          },
                        },
                      }}
                    />
                  </LocalizationProvider>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="End Date"
                      value={endDate}
                      onChange={(date) => setEndDate(date)}
                      minDate={startDate}
                      slotProps={{
                        textField: {
                          size: "small",
                          fullWidth: true,
                          sx: {
                            minWidth: { xs: "100%", sm: 200 },
                            maxWidth: { md: 150 },
                          },
                        },
                      }}
                    />
                  </LocalizationProvider>
                </div>
              )}

              {/* Category Filter */}
              <FormControl
                size="small"
                sx={{
                  minWidth: { xs: "100%", sm: 150 },
                  maxWidth: { md: 180 },
                  display: "flex",
                  justifyContent: "center",
                  alignSelf: { xs: "stretch", sm: "center" },
                  "& .MuiInputLabel-root": {
                    fontSize: "0.75rem",
                  },
                  "& .MuiInputLabel-shrink": {
                    transform: "translate(14px, -9px) scale(0.75)",
                  },
                }}
              >
                <InputLabel
                  sx={{
                    fontSize: "0.5rem",
                    top:!categoryFilter ? "-1px !important" : "0px !important",
                    "&.Mui-focused": {
                      color: categoryFilter ? "#824EF2" : "#6B7280",
                    },
                  }}
                >
                  Category
                </InputLabel>
                <Select
                  value={categoryFilter}
                  label="Category"
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  sx={{
                    borderRadius: "8px",
                    fontSize: "0.75rem !important",
                    fontWeight: 500,
                    height: "29.9px",
                    display: "flex",
                    alignItems: "center",

                    "& .MuiSelect-select": {
                      padding: "6px 32px 6px 12px",
                      color: "#6B7280",
                      display: "flex",
                      alignItems: "center",
                      minHeight: "20px",
                      fontSize: "0.75rem !important",
                    },
                    "& .MuiSvgIcon-root": {
                      color: "#9CA3AF",
                      fontSize: "1rem !important",
                    },
                  }}
                >
                  <MenuItem value="" sx={{ fontSize: "0.75rem" }}>
                    All Categories
                  </MenuItem>
                  {categories.map((category) => (
                    <MenuItem
                      key={category.id}
                      value={category.id}
                      sx={{
                        fontSize: "0.75rem",
                        "&:hover": {
                          backgroundColor: "#F3F4F6",
                        },
                        "&.Mui-selected": {
                          backgroundColor: "#F3E8FF",
                          color: "#824EF2",
                          "&:hover": {
                            backgroundColor: "#E9D5FF",
                          },
                        },
                      }}
                    >
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Clear Button */}
              <button
                onClick={handleClearFilters}
                className={`px-3 py-[6.15px] text-xs font-medium rounded-lg border transition-all duration-300 shrink-0 self-start sm:self-center ${hasActiveFilters
                  ? "border-red-500 text-red-500 hover:bg-red-50 focus:ring-2 focus:ring-red-500"
                  : "border border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600 hover:bg-gray-50"
                  }`}
              >
                Clear
              </button>
            </div>
          </div>

          {/* Show raw data for debugging */}
          {/* {statsData && (
            <pre className="bg-gray-50 text-xs p-3 rounded border border-gray-200 overflow-x-auto">
              {JSON.stringify(statsData, null, 2)}
            </pre>
          )} */}

          {/* Stats Grid */}
          <div className="relative">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className={`rounded-md border border-gray-100 bg-white p-5 shadow-card hover:shadow-md transition-all duration-300 ${s.resolutionTime ? "flex items-center justify-between gap-4" : "flex items-center gap-4"
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-lg"
                      style={{
                        backgroundColor:
                          s.label === "Open Tickets"
                            ? "rgba(59, 130, 246, 0.12)" // light blue bg
                            : s.label === "In Progress"
                              ? "rgba(250, 204, 21, 0.15)" // light yellow bg
                              : s.label === "Completed"
                                ? "rgba(34, 197, 94, 0.12)" // light green bg
                                : "#f3f4f6", // fallback light gray
                      }}
                    >
                      {s.icon}
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">{s.label}</div>
                      <div className="mt-1 text-2xl font-bold">
                        {s.label === "Open Tickets" && typeof s.total === "number"
                          ? s.total
                            ? `${s.value} / ${s.total}`
                            : s.value
                          : s.value}
                      </div>
                      {s.label === "Open Tickets" && typeof s.total === "number" && s.total > 0 && (
                        <div className="mt-0.5 text-xs text-gray-500">
                          of {s.total} total
                        </div>
                      )}
                    </div>
                  </div>
                  {s.resolutionTime && (
                    <div className="text-right flex flex-col items-end">
                      <div className="text-xs text-gray-500 font-medium flex items-center gap-1.5 justify-end mb-2">
                        <ClockIcon className="h-4 w-4 text-gray-400" />
                        <span>Avg Resolution Time</span>
                      </div>
                      <div className="px-3 py-1.5 rounded-md bg-white border border-gray-200 shadow-sm">
                        <div className="!text-[13px] font-semibold text-gray-700">{s.resolutionTime}</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Ticket Trends Line Chart */}
          <div className="rounded-md border border-gray-100 bg-white p-5 shadow-card hover:shadow-md ">
            <h3 className="mb-3 text-md font-medium text-sidebar">
              Tickets Created
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getChartData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="tickets"
                  stroke="#9C6BFF"
                  strokeWidth={2}
                  activeDot={{ r: 6, fill: "#824EF2" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {/* Status Pie Chart */}
            <div className="rounded-md border border-gray-100 bg-white p-5 shadow-card hover:shadow-md ">
              <h3 className="mb-4 text-sidebar font-medium">
                Tickets by Status
              </h3>
              {statusData.length > 0 ? (
                <ResponsiveContainer
                  width="100%"
                  height={300}
                  style={{ border: "1px solid #E5E7EB", borderRadius: "2px" }}
                >
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
                      dataKey="value"
                    >
                      {statusData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border border-gray-200 bg-gray-50 bg-opacity-75 text-center shadow-sm">
                  {/* <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 text-red-500">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div> */}
                  <p className="text-sm font-medium text-gray-600">
                    No status data
                  </p>
                  {/* <p className="text-xs text-gray-400">
                    There’s nothing to display right now.
                  </p> */}
                </div>
              )}
            </div>

            {/* Priority Pie Chart */}
            <div className="rounded-md border border-gray-100 bg-white p-5 shadow-card hover:shadow-md ">
              <h3 className="mb-4 text-sidebar font-medium">
                Tickets by Priority
              </h3>

              {priorityData.length > 0 ? (
                <ResponsiveContainer
                  width="100%"
                  height={300}
                  style={{ border: "1px solid #E5E7EB", borderRadius: "2px" }}
                >
                  <PieChart>
                    <Pie
                      data={priorityData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
                      dataKey="value"
                    >
                      {priorityData.map((entry, i) => (
                        <Cell
                          key={`priority-${i}`}
                          fill={PRIORITY_COLORS[entry.name] || "#9CA3AF"}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border border-gray-200 bg-gray-50 bg-opacity-75  text-center shadow-sm">
                  <p className="text-sm font-medium text-gray-600">
                    No priority data
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
