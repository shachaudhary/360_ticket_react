import React, { useEffect, useState, useCallback } from "react";
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
  ArrowUpTrayIcon,
  XMarkIcon,
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

// ✅ URL detection regex
const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[^\s]+\.[a-z]{2,}[^\s]*)/gi;

// ✅ Function to render text with clickable links
const renderCommentWithLinks = (text) => {
  if (!text) return null;

  const parts = [];
  let lastIndex = 0;
  let match;

  // Reset regex lastIndex
  urlRegex.lastIndex = 0;

  while ((match = urlRegex.exec(text)) !== null) {
    // Add text before the URL
    if (match.index > lastIndex) {
      const beforeText = text.substring(lastIndex, match.index);
      parts.push(...renderTextParts(beforeText));
    }

    // Add the URL as a link
    let url = match[0];
    let href = url;

    // Add protocol if missing
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      href = `https://${url}`;
    }

    parts.push(
      <a
        key={`link-${match.index}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()} // Prevent expand/collapse on link click
        className="text-blue-600 hover:text-blue-800 underline break-all mr-1 lowercase"
      >
        {url}
      </a>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last URL
  if (lastIndex < text.length) {
    const afterText = text.substring(lastIndex);
    parts.push(...renderTextParts(afterText));
  }

  // If no URLs found, render normally
  if (parts.length === 0) {
    return renderTextParts(text);
  }

  return parts;
};

// ✅ Function to render text parts (handles @mentions and regular text)
const renderTextParts = (text) => {
  if (!text) return null;
  
  const words = text.split(/(\s+)/); // Split but keep spaces
  return words.map((word, i) => {
    if (!word.trim()) {
      // Preserve spaces
      return <span key={i}>{word}</span>;
    }
    if (word.startsWith("@")) {
      return (
        <span
          key={i}
          className="text-blue-600 font-medium underline"
        >
          {word}
        </span>
      );
    }
    return <span key={i}>{word}</span>;
  });
};

// ✅ Reusable Comments List with expandable body & transitions
const CommentsList = ({ comments }) => {
  const [expandedMap, setExpandedMap] = useState({});

  const toggleComment = (key) => {
    setExpandedMap((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const clampStyles = {
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  };

  return (
    <Box className="space-y-2">
      {comments?.length > 0 ? (
        <AnimatePresence>
          {comments.map((c, idx) => {
            const key = c.id || idx;
            const isExpanded = !!expandedMap[key];

            return (
              <motion.div
                key={key} // 🔑 use stable id if available
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 0 }}
                transition={{ duration: 0.25 }}
                layout // enables smooth reordering
                onClick={() => toggleComment(key)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleComment(key);
                  }
                }}
                className="rounded-lg border bg-[#E5E7EB] hover:bg-gray-50 bg-opacity-10 p-3 text-sm cursor-pointer transition-colors"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-gray-500">
                    {toProperCase(c.username) || "N/A"}
                  </span>
                  <span className="text-xs text-gray-500">
                    {convertToCST(c.created_at)}
                  </span>
                </div>
                <div
                  className="text-gray-700 break-words transition-all duration-300"
                  style={isExpanded ? undefined : clampStyles}
                >
                  {renderCommentWithLinks(c.comment)}
                </div>
                <span className="mt-2 inline-block text-xs font-semibold text-brand-500">
                  {isExpanded ? "Show less" : "Show more"}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      ) : (
        <Typography variant="body2" color="text.secondary">
          No comments yet
        </Typography>
      )}
    </Box>
  );
};

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
        first_name: first.assign_to_first_name || first.assign_to_username?.split(" ")[0] || "",
        last_name: first.assign_to_last_name || first.assign_to_username?.split(" ").slice(1).join(" ") || "",
        email: first.assign_to_email || "",
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
        {ticket?.assignees?.length > 0 ? "Update Assignee" : "Assign Ticket"}
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
              ? option.first_name
                ? `${toProperCase(option.first_name)} ${toProperCase(
                    option.last_name || ""
                  )}`.trim()
                : toProperCase(option.username || "")
              : ""
          }
          renderOption={(props, option) => (
            <li {...props} key={option.user_id}>
              <div className="flex flex-col">
                <span className="font-medium text-gray-600">
                  {option.first_name
                    ? `${toProperCase(option.first_name)} ${toProperCase(
                        option.last_name || ""
                      )}`.trim()
                    : toProperCase(option.username || "")}
                </span>
                {option.email && (
                  <span className="text-xs text-gray-500">{option.email}</span>
                )}
              </div>
            </li>
          )}
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
            ticket?.assignees?.length > 0 ? "Update" : "Assign"
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
  const [loading, setLoading] = useState(false);

  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  
  // 🔹 Notification logs state
  const [notificationLogs, setNotificationLogs] = useState([]);

  // 🔹 File upload state
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);

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

  // 🔹 Initialize files from ticket when ticket is loaded
  useEffect(() => {
    if (ticket?.files) {
      const existingFiles = ticket.files.map((f) => ({
        name: f.name || f.url.split("/").pop(),
        url: f.url,
        isExisting: true,
      }));
      setFiles(existingFiles);
    } else {
      setFiles([]);
    }
  }, [ticket]);

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
            first_name: ticket.assignees[0]?.assign_to_first_name || ticket.assignees[0]?.assign_to_username?.split(" ")[0] || "",
            last_name: ticket.assignees[0]?.assign_to_last_name || ticket.assignees[0]?.assign_to_username?.split(" ").slice(1).join(" ") || "",
            email: ticket.assignees[0]?.assign_to_email || "",
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
          `clinic_team/search?query=${encodeURIComponent(debouncedSearch)}`
        ).fetchAll();
        setSearchResults(res?.data?.results || []);
      } catch (err) {
        console.error("Failed to search team members", err);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    };
    search();
  }, [debouncedSearch, ticket]);

  // ✅ Search Team Members - Fetch current assignee when modal opens
  useEffect(() => {
    if (assignModalOpen && !debouncedSearch && ticket?.assignees?.length > 0) {
      (async () => {
        setSearchLoading(true);
        try {
          const currentAssignee = ticket.assignees[0];
          const username = currentAssignee?.assign_to_username || "";
          
          if (username) {
            const res = await createAPIEndPointAuth(
              `clinic_team/search?query=${encodeURIComponent(username)}`
            ).fetchAll();
            
            // Include current assignee in results if not already present
            const results = res?.data?.results || [];
            const currentAssigneeObj = {
              user_id: currentAssignee.assign_to,
              first_name: currentAssignee.assign_to_first_name || username.split(" ")[0] || "",
              last_name: currentAssignee.assign_to_last_name || username.split(" ").slice(1).join(" ") || "",
              email: currentAssignee.assign_to_email || "",
            };
            
            // Check if current assignee is already in results
            const exists = results.some(r => r.user_id === currentAssigneeObj.user_id);
            setSearchResults(exists ? results : [currentAssigneeObj, ...results]);
          } else {
            setSearchResults([]);
          }
        } catch (err) {
          console.error("Failed to fetch team", err);
          setSearchResults([]);
        } finally {
          setSearchLoading(false);
        }
      })();
    }
  }, [assignModalOpen, debouncedSearch, ticket]);

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

  // 🔹 Handle file upload
  const handleFileUpload = async () => {
    const newFiles = files.filter((f) => !f.isExisting);
    if (newFiles.length === 0) {
      toast.error("Please select files to upload");
      return;
    }

    try {
      setUploadingFiles(true);
      const formData = new FormData();
      formData.append("ticket_id", id); // Add ticket_id to FormData
      newFiles.forEach((file) => {
        formData.append("files", file.file || file);
      });

      await createAPIEndPoint(`ticket/${id}`).patch(formData);
      toast.success("Files uploaded successfully");
      fetchTicket(); // Refresh ticket to get updated files
      // Clear new files from state after successful upload
      setFiles((prev) => prev.filter((f) => f.isExisting));
    } catch (err) {
      console.error("Failed to upload files", err);
      toast.error("Failed to upload files");
    } finally {
      setUploadingFiles(false);
    }
  };

  // 🔹 Handle file selection
  const handleFileSelect = (selectedFiles) => {
    const newFiles = Array.from(selectedFiles).map((file) => ({
      name: file.name,
      file: file,
      isExisting: false,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  };

  // 🔹 Remove file from list
  const handleRemoveFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
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
            {/* Assigned To or Assign Ticket Button */}
            {ticket.assignees?.length > 0 ? (
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
            ) : (
              <Button
                variant="contained"
                size="small"
                startIcon={<UserPlusIcon className="h-4 w-4" />}
                onClick={() => {
                  setAssignee(null);
                  setAssignModalOpen(true);
                }}
                sx={{ borderRadius: 1.25, mr: "auto" }}
                className="!bg-brand-500 hover:!bg-brand-600 !text-white !px-3 !py-1.5 !shadow-none"
              >
                Assign Ticket
              </Button>
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
              
              {/* Contact Form Info */}
              {ticket.contact_form_info?.name && (
                <Label
                  title="Contact Name"
                  value={toProperCase(ticket.contact_form_info.name)}
                />
              )}
              {ticket.contact_form_info?.phone && (
                <Label
                  title="Contact Phone"
                  value={ticket.contact_form_info.phone}
                />
              )}
              {ticket.contact_form_info?.email && (
                <Label
                  title="Contact Email"
                  value={ticket.contact_form_info.email}
                />
              )}
              
              <div className="sm:col-span-2 md:col-span-3">
                <Label title="Message" value={ticket.details} />
              </div>
            </div>

            {/* Attached Files Section */}
            <div className="mt-4 border border-gray-200 rounded-lg py-2.5 px-3.5">
              <div className="flex items-center justify-between mb-1">
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Attached Files
                </Typography>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    id="fileUploadTicket"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.currentTarget.files && e.currentTarget.files.length > 0) {
                        handleFileSelect(e.currentTarget.files);
                      }
                    }}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => document.getElementById("fileUploadTicket")?.click()}
                    sx={{ px:1.5 }}
                    // sx={{
                    //   textTransform: "none",
                    //   borderRadius: 1.25,
                    //   borderColor: "#824EF2",
                    //   color: "#824EF2",
                    //   "&:hover": {
                    //     borderColor: "#824EF2",
                    //     backgroundColor: "#F3F4F6",
                    //   },
                    // }}
                  >
                    <ArrowUpTrayIcon className="h-4 w-4 mr-1" />
                    Upload
                  </Button>
                </div>
              </div>

              {/* Existing Files Display */}
              {files.filter((f) => f.isExisting).length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
                  {files
                    .filter((f) => f.isExisting)
                    .map((file, idx) => {
                      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(
                        file.url
                      );
                      const fileName = file.name || file.url.split("/").pop();

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
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No files yet
                </Typography>
              )}

              {/* File Upload Area - Commented out for now */}
              {/* <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleFileSelect(e.dataTransfer.files);
                  }
                }}
                className={`min-h-32 relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all ${
                  dragActive
                    ? "border-brand-500 bg-purple-50 scale-[1.01]"
                    : "border-[#D1D5DB] bg-[#FFF]"
                }`}
              >
                <input
                  type="file"
                  id="fileUploadTicket"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.currentTarget.files && e.currentTarget.files.length > 0) {
                      handleFileSelect(e.currentTarget.files);
                    }
                  }}
                />
                <label
                  htmlFor="fileUploadTicket"
                  className="cursor-pointer flex flex-col items-center text-sm font-medium text-gray-600"
                >
                  <ArrowUpTrayIcon
                    className={`h-8 w-8 mb-2 transition-colors ${
                      dragActive || files.filter((f) => !f.isExisting).length > 0
                        ? "text-brand-500"
                        : "text-gray-400"
                    }`}
                  />
                  <span className="block">Drag & drop files here</span>
                  <span className="text-gray-400">or click to upload</span>
                </label>
              </div> */}

              {/* Preview New Files */}
              {files.filter((f) => !f.isExisting).length > 0 && (
                <div className="mt-4">
                  <Typography variant="caption" sx={{ mb: 1, fontWeight: 600, color: "#7E858D" }}>
                    New Files to Upload
                  </Typography>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {files
                      .map((file, originalIndex) => {
                        if (file.isExisting) return null;
                        
                        const fileObj = file.file || file;
                        const isImage = fileObj.type?.startsWith("image/");
                        const fileName = file.name || fileObj.name;

                        return (
                          <div
                            key={originalIndex}
                            className="relative flex flex-col items-center border rounded-lg p-2 bg-gray-50"
                          >
                            {/* Show preview if image */}
                            {isImage ? (
                              <img
                                src={URL.createObjectURL(fileObj)}
                                alt={fileName}
                                className="h-20 w-full object-cover rounded"
                              />
                            ) : (
                              <div className="h-20 w-full flex items-center justify-center bg-gray-100 text-xs text-gray-600 rounded">
                                {fileName.endsWith(".pdf") ? "📄 PDF File" : fileName}
                              </div>
                            )}

                            {/* Filename */}
                            <Typography
                              variant="caption"
                              className="!mt-1 truncate w-full text-center text-xs"
                            >
                              {fileName}
                            </Typography>

                            {/* Remove button */}
                            <Button
                              size="small"
                              onClick={() => handleRemoveFile(originalIndex)}
                              sx={{
                                position: "absolute",
                                top: -8,
                                right: -8,
                                minWidth: 0,
                                width: 24,
                                height: 24,
                                borderRadius: "50%",
                                p: 0,
                                backgroundColor: "#ef4444",
                                color: "white",
                                "&:hover": {
                                  backgroundColor: "#dc2626",
                                },
                              }}
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })
                      .filter(Boolean)}
                  </div>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleFileUpload}
                    disabled={uploadingFiles}
                    sx={{
                      mt: 2,
                      textTransform: "none",
                      borderRadius: 1.25,
                      boxShadow: "none",
                    }}
                  >
                    {uploadingFiles ? (
                      <>
                        <CircularProgress size={16} sx={{ color: "white", mr: 1 }} />
                        Uploading...
                      </>
                    ) : (
                      "Upload Files"
                    )}
                  </Button>
                </div>
              )}
            </div>

            <Divider  sx={{ mt: 2 }}/>

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
