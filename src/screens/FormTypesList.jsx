import React, { useEffect, useState } from "react";
import {
  TextField,
  IconButton,
  Tooltip,
  CircularProgress,
  Chip,
} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import { EyeIcon } from "@heroicons/react/24/outline";
import { PlusIcon } from "@heroicons/react/24/solid";
import { createAPIEndPoint } from "../config/api/api";
import { toProperCase } from "../utils/formatting";
import CustomTablePagination from "../components/CustomTablePagination";
import { useNavigate } from "react-router-dom";
import { convertToCST } from "../utils";
import FormTypeModal from "../components/FormTypeModal";
import toast from "react-hot-toast"; // ✅ make sure toast works
import { createAPIEndPointAuth } from "../config/api/apiAuth";
import ModeEditSharpIcon from "@mui/icons-material/ModeEditSharp";

export default function FormTypesList() {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [forms, setForms] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // 🟢 Modal control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);

  // 🔹 Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(0);
    }, 500);
    return () => clearTimeout(handler);
  }, [query]);

  // 🔹 Fetch form types
  const fetchForms = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedQuery) params.append("name", debouncedQuery);
      params.append("page", page + 1);
      params.append("per_page", rowsPerPage);

      const res = await createAPIEndPointAuth(
        `form_types?${params}`
      ).fetchAll();
      setForms(res.data?.form_types || []);
      setTotalCount(res.data?.total || 0);
    } catch (err) {
      console.error("Error fetching form types:", err);
      toast.error("Failed to load forms");
      setForms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, [debouncedQuery, page, rowsPerPage]);

  const handleClearFilters = () => {
    setQuery("");
    setPage(0);
  };

  const handleViewSubmissions = (formId, formName) => {
    // Make name URL-friendly
    const encodedName = encodeURIComponent(
      formName.trim().replace(/\s+/g, "-").toLowerCase()
    );
    navigate(`/forms/${formId}/submissions/${encodedName}`);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg md:text-xl font-semibold text-sidebar">Forms</h2>

        <div className="max-w-xs w-full">
          <TextField
            label="Search Form Name"
            size="small"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            fullWidth
            InputProps={{
              endAdornment: query?.length > 0 && (
                <IconButton size="small" onClick={() => setQuery("")}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              ),
            }}
          />
        </div>

        {/* <button
          onClick={() => {
            setSelectedForm(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1 rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-all"
        >
          <PlusIcon className="h-4 w-4 text-white stroke-[2.5]" />
          New Form
        </button> */}
      </div>

      {/* 🟢 Modal for creating/editing form type */}
      <FormTypeModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={() => {
          setIsModalOpen(false);
          fetchForms();
        }}
        formType={selectedForm}
      />

      {/* Search */}
      <div className="flex gap-3">
        {/* <div className="max-w-xs w-full">
          <TextField
            label="Search Form Name"
            size="small"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            fullWidth
            InputProps={{
              endAdornment: query?.length > 0 && (
                <IconButton size="small" onClick={() => setQuery("")}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              ),
            }}
          />
        </div> */}

        {/* <button
          onClick={handleClearFilters}
          className={`ml-auto px-3 py-[6.15px] rounded-lg text-xs font-medium focus:outline-none focus:ring-2 transition-all ${
            query
              ? "border border-red-500 bg-red-500 text-white hover:bg-red-600 focus:ring-red-500"
              : "border border-[#E5E7EB] text-gray-400 hover:border-gray-300 hover:text-gray-600 hover:bg-brand-50 focus:ring-gray-500"
          }`}
        >
          Clear
        </button> */}
      </div>

      {/* Table */}
      {loading ? (
        <div className="overflow-hidden rounded-lg border border-[#E5E7EB]">
          <div className="h-[calc(100dvh-152px)] flex items-center justify-center bg-purple-50">
            <CircularProgress color="primary" />
          </div>
        </div>
      ) : forms.length === 0 ? (
        <div className="overflow-hidden rounded-lg border border-[#E5E7EB]">
          <div className="h-[calc(100dvh-152px)] flex flex-col items-center justify-center bg-white">
            <p className="text-gray-500 font-normal text-md">No forms found</p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="overflow-hidden rounded-lg border border-[#E5E7EB]">
            <div className="overflow-auto h-[calc(100dvh-218.75px)]">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-white sticky top-0 z-10 whitespace-nowrap">
                  <tr className="text-left text-xs text-gray-500">
                    <th className="px-4 py-3 border-b border-r border-[#E5E7EB]">
                      #
                    </th>
                    <th className="px-4 py-3 border-b border-r border-[#E5E7EB]">
                      Name
                    </th>
                    <th className="px-4 py-3 border-b border-r border-[#E5E7EB]">
                      Description
                    </th>
                    <th className="px-4 py-3 border-b border-r border-[#E5E7EB]">
                      Created By
                    </th>
                    <th className="px-4 py-3 border-b border-r border-[#E5E7EB]">
                      {/* Notify Users */}
                      Total Entries
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
                  {forms.map((form, idx) => (
                    <tr key={form.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 border-b border-[#E5E7EB]">
                        {page * rowsPerPage + idx + 1}
                      </td>

                      {/* Name */}
                      <td className="px-4 py-3 border-b border-[#E5E7EB] font-medium text-gray-800">
                        {toProperCase(form.name)}
                      </td>

                      {/* Description */}
                      <td
                        className="px-4 py-3 border-b border-[#E5E7EB] text-gray-600 max-w-[320px]"
                        title={form.description}
                      >
                        {form.description?.length > 80
                          ? form.description.slice(0, 80) + "..."
                          : form.description || "—"}
                      </td>

                      {/* Owner */}
                      <td className="px-4 py-3 border-b border-[#E5E7EB] text-gray-700">
                        <Chip
                          label={toProperCase(form.owner?.username) || "N/A"}
                          variant="filled"
                          sx={{
                            fontSize: 12.5,
                            borderRadius: "24px",
                            backgroundColor: "#f5f6fa",
                            color: "#353b48",
                            height: 27,
                            "& .MuiChip-label": { px: "8px !important" },
                          }}
                        />
                      </td>

                      {/* ✅ Notify Users (max 2 + “+N more”) */}
                      {/* <td className="px-4 py-3 border-b border-[#E5E7EB] text-gray-700">
                        <div className="flex flex-wrap items-center gap-1">
                          {form.assign_users && form.assign_users.length > 0 ? (
                            <>
                              {form.assign_users.slice(0, 2).map((user) => (
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

                              {form.assign_users.length > 2 && (
                                <Chip
                                  label={`+${
                                    form.assign_users.length - 2
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
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-gray-400">
                              No notify users
                            </span>
                          )}
                        </div>
                      </td> */}

                      <td className="px-4 py-3 border-b border-[#E5E7EB]">
                        <Chip
                          label={form?.total_submissions || "N/A"}
                          variant="filled"
                          sx={{
                            fontSize: 11.75,
                            fontWeight: 500,
                            borderRadius: "6px",
                            color: "#6B7280",
                            border: "1px solid #E5E7EB",
                            background: "white",
                            height: 23.5,
                            "& .MuiChip-label": {
                              px: "7px !important", // ✅ Correct selector
                            },
                          }}
                        />
                      </td>

                      {/* Created */}
                      <td className="px-4 py-3 border-b border-[#E5E7EB] text-gray-600">
                        {convertToCST(form.created_at)}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 text-center border-b border-[#E5E7EB] whitespace-nowrap">
                        <Tooltip title="View Submissions">
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleViewSubmissions(form.id, form.name)
                            }
                          >
                            <EyeIcon className="h-5 w-5 text-gray-500 hover:text-brand-500 transition-colors" />
                          </IconButton>
                        </Tooltip>

                        {/* ✏️ Edit Form */}
                        <Tooltip title="Edit Form">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedForm(form); // 🟢 Pass selected form to modal
                              setIsModalOpen(true);
                            }}
                          >
                            <ModeEditSharpIcon
                              fontSize="small"
                              className="!text-[16px] text-gray-500 hover:text-brand-500 transition-colors"
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
