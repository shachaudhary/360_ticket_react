import React, { useEffect, useState } from "react";
import {
  TextField,
  IconButton,
  Tooltip,
  CircularProgress,
  Chip,
} from "@mui/material";
import { PlusIcon } from "@heroicons/react/24/solid";
import ModeEditSharpIcon from "@mui/icons-material/ModeEditSharp";
import { createAPIEndPoint } from "../config/api/api";
import FormTypeModal from "../components/FormTypeModal";
import DateWithTooltip from "../components/DateWithTooltip";
import { toProperCase } from "../utils/formatting";
import CustomTablePagination from "../components/CustomTablePagination";
import { createAPIEndPointAuth } from "../config/api/apiAuth";

function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

export default function SettingsFormTypes() {
  const [formTypes, setFormTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [editingFormType, setEditingFormType] = useState(null);

  // Pagination
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Search
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 500);

  // Fetch all form types
  const fetchFormTypes = async () => {
    try {
      setLoading(true);
      const res = await createAPIEndPointAuth(
        `form_types?page=${
          page + 1
        }&per_page=${rowsPerPage}&search=${debouncedQuery}`
      ).fetchAll();

      setFormTypes(res.data?.form_types || res.data || []);
      setTotalCount(res.data?.total || res.data?.length || 0);
    } catch (err) {
      console.error("Error fetching form types:", err);
      setFormTypes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFormTypes();
  }, [page, rowsPerPage, debouncedQuery]);

  // Modal handlers
  const handleOpenModal = (formType = null) => {
    setEditingFormType(formType);
    setOpenModal(true);
  };
  const handleCloseModal = () => {
    setEditingFormType(null);
    setOpenModal(false);
  };
  const handleSaved = () => {
    handleCloseModal();
    fetchFormTypes();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <h2 className="text-lg md:text-xl font-semibold text-sidebar">
          Form Types
        </h2>

        <div className="md:ml-auto md:mr-2.5 md:max-w-64 w-full">
          <TextField
            label="Search"
            size="small"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            fullWidth
          />
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-1 rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-all"
        >
          <PlusIcon className="h-4 w-4 text-white stroke-[2.5]" />
          Add Form Type
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="overflow-hidden rounded-lg border border-[#E5E7EB]">
          <div className="overflow-auto h-[calc(100dvh-139px)] flex items-center justify-center bg-purple-50">
            <CircularProgress color="primary" />
          </div>
        </div>
      ) : formTypes.length === 0 ? (
        <div className="overflow-hidden rounded-lg border border-[#E5E7EB]">
          <div className="h-[calc(100dvh-145px)] flex-col gap-1 flex items-center justify-center">
            <p className="text-gray-500 font-normal text-md">
              No form types found
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="overflow-hidden rounded-lg border border-[#E5E7EB]">
            <div className="overflow-auto h-[calc(100dvh-209px)]">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-white sticky top-0 z-10">
                  <tr className="text-left text-xs text-gray-500">
                    <th className="px-4 py-3 border-r border-b font-medium">
                      #
                    </th>
                    <th className="px-4 py-3 border-r border-b font-medium">
                      Name
                    </th>
                    <th className="px-4 py-3 border-r border-b font-medium">
                      Description
                    </th>
                    <th className="px-4 py-3 border-r border-b font-medium">
                      Notify Members
                    </th>
                    <th className="px-4 py-3 border-r border-b font-medium">
                      Created By
                    </th>
                    <th className="px-4 py-3 border-r border-b font-medium">
                      Created At
                    </th>
                    <th className="px-4 py-3 text-center border-b font-medium">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white text-sm">
                  {formTypes.map((ft, idx) => (
                    <tr key={ft.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        {page * rowsPerPage + idx + 1}
                      </td>

                      {/* Name */}
                      <td className="px-4 py-3">
                        {toProperCase(ft.name) || "—"}
                        {/* <Chip
                          label={toProperCase(ft.name) || "—"}
                          variant="filled"
                          sx={{
                            fontSize: 11.75,
                            fontWeight: 500,
                            borderRadius: "6px",
                            color: "#6B7280",
                            border: "1px solid #E5E7EB",
                            background: "white",
                            height: 27.5,
                            "& .MuiChip-label": { px: "7px !important" },
                          }}
                        /> */}
                      </td>

                      {/* Description with line clamp */}
                      <td
                        className="px-4 py-3 max-w-[320px] text-gray-700 text-sm leading-snug"
                        title={ft.description}
                      >
                        {ft.description
                          ? ft.description.length > 100
                            ? `${ft.description.slice(0, 100)}...`
                            : ft.description
                          : "N/A"}
                      </td>

                      {/* Notify Members */}
                      <td className="px-4 py-3">
                        {ft.users?.length ? (
                          <div className="flex flex-wrap gap-1">
                            {ft.users.slice(0, 3).map((u, i) => (
                              <Chip
                                key={i}
                                label={toProperCase(u.username)}
                                variant="filled"
                                sx={{
                                  fontSize: 11.5,
                                  borderRadius: "16px",
                                  color: "#353b48",
                                  backgroundColor: "#f5f6fa",
                                  height: 26,
                                }}
                              />
                            ))}
                            {ft.users.length > 3 && (
                              <Chip
                                label={`+${ft.users.length - 3} more`}
                                variant="outlined"
                                sx={{
                                  fontSize: 11.5,
                                  borderRadius: "16px",
                                  color: "#6B7280",
                                  borderColor: "#D1D5DB",
                                  height: 26,
                                }}
                              />
                            )}
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>

                      {/* Created By */}
                      <td className="px-4 py-3 text-gray-600">
                        {ft.owner ? toProperCase(ft.owner.username) : "—"}
                      </td>

                      {/* Created At */}
                      <td className="px-4 py-3">
                        {ft.created_at ? (
                          <DateWithTooltip date={ft.created_at} />
                        ) : (
                          "—"
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-center">
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenModal(ft)}
                            className="!bg-slate-50"
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

      {openModal && (
        <FormTypeModal
          open={openModal}
          onClose={handleCloseModal}
          onSaved={handleSaved}
          formType={editingFormType}
        />
      )}
    </div>
  );
}
