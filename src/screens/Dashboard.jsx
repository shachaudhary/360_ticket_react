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
} from "@heroicons/react/24/outline";
import { checkTokenAndAuth } from "../utils/checkTokenAndAuth";
import { useNavigate } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const url = `/dashboard`;

  useEffect(() => {
    const fetchAuth = async () => {
      try {
        setLoading(true); // show loader
        await checkTokenAndAuth(navigate, url);
      } finally {
        setLoading(false); // hide loader
      }
    };
    fetchAuth();
  }, [navigate]);

  const stats = [
    {
      label: "Open Tickets",
      value: 128,
      icon: <TicketIcon className="h-6 w-6 text-brand-600" />,
    },
    {
      label: "High Priority",
      value: 15,
      icon: <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />,
    },
    {
      label: "Clients",
      value: 42,
      icon: <UserGroupIcon className="h-6 w-6 text-blue-500" />,
    },
  ];

  const activities = [
    {
      text: "Resolved #TCK-1213",
      icon: (
        <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0" />
      ),
    },
    {
      text: "Assigned #TCK-1216 to Alex",
      icon: (
        <WrenchScrewdriverIcon className="h-5 w-5 text-yellow-500 flex-shrink-0" />
      ),
    },
    {
      text: "Escalated #TCK-1199 (High)",
      icon: (
        <ExclamationCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
      ),
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
            <div className="w-full md:w-[420px] flex gap-3">
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
                    },
                  }}
                />
              </LocalizationProvider>
            </div>
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

          {/* Activity */}
          <div className="rounded-md border border-gray-100 bg-white p-5 shadow-card">
            <div className="mb-3 text-sm font-medium text-gray-500">
              Recent activity
            </div>
            <ul className="space-y-3 text-sm">
              {activities.map((a, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-gray-50"
                >
                  {a.icon}
                  <span className="text-gray-700">{a.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
