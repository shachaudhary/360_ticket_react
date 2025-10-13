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
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { convertToCST } from "../utils";
import { toProperCase } from "../utils/formatting";
import { PlusIcon } from "@heroicons/react/24/solid";
import BackButton from "../components/BackButton";
import FormTypeModal from "../components/FormTypeModal";

export default function FormEntriesByType() {
  const navigate = useNavigate();
  const location = useLocation();

  const { form_type_id } = useParams();
  const formTypeId = form_type_id;
  const params = new URLSearchParams(location.search);
  const formName = params.get("form_name");

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
        "ring-brand-500",
        "ring-offset-2"
      );

      setTimeout(() => {
        copyBtnRef.current.classList.remove(
          "ring-2",
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
    if (!formTypeId) return;
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedQuery) params.append("search", debouncedQuery);
      params.append("page", page + 1);
      params.append("per_page", rowsPerPage);

      const res = await createAPIEndPoint(
        `form_entries/by_form_type/${formTypeId}?${params}`
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
    if (!formTypeId) return;
    try {
      setLoading(true);
      const res = await createAPIEndPoint(
        `stats/form_entries_summary/${formTypeId}`
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
      id: formTypeId,
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
  }, [formTypeId, page, rowsPerPage, debouncedQuery]);

  const handleViewEntry = (id) => navigate(`/form_entries/details/${id}`);
  const handleClearSearch = () => setQuery("");

  return (
    <>
      {loading && (
        <div className="absolute inset-0 z-[9999] flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm">
          <CircularProgress color="primary" size={60} />
          {/* <p className="text-gray-600 font-medium mt-3">Loading data...</p> */}
        </div>
      )}

      <div className="space-y-3 relative">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex">
            <div className="flex gap-2 items-center">
              <BackButton self={-1} isSmall={true} />
              {/* <BackButton textBtn /> */}

              <Typography
                variant="h6"
                className="!text-sidebar"
                fontWeight={700}
                color="primary"
              >
                {(() => {
                  const title =
                    formTypeName || formName
                      ? toProperCase(formTypeName || formName)
                      : "Form";
                  const cleanTitle = title.toLowerCase().includes("form")
                    ? title
                    : `${title} Form`;
                  return `${cleanTitle} Overview`;
                })()}
              </Typography>
            </div>
          </div>

          {/* <button
            onClick={() => navigate("/forms/new-hire-form")}
            className="flex items-center gap-1 rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-all"
          >
            <PlusIcon className="h-4 w-4 text-white stroke-[2.5]" />
            New Submission
          </button> */}

          <div className="flex gap-2">
            <button
              ref={copyBtnRef}
              onClick={handleCopy}
              className="px-3 py-[6.15px] shrink-0 rounded-lg text-xs font-medium focus:outline-none  transition-all border border-[#E5E7EB] text-gray-500 hover:border-gray-300 hover:text-gray-600 hover:bg-brand-50"
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

            <Button
              variant="outlined"
              size="small"
              startIcon={<PencilSquareIcon className="h-4 w-4" />}
              onClick={handleOpenEditModal}
              sx={{ borderRadius: 1.25 }}
              className="!border !border-[#E5E7EB] hover:!border-[#ddd]  !text-gray-500 hover:!bg-gray-50 focus:!ring-gray-500 !px-1 !py-1.5"
            >
              Edit
            </Button>
          </div>
        </div>

        {/* 🟢 STATS SECTION */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-all">
            <p className="text-sm text-brand-500 font-medium">
              Total Submissions
            </p>
            <h2 className="text-2xl font-bold text-gray-800 mt-1">
              {stats.totalSubmissions}
            </h2>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-all">
            <p className="text-sm text-brand-500 font-medium">
              Total Notifiers
            </p>
            <h2 className="text-2xl font-bold text-gray-800 mt-1">
              {stats.totalNotifiers}
            </h2>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-all">
            <p className="text-sm text-brand-500 font-medium">
              Last Submission
            </p>
            <h2 className="text-xl font-semibold text-gray-800 mt-1">
              {stats.lastSubmission}
            </h2>
          </div>
        </div>

        {/* 🔹 DESCRIPTION CARD */}
        {description && (
          <div className="rounded-lg border border-gray-200 bg-white p-4 mt-3 text-sm text-gray-600 leading-relaxed">
            <p className="mb-1">
              <span className="font-semibold text-brand-600 block">
                Description:
              </span>
              {description}
            </p>
          </div>
        )}

        {/* 🟣 NOTIFIERS SECTION */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm mt-2">
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
                No notifiers assigned
              </span>
            )}
          </div>
        </div>

        {/* Search + Heading Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 mb-1">
          {/* Left Heading */}
          <h2 className="text-[15px] sm:text-base font-semibold text-gray-700 mb-2 sm:mb-0">
            Submissions List
          </h2>

          {/* Right Search */}
          <div className="flex gap-2 items-center w-full sm:w-auto">
            <TextField
              label="Search by name, email"
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
        </div>

        {/* TABLE SECTION (unchanged) */}
        {loading ? null : entries.length === 0 ? ( // </div> //   </div> //     <CircularProgress color="primary" /> //   <div className="h-[calc(100dvh-240px)] flex items-center justify-center rounded-lg bg-purple-50"> // <div className="overflow-hidden rounded-lg border border-[#E5E7EB]">
          <div className="overflow-hidden rounded-lg border border-[#E5E7EB]">
            <div className="h-[calc(100dvh-240px)] flex flex-col items-center justify-center rounded-lg">
              <p className="text-gray-500 font-normal text-md">
                No submissions found for this form
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto !pb-4">
            <div className="overflow-hidden rounded-lg border border-[#E5E7EB]">
              {/* <div className="overflow-auto h-[calc(100dvh-250.75px)]"> */}
              <div className="overflow-auto max-h-[calc(100dvh-250.75px)]">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-white sticky top-0 z-10 whitespace-nowrap">
                    <tr className="text-left text-xs text-gray-500">
                      <th className="px-4 py-3 border-b border-r border-[#E5E7EB]">
                        #
                      </th>
                      <th className="px-4 py-3 border-b border-r border-[#E5E7EB]">
                        Created By
                      </th>
                      <th className="px-4 py-3 border-b border-r border-[#E5E7EB]">
                        Email
                      </th>
                      <th className="px-4 py-3 border-b border-r border-[#E5E7EB]">
                        Created At
                      </th>
                      <th className="px-4 py-3 text-center border-b border-[#E5E7EB]">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100 bg-white text-sm">
                    {entries.map((entry, idx) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 border-b border-[#E5E7EB]">
                          {page * rowsPerPage + idx + 1}
                        </td>
                        <td className="px-4 py-3 border-b border-[#E5E7EB] text-gray-700">
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
                        <td className="px-4 py-3 border-b border-[#E5E7EB]">
                          {entry.submitted_by?.email || "N/A"}
                        </td>
                        <td className="px-4 py-3 border-b border-[#E5E7EB] text-gray-700">
                          {convertToCST(entry.created_at) || "—"}
                        </td>
                        <td className="px-4 py-3 text-center border-b border-[#E5E7EB]">
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
