import React, { useEffect, useState, useCallback } from "react";
import {
  TextField,
  IconButton,
  Tooltip,
  CircularProgress,
  InputAdornment,
  Autocomplete,
  Box,
} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import { TrashIcon, EyeIcon } from "@heroicons/react/24/outline";
import { PlusIcon } from "@heroicons/react/24/solid";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { createAPIEndPoint } from "../config/api/api";
import { createAPIEndPointAuth } from "../config/api/apiAuth";
import { toProperCase } from "../utils/formatting";
import { convertToCST } from "../utils";
import CustomTablePagination from "../components/CustomTablePagination";
import ConfirmationModal from "../components/ConfirmationModal";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../state/AppContext";
import toast from "react-hot-toast";
import {
  getStaticInventoryFallbackList,
  sortInventoryDevicesByCreatedDesc,
  filterInventoryDevices,
} from "../data/staticInventoryDevices";
// import InventoryStatusChip from "../components/InventoryStatusChip";

const inventoryFilterWrapSx = {
  width: "100%",
  maxWidth: { xs: "100%", sm: 280 },
  flexShrink: 0,
};

const inventoryFilterInputSx = {
  width: "100%",
  maxWidth: "100%",
  "& .MuiOutlinedInput-root": {
    height: 40,
    minHeight: 40,
    boxSizing: "border-box",
  },
  "& .MuiInputBase-input": {
    py: 0,
  },
};

export default function InventoryList() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useApp();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState([]);
  const [locations, setLocations] = useState([]);
  const [locationsById, setLocationsById] = useState({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(0);
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const loadLocations = async () => {
      if (!user?.clinic_id) return;
      try {
        const res = await createAPIEndPointAuth(
          `clinic_locations/get_all/${user.clinic_id}`,
        ).fetchAll();
        const locs = res.data?.locations || [];
        const filtered = locs.filter((loc) => {
          const name = (loc.location_name || "").trim().toLowerCase();
          return (
            loc.id !== 25 &&
            loc.id !== 28 &&
            loc.id !== 44 &&
            name !== "sales team" &&
            name !== "insurance" &&
            name !== "jazmin spanish"
          );
        });
        const sorted = filtered.sort((a, b) => {
          const nameA = (
            a.display_name?.trim() ||
            a.location_name?.trim() ||
            ""
          ).toLowerCase();
          const nameB = (
            b.display_name?.trim() ||
            b.location_name?.trim() ||
            ""
          ).toLowerCase();
          return nameA.localeCompare(nameB);
        });
        setLocations(sorted);
        const map = {};
        sorted.forEach((l) => {
          map[l.id] = l.display_name || l.location_name || `#${l.id}`;
        });
        setLocationsById(map);
      } catch (e) {
        console.error(e);
      }
    };
    loadLocations();
  }, [user?.clinic_id]);

  const fetchDevices = useCallback(async () => {
    if (!user?.clinic_id) {
      setDevices([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const params = { clinic_id: user.clinic_id };
      if (locationFilter) {
        params.location_id = locationFilter;
      }

      const res = await createAPIEndPoint("devices").fetchFiltered(params);
      let list = res.data?.data ?? res.data ?? [];
      if (!Array.isArray(list)) list = [];

      if (debouncedQuery.trim()) {
        list = filterInventoryDevices(list, debouncedQuery, locationsById);
      }

      setDevices(sortInventoryDevicesByCreatedDesc(list));
    } catch (err) {
      console.error(err);
      setDevices(
        getStaticInventoryFallbackList(
          user.clinic_id,
          debouncedQuery,
          locationFilter,
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [user?.clinic_id, debouncedQuery, locationFilter, locationsById]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices, location.key]);

  const openDeleteModal = (e, id, serial) => {
    e.stopPropagation();
    setDeviceToDelete({ id, serial });
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    if (deleting) return;
    setDeleteModalOpen(false);
    setDeviceToDelete(null);
  };

  const confirmDeleteDevice = async () => {
    if (!deviceToDelete?.id) return;
    try {
      setDeleting(true);
      await createAPIEndPoint("devices/").delete(deviceToDelete.id);
      toast.success("Inventory item deleted");
      fetchDevices();
      setDeleteModalOpen(false);
      setDeviceToDelete(null);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Failed to delete inventory item");
    } finally {
      setDeleting(false);
    }
  };

  if (!user?.is_form_access) {
    return <Navigate to="/dashboard" replace />;
  }

  const totalCount = devices.length;
  const paged = devices.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-lg md:text-xl font-semibold text-sidebar shrink-0">
          IT Inventory
        </h2>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center w-full lg:w-auto lg:justify-end">
          <Box sx={inventoryFilterWrapSx}>
            <TextField
              label="Search location, room, computer, serial, type"
              size="small"
              fullWidth
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={loading}
              sx={inventoryFilterInputSx}
              InputProps={{
                endAdornment: query?.length > 0 && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setQuery("")}
                      disabled={loading}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          <Box sx={inventoryFilterWrapSx}>
            <Autocomplete
              size="small"
              fullWidth
              disabled={loading}
              sx={inventoryFilterInputSx}
              options={[
                { id: "", location_name: "All Locations" },
                ...locations,
              ]}
              getOptionLabel={(opt) =>
                opt.display_name || opt.location_name || ""
              }
              value={
                locationFilter === ""
                  ? { id: "", location_name: "All Locations" }
                  : locations.find((loc) => loc.id === locationFilter) || null
              }
              onChange={(_, newValue) => {
                setLocationFilter(newValue?.id ? newValue.id : "");
                setPage(0);
              }}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  fullWidth
                  label="Location"
                  placeholder="All Locations"
                />
              )}
            />
          </Box>
          <button
            type="button"
            onClick={() => navigate("/inventory/new")}
            className="flex items-center justify-center gap-1 rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-all whitespace-nowrap shrink-0"
          >
            <PlusIcon className="h-4 w-4 text-white stroke-[2.5]" />
            Add inventory
          </button>
        </div>
      </div>

      {loading ? (
        <div className="overflow-hidden rounded-lg border border-[#E5E7EB]">
          <div className="h-[calc(100dvh-152px)] flex items-center justify-center bg-purple-50">
            <CircularProgress color="primary" />
          </div>
        </div>
      ) : devices.length === 0 ? (
        <div className="overflow-hidden rounded-lg border border-[#E5E7EB]">
          <div className="h-[calc(100dvh-152px)] flex flex-col items-center justify-center bg-white">
            <p className="text-gray-500 font-normal text-md">
              No inventory items found
            </p>
            <button
              type="button"
              onClick={() => navigate("/inventory/new")}
              className="mt-3 text-sm font-medium text-brand-600 hover:underline"
            >
              Register an item
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="overflow-hidden rounded-lg border border-[#E5E7EB]">
            <div className="overflow-auto h-[calc(100dvh-200.75px)]">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-white sticky top-0 z-10 whitespace-nowrap">
                  <tr className="text-left text-xs text-gray-500">
                    <th className="px-4 py-3 border-b border-r border-[#E5E7EB]">
                      #
                    </th>
                    <th className="px-4 py-3 border-b border-r border-[#E5E7EB]">
                      Location
                    </th>
                    <th className="px-4 py-3 border-b border-r border-[#E5E7EB]">
                      Room #
                    </th>
                    <th className="px-4 py-3 border-b border-r border-[#E5E7EB]">
                      Computer name
                    </th>
                    <th className="px-4 py-3 border-b border-r border-[#E5E7EB]">
                      Serial number
                    </th>
                    <th className="px-4 py-3 border-b border-r border-[#E5E7EB]">
                      Device type
                    </th>
                    <th className="px-4 py-3 border-b border-r border-[#E5E7EB]">
                      Created at
                    </th>
                    {/* <th className="px-4 py-3 border-b border-r border-[#E5E7EB]">
                      Status
                    </th> */}
                    <th className="px-4 py-3 text-center border-b border-[#E5E7EB]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white text-sm">
                  {paged.map((d, idx) => (
                    <tr
                      key={d.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/inventory/${d.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          navigate(`/inventory/${d.id}`);
                        }
                      }}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-4 py-3 border-b border-[#E5E7EB] text-gray-600">
                        {page * rowsPerPage + idx + 1}
                      </td>
                      <td
                        className="px-4 py-3 border-b border-[#E5E7EB] text-gray-700 max-w-[180px] truncate"
                        title={locationsById[d.location_id]}
                      >
                        {locationsById[d.location_id] ||
                          d.location_details?.location_name ||
                          `ID ${d.location_id ?? "—"}`}
                      </td>
                      <td className="px-4 py-3 border-b border-[#E5E7EB] text-gray-600">
                        {d.room_number?.trim() ? d.room_number : "—"}
                      </td>
                      <td
                        className="px-4 py-3 border-b border-[#E5E7EB] text-gray-700 max-w-[160px] truncate"
                        title={d.computer_name}
                      >
                        {d.computer_name || "—"}
                      </td>
                      <td
                        className="px-4 py-3 border-b border-[#E5E7EB] font-medium text-gray-800 max-w-[140px] truncate"
                        title={d.serial_number}
                      >
                        {d.serial_number || "—"}
                      </td>
                      <td className="px-4 py-3 border-b border-[#E5E7EB]">
                        {d.device_type ? toProperCase(d.device_type) : "—"}
                      </td>
                      <td className="px-4 py-3 border-b border-[#E5E7EB] text-gray-600 whitespace-nowrap">
                        {d.created_at ? convertToCST(d.created_at) : "—"}
                      </td>
                      {/* <td
                        className="px-4 py-3 border-b border-[#E5E7EB]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <InventoryStatusChip status={d.status} />
                      </td> */}
                      <td className="px-4 py-3 text-center border-b border-[#E5E7EB] whitespace-nowrap">
                        <Tooltip title="View">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/inventory/${d.id}`);
                            }}
                          >
                            <EyeIcon className="h-5 w-5 text-gray-500 hover:text-brand-500" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/inventory/${d.id}/edit`);
                            }}
                          >
                            <PencilSquareIcon className="h-5 w-5 text-gray-500 hover:text-brand-500" />
                          </IconButton>
                        </Tooltip>
                        {/* <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={(e) =>
                              openDeleteModal(e, d.id, d.serial_number)
                            }
                          >
                            <TrashIcon className="h-5 w-5 text-gray-500 hover:text-red-500" />
                          </IconButton>
                        </Tooltip> */}
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

      <ConfirmationModal
        open={deleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteDevice}
        title="Delete inventory item"
        message={`Are you sure you want to delete inventory item ${
          deviceToDelete?.serial?.trim()
            ? `"${deviceToDelete.serial}"`
            : `#${deviceToDelete?.id ?? ""}`
        }? This cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        loading={deleting}
        danger
      />
    </div>
  );
}
