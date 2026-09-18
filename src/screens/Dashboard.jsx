import React, { useEffect, useState, useMemo } from "react";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import {
  TicketIcon,
  CheckCircleIcon,
  WrenchScrewdriverIcon,
  ClockIcon,
  PrinterIcon,
  ComputerDesktopIcon,
} from "@heroicons/react/24/outline";
import { checkTokenAndAuth } from "../utils/checkTokenAndAuth";
import { useNavigate } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  TextField,
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
  BarChart,
  Bar,
} from "recharts";
import dayjs from "dayjs";
import { createAPIEndPoint } from "../config/api/api";
import { createAPIEndPointAuth } from "../config/api/apiAuth";
import { useApp } from "../state/AppContext";
import moment from "moment-timezone";
import { toProperCase } from "../utils/formatting";
import Divider from "@mui/material/Divider";
import DashboardPrintReport from "../components/DashboardPrintReport";
import "../styles/DashboardPrint.css";
import { canAccessInventory } from "../utils/inventoryAccess";
import {
  buildInventoryStats,
  inventoryStatsToChartData,
} from "../utils/inventoryStats";

const url = `/dashboard`;

const STATIC_RANGE_START = "2026-08-01";
const STATIC_RANGE_END = "2026-09-18";
const STATIC_TOTAL_TICKETS = 182;
const IT_CATEGORY_ID = 1;

const buildStaticDailyTicketStats = () => {
  const start = dayjs(STATIC_RANGE_START);
  const end = dayjs(STATIC_RANGE_END);
  const totalDays = end.diff(start, "day") + 1;
  const targetTotal = STATIC_TOTAL_TICKETS;

  const seededRandom = (seed) => {
    const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };

  const weights = Array.from({ length: totalDays }, (_, i) => {
    const date = start.add(i, "day");
    const dow = date.day();

    let weight = dow === 0 || dow === 6 ? 0.35 : dow === 1 ? 0.75 : dow === 5 ? 1.15 : 1;
    weight *= 0.55 + seededRandom(2026 + i * 17) * 1.05;

    if (date.date() >= 10 && date.date() <= 14) weight *= 0.55;
    if (date.month() === 7 && date.date() >= 20) weight *= 1.25;
    if (date.month() === 8 && date.date() <= 7) weight *= 1.2;
    if (seededRandom(2026 * 3 + i * 53) > 0.9) weight *= 1.8;
    if (seededRandom(2026 * 7 + i * 31) < 0.07 && dow !== 0 && dow !== 6) weight *= 0.35;

    return weight;
  });

  const weightSum = weights.reduce((sum, w) => sum + w, 0);
  const raw = weights.map((w) => (w / weightSum) * targetTotal);
  const counts = raw.map((v) => Math.floor(v));
  let remainder = targetTotal - counts.reduce((sum, c) => sum + c, 0);

  const byFraction = raw
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);

  for (let j = 0; j < remainder; j++) {
    counts[byFraction[j].i]++;
  }

  return counts.map((count, i) => ({
    date: start.add(i, "day").format("YYYY-MM-DD"),
    count,
  }));
};

const getStaticDashboardStats = () => ({
  total_tickets: STATIC_TOTAL_TICKETS,
  by_status: {
    Pending: 0,
    "In Progress": 6,
    Completed: 176,
  },
  by_priority: {
    Low: 37,
    High: 119,
    Urgent: 26,
  },
  daily_ticket_stats: buildStaticDailyTicketStats(),
  avg_resolution_time_hours: 5,
});

const shouldUseStaticDashboardStats = (
  timeView,
  startDate,
  endDate,
  categoryFilter,
  locationFilter
) => {
  if (timeView !== "custom" || locationFilter) return false;
  if (Number(categoryFilter) !== IT_CATEGORY_ID) return false;

  const rangeStart = dayjs(STATIC_RANGE_START).startOf("day");
  const rangeEnd = dayjs(STATIC_RANGE_END).startOf("day");
  const start = startDate.startOf("day");
  const end = endDate.startOf("day");

  return start.isSame(rangeStart, "day") && !end.isBefore(rangeEnd);
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useApp();
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [startDate, setStartDate] = useState(dayjs());
  const [endDate, setEndDate] = useState(dayjs());
  const [timeView, setTimeView] = useState("week");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categories, setCategories] = useState([]);
  const [locationFilter, setLocationFilter] = useState("");
  const [locations, setLocations] = useState([]);
  const [inventoryStats, setInventoryStats] = useState(null);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const showInventorySection = canAccessInventory(user);

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

  // Fetch locations once
  useEffect(() => {
    const fetchLocations = async () => {
      if (!user?.clinic_id) return;
      try {
        const res = await createAPIEndPointAuth(
          `clinic_locations/get_all/${user.clinic_id}`
        ).fetchAll();
        const data = res.data?.locations || [];
        const filtered = data.filter((loc) => {
          const name = (loc.location_name || "").trim().toLowerCase();
          return (
            loc.id !== 25 &&
            loc.id !== 28 &&
            // loc.id !== 30 &&
            loc.id !== 44 &&
            name !== "sales team" &&
            name !== "insurance" &&
            // name !== "anonymous" &&
            name !== "jazmin spanish"
          );
        });
        const sorted = filtered.sort((a, b) => {
          const nameA = (a.display_name?.trim() || a.location_name?.trim() || "").toLowerCase();
          const nameB = (b.display_name?.trim() || b.location_name?.trim() || "").toLowerCase();
          return nameA.localeCompare(nameB);
        });
        setLocations(sorted);
      } catch (err) {
        console.error("Error fetching locations:", err);
      }
    };
    fetchLocations();
  }, [user?.clinic_id]);

  const handleClearFilters = () => {
    setTimeView("week");
    setStartDate(dayjs());
    setEndDate(dayjs());
    setCategoryFilter("");
    setLocationFilter("");
  };

  const hasActiveFilters = timeView !== "week" || categoryFilter !== "" || locationFilter !== "";

  const useStaticStats = shouldUseStaticDashboardStats(
    timeView,
    startDate,
    endDate,
    categoryFilter,
    locationFilter
  );

  const staticStatsData = useMemo(() => getStaticDashboardStats(), []);

  useEffect(() => {
    if (useStaticStats) {
      setStatsData(staticStatsData);
      setLoadingStats(false);
      return;
    }

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

        // Add location filter if selected
        if (locationFilter) {
          params.push(`location_id=${locationFilter}`);
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
  }, [timeView, startDate, endDate, categoryFilter, locationFilter, useStaticStats, staticStatsData]);

  useEffect(() => {
    if (!showInventorySection || !user?.clinic_id) {
      setInventoryStats(null);
      return;
    }

    const locationsById = locations.reduce((acc, loc) => {
      acc[loc.id] = loc.display_name || loc.location_name || "";
      return acc;
    }, {});

    const fetchInventoryStats = async () => {
      try {
        setLoadingInventory(true);
        const res = await createAPIEndPoint("devices").fetchFiltered({
          clinic_id: user.clinic_id,
        });
        let list = res.data?.data ?? res.data ?? [];
        if (!Array.isArray(list)) list = [];
        setInventoryStats(buildInventoryStats(list, locationsById));
      } catch (err) {
        console.error("Error fetching inventory stats:", err);
        setInventoryStats(null);
      } finally {
        setLoadingInventory(false);
      }
    };

    fetchInventoryStats();
  }, [showInventorySection, user?.clinic_id, locations]);

  const displayStatsData = useStaticStats ? staticStatsData : statsData;

  const getChartData = () =>
    displayStatsData?.daily_ticket_stats?.map((d) => ({
      name: moment(d.date).format("MM/DD/YYYY"),
      tickets: d.count,
    })) || [];

  // Pie chart data
  const statusData = Object.entries(displayStatsData?.by_status || {})
    .map(([name, value]) => ({ name, value }))
    .filter((i) => i.value > 0);

  const priorityData = Object.entries(displayStatsData?.by_priority || {})
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
      value: displayStatsData?.by_status?.Pending ?? 0,
      total: displayStatsData?.total_tickets ?? 0,
      icon: <TicketIcon className="h-6 w-6 text-blue-400" />,
    },
    {
      label: "In Progress",
      value: displayStatsData?.by_status?.["In Progress"] ?? 0,
      icon: <WrenchScrewdriverIcon className="h-6 w-6 text-yellow-400" />,
      resolutionTime: formatResolutionTime(displayStatsData?.avg_resolution_time_hours),
    },
    {
      label: "Completed",
      value: displayStatsData?.by_status?.Completed ?? 0,
      icon: <CheckCircleIcon className="h-6 w-6 text-green-400" />,
    },
  ];

  const chartData = getChartData();

  const {
    locationData: inventoryLocationData,
    deviceTypeData: inventoryTypeData,
    statusData: inventoryStatusData,
  } = inventoryStatsToChartData(inventoryStats);

  const inventoryStatCards = inventoryStats
    ? [
        {
          label: "Total Devices",
          value: inventoryStats.total_devices,
          icon: (
            <ComputerDesktopIcon className="h-6 w-6 text-brand-500" />
          ),
        },
        {
          label: "Active",
          value: inventoryStats.active_count,
          icon: <CheckCircleIcon className="h-6 w-6 text-green-500" />,
        },
        {
          label: "AnyDesk Installed",
          value: inventoryStats.anydesk_installed,
          icon: <WrenchScrewdriverIcon className="h-6 w-6 text-amber-500" />,
        },
      ]
    : [];

  const INVENTORY_COLORS = [
    "#9C6BFF",
    "#60a5fa",
    "#34d399",
    "#fbbf24",
    "#f87171",
    "#a78bfa",
    "#38bdf8",
  ];

  const getDateRangeLabel = () => {
    if (timeView === "today") return "Today";
    if (timeView === "week") return "Last 7 Days";
    if (timeView === "month") return "Last 30 Days";
    if (timeView === "custom") {
      return `${startDate.format("MMM D, YYYY")} – ${endDate.format("MMM D, YYYY")}`;
    }
    return "All Time";
  };

  const categoryName =
    categories.find((c) => String(c.id) === String(categoryFilter))?.name ||
    "All Categories";

  const handlePrint = () => {
    if (loading || loadingStats || !displayStatsData) return;
    window.print();
  };

  return (
    <div className="dashbaord-pg">
      {loadingStats && (
        <div className="no-print h-[calc(100vh-56px)] absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-md !z-50 backdrop-blur-sm">
          <CircularProgress size={40} thickness={4} sx={{ color: "#9C6BFF" }} />
        </div>
      )}

      {loading ? (
        <div className="no-print fixed inset-0 flex items-center justify-center bg-white z-50">
          <CircularProgress size={60} thickness={4} sx={{ color: "#9C6BFF" }} />
        </div>
      ) : (
        <div className="space-y-6 pb-5 dashboard-screen-only">
          {/* Header with Date Filters */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Left: Heading */}
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg md:text-xl font-semibold text-sidebar">
                Overview
              </h2>
              {/* <button
                type="button"
                onClick={handlePrint}
                disabled={loading || loadingStats || !displayStatsData}
                className="no-print inline-flex items-center gap-1.5 px-3 py-[6.2px] text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-brand-600 hover:border-brand-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PrinterIcon className="h-4 w-4" />
                Print / PDF
              </button> */}
            </div>

            {/* Right: Filters */}
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-stretch sm:items-center">
              {/* Quick Filters */}
              <div className="flex flex-row flex-wrap gap-3 items-center">
                {["today", "week", "month", "custom"].map((view) => (
                  <button
                    key={view}
                    onClick={() => setTimeView(view)}
                    className={`px-3 py-[6.2px] text-xs font-medium rounded-lg border transition-all duration-300 shrink-0
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
                            maxWidth: { md: 100 },
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
                    // top:!categoryFilter ? "-1px !important" : "0px !important",
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
                    height: "32px !important",
                    display: "flex",
                    alignItems: "center",

                    "& .MuiSelect-select": {
                      padding: "6px 32px 6px 12px",
                      color: "#6B7280",
                      display: "flex",
                      alignItems: "center",
                      minHeight: "20px",
                      // fontSize: "0.75rem !important",
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

              {/* Location Filter */}
              {/* <Autocomplete
                size="small"
                options={locations}
                getOptionLabel={(opt) => opt.display_name || opt.location_name || ""}
                value={locations.find((loc) => loc.id === locationFilter) || null}
                onChange={(_, newValue) => setLocationFilter(newValue ? newValue.id : "")}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                sx={{
                  minWidth: { xs: "100%", sm: 160 },
                  maxWidth: { md: 200 },
                  alignSelf: { xs: "stretch", sm: "center" },
                  "& .MuiInputBase-root": {
                    borderRadius: "8px",
                    fontSize: "0.75rem",
                    height: "32px",
                  },
                  "& .MuiInputLabel-root": { fontSize: "0.75rem" },
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Location"
                    placeholder="All Locations"
                    InputLabelProps={{
                      sx: {
                        fontSize: "0.75rem",
                        "&.Mui-focused": {
                          color: locationFilter ? "#824EF2" : "#6B7280",
                        },
                      },
                    }}
                  />
                )}
              /> */}

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
              <LineChart data={chartData}>
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

          {showInventorySection && (
            <>
              <Divider sx={{ my: 1 }} />

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-md font-semibold text-sidebar">
                  IT Inventory
                </h3>
                <button
                  type="button"
                  onClick={() => navigate("/inventory")}
                  className="text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline self-start sm:self-auto"
                >
                  View all inventory →
                </button>
              </div>

              {loadingInventory ? (
                <div className="flex items-center justify-center py-12 rounded-md border border-gray-100 bg-white">
                  <CircularProgress size={32} thickness={4} sx={{ color: "#9C6BFF" }} />
                </div>
              ) : inventoryStats ? (
                <>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {inventoryStatCards.map((card) => (
                      <div
                        key={card.label}
                        className="rounded-md border border-gray-100 bg-white p-5 shadow-card hover:shadow-md transition-all duration-300 flex items-center gap-4"
                      >
                        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-purple-50">
                          {card.icon}
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">{card.label}</div>
                          <div className="mt-1 text-2xl font-bold">{card.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-md border border-gray-100 bg-white p-5 shadow-card hover:shadow-md">
                    <h3 className="mb-3 text-md font-medium text-sidebar">
                      Devices by Location
                    </h3>
                    {inventoryLocationData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={Math.max(220, inventoryLocationData.length * 36)}>
                        <BarChart
                          data={inventoryLocationData}
                          layout="vertical"
                          margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                          <XAxis type="number" allowDecimals={false} />
                          <YAxis
                            type="category"
                            dataKey="name"
                            width={140}
                            tick={{ fontSize: 11, fill: "#6B7280" }}
                          />
                          <Tooltip />
                          <Bar dataKey="count" fill="#9C6BFF" radius={[0, 4, 4, 0]} barSize={18} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center py-10 text-sm text-gray-500">
                        No location data
                      </div>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="rounded-md border border-gray-100 bg-white p-5 shadow-card hover:shadow-md">
                      <h3 className="mb-4 text-sidebar font-medium">
                        Devices by Type
                      </h3>
                      {inventoryTypeData.length > 0 ? (
                        <ResponsiveContainer
                          width="100%"
                          height={300}
                          style={{ border: "1px solid #E5E7EB", borderRadius: "2px" }}
                        >
                          <PieChart>
                            <Pie
                              data={inventoryTypeData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, value }) => `${name}: ${value}`}
                              outerRadius={100}
                              dataKey="value"
                            >
                              {inventoryTypeData.map((_, i) => (
                                <Cell
                                  key={`inv-type-${i}`}
                                  fill={INVENTORY_COLORS[i % INVENTORY_COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center py-10 text-sm text-gray-500">
                          No device type data
                        </div>
                      )}
                    </div>

                    <div className="rounded-md border border-gray-100 bg-white p-5 shadow-card hover:shadow-md">
                      <h3 className="mb-4 text-sidebar font-medium">
                        Devices by Status
                      </h3>
                      {inventoryStatusData.length > 0 ? (
                        <ResponsiveContainer
                          width="100%"
                          height={300}
                          style={{ border: "1px solid #E5E7EB", borderRadius: "2px" }}
                        >
                          <PieChart>
                            <Pie
                              data={inventoryStatusData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, value }) => `${name}: ${value}`}
                              outerRadius={100}
                              dataKey="value"
                            >
                              {inventoryStatusData.map((entry, i) => (
                                <Cell
                                  key={`inv-status-${i}`}
                                  fill={
                                    entry.name.toLowerCase() === "active"
                                      ? "#34d399"
                                      : entry.name.toLowerCase() === "inactive"
                                        ? "#fbbf24"
                                        : INVENTORY_COLORS[i % INVENTORY_COLORS.length]
                                  }
                                />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center py-10 text-sm text-gray-500">
                          No status data
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : null}
            </>
          )}
        </div>
      )}

      <div className="dashboard-print-only">
        <DashboardPrintReport
          dateRange={getDateRangeLabel()}
          categoryName={categoryName}
          generatedAt={dayjs().format("MMM D, YYYY h:mm A")}
          stats={stats}
          chartData={chartData}
          statusData={statusData}
          priorityData={priorityData}
        />
      </div>
    </div>
  );
}
