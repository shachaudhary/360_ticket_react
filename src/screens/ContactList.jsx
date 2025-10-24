import React, { useEffect, useState } from "react";
import {
  TextField,
  IconButton,
  Tooltip,
  CircularProgress,
  Chip,
  Button,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { createAPIEndPoint } from "../config/api/api";
import DateWithTooltip from "../components/DateWithTooltip";
import { toProperCase1 } from "../utils/formatting";
import CustomTablePagination from "../components/CustomTablePagination";
import { convertToCST, formatUSPhoneNumber } from "../utils";
import { EyeIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";

// 🔹 Debounce Hook
function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

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

  // 🔹 Fetch Contacts
  const fetchContacts = async () => {
    try {
      setLoading(true);
      const res = await createAPIEndPoint(
        `contact/get_all?clinic_id=1&page=${
          page + 1
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
                    <th className="px-4 py-3 border-r border-b border-[#E5E7EB] font-medium">
                      Message
                    </th>
                    <th className="px-4 py-3 border-r border-b border-[#E5E7EB] font-medium">
                      Status
                    </th>
                    <th className="px-4 py-3 border-r border-b border-[#E5E7EB] font-medium">
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
                          label={formatUSPhoneNumber(contact.phone) || "—"}
                          variant="filled"
                          sx={{
                            fontSize: 12.75,
                            borderRadius: "24px",
                            color: "#353b48",
                            backgroundColor: "#f5f6fa",
                            height: 27.5,
                            "& .MuiChip-label": {
                              px: "7px !important",
                            },
                          }}
                        />
                      </td>
                      <td className="px-4 py-3 border-b border-[#E5E7EB]">
                        {contact.email || "—"}
                      </td>
                      <td className="px-4 py-3 border-b max-w-56 border-[#E5E7EB] text-gray-600">
                        {contact.message?.length > 55
                          ? contact.message.slice(0, 55) + "..."
                          : contact.message || "—"}
                      </td>
                      <td className="px-4 py-3 border-b border-[#E5E7EB] text-gray-600">
                        <StatusBadge status={contact?.status} />
                      </td>
                      <td className="px-4 py-3 border-b text-gray-700">
                        {convertToCST(contact?.created_at) || "—"}
                      </td>
                      <td className="px-4 py-3 border-b border-[#E5E7EB] text-center">
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/contacts/${contact.id}`)}
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
    </div>
  );
}
