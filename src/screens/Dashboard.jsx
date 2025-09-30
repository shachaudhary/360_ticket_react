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

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(dayjs()); // today
  const [endDate, setEndDate] = useState(dayjs().add(7, "day")); // +7 days
  const [timeView, setTimeView] = useState("week");

  const url = `/dashboard`;

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

  // helper function to decide which chart data to show
  const getChartData = () => {
    if (timeView === "custom" && startDate && endDate) {
      // filter the fake "custom" data based on selected date range
      return ticketTrends.custom
        .filter(
          (d) =>
            new Date(d.date) >= new Date(startDate) &&
            new Date(d.date) <= new Date(endDate)
        )
        .map((d) => ({
          name: d.date, // label on X-axis
          tickets: d.tickets,
        }));
    }

    // otherwise just return week or month data
    return ticketTrends[timeView];
  };

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

  const statusData = [
    { name: "Open", value: 128 },
    { name: "In Progress", value: 82 },
    { name: "Completed", value: 210 },
    { name: "Escalated", value: 15 },
  ];
  const COLORS = ["#60a5fa", "#fbbf24", "#34d399", "#f87171"];

  const stats = [
    {
      label: "Open Tickets",
      value: 128,
      icon: <TicketIcon className="h-6 w-6 text-blue-400" />,
    },
    {
      label: "Urgent Priority",
      value: 15,
      icon: <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />,
    },
    {
      label: "Past Due",
      value: 42,
      icon: <ClockIcon className="h-6 w-6 text-orange-400" />, // ⏰ softer clock
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
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-lg md:text-xl font-semibold">Overview</h2>
            {/* <div className="w-full md:w-[420px] flex gap-3">
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
            </div> */}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-md border border-gray-100 bg-white p-5 shadow-card flex items-center gap-4"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50">
                  {s.icon}
                </div>
                <div>
                  <div className="text-sm text-gray-500">{s.label}</div>
                  <div className="mt-1 text-2xl font-bold">{s.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Ticket Trends Chart */}
          {/* Ticket Trends Chart */}
          <div className="rounded-md border border-gray-100 bg-white p-5 shadow-card">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium text-brand-600 capitalize">
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
            <h3 className="mb-3 text-sm font-medium text-brand-600">
              Tickets by Status
            </h3>
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
          </div>
        </div>
      )}
    </>
  );
}
