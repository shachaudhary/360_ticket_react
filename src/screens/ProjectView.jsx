import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Card,
  Typography,
  Divider,
  Button,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  Tabs,
  Tab,
  Paper,
} from "@mui/material";
import {
  PencilSquareIcon,
  PlusIcon,
  UserPlusIcon,
  ArrowsRightLeftIcon,
  Squares2X2Icon,
  ViewColumnsIcon,
  ChartBarIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { useParams, useNavigate } from "react-router-dom";
import { createAPIEndPoint } from "../config/api/api";
import { createAPIEndPointAuth } from "../config/api/apiAuth";
import BackButton from "../components/BackButton";
import { useApp } from "../state/AppContext";
import StatusBadge from "../components/StatusBadge";
import DateWithTooltip from "../components/DateWithTooltip";
import DraggableTicketCard from "../components/DraggableTicketCard";
import { convertToCST } from "../utils";
import { toProperCase } from "../utils/formatting";
import toast from "react-hot-toast";

export default function ProjectView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useApp();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignees, setAssignees] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [savingAssignees, setSavingAssignees] = useState(false);
  const [viewMode, setViewMode] = useState("board"); // 'board', 'list', 'timeline'
  const [activeTab, setActiveTab] = useState(0);
  const [draggedOverColumn, setDraggedOverColumn] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [optimisticTickets, setOptimisticTickets] = useState(null); // For optimistic updates
  const [draggedTicketId, setDraggedTicketId] = useState(null);
  const [updatingTicketId, setUpdatingTicketId] = useState(null); // Track which ticket is being updated

  const fetchProject = useCallback(async () => {
    try {
      setLoading(true);
      const res = await createAPIEndPoint(`project/${id}`).fetchAll();
      setProject(res.data);
    } catch (err) {
      console.error("Failed to fetch project", err);
      toast.error("Failed to load project");
      setProject(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  // Initialize assignees when modal opens
  useEffect(() => {
    if (assignModalOpen && project) {
      // API returns team_members, but support both for backward compatibility
      const teamMembers = project.team_members || project.assignees || [];
      const mappedAssignees = teamMembers.map((member) => ({
        user_id: member.user_id || member.id,
        first_name: member.first_name || member.username?.split(" ")[0] || "",
        last_name: member.last_name || member.username?.split(" ").slice(1).join(" ") || "",
        username: member.username || member.name || "",
      }));
      setAssignees(mappedAssignees);
      setSearchTerm("");
    } else if (assignModalOpen) {
      setAssignees([]);
      setSearchTerm("");
    }
  }, [assignModalOpen, project]);

  useEffect(() => {
    if (!searchTerm) {
      setSearchResults([]);
      return;
    }

    const search = async () => {
      setSearchLoading(true);
      try {
        const res = await createAPIEndPointAuth(
          `clinic_team/search?query=${encodeURIComponent(searchTerm)}`
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
  }, [searchTerm]);

  const handleAssign = async () => {
    if (assignees.length === 0) return toast.error("Please select at least one team member");
    try {
      setSavingAssignees(true);
      await createAPIEndPoint(`project/${id}/assign`).createWithJSONFormat({
        user_ids: assignees.map((a) => a.user_id || a.id),
        assigned_by: user?.id,
        replace: false, // Add to existing, don't replace
      });
      toast.success("Team members assigned successfully");
      fetchProject();
      setAssignModalOpen(false);
      setAssignees([]);
    } catch (err) {
      console.error("Failed to assign team members", err);
      toast.error("Failed to assign team members");
    } finally {
      setSavingAssignees(false);
    }
  };

  // Handle drag start - optimistic update
  const handleDragStart = (ticketId, currentStatus) => {
    setDraggedTicketId(ticketId);
    // Create optimistic update immediately with current status
    const currentTickets = project?.tickets || [];
    const ticketToMove = currentTickets.find((t) => t.id === ticketId);
    if (ticketToMove) {
      setOptimisticTickets({
        ...ticketToMove,
        status: currentStatus,
      });
    }
  };

  // Handle drag and drop for ticket status updates
  const handleDragOver = (e, targetStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDraggedOverColumn(targetStatus);

    // Optimistically update ticket status when dragging over a column
    if (draggedTicketId) {
      const statusMap = {
        "Pending": "pending",
        "In Progress": "in_progress",
        "Completed": "completed",
      };
      const targetStatusApi = statusMap[targetStatus] || targetStatus.toLowerCase().replace(" ", "_");

      // Get the original ticket
      const currentTickets = project?.tickets || [];
      const originalTicket = currentTickets.find((t) => t.id === draggedTicketId);

      if (originalTicket) {
        // Update optimistic ticket status to target
        setOptimisticTickets({
          ...originalTicket,
          status: targetStatusApi,
        });
      }
    }
  };

  const handleDragLeave = (e) => {
    // Only clear if we're actually leaving the drop zone (not entering a child)
    const relatedTarget = e.relatedTarget;
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setDraggedOverColumn(null);
    }
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    setDraggedOverColumn(null);

    try {
      const data = JSON.parse(e.dataTransfer.getData("text/plain"));
      const { ticketId, currentStatus } = data;

      // Map display status to API status format
      const statusMap = {
        "Pending": "pending",
        "In Progress": "in_progress",
        "Completed": "completed",
      };

      const targetStatusApi = statusMap[targetStatus] || targetStatus.toLowerCase().replace(" ", "_");

      // Normalize current status for comparison
      let currentStatusApi = currentStatus?.toLowerCase() || "pending";
      if (currentStatusApi === "in progress") {
        currentStatusApi = "in_progress";
      }
      if (currentStatusApi === "open") {
        currentStatusApi = "pending";
      }
      if (currentStatusApi === "closed") {
        currentStatusApi = "completed";
      }

      // Don't update if status hasn't changed
      if (targetStatusApi === currentStatusApi) {
        setOptimisticTickets(null);
        setDraggedTicketId(null);
        setUpdatingTicketId(null);
        return;
      }

      // Show loader immediately
      setUpdatingTicketId(ticketId);
      setUpdatingStatus(true);

      // Update API in background (non-blocking)
      createAPIEndPoint(`ticket/${ticketId}`).patch({
        status: targetStatusApi,
        updated_by: user?.id,
      })
        .then(() => {
          toast.success(`Ticket status updated to ${targetStatus}`);
          fetchProject(); // Refresh project data to get updated tickets
        })
        .catch((err) => {
          console.error("Failed to update ticket status", err);
          toast.error("Failed to update ticket status");
          // Revert optimistic update on error
          fetchProject();
        })
        .finally(() => {
          setUpdatingStatus(false);
          setOptimisticTickets(null);
          setDraggedTicketId(null);
          setUpdatingTicketId(null);
        });
    } catch (err) {
      console.error("Failed to parse drag data", err);
      setOptimisticTickets(null);
      setDraggedTicketId(null);
      setUpdatingTicketId(null);
    }
  };

  if (loading) {
    return (
      <Box className="absolute inset-0 flex items-center justify-center bg-purple-50">
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (!project) {
    return (
      <Box className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-50">
        <Typography variant="h6" fontWeight={600} color="text.secondary">
          Project not found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          The project may have been deleted or the link is invalid.
        </Typography>
        <BackButton textBtn self={"/projects"} />
      </Box>
    );
  }

  const displayProject = project;

  const tickets = displayProject.tickets || [];
  const totalTickets = tickets.length;
  const completedTickets = tickets.filter(
    (t) => t.status === "completed"
  ).length;
  const progress = totalTickets > 0 ? Math.round((completedTickets / totalTickets) * 100) : 0;
  const projectColor = displayProject.color || "#5F27CD";

  // Group tickets by status for Kanban board (with optimistic updates)
  const getTicketsByStatus = () => {
    const statuses = ["Pending", "In Progress", "Completed"];
    const grouped = {};

    // Use optimistic tickets if available
    let ticketsToUse = tickets;
    if (optimisticTickets && draggedTicketId) {
      ticketsToUse = tickets.map((t) =>
        t.id === draggedTicketId ? optimisticTickets : t
      );
    }

    statuses.forEach((status) => {
      grouped[status] = ticketsToUse.filter((t) => {
        const tStatus = t.status || "Pending";
        if (status === "Pending") {
          return tStatus.toLowerCase() === "pending" || tStatus.toLowerCase() === "open";
        } else if (status === "In Progress") {
          return tStatus.toLowerCase() === "in progress" || tStatus.toLowerCase() === "in_progress";
        } else if (status === "Completed") {
          return tStatus.toLowerCase() === "completed" || tStatus.toLowerCase() === "closed";
        }
        return false;
      });
    });
    return grouped;
  };

  return (
    <div className="!space-y-6 min-h-screen">
      {/* Header */}
      <div className="!flex !items-center !justify-between !mb-4">
        <BackButton self="/projects" />
        <div className="!flex !items-center !gap-2">
          {(displayProject.team_members || displayProject.assignees)?.length > 0 ? (
            <Tooltip title="Manage Team Members" arrow>
              <Box
                onClick={() => setAssignModalOpen(true)}
                className="!flex !items-center !gap-1.5 !text-brand-500 !border !border-brand-500 !bg-purple-50 hover:!bg-purple-100 !py-2 !px-4 !rounded-lg !cursor-pointer !transition-all !text-sm !font-medium !shadow-sm"
              >
                <UserPlusIcon className="!h-4 !w-4" />
                <span>
                  Team Members ({(displayProject.team_members || displayProject.assignees || []).length})
                </span>
                <ArrowsRightLeftIcon className="!h-4 !w-4" />
              </Box>
            </Tooltip>
          ) : (
            <Button
              variant="contained"
              size="small"
              startIcon={<UserPlusIcon className="!h-4 !w-4" />}
              onClick={() => setAssignModalOpen(true)}
              className="!bg-brand-500 hover:!bg-brand-600 !shadow-sm"
              sx={{ textTransform: "none" }}
            >
              Assign Team Members
            </Button>
          )}
          <Button
            variant="outlined"
            size="small"
            startIcon={<PencilSquareIcon className="!h-4 !w-4" />}
            onClick={() => navigate(`/projects/${id}/edit`)}
            sx={{ borderRadius: 1.25 }}
            className="min-h-[37.6px] !border !border-[#E5E7EB] hover:!border-[#ddd]  !text-gray-500 hover:!bg-gray-50 focus:!ring-gray-500 !px-1 !py-1.5"
          >
            Edit
          </Button>
        </div>
      </div>

      {/* Project Header Card */}
      <Card className="!p-6 !border-l-4 !shadow-md !bg-white !rounded-lg" style={{ borderLeftColor: projectColor }}>
        <div className="!flex !flex-col md:!flex-row !justify-between !items-start md:!items-center !gap-4 !mb-6">
          <div className="!flex-1">
            <div className="!flex !items-center !gap-3 !mb-4">
              <Box
                className="!w-6 !h-6 !rounded-full !shrink-0 !shadow-sm"
                style={{ backgroundColor: projectColor }}
              />
              <Typography variant="h4" className="!font-semibold !text-gray-800 !text-2xl">
                {displayProject.name}
              </Typography>
            </div>
            <div className="!flex !items-center !gap-2 !flex-wrap !mb-4">
              <StatusBadge status={displayProject.status || "active"} isInside />
              <StatusBadge status={displayProject.priority || "low"} isInside />
              {displayProject.tags && displayProject.tags.length > 0 && (
                <div className="!flex !gap-1.5 !flex-wrap">
                  {displayProject.tags.map((tag, idx) => {
                    // Handle both string tags and tag objects from API
                    const tagName = typeof tag === 'string' ? tag : (tag.tag_name || tag.name || tag);
                    const tagId = typeof tag === 'object' ? tag.id : idx;
                    return (
                      <Chip
                        key={tagId}
                        label={tagName}
                        size="small"
                        className="!bg-gray-100 !text-gray-700 !border !border-gray-200"
                      />
                    );
                  })}
                </div>
              )}
            </div>
            {displayProject.description && (
              <Typography variant="body2" className="!text-gray-600 !leading-relaxed !text-base">
                {displayProject.description}
              </Typography>
            )}
          </div>
        </div>

        <Divider className="!my-6" />

        {/* Stats Grid */}
        <div className="!grid !grid-cols-2 md:!grid-cols-4 !gap-4 !mb-6">
          <div className="!bg-amber-50 !p-4 !rounded-lg !border !border-amber-200 !shadow-sm hover:!shadow-md !transition-shadow">
            <Typography variant="caption" className="!text-amber-600 !block !mb-2 !text-xs !font-medium">
              Total Tickets
            </Typography>
            <Typography variant="h5" className="!font-semibold !text-amber-700 !text-2xl">
              {totalTickets}
            </Typography>
          </div>
          <div className="!bg-blue-50 !p-4 !rounded-lg !border !border-blue-200 !shadow-sm hover:!shadow-md !transition-shadow">
            <Typography variant="caption" className="!text-blue-600 !block !mb-2 !text-xs !font-medium">
              In Progress
            </Typography>
            <Typography variant="h5" className="!font-semibold !text-blue-700 !text-2xl">
              {tickets.filter((t) => t.status === "in-progress" || t.status === "in_progress").length}
            </Typography>
          </div>
          <div className="!bg-green-50 !p-4 !rounded-lg !border !border-green-200 !shadow-sm hover:!shadow-md !transition-shadow">
            <Typography variant="caption" className="!text-green-600 !block !mb-2 !text-xs !font-medium">
              Completed
            </Typography>
            <Typography variant="h5" className="!font-semibold !text-green-700 !text-2xl">
              {completedTickets}
            </Typography>
          </div>
          <div className="!bg-purple-50 !p-4 !rounded-lg !border !border-purple-200 !shadow-sm hover:!shadow-md !transition-shadow">
            <Typography variant="caption" className="!text-purple-600 !block !mb-2 !text-xs !font-medium">
              Progress
            </Typography>
            <Typography variant="h5" className="!font-semibold !text-purple-700 !text-2xl">
              {progress}%
            </Typography>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="!mb-6">
          <div className="!flex !justify-between !items-center !mb-3">
            <Typography variant="body2" className="!font-semibold !text-gray-700 !text-sm">
              Overall Progress
            </Typography>
            <Typography variant="body2" className="!text-gray-600 !text-sm">
              {completedTickets} of {totalTickets} completed
            </Typography>
          </div>
          <div className="!w-full !bg-gray-200 !rounded-full !h-3 !overflow-hidden !shadow-inner">
            <div
              className="!h-3 !rounded-full !transition-all !duration-500"
              style={{
                width: `${progress}%`,
                backgroundColor: projectColor,
              }}
            />
          </div>
        </div>

        <Divider className="!my-6" />

        {/* Project Details */}
        <div className="!grid !grid-cols-1 md:!grid-cols-2 lg:!grid-cols-4 !gap-6">
          <div>
            <Typography variant="caption" className="!text-gray-500 !block !mb-2 !text-xs !font-medium">
              Created At
            </Typography>
            <Typography variant="body2" className="!font-medium !text-gray-800 !text-sm">
              {convertToCST(displayProject.created_at)}
            </Typography>
          </div>
          {displayProject.due_date && (
            <div>
              <Typography variant="caption" className="!text-gray-500 !block !mb-2 !text-xs !font-medium">
                Due Date
              </Typography>
              <DateWithTooltip date={displayProject.due_date} />
            </div>
          )}
          <div>
            <Typography variant="caption" className="!text-gray-500 !block !mb-2 !text-xs !font-medium">
              Created By
            </Typography>
            <Typography variant="body2" className="!font-medium !text-gray-800 !text-sm">
              {toProperCase(displayProject.created_by?.username || "N/A")}
            </Typography>
          </div>
          <div>
            <Typography variant="caption" className="!text-gray-500 !block !mb-2 !text-xs !font-medium">
              Team Members
            </Typography>
            {(displayProject.team_members || displayProject.assignees)?.length > 0 ? (
              <div className="!flex !flex-wrap !gap-1.5">
                {(displayProject.team_members || displayProject.assignees || []).map((member) => (
                  <Chip
                    key={member.user_id || member.id}
                    label={toProperCase(member.username || member.name || "N/A")}
                    size="small"
                    className="!bg-purple-50 !border !border-purple-200 !text-gray-700"
                  />
                ))}
              </div>
            ) : (
              <Typography variant="body2" className="!text-gray-400 !text-sm !italic">
                No team members assigned
              </Typography>
            )}
          </div>
        </div>
      </Card>

      {/* Tickets Section with View Modes */}
      <Card className="!p-6 !shadow-md !bg-white !rounded-lg">
        <div className="!flex !flex-col sm:!flex-row !justify-between !items-start sm:!items-center !gap-4 !mb-6 !pb-4 !border-b !border-gray-200">
          <div>
            <Typography variant="h6" className="!font-semibold !text-gray-800 !mb-1 !text-lg">
              Project Tickets
            </Typography>
            <Typography variant="body2" className="!text-gray-500 !text-sm">
              {totalTickets} {totalTickets === 1 ? "ticket" : "tickets"} in this project
            </Typography>
          </div>
          <div className="!flex !items-center !gap-2">
            <div className="!flex !items-center !gap-1 !border !border-gray-200 !rounded-lg !py-0.5 !px-1 !bg-gray-50">
              <Tooltip title="Board View">
                <IconButton
                  size="small"
                  onClick={() => setViewMode("board")}
                  className={
                    viewMode === "board"
                      ? "!bg-brand-500 !text-white hover:!bg-brand-600"
                      : "!text-gray-500 hover:!bg-gray-100"
                  }
                >
                  <Squares2X2Icon className="!h-4 !w-4" />
                </IconButton>
              </Tooltip>
              <Tooltip title="List View">
                <IconButton
                  size="small"
                  onClick={() => setViewMode("list")}
                  className={
                    viewMode === "list"
                      ? "!bg-brand-500 !text-white hover:!bg-brand-600"
                      : "!text-gray-500 hover:!bg-gray-100"
                  }
                >
                  <ViewColumnsIcon className="!h-4 !w-4" />
                </IconButton>
              </Tooltip>
            </div>
            <Button
              variant="contained"
              size="small"
              startIcon={<PlusIcon className="!h-4 !w-4" />}
              onClick={() => navigate(`/projects/${id}/tickets/new`)}
              className="!bg-brand-500 hover:!bg-brand-600 !shadow-sm"
              sx={{ textTransform: "none" }}
            >
              Add Ticket
            </Button>
          </div>
        </div>

        {tickets.length > 0 ? (
          viewMode === "board" ? (
            // Kanban Board View
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(getTicketsByStatus()).map(([status, statusTickets]) => {
                const statusColors = {
                  "Pending": "bg-yellow-50 border-yellow-200",
                  "In Progress": "bg-blue-50 border-blue-200",
                  "Completed": "bg-green-50 border-green-200",
                };
                const statusBorderColors = {
                  "Pending": "!border-yellow-400",
                  "In Progress": "!border-blue-500",
                  "Completed": "!border-green-500",
                };
                const isDraggedOver = draggedOverColumn === status;
                return (
                  <Paper
                    key={status}
                    onDragOver={(e) => handleDragOver(e, status)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, status)}
                    className={`!p-4 !border-2 !rounded-lg !shadow-sm !transition-all ${isDraggedOver
                        ? `${statusColors[status]} ${statusBorderColors[status]} !border-4 !bg-opacity-90 !shadow-md`
                        : `${statusColors[status] || "!bg-gray-50 !border-gray-200"}`
                      }`}
                  >
                    <div className="!flex !items-center !justify-between !mb-4 !pb-3 !border-b !border-gray-200">
                      <Typography variant="subtitle1" className="!font-semibold !text-gray-800 !text-sm">
                        {status}
                      </Typography>
                      <Chip
                        label={statusTickets.length}
                        size="small"
                        className="!bg-white !font-semibold !text-xs"
                      />
                    </div>
                    <div className="!space-y-3 !min-h-[300px]">
                      {statusTickets.map((ticket) => (
                        <DraggableTicketCard
                          key={ticket.id}
                          ticket={ticket}
                          onStatusChange={fetchProject}
                          onDragStart={handleDragStart}
                          isDragging={draggedTicketId === ticket.id}
                          isUpdating={updatingTicketId === ticket.id}
                        />
                      ))}
                      {statusTickets.length === 0 && (
                        <div className={`!flex !items-center !justify-center !py-12 !rounded-lg !border-2 !border-dashed !transition-all ${isDraggedOver
                            ? `${statusBorderColors[status]} !bg-opacity-20 ${statusColors[status]}`
                            : "!border-gray-200 !bg-transparent"
                          }`}>
                          <Typography variant="caption" className={`!text-xs ${isDraggedOver ? "!font-medium" : "!text-gray-400"
                            }`}>
                            {isDraggedOver ? "Drop ticket here" : "No tickets"}
                          </Typography>
                        </div>
                      )}
                    </div>
                  </Paper>
                );
              })}
            </div>
          ) : (
            // List View - Table Style
            <div className="!overflow-hidden !rounded-lg !border !border-[#E5E7EB] !shadow-sm">
              <div className="!overflow-auto">
                <table className="!min-w-full !divide-y !divide-gray-100">
                  <thead className="!bg-gray-50 !sticky !top-0 !z-10">
                    <tr className="!text-left !text-xs !text-gray-500 !font-semibold">
                      <th className="!px-4 !py-3 !border-b !border-r !border-[#E5E7EB]">#</th>
                      <th className="!px-4 !py-3 !border-b !border-r !border-[#E5E7EB]">Title</th>
                      <th className="!px-4 !py-3 !border-b !border-r !border-[#E5E7EB]">Status</th>
                      <th className="!px-4 !py-3 !border-b !border-r !border-[#E5E7EB]">Priority</th>
                      <th className="!px-4 !py-3 !border-b !border-r !border-[#E5E7EB]">Category</th>
                      <th className="!px-4 !py-3 !border-b !border-r !border-[#E5E7EB]">Due Date</th>
                      <th className="!px-4 !py-3 !border-b !border-[#E5E7EB]">Assigned To</th>
                    </tr>
                  </thead>
                  <tbody className="!divide-y !divide-gray-100 !bg-white !text-sm">
                    {tickets.map((ticket, idx) => (
                      <tr
                        key={ticket.id}
                        className="hover:!bg-gray-50 !cursor-pointer !transition-colors"
                        onClick={() => navigate(`/tickets/${ticket.id}`)}
                      >
                        <td className="!px-4 !py-3 !border-b !border-[#E5E7EB] !text-gray-600">
                          {idx + 1}
                        </td>
                        <td className="!px-4 !py-3 !border-b !border-[#E5E7EB] !font-medium !text-gray-800 !max-w-64">
                          <div>
                            <Typography className="!font-semibold !text-sm">
                              {toProperCase(ticket.title)}
                            </Typography>
                            {ticket.details && (
                              <Typography variant="caption" className="!text-gray-500 !line-clamp-1 !text-xs">
                                {ticket.details}
                              </Typography>
                            )}
                          </div>
                        </td>
                        <td className="!px-4 !py-3 !border-b !border-[#E5E7EB]">
                          <StatusBadge status={ticket.status} isInside />
                        </td>
                        <td className="!px-4 !py-3 !border-b !border-[#E5E7EB]">
                          <StatusBadge status={ticket.priority} isInside />
                        </td>
                        <td className="!px-4 !py-3 !border-b !border-[#E5E7EB]">
                          {ticket.category ? (
                            <Chip
                              label={toProperCase(ticket.category.name)}
                              size="small"
                              className="!text-xs !bg-gray-100"
                            />
                          ) : (
                            <span className="!text-gray-400">-</span>
                          )}
                        </td>
                        <td className="!px-4 !py-3 !border-b !border-[#E5E7EB] !text-sm !text-gray-600">
                          {ticket.due_date ? (
                            <DateWithTooltip date={ticket.due_date} />
                          ) : (
                            <span className="!text-gray-400">-</span>
                          )}
                        </td>
                        <td className="!px-4 !py-3 !border-b !border-[#E5E7EB] !text-sm !text-gray-600">
                          {ticket.assignees?.length > 0 ? (
                            toProperCase(ticket.assignees[0]?.assign_to_username || "N/A")
                          ) : (
                            <span className="!text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : (
          <Box className="!text-center !py-12 !border-2 !border-dashed !border-gray-200 !rounded-lg !bg-gray-50">
            <Typography variant="body1" className="!text-gray-500 !mb-2 !font-medium !text-base">
              No tickets in this project yet
            </Typography>
            <Typography variant="body2" className="!text-gray-400 !mb-4 !text-sm">
              Get started by adding your first ticket
            </Typography>
            <Button
              variant="contained"
              startIcon={<PlusIcon className="!h-5 !w-5" />}
              onClick={() => navigate(`/projects/${id}/tickets/new`)}
              className="!bg-brand-500 hover:!bg-brand-600 !shadow-sm"
              sx={{ textTransform: "none" }}
            >
              Add First Ticket
            </Button>
          </Box>
        )}
      </Card>

      {/* Assign Team Members Modal */}
      <Dialog
        open={assignModalOpen}
        onClose={() => {
          setAssignModalOpen(false);
          setAssignees([]);
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle className="!text-lg md:text-xl !font-semibold !text-sidebar">
          {(displayProject.team_members || displayProject.assignees)?.length > 0 ? "Manage Team Members" : "Assign Team Members"}
        </DialogTitle>
        <DialogContent dividers sx={{ px: 2 }}>
          <Autocomplete
            multiple
            size="small"
            fullWidth
            options={searchResults}
            value={assignees}
            onChange={(e, newValue) => setAssignees(newValue)}
            onInputChange={(e, newInputValue) => setSearchTerm(newInputValue)}
            isOptionEqualToValue={(option, value) =>
              option.user_id === value?.user_id || option.id === value?.id
            }
            getOptionLabel={(option) =>
              option.first_name && option.last_name
                ? `${toProperCase(option.first_name)} ${toProperCase(option.last_name)}`
                : toProperCase(option.username || "")
            }
            loading={searchLoading}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Assign Team Members"
                placeholder="Search team members..."
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {searchLoading ? <CircularProgress size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={option.user_id || option.id}
                  label={
                    option.first_name && option.last_name
                      ? `${toProperCase(option.first_name)} ${toProperCase(option.last_name)}`
                      : toProperCase(option.username || "")
                  }
                  size="small"
                  className="!bg-purple-50 !border !border-purple-200 !text-gray-700"
                />
              ))
            }
            noOptionsText={
              searchLoading
                ? "Searching..."
                : searchTerm
                  ? "No team members found"
                  : "Search to find team members"
            }
          />
          {(displayProject.team_members || displayProject.assignees)?.length > 0 && (
            <Box className="!mt-4 !pt-4 !border-t !border-gray-200">
              <Typography variant="caption" className="!text-gray-600 !block !mb-2 !font-medium">
                Current Team Members ({(displayProject.team_members || displayProject.assignees || []).length}):
              </Typography>
              <div className="!flex !flex-wrap !gap-2">
                {(displayProject.team_members || displayProject.assignees || []).map((member) => (
                  <Chip
                    key={member.user_id || member.id}
                    label={toProperCase(member.username || member.name || "N/A")}
                    size="small"
                    className="!bg-gray-100 !text-gray-700"
                  />
                ))}
              </div>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.5 }}>
          <Button
            onClick={() => {
              setAssignModalOpen(false);
              setAssignees([]);
            }}
            disabled={savingAssignees}
            sx={{
              textTransform: "none",
              borderColor: "#E5E7EB",
              color: "#6B7270",
              "&:hover": {
                borderColor: "#E5E7EB",
                backgroundColor: "#Fafafa",
              },
              "&:disabled": {
                borderColor: "#E5E7EB",
                color: "#9CA3AF",
                opacity: 0.6,
                cursor: "not-allowed",
              },
              transition: "all 0.2s ease",
            }}
            className="!px-6"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            variant="contained"
            disabled={savingAssignees}
            sx={{
              textTransform: "none",
              backgroundColor: savingAssignees ? "#F3F4F6" : "#824EF2",
              color: savingAssignees ? "#6B7280" : "white",
              "&:hover": {
                backgroundColor: savingAssignees ? "#F3F4F6" : "#6B3BC4",
              },
              "&:disabled": {
                backgroundColor: "#F3F4F6",
                color: "#6B7280",
                cursor: "not-allowed",
              },
              transition: "all 0.2s ease",
              minWidth: 100,
            }}
          >
            {savingAssignees ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress
                  size={16}
                  sx={{
                    color: "#6B7280",
                    "& .MuiCircularProgress-circle": {
                      strokeLinecap: "round",
                    },
                  }}
                />
                <span>Saving...</span>
              </Box>
            ) : (displayProject.team_members || displayProject.assignees)?.length > 0 ? (
              "Update"
            ) : (
              "Assign"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

