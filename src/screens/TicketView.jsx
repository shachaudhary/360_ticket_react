import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Card,
  Typography,
  Box,
  Divider,
  Container,
  Button,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  CircularProgress,
  Autocomplete,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
} from "@mui/material";
import {
  ArrowPathIcon,
  ArrowsRightLeftIcon,
  EyeIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "react-router-dom";
import { createAPIEndPoint } from "../config/api/api";
import BackButton from "../components/BackButton";
import CommentBox from "../components/CommentBox";
import { createAPIEndPointAuth } from "../config/api/apiAuth";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { toProperCase } from "../utils/formatting";
import TicketHeader from "../components/TicketHeader";
import { convertToCST } from "../utils";
import { useApp } from "../state/AppContext";
import StatusBadge from "../components/StatusBadge";
import DateWithTooltip from "../components/DateWithTooltip";

// ✅ Debounce Hook
function useDebounce(value, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// ✅ Reusable Comments List with transitions
const CommentsList = ({ comments }) => (
  <Box className="space-y-2">
    {comments?.length > 0 ? (
      <AnimatePresence>
        {comments.map((c, idx) => (
          <motion.div
            key={c.id || idx} // 🔑 use stable id if available
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 0 }}
            transition={{ duration: 0.25 }}
            layout // enables smooth reordering
            className="rounded-lg border bg-[#E5E7EB] hover:bg-gray-50 bg-opacity-10 p-3 text-sm"
          >
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-gray-500">
                {toProperCase(c.username) || "N/A"}
              </span>
              <span className="text-xs text-gray-500">
                {convertToCST(c.created_at)}
              </span>
            </div>
            <div className="text-gray-700 break-words">
              {c.comment.split(" ").map((word, i) => (
                <span
                  key={i}
                  className={
                    word.startsWith("@")
                      ? "mr-1 text-blue-600 font-medium underline"
                      : "mr-1"
                  }
                >
                  {word}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    ) : (
      <Typography variant="body2" color="text.secondary">
        No comments yet
      </Typography>
    )}
  </Box>
);

function AssignModal({
  open,
  onClose,
  ticket,
  assignee,
  setAssignee,
  handleAssign,
  searchResults,
  searchLoading,
  setSearchTerm,
  loading,
}) {
  useEffect(() => {
    if (open && ticket?.assignees?.length > 0) {
      const first = ticket.assignees[0]; // 👈 first index
      setAssignee({
        user_id: first.assign_to,
        first_name: first.assign_to_username?.split(" ")[0] || "",
        last_name:
          first.assign_to_username?.split(" ").slice(1).join(" ") || "",
      });
      setSearchTerm(""); // reset search
    }
  }, [open, ticket, setAssignee, setSearchTerm]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      PaperProps={{ style: { maxWidth: "360px" } }}
    >
      <DialogTitle
        color="primary"
        sx={{ px: 2 }}
        className="!text-lg md:text-xl font-semibold text-sidebar"
      >
        Update Assignee
      </DialogTitle>
      <DialogContent dividers sx={{ px: 2 }}>
        <Autocomplete
          size="small"
          fullWidth
          options={searchResults}
          value={assignee} // ✅ current assignee shown first
          onChange={(e, newValue) => setAssignee(newValue)}
          isOptionEqualToValue={(option, value) =>
            option.user_id === value?.user_id
          }
          getOptionLabel={(option) =>
            option
              ? `${toProperCase(option.first_name)} ${toProperCase(
                option.last_name
              )}`
              : ""
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Assign To"
              placeholder="Search team member..."
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {searchLoading && <CircularProgress size={20} />}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          noOptionsText={
            searchLoading ? "Searching..." : "No team members found"
          }
        />
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.5 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            textTransform: "none",
            borderColor: "#E5E7EB",
            color: "#6B7270",
            "&:hover": { borderColor: "#E5E7EB", backgroundColor: "#Fafafa" },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={async () => {
            await handleAssign();
            onClose();
          }}
          variant="contained"
          color="primary"
          sx={{
            boxShadow: "none",
            textTransform: "none",
            color: "white",
            minWidth: 90,
          }}
          disabled={loading} // disable while loading
        >
          {loading ? (
            <CircularProgress size={20} sx={{ color: "#6B7270" }} />
          ) : (
            "Update"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function TicketView() {
  const { id } = useParams();
  const { user } = useApp();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [isFetching, setIsFetching] = useState(true); // 👈 added
  const [fetchError, setFetchError] = useState(false); // 👈 for not found
  const [assignee, setAssignee] = useState(null);
  console.log("🚀 ~ TicketView ~ assignee:", assignee);
  const [loading, setLoading] = useState(false);

  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  
  // 🔹 Notification logs state
  const [notificationLogs, setNotificationLogs] = useState([]);
  const contactFormInfo = ticket?.contact_form_info;
  const parsedContactFormData = useMemo(() => {
    if (!contactFormInfo?.data) return null;
    try {
      return JSON.parse(contactFormInfo.data);
    } catch (error) {
      console.warn("Failed to parse contact form data", error);
      return null;
    }
  }, [contactFormInfo?.data]);

  // ✅ Fetch Ticket
  const fetchTicket = useCallback(async () => {
    setIsFetching(true);
    setFetchError(false);

    try {
      const res = await createAPIEndPoint(`ticket/${id}`).fetchAll();
      if (!res.data) {
        setFetchError(true);
      } else {
        setTicket(res.data);
      }
    } catch (err) {
      console.error("❌ Failed to fetch ticket:", err);
      setFetchError(true);
    } finally {
      setIsFetching(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  // ✅ Fetch Notification Logs
  useEffect(() => {
    const fetchNotificationLogs = async () => {
      if (!user?.id || !id) return;

      try {
        const res = await createAPIEndPoint(
          `notifications?user_id=${user.id}&ticket_id=${id}`
        ).fetchAll();
        setNotificationLogs(res.data?.notifications || res.data || []);
      } catch (err) {
        console.error("Failed to fetch notification logs:", err);
        setNotificationLogs([]);
      }
    };

    fetchNotificationLogs();
  }, [id, user?.id]);

  useEffect(() => {
    const search = async () => {
      if (!debouncedSearch) {
        // keep current assignee in options if exists
        if (ticket?.assignees?.length > 0) {
          const current = {
            user_id: ticket.assignees[0]?.assign_to,
            first_name: ticket.assignees[0]?.assign_to_first_name,
            last_name: ticket.assignees[0]?.assign_to_last_name,
          };
          setSearchResults([current]);
        } else {
          setSearchResults([]);
        }
        return;
      }

      setSearchLoading(true);
      try {
        const res = await createAPIEndPointAuth(
          `clinic_team/search?query=${debouncedSearch}`
        ).fetchAll();
        setSearchResults(res?.data?.results || []);
      } catch (err) {
        console.error("Failed to search team members", err);
      } finally {
        setSearchLoading(false);
      }
    };
    search();
  }, [debouncedSearch, ticket]);

  // ✅ Search Team Members
  useEffect(() => {
    if (assignModalOpen && !debouncedSearch) {
      (async () => {
        setSearchLoading(true);
        try {
          const res = await createAPIEndPointAuth(
            `clinic_team/search?query=${ticket.assignees[-1]?.assign_to_username
            }`
          ).fetchAll();
          setSearchResults(res?.data?.results || []);
        } catch (err) {
          console.error("Failed to fetch team", err);
        } finally {
          setSearchLoading(false);
        }
      })();
    }
  }, [assignModalOpen, debouncedSearch]);

  // ✅ Assign Ticket
  const handleAssign = async () => {
    if (!assignee) return toast.error("Please select a team member");
    try {
      setLoading(true);
      await createAPIEndPoint(`ticket/${id}`).patch({
        assign_to: assignee?.user_id,
        // assign_by: user?.id,
        updated_by: user?.id,
      });

      toast.success("Ticket assigned successfully");
      fetchTicket(); // refresh ticket after update
    } catch (err) {
      console.error("Failed to assign ticket", err);
      toast.error("Failed to assign ticket");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Reusable Logs List
  const LogsList = ({ logs }) => (
    <Box className="space-y-2 ">
      {logs?.length > 0 ? (
        logs.map((log, idx) => (
          <div
            key={idx}
            className="rounded-lg  border bg-[#E5E7EB] bg-opacity-10  p-3 text-sm"
          >
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-gray-700">
                {toProperCase(log.username)}
              </span>
              <span className="text-xs text-gray-500">
                {convertToCST(log.timestamp)}
              </span>
            </div>
            <div className="text-gray-700 break-words">{log.action}</div>
          </div>
        ))
      ) : (
        <Typography variant="body2" color="text.secondary">
          No logs yet
        </Typography>
      )}
    </Box>
  );

  if (isFetching) {
    return (
      <Box className="absolute inset-0 flex items-center justify-center bg-purple-50">
        <CircularProgress color="primary" />
      </Box>
    );
  }

  // ✅ Show not found message
  if (fetchError || !ticket) {
    return (
      <Box className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-50">
        <Typography variant="h6" fontWeight={600} color="text.secondary">
          Ticket not found or failed to load.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          The ticket may have been deleted or the link is invalid.
        </Typography>
        <BackButton textBtn />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", height: "100%", position: "relative" }}>
      {/* 🔹 Main Ticket Details */}
      <Box sx={{ flex: 1, overflowY: "auto", pr: 2 }}>
        <div className="flex justify-between items-center">
          <BackButton self="/tickets" />

          <div className="flex items-center gap-2 justify-between w-full pl-3">
            {/* Assigned To */}
            {ticket.assignees?.length > 0 && (
              <div className="flex items-center gap-1 !text-[13px] text-gray-500 mr-auto">
                <span className="font-medium text-sm">Assigned To:</span>
                <Tooltip title="Change Assignee" arrow>
                  <Box
                    onClick={() => {
                      // 🚀 reset so modal opens empty
                      setAssignee(null);
                      setAssignModalOpen(true);
                    }}
                    sx={{ borderRadius: 1.25 }}
                    className="flex justify-center items-center text-brand-500 border border-brand-500 bg-purple-50 hover:brightness-[97.5%] py-2 px-2 gap-1 cursor-pointer transition-all"
                  >
                    <span className="leading-3 font-semibold">
                      {toProperCase(ticket.assignees[0]?.assign_to_username)}
                    </span>
                    <ArrowsRightLeftIcon className="h-4 w-4 text-brand-500" />
                  </Box>
                </Tooltip>
              </div>
            )}

            {/* Edit Button */}
            <Button
              variant="outlined"
              size="small"
              startIcon={<PencilSquareIcon className="h-4 w-4" />}
              onClick={() => navigate(`/tickets/${ticket.id}/edit`)}
              sx={{ borderRadius: 1.25 }}
              className="!border !border-[#E5E7EB] hover:!border-[#ddd]  !text-gray-500 hover:!bg-gray-50 focus:!ring-gray-500 !px-1 !py-1.5"
            >
              Edit
            </Button>
          </div>
        </div>

        <Container maxWidth="1440px" sx={{ mt: 2, px: "0px !important" }}>
          <Card
            sx={{
              width: "100%",
              bgcolor: "background.paper",
              border: "1px solid #ddd",
              borderRadius: "16px",
              boxShadow: 0,
              p: 2,
              height: { xs: "auto", md: "calc(100dvh - 144px)" },
              overflowY: "auto",

              // Hide scrollbar
              "&::-webkit-scrollbar": {
                width: 0, // for Chrome, Safari
              },
              scrollbarWidth: "none", // for Firefox
              msOverflowStyle: "none", // for IE & Edge
            }}
          >
            <div>
              <TicketHeader
                ticket={ticket}
                onUpdate={setTicket}
                fetchAgain={fetchTicket}
              />
            </div>

            <Divider sx={{ my: 2 }} />

            {/* Ticket Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <Label title="Title" value={toProperCase(ticket.title)} />
              <Label
                title="Priority"
                value={<StatusBadge status={ticket.priority} isInside />}
              />
              <Label
                title="Due Date"
                value={<DateWithTooltip date={ticket?.due_date} />}
              />
              {ticket.assignees?.length > 0 && (
                <Label
                  title="Assigned At"
                  value={
                    convertToCST(ticket?.assignees[0]?.assigned_at)
                    // <DateWithTooltip date={ticket?.assignees[0]?.assigned_at} />
                  }
                />
              )}
              {ticket?.completed_at > 0 && (
                <Label
                  title="Completed At"
                  value={<DateWithTooltip date={ticket?.completed_at} />}
                />
              )}
              <Label
                title="Created At"
                value={convertToCST(ticket.created_at)}
              />
              <Label
                title="Created By"
                value={toProperCase(ticket?.created_by?.username)}
              />
              {!contactFormInfo && (
                <div className="sm:col-span-2 md:col-span-3">
                  <Label title="Details" value={ticket.details} />
                </div>
              )}
            </div>

            {/* Attached Files */}
            {ticket.files?.length > 0 && (
              <div className="mt-4">
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Attached Files
                </Typography>

                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {ticket.files.map((file, idx) => {
                    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(
                      file.url
                    );
                    const fileName = file.url.split("/").pop();

                    // shorten file name if too long
                    const shortName =
                      fileName.length > 15
                        ? fileName.substring(0, 8) + "..." + fileName.slice(-7)
                        : fileName;

                    return (
                      <a
                        key={idx}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-1.5 py-1.5 text-xs text-gray-600 hover:bg-white shadow-sm hover:shadow transition-all"
                      >
                        {isImage ? (
                          <img
                            src={file.url}
                            alt={fileName}
                            className="h-10 w-10 rounded object-cover border border-gray-300"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-200 text-gray-500">
                            📄
                          </div>
                        )}
                        <span className="truncate">{shortName}</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {contactFormInfo && (
              <Box className="mt-5 rounded-2xl border border-gray-200 bg-gray-50/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Typography
                    variant="subtitle1"
                    color="primary"
                    sx={{ fontWeight: 600 }}
                  >
                    Contact Form Submission
                  </Typography>
                  {/* {contactFormInfo.status && (
                    <StatusBadge
                      status={contactFormInfo.status}
                      isInside
                      customRadius="999px"
                    />
                  )} */}
                </div>
                <Divider sx={{ my: 2 }} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Label title="Form Name" value={contactFormInfo.form_name} />
                  <Label title="Submission ID" value={`#${contactFormInfo.id}`} />
                  <Label
                    title="Submitted At"
                    value={convertToCST(contactFormInfo.created_at)}
                  />
                  <Label
                    title="Category"
                    value={
                      parsedContactFormData?.predicted_category
                        ? toProperCase(parsedContactFormData.predicted_category)
                        : "N/A"
                    }
                  />
                  <Label
                    title="Contact Name"
                    value={toProperCase(contactFormInfo.name)}
                  />
                  <Label title="Email" value={contactFormInfo.email} />
                  <Label title="Phone" value={contactFormInfo.phone} />
                  <Label title="Status" value={toProperCase(contactFormInfo.status)} />
                </div>
                <Box className="mt-4">
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, color: "#7E858D", mb: 0.5 }}
                  >
                    Message
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 500, color: "#2d3436" }}
                  >
                    {contactFormInfo.message?.trim() || "N/A"}
                  </Typography>
                </Box>
              </Box>
            )}


            <div className="grid md:grid-cols-1 gap-5">
              {/* 🔹 Assignment Logs Section */}
              <div className="mt-4">
                <Typography
                  variant="subtitle1"
                  color="primary"
                  sx={{ mb: 1, fontWeight: 600 }}
                >
                  Assignment Logs
                </Typography>
                <div className="max-h-64 overflow-y-auto">
                  <LogsList
                    logs={
                      ticket.assignment_logs?.map((log) => ({
                        username: log.changed_by_username || "N/A",
                        action: `Reassigned from ${toProperCase(
                          log.old_assign_to_username
                        )} → ${toProperCase(log.new_assign_to_username)}`,
                        timestamp: convertToCST(log.changed_at),
                      })) || []
                    }
                  />
                </div>
              </div>

              <Divider />

              {/* 🔹 Status Logs Section */}
              <div className="mt-0">
                <Typography
                  variant="subtitle1"
                  color="primary"
                  sx={{ mb: 1, fontWeight: 600 }}
                >
                  Status Logs
                </Typography>
                <div className="max-h-64 overflow-y-auto">
                  <LogsList
                    logs={
                      ticket.status_logs?.map((log) => ({
                        username: log.changed_by_username || "N/A",
                        action: `Changed status from ${toProperCase(
                          log.old_status
                        )} → ${toProperCase(log.new_status)}`,
                        timestamp: convertToCST(log.changed_at),
                      })) || []
                    }
                  />
                </div>
              </div>

              <Divider />

              {/* 🔹 Notification Logs Section */}
              <div className="mt-0">
                <Typography
                  variant="subtitle1"
                  color="primary"
                  sx={{ mb: 1, fontWeight: 600 }}
                >
                  Notification Logs
                </Typography>
                <div className="max-h-64 overflow-y-auto">
                  <LogsList
                    logs={
                      notificationLogs?.map((log) => ({
                        username: toProperCase(log.receiver_info?.username) || "N/A",
                        action: `${log.message || "Notification sent"} to ${
                          log.receiver_info?.email || "N/A"
                        } - ${toProperCase(log.email_type?.replace(/_/g, " ")) || ""}`,
                        timestamp: convertToCST(log.created_at),
                      })) || []
                    }
                  />
                </div>
              </div>
            </div>

            {/* 🔹 Logs Section */}
            {/* <div className="mt-4">
              <Typography
                variant="subtitle1"
                // color="primary"
                sx={{ mb: 1, fontWeight: 600 }}
              >
                Activity Logs
              </Typography>
              <div className="max-h-[27dvh] overflow-y-auto">
                <LogsList
                  logs={
                    ticket.status_logs?.map((log) => ({
                      username: log.changed_by_username,
                      action: `Changed status from ${toProperCase(
                        log.old_status
                      )} → ${toProperCase(log.new_status)}`,
                      timestamp: convertToCST(log.changed_at),
                    })) || []
                  }
                />
              </div>
            </div> */}

            {/* Assign Section */}
            {/* <div className="mt-10 rounded-xl border border-gray-200 p-4">
              <Typography
                variant="subtitle1"
                fontWeight={600}
                color="primary"
                gutterBottom
                className="!mb-4"
              >
                {ticket.assignees?.length > 0
                  ? "Assigned Ticket"
                  : "Assign Ticket"}
              </Typography>

              {console.log(ticket.assignees, "ticket.assignees")}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <FormControl fullWidth size="small" disabled>
                  <InputLabel>Assigned By</InputLabel>
                  <Select
                    value={toProperCase(ticket.created_by?.username) || ""}
                    label="Assigned By"
                  >
                    <MenuItem
                      value={toProperCase(ticket.created_by?.username) || ""}
                    >
                      {toProperCase(ticket.created_by?.username) || "--"}
                    </MenuItem>
                  </Select>
                </FormControl>

                {ticket.assignees?.length > 0 ? (
                  <FormControl fullWidth size="small" disabled>
                    <InputLabel>Assigned To</InputLabel>
                    <Select
                      value={
                        toProperCase(ticket.assignees[0]?.assign_to_username) ||
                        ""
                      }
                      label="Assign To"
                    >
                      <MenuItem
                        value={
                          toProperCase(
                            ticket.assignees[0]?.assign_to_username
                          ) || ""
                        }
                      >
                        {toProperCase(
                          ticket.assignees[0]?.assign_to_username
                        ) || "--"}
                      </MenuItem>
                    </Select>
                  </FormControl>
                ) : (
                  <Autocomplete
                    fullWidth
                    size="small"
                    options={searchResults}
                    loading={searchLoading}
                    filterOptions={(x) => x}
                    getOptionLabel={(option) =>
                      option
                        ? `${toProperCase(option.first_name)} ${toProperCase(
                            option.last_name
                          )}`
                        : ""
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Assign To"
                        placeholder="Search team member..."
                        onChange={(e) => {
                          const value = e.target.value;
                          setSearchTerm(value);
                          if (!value.trim()) {
                            setSearchResults([]);
                            setAssignee("");
                          }
                        }}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {searchLoading && <CircularProgress size={20} />}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                    noOptionsText={
                      searchLoading
                        ? "Searching..."
                        : searchTerm.trim()
                        ? "No team members found"
                        : "Search to find team member"
                    }
                    value={
                      searchResults.find((m) => m.user_id === assignee) || null
                    }
                    onChange={(e, newValue) =>
                      setAssignee(newValue?.user_id || "")
                    }
                  />
                )}

                {ticket.assignees?.length === 0 && (
                  <div className="flex justify-end">
                    <Button
                      onClick={handleAssign}
                      variant="contained"
                      color="primary"
                      sx={{
                        textTransform: "none",
                        color: "white",
                        px: 4,
                        borderRadius: 2,
                        fontWeight: 500,
                        boxShadow: "none",
                        minHeight: 36,
                      }}
                    >
                      {loading ? (
                        <CircularProgress size={20} sx={{ color: "white" }} />
                      ) : (
                        "Assign"
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div> */}

            {/* Comments (mobile) */}
            <Box className="mt-6 rounded-xl border border-gray-200 p-4 md:hidden">
              <CommentBox ticketId={ticket.id} onAdd={fetchTicket} />
              <Divider sx={{ my: 2 }} />
              <Typography
                variant="body2"
                fontWeight={600}
                sx={{ mb: 1 }}
                className="!text-sidebar"
              >
                Previous Comments
              </Typography>
              <CommentsList comments={ticket.comments} />
            </Box>
          </Card>
        </Container>
      </Box>

      {/* Comments Sidebar (desktop) */}
      <Box
        className="hidden md:flex flex-col w-[305px] bg-white p-2.5 pr-0 border-l border-gray-200 -mt-4 -mb-4"
        sx={{
          height: "calc(100dvh - 58px)", // full viewport height
          overflowY: "hidden", // enable vertical scroll only in sidebar
          // Hide scrollbar
          "&::-webkit-scrollbar": {
            width: 0, // for Chrome, Safari
          },
          scrollbarWidth: "none", // for Firefox
          msOverflowStyle: "none", // for IE & Edge
        }}
      >
        <CommentBox ticketId={ticket.id} onAdd={fetchTicket} />
        <Divider sx={{ my: 2 }} />
        <Typography
          variant="subtitle1"
          fontWeight={600}
          sx={{ mb: 1, mt: -0.5 }}
        >
          Previous Comments
        </Typography>
        <Box
          sx={{
            overflowY: "auto",
          }}
        >
          <CommentsList comments={ticket.comments} />
        </Box>
      </Box>

      <AssignModal
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        ticket={ticket}
        assignee={assignee}
        setAssignee={setAssignee}
        handleAssign={handleAssign}
        searchResults={searchResults}
        searchLoading={searchLoading}
        setSearchTerm={setSearchTerm}
        loading={loading} // 👈 pass it
      />
    </Box>
  );
}

// ✅ Label Component
const Label = ({ title, value }) => (
  <div>
    <Typography variant="body2" sx={{ fontWeight: 600, color: "#7E858D" }}>
      {title}
    </Typography>
    <Typography variant="body2" sx={{ fontWeight: 500, color: "#2d3436" }}>
      {value || "N/A"}
    </Typography>
  </div>
);
