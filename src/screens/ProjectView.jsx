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
  const [assignee, setAssignee] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("board"); // 'board', 'list', 'timeline'
  const [activeTab, setActiveTab] = useState(0);

  // Dummy data for fallback UI
  const dummyProject = {
    id: id || 1,
    name: "Website Redesign Project",
    description: "Complete redesign of company website with modern UI/UX. This project includes frontend development, backend integration, and user testing phases.",
    status: "active",
    priority: "high",
    color: "#FF3838",
    tags: ["Design", "Frontend", "UI/UX"],
    due_date: "2024-12-31",
    created_at: "2024-01-15T10:00:00Z",
    created_by: {
      id: 1,
      username: "John Doe",
      name: "John Doe",
    },
    assignees: [
      {
        id: 1,
        user_id: 1,
        username: "Jane Smith",
        name: "Jane Smith",
        first_name: "Jane",
        last_name: "Smith",
      },
    ],
    tickets: [
      {
        id: 1,
        title: "Design Homepage Layout",
        details: "Create modern and responsive homepage design with hero section, features, and call-to-action buttons.",
        status: "completed",
        priority: "High",
        due_date: "2024-11-15",
        assignees: [
          {
            assign_to_username: "Jane Smith",
          },
        ],
        category: {
          id: 1,
          name: "Design",
        },
      },
      {
        id: 2,
        title: "Implement Responsive Navigation",
        details: "Build responsive navigation menu that works on all device sizes with mobile hamburger menu.",
        status: "in-progress",
        priority: "Medium",
        due_date: "2024-11-20",
        assignees: [
          {
            assign_to_username: "Bob Wilson",
          },
        ],
        category: {
          id: 2,
          name: "Frontend",
        },
      },
      {
        id: 3,
        title: "Setup Backend API Endpoints",
        details: "Create RESTful API endpoints for user authentication, data fetching, and form submissions.",
        status: "pending",
        priority: "High",
        due_date: "2024-11-25",
        assignees: [
          {
            assign_to_username: "Alice Johnson",
          },
        ],
        category: {
          id: 3,
          name: "Backend",
        },
      },
      {
        id: 4,
        title: "User Testing and Feedback",
        details: "Conduct user testing sessions and gather feedback for improvements.",
        status: "pending",
        priority: "Low",
        due_date: "2024-12-10",
        assignees: [
          {
            assign_to_username: "Jane Smith",
          },
        ],
        category: {
          id: 4,
          name: "Testing",
        },
      },
      {
        id: 5,
        title: "Deploy to Production",
        details: "Final deployment to production server with all optimizations and security measures.",
        status: "pending",
        priority: "High",
        due_date: "2024-12-31",
        assignees: [
          {
            assign_to_username: "Bob Wilson",
          },
        ],
        category: {
          id: 5,
          name: "DevOps",
        },
      },
    ],
  };

  const fetchProject = useCallback(async () => {
    try {
      setLoading(true);
      const res = await createAPIEndPoint(`project/${id}`).fetchAll();
      setProject(res.data);
    } catch (err) {
      console.error("Failed to fetch project", err);
      // Use dummy data on error for UI preview
      setProject(dummyProject);
      toast.error("Failed to load project");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  useEffect(() => {
    if (!searchTerm) {
      if (project?.assignees?.length > 0) {
        const current = project.assignees[0];
        setSearchResults([
          {
            user_id: current.id || current.user_id,
            first_name: current.first_name || current.username?.split(" ")[0],
            last_name: current.last_name || current.username?.split(" ").slice(1).join(" "),
          },
        ]);
      } else {
        setSearchResults([]);
      }
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
      } finally {
        setSearchLoading(false);
      }
    };
    search();
  }, [searchTerm, project]);

  const handleAssign = async () => {
    if (!assignee) return toast.error("Please select a team member");
    try {
      await createAPIEndPoint(`project/${id}`).patch({
        assignee_ids: [assignee.user_id],
        updated_by: user?.id,
      });
      toast.success("Project assigned successfully");
      fetchProject();
      setAssignModalOpen(false);
    } catch (err) {
      console.error("Failed to assign project", err);
      toast.error("Failed to assign project");
    }
  };

  if (loading) {
    return (
      <Box className="!flex !items-center !justify-center !h-96">
        <CircularProgress size={40} />
      </Box>
    );
  }

  // Use dummy data if project is null (for UI preview)
  const displayProject = project || dummyProject;

  const tickets = displayProject.tickets || [];
  const totalTickets = tickets.length;
  const completedTickets = tickets.filter(
    (t) => t.status === "completed"
  ).length;
  const progress = totalTickets > 0 ? Math.round((completedTickets / totalTickets) * 100) : 0;
  const projectColor = displayProject.color || "#5F27CD";

  // Group tickets by status for Kanban board
  const getTicketsByStatus = () => {
    const statuses = ["Pending", "In Progress", "Completed"];
    const grouped = {};
    statuses.forEach((status) => {
      grouped[status] = tickets.filter((t) => {
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
    <div className="!space-y-6 !bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="!flex !items-center !justify-between !mb-4">
        <BackButton self="/projects" />
        <div className="!flex !items-center !gap-2">
          {displayProject.assignees?.length > 0 ? (
            <Tooltip title="Change Assignee" arrow>
              <Box
                onClick={() => {
                  setAssignee(null);
                  setAssignModalOpen(true);
                }}
                className="!flex !items-center !gap-1.5 !text-brand-500 !border !border-brand-500 !bg-purple-50 hover:!bg-purple-100 !py-2 !px-4 !rounded-lg !cursor-pointer !transition-all !text-sm !font-medium !shadow-sm"
              >
                <span>
                  {toProperCase(displayProject.assignees[0]?.username || displayProject.assignees[0]?.name)}
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
              Assign Project
            </Button>
          )}
          <Button
            variant="outlined"
            size="small"
            startIcon={<PencilSquareIcon className="!h-4 !w-4" />}
            onClick={() => navigate(`/projects/${id}/edit`)}
            sx={{ textTransform: "none" }}
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
                  {displayProject.tags.map((tag, idx) => (
                    <Chip 
                      key={idx} 
                      label={tag} 
                      size="small" 
                      className="!bg-gray-100 !text-gray-700 !border !border-gray-200"
                    />
                  ))}
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
          <div className="!bg-gray-50 !p-4 !rounded-lg !border !border-gray-200 !shadow-sm hover:!shadow-md !transition-shadow">
            <Typography variant="caption" className="!text-gray-500 !block !mb-2 !text-xs !font-medium">
              Total Tickets
            </Typography>
            <Typography variant="h5" className="!font-semibold !text-gray-800 !text-2xl">
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
        <div className="!grid !grid-cols-1 md:!grid-cols-3 !gap-6">
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
            <div className="!flex !items-center !gap-1 !border !border-gray-200 !rounded-lg !p-0.5 !bg-gray-50">
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
                  <Squares2X2Icon className="!h-5 !w-5" />
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
                  <ViewColumnsIcon className="!h-5 !w-5" />
                </IconButton>
              </Tooltip>
            </div>
            <Button
              variant="contained"
              size="small"
              startIcon={<PlusIcon className="!h-4 !w-4" />}
              onClick={() => navigate(`/tickets/new?project_id=${id}`)}
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
                return (
                  <Paper 
                    key={status} 
                    className={`!p-4 !border-2 ${statusColors[status] || "!bg-gray-50 !border-gray-200"} !rounded-lg !shadow-sm`}
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
                        <Card
                          key={ticket.id}
                          className="!p-4 hover:!shadow-lg !transition-all !cursor-pointer !bg-white !border !border-gray-200 !rounded-lg !shadow-none"
                          onClick={() => navigate(`/tickets/${ticket.id}`)}
                        >
                          <div className="!flex !items-start !justify-between !mb-2">
                            <Typography variant="subtitle2" className="!font-semibold !text-gray-800 !flex-1 !text-sm">
                              #{ticket.id} - {ticket.title}
                            </Typography>
                            <StatusBadge status={ticket.priority} isInside />
                          </div>
                          {ticket.details && (
                            <Typography
                              variant="caption"
                              className="!text-gray-600 !line-clamp-2 !mb-3 !block !text-xs"
                            >
                              {ticket.details}
                            </Typography>
                          )}
                          <div className="!flex !items-center !justify-between !pt-2 !border-t !border-gray-100">
                            {ticket.category && (
                              <Chip 
                                label={ticket.category.name} 
                                size="small" 
                                className="!text-xs !bg-gray-100"
                              />
                            )}
                            {ticket.due_date && (
                              <DateWithTooltip date={ticket.due_date} />
                            )}
                          </div>
                        </Card>
                      ))}
                      {statusTickets.length === 0 && (
                        <div className="!flex !items-center !justify-center !py-12">
                          <Typography variant="caption" className="!text-gray-400 !text-xs">
                            No tickets
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
              onClick={() => navigate(`/tickets/new?project_id=${id}`)}
              className="!bg-brand-500 hover:!bg-brand-600 !shadow-sm"
              sx={{ textTransform: "none" }}
            >
              Add First Ticket
            </Button>
          </Box>
        )}
      </Card>

      {/* Assign Modal */}
      <Dialog
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Assign Project</DialogTitle>
        <DialogContent>
          <Autocomplete
            size="small"
            fullWidth
            options={searchResults}
            value={assignee}
            onChange={(e, newValue) => setAssignee(newValue)}
            onInputChange={(e, newInputValue) => setSearchTerm(newInputValue)}
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
            loading={searchLoading}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Assign To"
                placeholder="Search team member..."
              />
            )}
          />
        </DialogContent>
        <DialogActions className="!px-6 !pb-4">
          <Button 
            onClick={() => setAssignModalOpen(false)}
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            variant="contained"
            className="!bg-brand-500 hover:!bg-brand-600"
            sx={{ textTransform: "none" }}
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

