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
} from "@mui/material";
import { EyeIcon } from "@heroicons/react/24/outline";
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

// ✅ Reusable Comments List
const CommentsList = ({ comments }) => (
  <Box className="space-y-2">
    {comments?.length > 0 ? (
      comments.map((c, idx) => (
        <div
          key={idx}
          className="rounded-lg border border-gray-200 p-3 text-sm"
        >
          <div className="flex justify-between items-center mb-1">
            <span className="font-semibold text-brand-500">
              {toProperCase(c.username)}
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
                    ? // ? "mr-1 text-blue-600 font-medium"
                      "mr-1"
                    : "mr-1"
                }
              >
                {word}
              </span>
            ))}
          </div>
        </div>
      ))
    ) : (
      <Typography variant="body2" color="text.secondary">
        No comments yet
      </Typography>
    )}
  </Box>
);

export default function TicketView() {
  const { id } = useParams();
  const { user } = useApp();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [assignee, setAssignee] = useState("");
  const [loading, setLoading] = useState(false);

  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);

  // ✅ Fetch Ticket
  const fetchTicket = useCallback(async () => {
    try {
      const res = await createAPIEndPoint(`ticket/${id}`).fetchAll();
      setTicket(res.data);
    } catch {
      setTicket(null);
    }
  }, [id]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  // ✅ Search Team Members
  useEffect(() => {
    const search = async () => {
      if (!debouncedSearch) return setSearchResults([]);
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
  }, [debouncedSearch]);

  // ✅ Assign Ticket
  const handleAssign = async () => {
    if (!assignee) return toast.error("Please select a team member");
    try {
      setLoading(true);
      await createAPIEndPoint("assign").createWithJSONFormat({
        ticket_id: Number(id),
        assign_to: assignee,
        assign_by: user?.id,
      });
      toast.success("Ticket assigned successfully");
      fetchTicket();
    } catch (err) {
      toast.error("Failed to assign ticket");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Reusable Logs List
  const LogsList = ({ logs }) => (
    <Box className="space-y-2">
      {logs?.length > 0 ? (
        logs.map((log, idx) => (
          <div
            key={idx}
            className="rounded-lg border border-gray-200 p-3 text-sm bg-gray-50"
          >
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-gray-800">
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

  if (!ticket) {
    return (
      <Box className="absolute inset-0 flex items-center justify-center bg-green-50">
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", height: "100%", position: "relative" }}>
      {/* 🔹 Main Ticket Details */}
      <Box sx={{ flex: 1, overflowY: "auto", pr: 2 }}>
        <div className="flex justify-between items-center">
          <BackButton self="/tickets" />

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

        <Container maxWidth="1440px" sx={{ mt: 2, px: "0px !important" }}>
          <Card
            sx={{
              width: "100%",
              bgcolor: "background.paper",
              border: "1px solid #ddd",
              borderRadius: "16px",
              boxShadow: 0,
              p: 2,
              height: "calc(100dvh - 144px)",
              overflowY:"auto"
            }}
          >
            <TicketHeader ticket={ticket} onUpdate={setTicket} />

            <Divider sx={{ my: 2 }} />

            {/* Ticket Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
              <div className="sm:col-span-2 md:col-span-3">
                <Label title="Details" value={ticket.details} />
              </div>
            </div>

            {/* Attached Files */}
            {ticket.files?.length > 0 && (
              <div className="mt-4">
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Attached Files
                </Typography>
                <ul className="space-y-2">
                  {ticket.files.map((file, idx) => (
                    <li key={idx}>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-500 hover:bg-gray-50"
                      >
                        <EyeIcon className="h-[14px] w-[14px] text-gray-500" />
                        View
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 🔹 Logs Section */}
            <div className="mt-6">
              <Typography variant="subtitle2"  color="primary" sx={{ mb: 1, fontWeight: 600 }}>
                Activity Logs
              </Typography>
              <LogsList
                logs={[
                  {
                    username: "John Doe",
                    action: "Changed status from Pending → Completed",
                    timestamp: new Date().toISOString(),
                  },
                  {
                    username: "Sarah Smith",
                    action: "Assigned ticket to Ali Raza",
                    timestamp: new Date(
                      Date.now() - 1000 * 60 * 60
                    ).toISOString(),
                  },
                  {
                    username: "Admin",
                    action: "Created ticket with priority High",
                    timestamp: new Date(
                      Date.now() - 1000 * 60 * 60 * 5
                    ).toISOString(),
                  },
                ]}
              />
            </div>

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
              <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                Previous Comments
              </Typography>
              <CommentsList comments={ticket.comments} />
            </Box>
          </Card>
        </Container>
      </Box>

      {/* Comments Sidebar (desktop) */}
      <Box
        className="hidden md:flex flex-col w-[320px] bg-white p-3.5 pr-0 border-l border-gray-200 -mt-4 -mb-4"
        sx={{
          height: "calc(100vh - 58px)", // full viewport height
          overflowY: "auto", // enable vertical scroll only in sidebar
        }}
      >
        <CommentBox ticketId={ticket.id} onAdd={fetchTicket} />
        <Divider sx={{ my: 2 }} />
        <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
          Previous Comments
        </Typography>
        <CommentsList comments={ticket.comments} />
      </Box>
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
      {value || "--"}
    </Typography>
  </div>
);
