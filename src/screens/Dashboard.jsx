import React, { useEffect, useState } from "react";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import {
  TicketIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  CheckCircleIcon,
  WrenchScrewdriverIcon,
  ExclamationCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { checkTokenAndAuth } from "../utils/checkTokenAndAuth";
import { useNavigate } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";

// MUI
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";

// Recharts
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
  Legend,
} from "recharts";
import dayjs from "dayjs";
import { createAPIEndPoint } from "../config/api/api";
import moment from "moment-timezone";

const url = `/dashboard`;

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [startDate, setStartDate] = useState(dayjs()); // today
  const [endDate, setEndDate] = useState(dayjs().add(7, "day")); // +7 days
  const [timeView, setTimeView] = useState("week");
  const [categories, setCategories] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  const priorities = ["Low", "High", "Urgent"]; // 🔹 static options

  useEffect(() => {
    const fetchAuth = async () => {
      try {
        setLoading(true);
        await checkTokenAndAuth(navigate, url);
      } finally {
        setLoading(false);
      }
    };
    fetchAuth();
  }, [navigate]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await createAPIEndPoint("category").fetchAll();
        setCategories(res.data || []);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, []);

  // helper function to decide which chart data to show
  const getChartData = () => {
    return (
      statsData?.daily_ticket_stats?.map((d) => ({
        name: moment(d.date).format("MM/DD/YYYY"),
        tickets: d.count,
      })) || []
    );
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoadingStats(true);

        let apiUrl = "tickets/stats";
        const params = [];
        if (categoryFilter) params.push(`category_id=${categoryFilter}`);
        if (priorityFilter) params.push(`priority=${priorityFilter}`);
        if (params.length > 0) apiUrl += "?" + params.join("&");

        const res = await createAPIEndPoint(apiUrl).fetchAll();
        setStatsData(res.data || null);
      } catch (err) {
        console.error("Error fetching ticket stats:", err);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, [categoryFilter, priorityFilter]);

  const ticketTrends = {
    week: [
      { name: "Mon", tickets: 8 },
      { name: "Tue", tickets: 14 },
      { name: "Wed", tickets: 10 },
      { name: "Thu", tickets: 20 },
      { name: "Fri", tickets: 12 },
      { name: "Sat", tickets: 5 },
      { name: "Sun", tickets: 7 },
    ],
    month: [
      { name: "Jan", tickets: 120 },
      { name: "Feb", tickets: 160 },
      { name: "Mar", tickets: 90 },
      { name: "Apr", tickets: 200 },
      { name: "May", tickets: 150 },
      { name: "Jun", tickets: 180 },
      { name: "Jul", tickets: 140 },
      { name: "Aug", tickets: 170 },
      { name: "Sep", tickets: 110 },
      { name: "Oct", tickets: 190 },
      { name: "Nov", tickets: 130 },
      { name: "Dec", tickets: 220 },
    ],
    custom: [
      { date: "2025-09-01", tickets: 5 },
      { date: "2025-09-05", tickets: 12 },
      { date: "2025-09-10", tickets: 8 },
      { date: "2025-09-15", tickets: 15 },
      { date: "2025-09-20", tickets: 10 },
      { date: "2025-09-25", tickets: 20 },
    ],
  };

  const statusData = Object.entries(statsData?.by_status || {})
    .map(([name, value]) => ({ name, value }))
    .filter((item) => item.value > 0);

  const COLORS = ["#60a5fa", "#fbbf24", "#34d399", "#f87171"];

  const stats = [
    {
      label: "Open Tickets",
      value: statsData?.pending_count ?? 0,
      icon: <TicketIcon className="h-6 w-6 text-blue-400" />,
    },
    {
      label: "In Progress",
      value: statsData?.in_progress_count ?? 0,
      icon: <WrenchScrewdriverIcon className="h-6 w-6 text-yellow-400" />,
    },
    {
      label: "Completed",
      value: statsData?.completed_count ?? 0,
      icon: <CheckCircleIcon className="h-6 w-6 text-green-400" />,
    },
  ];

  return (
    <>
      {loading ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(255,255,255,1)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <CircularProgress size={60} thickness={4} sx={{ color: "#2bcb6b" }} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header with Date Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            {/* Left: Heading */}
            <h2 className="text-lg md:text-xl font-semibold whitespace-nowrap">
              Overview
            </h2>

            {/* Right: Filters */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-end w-full">
              {/* Category Filter */}
              <div>
                <FormControl size="small" fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={categoryFilter}
                    label="Category"
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    sx={{ minWidth: 200 }}
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

              {/* Priority Filter */}
              <div >
                <FormControl size="small" fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={priorityFilter}
                    label="Priority"
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    sx={{ minWidth: 200 }}
                  >
                    <MenuItem value="">All</MenuItem>
                    {priorities.map((p) => (
                      <MenuItem key={p} value={p}>
                        {p}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>

              {/* Start Date */}
              <div >
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
                        sx: { minWidth: 200, maxWidth: 200 }, // ✅ apply width constraints here
                      },
                    }}
                  />
                </LocalizationProvider>
              </div>

              {/* End Date */}
              <div>
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
                        sx: { minWidth: 200, maxWidth: 200 }, // ✅ apply width constraints here
                      },
                    }}
                  />
                </LocalizationProvider>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {stats.map((s) => (
              <div
                key={s.label}
                className={`rounded-md border border-gray-100 bg-white  p-5 shadow-card flex items-center gap-4  bg-opacity-90 ${s.bg} `}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-50">
                  {s.icon}
                </div>
                <div>
                  <div className="text-sm text-gray-500">{s.label}</div>
                  <div className="mt-1 text-2xl font-bold ">{s.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Ticket Trends Chart */}
          {/* Ticket Trends Chart */}
          <div className="rounded-md border border-gray-100 bg-white p-5 shadow-card">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-md  text-[#6B7280] capitalize">
                Tickets Created ({timeView})
              </h3>

              {/* View Selector */}
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel id="timeview-label">View</InputLabel>
                <Select
                  labelId="timeview-label"
                  value={timeView}
                  onChange={(e) => setTimeView(e.target.value)}
                  label="View"
                >
                  <MenuItem value="week">By Week</MenuItem>
                  <MenuItem value="month">By Month</MenuItem>
                  <MenuItem value="custom">Custom</MenuItem>
                </Select>
              </FormControl>
            </div>

            {/* Show date pickers only when "Custom" is selected */}
            {timeView === "custom" && (
              <div className="flex flex-col md:flex-row gap-3 mb-4">
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
            )}

            {/* Chart */}
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getChartData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="tickets"
                  stroke="#2bcb6b"
                  strokeWidth={2}
                  activeDot={{ r: 6, fill: "#186f3c" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Status Pie Chart */}
          <div className="rounded-md border border-gray-100 bg-white p-5 shadow-card">
            <h3 className="mb-3 text- text-[#6B7280]">Tickets by Status</h3>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
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
                    {statusData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  {/* <Legend /> */}
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-gray-400 mb-6 mt-6">
                No status data available
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
