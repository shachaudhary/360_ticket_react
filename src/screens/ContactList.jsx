import React, { useEffect, useState } from "react";
import {
  TextField,
  IconButton,
  Tooltip,
  CircularProgress,
  Chip,
  Button,
  Menu,
  MenuItem,
  Typography,
  InputAdornment,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SearchIcon from "@mui/icons-material/Search";
import { createAPIEndPoint } from "../config/api/api";
import DateWithTooltip from "../components/DateWithTooltip";
import { toProperCase1, toProperCase } from "../utils/formatting";
import CustomTablePagination from "../components/CustomTablePagination";
import { convertToCST, formatUSPhoneNumber } from "../utils";
import { EyeIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";
import toast from "react-hot-toast";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { chipStyle } from "../utils/common";

// 🔹 Debounce Hook
function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

// 🔹 Helper to parse predicted_category from data JSON string
const getPredictedCategory = (dataString) => {
  try {
    if (!dataString) return null;
    const parsed = JSON.parse(dataString);
    return parsed.predicted_category || null;
  } catch (err) {
    console.error("Error parsing data field:", err);
    return null;
  }
};

export default function ContactList() {
  const navigate = useNavigate();

  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Pagination state
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // 🔹 Search state
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 500);

  // 🔹 Category update state
  const [categories, setCategories] = useState([]);
  const [categoryMenuAnchor, setCategoryMenuAnchor] = useState(null);
  const [selectedContactForCategory, setSelectedContactForCategory] = useState(null);
  const [updatingCategory, setUpdatingCategory] = useState(false);
  const [categorySearchTerm, setCategorySearchTerm] = useState("");

  // 🔹 Fetch Categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await createAPIEndPoint("category").fetchAll();
        setCategories(res.data || []);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  // 🔹 Filter categories based on search
  const filteredCategories = categories.filter((cat) =>
    cat.name?.toLowerCase().includes(categorySearchTerm.toLowerCase())
  );

  // 🔹 Handle Category Update
  const handleCategoryUpdate = async (contactId, categoryName) => {
    setUpdatingCategory(true);
    try {
      await createAPIEndPoint(`contact/update_category/`).update(contactId, {
        category: categoryName,
      });

      toast.success(`Category updated to ${toProperCase(categoryName)}`);
      setCategoryMenuAnchor(null);
      setSelectedContactForCategory(null);
      setCategorySearchTerm("");
      fetchContacts(); // Refresh the list
    } catch (err) {
      console.error("Failed to update category", err);
      toast.error("Failed to update category");
    } finally {
      setUpdatingCategory(false);
    }
  };

  // 🔹 Fetch Contacts
  const fetchContacts = async () => {
    try {
      setLoading(true);
      const res = await createAPIEndPoint(
        `contact/get_all?clinic_id=1&page=${page + 1
        }&per_page=${rowsPerPage}&search=${debouncedQuery}`
      ).fetchAll();

      setContacts(res.data?.forms || res.data || []);
      setTotalCount(res.data?.total || res.data?.length || 0);
    } catch (err) {
      console.error("Error fetching contacts:", err);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [page, rowsPerPage, debouncedQuery]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <h2 className="text-lg md:text-xl font-semibold text-sidebar">
          Contact Submissions
        </h2>

        {/* Search Input */}
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
        {/* <Button
          variant="outlined"
          size="small"
          onClick={() => navigate(`/contact-us`)}
          sx={{ borderRadius: 1.25 }}
          className="!border !border-[#E5E7EB] hover:!border-[#ddd]  !text-gray-500 hover:!bg-gray-50 focus:!ring-gray-500 !px-2.5 !py-1.5"
        >
          View Form
        </Button> */}
      </div>

      {/* Table */}
      {loading ? (
        <div className="overflow-hidden rounded-lg border border-[#E5E7EB]">
          <div className="overflow-auto h-[calc(100dvh-139px)] flex items-center justify-center rounded-lg bg-purple-50">
            <CircularProgress color="primary" />
          </div>
        </div>
      ) : contacts.length === 0 ? (
        <div className="overflow-hidden rounded-lg border border-[#E5E7EB]">
          <div className="h-[calc(100dvh-145px)] flex-col gap-1 flex items-center justify-center rounded-lg">
            <p className="text-gray-500 font-normal text-md">
              No contacts found
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
                      Name
                    </th>
                    <th className="px-4 py-3 border-r border-b border-[#E5E7EB] font-medium">
                      Phone
                    </th>
                    <th className="px-4 py-3 border-r border-b border-[#E5E7EB] font-medium">
                      Email
                    </th>
                    {/* <th className="px-4 py-3 border-r border-b border-[#E5E7EB] font-medium">
                      Message
                    </th> */}
                    <th className="px-4 py-3 border-r border-b border-[#E5E7EB] font-medium">
                      Category
                    </th>
                    <th className="px-4 py-3 border-r border-b border-[#E5E7EB] font-medium">
                      Status
                    </th>
                    <th className="px-4 py-3 border-r border-b border-[#E5E7EB] font-medium whitespace-nowrap">
                      Created At
                    </th>
                    <th className="px-4 py-3 border-b border-[#E5E7EB] text-center font-medium">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white text-sm">
                  {contacts?.map((contact, idx) => (
                    <tr key={contact.id || idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 border-b border-[#E5E7EB]">
                        {page * rowsPerPage + idx + 1}
                      </td>
                      <td className="px-4 py-3 border-b border-[#E5E7EB] font-medium text-gray-800 text-wrap max-w-40">
                        {toProperCase1(contact.name) || "N/A"}
                      </td>
                      <td className="px-4 py-3 border-b border-[#E5E7EB]">
                        <Chip
                          label={formatUSPhoneNumber(contact.phone) || "N/A"}
                          variant="filled"
                          sx={chipStyle}
                        />
                      </td>
                      <td className="px-4 py-3 border-b border-[#E5E7EB]">
                        <span className="word-break-all max-w-10 lowercase">
                          {contact.email || "N/A"}
                        </span>
                      </td>
                      {/* <td className="px-4 py-3 border-b max-w-56 border-[#E5E7EB] text-gray-600">
                        {contact.message?.length > 50
                          ? contact.message.slice(0, 50) + "..."
                          : contact.message || "N/A"}
                      </td> */}
                      <td className="px-4 py-3 border-b border-[#E5E7EB]">
                        <Tooltip title="Click to change category" arrow>
                          <div className="cursor-pointer inline-block">
                            <Chip
                              // label={toProperCase(getPredictedCategory(contact.data)) || "N/A"}
                              label={toProperCase(contact?.predicted_category) || "N/A"}
                              deleteIcon={
                                <KeyboardArrowDownIcon
                                  sx={{
                                    fontSize: 14,
                                    color: categoryMenuAnchor && selectedContactForCategory?.id === contact.id
                                      ? "#824EF2 !important"
                                      : "#6B7280 !important",
                                    opacity: categoryMenuAnchor && selectedContactForCategory?.id === contact.id ? 1 : 0.7,
                                    px: 0.25,
                                    transition: "all 0.2s ease-in-out",
                                  }}
                                />
                              }
                              onDelete={(e) => {
                                setCategoryMenuAnchor(e.currentTarget.closest('.MuiChip-root'));
                                setSelectedContactForCategory(contact);
                                setCategorySearchTerm("");
                              }}
                              onClick={(e) => {
                                setCategoryMenuAnchor(e.currentTarget);
                                setSelectedContactForCategory(contact);
                                setCategorySearchTerm("");
                              }}
                              variant="filled"
                              sx={{
                                fontSize: 11.75,
                                fontWeight: 500,
                                borderRadius: "6px",
                                color: categoryMenuAnchor && selectedContactForCategory?.id === contact.id
                                  ? "#824EF2 !important"
                                  : "#6B7280 !important",
                                border: categoryMenuAnchor && selectedContactForCategory?.id === contact.id
                                  ? "1px solid #824EF2"
                                  : "1px solid #E5E7EB",
                                background: "white",
                                height: 27.5,
                                cursor: "pointer",
                                transition: "all 0.2s ease-in-out",
                                "&:hover": {
                                  backgroundColor: "#F3F4F6",
                                },
                                "& .MuiChip-label": {
                                  px: "7px !important",
                                  pr: "4px !important",
                                },
                                "& .MuiChip-deleteIcon": {
                                  margin: "0 4px 0 -2px",
                                  "&:hover": {
                                    color: "#6B7280 !important",
                                  },
                                },
                              }}
                            />
                          </div>
                        </Tooltip>
                      </td>
                      <td className="px-4 py-3 border-b border-[#E5E7EB] text-gray-600">
                        <StatusBadge status={contact?.status} isInside />
                      </td>
                      <td className="px-4 py-3 border-b text-gray-700">
                        {convertToCST(contact?.created_at) || "N/A"}
                      </td>
                      <td className="px-4 py-3 border-b border-[#E5E7EB] text-center">
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => window.open(`/contacts/${contact.id}`, "_blank")}
                            className="!bg-slate-50"
                          >
                            <EyeIcon className="h-5 w-5 text-gray-500 hover:text-brand-500 transition-colors" />
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

      {/* Category Update Menu */}
      <Menu
        anchorEl={categoryMenuAnchor}
        open={Boolean(categoryMenuAnchor)}
        onClose={() => {
          setCategoryMenuAnchor(null);
          setSelectedContactForCategory(null);
          setCategorySearchTerm("");
        }}
        PaperProps={{
          sx: {
            borderRadius: "12px",
            border: "1px solid #E5E7EB",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
            minWidth: 200,
            maxHeight: 400,
            mt: 0.5,
          },
        }}
      >
        {/* Search Field */}
        <div className="px-3 py-2 sticky top-0 bg-white z-10 border-b">
          <TextField
            size="small"
            fullWidth
            placeholder="Search category..."
            value={categorySearchTerm}
            onChange={(e) => setCategorySearchTerm(e.target.value)}
            autoFocus
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "8px",
                fontSize: "14px",
              },
              "& .MuiInputAdornment-root": {
                marginRight: "-6px !important",
              },
            }}
          />
        </div>

        {/* Header */}
        <div className="px-2 py-1">
          <Typography
            variant="caption"
            className="!px-2 !py-1 !text-gray-500 !font-medium !text-xs"
          >
            Update Category
          </Typography>
        </div>

        {/* Category List */}
        <div className="max-h-[160px] overflow-auto">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((category) => {
              const currentCategory = getPredictedCategory(
                selectedContactForCategory?.data
              );
              const isCurrentCategory =
                currentCategory?.toLowerCase() === category.name?.toLowerCase();

              return (
                <MenuItem
                  key={category.id}
                  onClick={() => {
                    if (!isCurrentCategory) {
                      handleCategoryUpdate(
                        selectedContactForCategory?.id,
                        category.name
                      );
                    }
                  }}
                  disabled={isCurrentCategory || updatingCategory}
                  sx={{
                    fontSize: "14px",
                    py: 1,
                    px: 2,
                    mx: 1,
                    my: 0.25,
                    borderRadius: "8px",
                    "&:hover": {
                      backgroundColor: "#F3F4F6",
                    },
                    ...(isCurrentCategory && {
                      backgroundColor: "#F3F4F6",
                      color: "#9CA3AF",
                    }),
                  }}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{toProperCase(category.name)}</span>
                    {updatingCategory && isCurrentCategory && (
                      <CircularProgress size={14} sx={{ ml: 1 }} />
                    )}
                    {isCurrentCategory && (
                      <span className="text-xs text-gray-400 ml-2">
                        (Current)
                      </span>
                    )}
                  </div>
                </MenuItem>
              );
            })
          ) : (
            <MenuItem disabled>
              <span className="text-gray-500 text-sm">No categories found</span>
            </MenuItem>
          )}
        </div>
      </Menu>
    </div>
  );
}
