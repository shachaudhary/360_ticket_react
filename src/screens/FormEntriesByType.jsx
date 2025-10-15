import React, { useEffect, useRef, useState } from "react";
import {
  TextField,
  CircularProgress,
  InputAdornment,
  Chip,
  IconButton,
  Tooltip,
  Typography,
  Button,
} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import { EyeIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import ModeEditSharpIcon from "@mui/icons-material/ModeEditSharp";
import { createAPIEndPoint } from "../config/api/api";
import CustomTablePagination from "../components/CustomTablePagination";
import { useNavigate, useParams } from "react-router-dom";
import { convertToCST } from "../utils";
import { toProperCase } from "../utils/formatting";
import { PlusIcon } from "@heroicons/react/24/solid";
import BackButton from "../components/BackButton";
import FormTypeModal from "../components/FormTypeModal";

export default function FormEntriesByType() {
  const navigate = useNavigate();
  const { form_type_id, form_name } = useParams();

  const [formTypeName, setFormTypeName] = useState("");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [entries, setEntries] = useState([]);
  const [description, setDescription] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const copyBtnRef = useRef(null);
  const [copied, setCopied] = useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedFormType, setSelectedFormType] = useState(null);

  const handleCopy = () => {
    // 🧠 Check if we’re running on the live domain
    const isLive = window.location.hostname.includes("dental360grp.com");

    // ✅ Use correct base URL based on environment
    const fullUrl = isLive
      ? "https://support.dental360grp.com/forms/new-hire-form"
      : `${window.location.origin}/forms/new-hire-form`;

    navigator.clipboard.writeText(fullUrl);
    setCopied(true);

    // 🔹 Visual feedback ring
    if (copyBtnRef.current) {
      copyBtnRef.current.focus();
      copyBtnRef.current.classList.add(
        "ring-2",
        "!border-none",
        "!text-brand-500",
        "ring-brand-500",
        "ring-offset-2"
      );

      setTimeout(() => {
        copyBtnRef.current.classList.remove(
          "ring-2",
          "!border-none",
          "!text-brand-500",
          "ring-brand-500",
          "ring-offset-2"
        );
      }, 600);
    }

    // 🔹 Reset button text after delay
    setTimeout(() => setCopied(false), 1200);
  };

  // 🟢 NEW STATE for dynamic stats + notifiers
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    totalNotifiers: 0,
    lastSubmission: "N/A",
  });
  const [notifiers, setNotifiers] = useState([]);

  // 🔹 Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(0);
    }, 500);
    return () => clearTimeout(handler);
  }, [query]);

  // 🔹 Fetch submissions (existing logic — untouched)
  const fetchFormEntries = async () => {
    if (!form_type_id) return;
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedQuery) params.append("search", debouncedQuery);
      params.append("page", page + 1);
      params.append("per_page", rowsPerPage);

      const res = await createAPIEndPoint(
        `form_entries/by_form_type/${form_type_id}?${params}`
      ).fetchAll();

      setDescription(res.data?.description || []);
      setEntries(res.data?.entries || []);
      setTotalCount(res.data?.total_entries || 0);
      setFormTypeName(res.data?.form_type_name || "");
    } catch (err) {
      console.error("Failed to fetch form entries", err);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  // 🟢 NEW API → Fetch stats and notifiers
  const fetchFormStats = async () => {
    if (!form_type_id) return;
    try {
      setLoading(true);
      const res = await createAPIEndPoint(
        `stats/form_entries_summary/${form_type_id}`
      ).fetchAll();

      const data = res.data;
      setStats({
        totalSubmissions: data?.stats?.total_entries ?? 0,
        totalNotifiers: data?.assigned_users?.length ?? 0,
        lastSubmission: data?.stats?.latest_entry_date
          ? convertToCST(data.stats.latest_entry_date)
          : "—",
      });
      setNotifiers(data?.assigned_users || []);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch form stats", err);
      setLoading(false);
    }
  };

  const handleOpenEditModal = () => {
    setSelectedFormType({
      id: form_type_id,
      name: formTypeName,
      description: description,
      assign_users: notifiers.map((n) => ({
        id: n.id,
        username: n.name,
        email: n.email,
      })),
    });
    setEditModalOpen(true);
  };

  const handleModalClose = () => setEditModalOpen(false);

  const handleModalSaved = async () => {
    setEditModalOpen(false);
    await fetchFormEntries(); // Refresh stats + notifiers after edit
  };

  // 🔹 Run both APIs
  useEffect(() => {
    fetchFormEntries();
    fetchFormStats();
  }, [form_type_id, page, rowsPerPage, debouncedQuery]);

  const handleViewEntry = (id) => navigate(`/forms/form_entries/details/${id}`);
  const handleClearSearch = () => setQuery("");

  return (
    <>
      {loading && (
        <div className="absolute inset-0 z-[9999] flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm">
          <CircularProgress color="primary" size={60} />
          {/* <p className="text-gray-600 font-medium mt-3">Loading data...</p> */}
        </div>
      )}

      <div className="space-y-5 relative">
        {/* 🔹 Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Left side */}
          <div className="flex flex-wrap items-center gap-3">
            <BackButton self="/forms" isSmall={false} />

            <h2 className="text-lg md:text-xl font-semibold text-sidebar">
              {(() => {
                const title =
                  formTypeName || form_name
                    ? toProperCase(formTypeName || form_name)
                    : "Form";
                const cleanTitle = title.toLowerCase().includes("form")
                  ? title
                  : `${title} Form`;
                return `${cleanTitle} Overview`;
              })()}
            </h2>
            <Button
              variant="outlined"
              size="small"
              startIcon={<PencilSquareIcon className="h-4 w-4" />}
              onClick={handleOpenEditModal}
              sx={{ borderRadius: 1.25 }}
              className="!text-xs !border !border-gray-200 hover:!border-gray-300 !text-gray-600 hover:!bg-gray-50 !px-2.5 !py-1.5 !min-w-10"
            >
              Edit
            </Button>
          </div>

          {/* Right side buttons */}
          <div className="flex gap-2 justify-end">
            <button
              ref={copyBtnRef}
              onClick={handleCopy}
              className="px-3 py-[6.15px] rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-700 hover:bg-gray-50 transition-all"
            >
              {copied ? "Copied!" : "Copy Link"}
            </button>
            <button
              onClick={() => navigate("/forms/new-hire-form")}
              className="flex items-center gap-1 rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-all"
            >
              <PlusIcon className="h-4 w-4 text-white stroke-[2.5]" />
              New Submission
            </button>
          </div>
        </div>

        {/* 🔸 Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              label: "Total Submissions",
              value: stats.totalSubmissions,
            },
            {
              label: "Total Notifiers",
              value: stats.totalNotifiers,
            },
            {
              label: "Last Submission",
              value: stats.lastSubmission,
              small: true,
            },
          ].map((item, i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-all"
            >
              <p className="text-sm text-brand-500 font-medium">{item.label}</p>
              <h2
                className={`${
                  item.small ? "text-xl font-semibold" : "text-2xl font-bold"
                } text-gray-800 mt-1`}
              >
                {item.value}
              </h2>
            </div>
          ))}
        </div>

        {/* 🔹 Description */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600 leading-relaxed">
          <p className="mb-1">
            <span className="font-semibold text-brand-600 block mb-1">
              Description:
            </span>
            {description.length > 0 ? (
              description
            ) : (
              <span className="text-gray-400 text-sm">
                No description available yet.{" "}
              </span>
            )}
          </p>
        </div>

        {/* 🟣 Notifiers Section */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-brand-500 font-semibold mb-2">Notifiers</p>
          <div className="flex flex-wrap gap-2">
            {notifiers.length > 0 ? (
              notifiers.map((n) => (
                <Tooltip
                  key={n.id}
                  title={
                    <div className="flex flex-col">
                      <span className="font-semibold text-xs text-gray-50">
                        {toProperCase(n.name)}
                      </span>
                      <span className="text-xs text-gray-100 opacity-90">
                        {n.email}
                      </span>
                    </div>
                  }
                  arrow
                  placement="top"
                >
                  <span className="px-3 py-1.5 bg-white text-gray-600 border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors cursor-default">
                    {n.email}
                  </span>
                </Tooltip>
              ))
            ) : (
              <span className="text-gray-400 text-sm">
                No notifiers assigned.
              </span>
            )}
          </div>
        </div>

        {/* 🔹 Search + Submissions Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 mb-2 gap-3">
          <h2 className="text-[15px] sm:text-base font-semibold text-gray-700">
            Submissions List
          </h2>
          <TextField
            label="Search by name or email"
            size="small"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            InputProps={{
              endAdornment: query?.length > 0 && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleClearSearch}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            className="w-full sm:w-[320px]"
          />
        </div>

        {/* 🧾 Table Section */}
        {loading ? null : entries.length === 0 ? (
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <div className="max-h-[calc(100dvh-240px)] min-h-28 flex flex-col items-center justify-center">
              <p className="text-gray-500 text-md">No submissions found</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto pb-4">
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <div className="overflow-auto max-h-[calc(100dvh-250.75px)]">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-white sticky top-0 z-10 whitespace-nowrap">
                    <tr className="text-left text-xs text-gray-500">
                      {["#", "Created By", "Email", "Created At", "Action"].map(
                        (header, i) => (
                          <th
                            key={i}
                            className={`px-4 py-3 border-b border-r border-gray-200 ${
                              header === "Action" ? "text-center" : ""
                            }`}
                          >
                            {header}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100 bg-white text-sm">
                    {entries.map((entry, idx) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 border-b">
                          {page * rowsPerPage + idx + 1}
                        </td>
                        <td className="px-4 py-3 border-b text-gray-700">
                          <Chip
                            label={toProperCase(
                              entry.submitted_by?.username || "N/A"
                            )}
                            variant="filled"
                            sx={{
                              fontSize: 12.75,
                              borderRadius: "24px",
                              color: "#374151",
                              backgroundColor: "#f5f6fa",
                              height: 27.5,
                              "& .MuiChip-label": { px: "7px !important" },
                            }}
                          />
                        </td>
                        <td className="px-4 py-3 border-b text-gray-700">
                          {entry.submitted_by?.email || "N/A"}
                        </td>
                        <td className="px-4 py-3 border-b text-gray-700">
                          {convertToCST(entry.created_at) || "—"}
                        </td>
                        <td className="px-4 py-3 text-center border-b">
                          <Tooltip title="View Submission">
                            <IconButton
                              size="small"
                              onClick={() => handleViewEntry(entry.id)}
                            >
                              <EyeIcon className="h-4 w-4 text-gray-600 hover:text-brand-500" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Submission">
                            <IconButton
                              size="small"
                              onClick={() =>
                                navigate(`/form_entries/edit/${entry.id}`)
                              }
                            >
                              <ModeEditSharpIcon
                                fontSize="small"
                                className="!text-[16px] text-gray-600 hover:text-brand-500"
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

      {/* 🟢 Floating Back Button */}
      {/* <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => navigate(-1)} // 👈 navigates back
          className="px-5 py-2.5 rounded-full border border-brand-400 hover:bg-purple-50 text-brand-700 bg-white 
               font-semibold text-sm transition-all duration-200 
               focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2"
        >
          Back
        </button>
      </div> */}
      <FormTypeModal
        open={editModalOpen}
        onClose={handleModalClose}
        onSaved={handleModalSaved}
        formType={selectedFormType}
      />
    </>
  );
}
