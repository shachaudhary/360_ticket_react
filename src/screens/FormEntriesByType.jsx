import React, { useEffect, useState } from "react";
import {
  TextField,
  CircularProgress,
  InputAdornment,
  Chip,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import { EyeIcon } from "@heroicons/react/24/outline";
import ModeEditSharpIcon from "@mui/icons-material/ModeEditSharp";
import { createAPIEndPoint } from "../config/api/api";
import CustomTablePagination from "../components/CustomTablePagination";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { convertToCST } from "../utils";
import { toProperCase } from "../utils/formatting";
import { PlusIcon } from "@heroicons/react/24/solid";
import { createAPIEndPointAuth } from "../config/api/apiAuth";
import BackButton from "../components/BackButton";

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
  const [loading, setLoading] = useState(true);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // 🔹 Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(0);
    }, 500);
    return () => clearTimeout(handler);
  }, [query]);

  // 🔹 Fetch submissions for this form type
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

      // 🟢 Match correct response keys
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

  useEffect(() => {
    fetchFormEntries();
  }, [formTypeId, page, rowsPerPage, debouncedQuery]);

  const handleViewEntry = (id) => {
    navigate(`/form_entries/details/${id}`);
  };

  const handleClearSearch = () => {
    setQuery("");
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex">
          <div className="flex gap-2 items-center">
            <BackButton self={-1} />
            {/* <h2 className="text-lg md:text-xl font-semibold text-sidebar">
              {formTypeName
                ? `${toProperCase(formTypeName)} Form Submissions`
                : formName
                ? `${toProperCase(formName)} Form Submissions`
                : "Form Submissions"}
            </h2> */}

            <Typography
              variant="h6"
              className="!text-sidebar"
              fontWeight={700}
              color="primary"
            >
              {formTypeName
                ? `${toProperCase(formTypeName)} Form Submissions`
                : formName
                ? `${toProperCase(formName)} Form Submissions`
                : "Form Submissions"}
            </Typography>
          </div>

          {/* <p className="text-gray-500 text-sm">
            View all submissions for this form type
          </p> */}
        </div>

        <button
          onClick={() => navigate("/new-hire-form")}
          className="flex items-center gap-1 rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-all"
        >
          <PlusIcon className="h-4 w-4 text-white stroke-[2.5]" />
          New Submission
        </button>
      </div>

      {/* Search Filter */}
      <div className="flex gap-3 items-center">
        <TextField
          label="Search by name, email, or field"
          size="small"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          fullWidth
          InputProps={{
            endAdornment: query?.length > 0 && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={handleClearSearch}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
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
              No submissions found for this form
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="overflow-hidden rounded-lg border border-[#E5E7EB]">
            <div className="overflow-auto h-[calc(100dvh-250.75px)]">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-white sticky top-0 z-10 whitespace-nowrap">
                  <tr className="text-left text-xs text-gray-500">
                    <th className="px-4 py-3 border-b border-[#E5E7EB]">#</th>
                    <th className="px-4 py-3 border-b border-[#E5E7EB]">
                      Created By
                    </th>
                    <th className="px-4 py-3 border-b border-[#E5E7EB]">
                      Notify Users
                    </th>
                    <th className="px-4 py-3 border-b border-[#E5E7EB]">
                      Submitted Date
                    </th>
                    <th className="px-4 py-3 text-center border-b border-[#E5E7EB]">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 bg-white text-sm">
                  {entries.map((entry, idx) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      {/* Index */}
                      <td className="px-4 py-3 border-b border-[#E5E7EB]">
                        {page * rowsPerPage + idx + 1}
                      </td>

                      {/* Submitted By */}
                      <td className="px-4 py-3 border-b border-[#E5E7EB] text-gray-700">
                        <Chip
                          label={toProperCase(
                            entry.submitted_by?.username || "N/A"
                          )}
                          variant="filled"
                          sx={{
                            fontSize: 12.75,
                            borderRadius: "24px",
                            color: "#353b48",
                            backgroundColor: "#f5f6fa",
                            height: 27.5,
                            "& .MuiChip-label": { px: "7px !important" },
                          }}
                        />
                      </td>

                      {/* ✅ Notify Users */}
                      <td className="px-4 py-3 border-b border-[#E5E7EB] text-gray-700">
                        <div className="flex flex-wrap items-center gap-1">
                          {entry.assigned_users &&
                          entry.assigned_users.length > 0 ? (
                            <>
                              {entry.assigned_users.slice(0, 2).map((user) => (
                                <Chip
                                  key={user.id}
                                  label={toProperCase(user.username)}
                                  variant="outlined"
                                  sx={{
                                    fontSize: 11.5,
                                    borderRadius: "16px",
                                    borderColor: "#ddd",
                                    height: 25,
                                    "& .MuiChip-label": {
                                      px: "8px !important",
                                    },
                                  }}
                                />
                              ))}

                              {entry.assigned_users.length > 2 && (
                                <Tooltip
                                  title={entry.assigned_users
                                    .slice(2)
                                    .map((u) => toProperCase(u.username))
                                    .join(", ")}
                                >
                                  <Chip
                                    label={`+${
                                      entry.assigned_users.length - 2
                                    } more`}
                                    variant="filled"
                                    sx={{
                                      fontSize: 11,
                                      borderRadius: "16px",
                                      backgroundColor: "#f0f0f0",
                                      color: "#555",
                                      height: 24,
                                      "& .MuiChip-label": {
                                        px: "8px !important",
                                      },
                                    }}
                                  />
                                </Tooltip>
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-gray-400">
                              No notify users
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Submitted Date */}
                      <td className="px-4 py-3 border-b border-[#E5E7EB] text-gray-700">
                        {convertToCST(entry.created_at) || "—"}
                      </td>

                      {/* Actions */}
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
                              className="!text-[16px] !text-[#707784]"
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
  );
}
