import React, { useEffect, useState } from "react";
import {
  TextField,
  IconButton,
  Tooltip,
  Switch,
  CircularProgress,
  Chip,
} from "@mui/material";
import { PlusIcon } from "@heroicons/react/24/solid";
import ModeEditSharpIcon from "@mui/icons-material/ModeEditSharp";
import { createAPIEndPoint } from "../config/api/api";
import CategoryModal from "../components/CategoryModal";
import DateWithTooltip from "../components/DateWithTooltip";
import { toProperCase } from "../utils/formatting";
import CustomTablePagination from "../components/CustomTablePagination";

// 🔹 Debounce Hook
function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

export default function Settings() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // 🔹 Pagination state
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0); // starts from 0 for UI
  const [totalCount, setTotalCount] = useState(0);

  // 🔹 Search state
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 500);

  // 🔹 Fetch categories
  const fetchCategories = async () => {
    try {
      setLoading(true);

      const res = await createAPIEndPoint(
        `category?page=${
          page + 1
        }&per_page=${rowsPerPage}&search=${debouncedQuery}`
      ).fetchAll();

      setCategories(res.data?.categories || res.data || []);
      setTotalCount(res.data?.total || res.data?.length || 0);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [page, rowsPerPage, debouncedQuery]);

  // 🔹 Toggle enable/disable
  const handleToggle = async (cat) => {
    try {
      await createAPIEndPoint(`category/${cat.id}`).patch({
        enabled: !cat.enabled,
      });
      fetchCategories();
    } catch (err) {
      console.error("Failed to toggle category", err);
    }
  };

  // 🔹 Modal open/close
  const handleOpenModal = (category = null) => {
    setEditingCategory(category);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setEditingCategory(null);
    setOpenModal(false);
  };

  // 🔹 After save
  const handleSaved = () => {
    handleCloseModal();
    fetchCategories();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <h2 className="text-lg md:text-xl font-semibold text-sidebar">
          Categories
        </h2>

        {/* Search Input */}
        <div className="md:ml-auto md:mr-2.5 md:max-w-64 w-full">
          <TextField
            label="Search"
            size="small"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0); // reset to first page when searching
            }}
            fullWidth
          />
        </div>

        {/* Add Button */}
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-1 rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-all"
        >
          <PlusIcon className="h-4 w-4 text-white stroke-[2.5]" />
          Add Category
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="overflow-hidden rounded-lg border border-[#E5E7EB]">
          <div className="overflow-auto h-[calc(100dvh-139px)] flex items-center justify-center rounded-lg bg-green-50">
            <CircularProgress color="primary" />
          </div>
        </div>
      ) : categories.length === 0 ? (
        <div className="overflow-hidden rounded-lg border border-[#E5E7EB]">
          <div className="h-[calc(100dvh-145px)] flex-col gap-1 flex items-center justify-center rounded-lg">
            <p className="text-gray-500 font-normal text-md">
              No categories found
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
                    <th className="px-4 py-3 border-r border-b border-[#E5E7EB] font-medium">
                      #
                    </th>
                    <th className="px-4 py-3 border-r border-b border-[#E5E7EB] font-medium">
                      Category Name
                    </th>
                    <th className="px-4 py-3 border-r border-b border-[#E5E7EB] font-medium">
                      Assigned To
                    </th>
                    <th className="px-4 py-3 border-r border-b border-[#E5E7EB] font-medium">
                      Created At
                    </th>
                    {/* <th className="px-4 py-3 text-center border-b border-[#E5E7EB] font-medium">
                      Enabled
                    </th> */}
                    <th className="px-4 py-3 text-center border-b border-[#E5E7EB] font-medium">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white text-sm">
                  {categories.map((cat, idx) => (
                    <tr key={cat.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 border-b border-[#E5E7EB]">
                        {page * rowsPerPage + idx + 1}
                      </td>
                      <td className="px-4 py-3 border-b border-[#E5E7EB]">
                        <Chip
                          label={toProperCase(cat.name) || "—"}
                          variant="filled"
                          sx={{
                            fontSize: 11.75,
                            fontWeight: 500,
                            borderRadius: "6px",
                            color: "#6B7280",
                            border: "1px solid #E5E7EB",
                            background: "white",
                            height: 27.5,
                            "& .MuiChip-label": {
                              px: "7px !important", // ✅ Correct selector
                            },
                          }}
                        />
                      </td>
                      <td className="px-4 py-3 border-b border-[#E5E7EB]">
                        {/* {toProperCase(cat.assignee_name) || "—"} */}

                        <Chip
                          label={toProperCase(cat.assignee_name) || "—"}
                          variant="filled"
                          sx={{
                            fontSize: 12.75,
                            borderRadius: "24px",
                            color: "#333",
                            backgroundColor: "#f6f6f6",
                            height: 27.5,
                            "& .MuiChip-label": {
                              px: "7px !important", // ✅ Correct selector
                            },
                          }}
                        />
                      </td>
                      <td className="px-4 py-3 border-b border-[#E5E7EB]">
                        {cat.created_at ? (
                          <DateWithTooltip date={cat.created_at} />
                        ) : (
                          "—"
                        )}
                      </td>
                      {/* <td className="px-4 py-3 border-b border-[#E5E7EB] text-center">
                        <Switch
                          checked={cat.enabled}
                          onChange={() => handleToggle(cat)}
                          color="primary"
                        />
                      </td> */}
                      <td className="px-4 py-3 border-b  border-[#E5E7EB] text-center">
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenModal(cat)}
                            className="!bg-slate-50"
                          >
                            <ModeEditSharpIcon
                              fontSize="small"
                              className="!text-[19px] !text-[#707784]"
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

          {/* Pagination */}
          <CustomTablePagination
            rowsPerPage={rowsPerPage}
            setRowsPerPage={setRowsPerPage}
            page={page}
            setPage={setPage}
            totalCount={totalCount}
          />
        </div>
      )}

      {/* Modal */}
      {openModal && (
        <CategoryModal
          open={openModal}
          onClose={handleCloseModal}
          onSaved={handleSaved}
          category={editingCategory}
        />
      )}
    </div>
  );
}
