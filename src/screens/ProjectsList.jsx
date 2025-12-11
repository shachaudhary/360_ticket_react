import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CircularProgress,
  TextField,
  InputAdornment,
  Typography,
  Chip,
  Menu,
  MenuItem,
  IconButton,
  Tooltip,
  FormControl,
  Select,
  InputLabel,
} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ViewColumnsIcon,
  Squares2X2Icon,
  EllipsisVerticalIcon,
  CalendarIcon,
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { createAPIEndPoint } from "../config/api/api";
import { useApp } from "../state/AppContext";
import toast from "react-hot-toast";
import { convertToCST } from "../utils";
import { toProperCase } from "../utils/formatting";
import StatusBadge from "../components/StatusBadge";
import DateWithTooltip from "../components/DateWithTooltip";

export default function ProjectsList() {
  const navigate = useNavigate();
  const { user } = useApp();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("board"); // 'board', 'table', 'timeline', 'calendar'
  const [statusFilter, setStatusFilter] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [sortBy, setSortBy] = useState("name"); // 'name', 'status', 'due_date', 'created_at'
  const [sortOrder, setSortOrder] = useState("asc"); // 'asc', 'desc'

  useEffect(() => {
    fetchProjects();
  }, [searchQuery, statusFilter, sortBy, sortOrder]);

  // Dummy data for fallback UI
  const dummyProjects = [
    {
      id: 1,
      name: "Website Redesign",
      description: "Complete redesign of company website with modern UI/UX",
      status: "active",
      priority: "high",
      color: "#FF3838",
      tags: ["Design", "Frontend"],
      due_date: "2024-12-31",
      created_at: "2024-01-15T10:00:00Z",
      tickets: [
        { id: 1, status: "completed", priority: "High" },
        { id: 2, status: "in-progress", priority: "Medium" },
        { id: 3, status: "pending", priority: "Low" },
      ],
      assignees: [{ id: 1, username: "John Doe", name: "John Doe" }],
    },
    {
      id: 2,
      name: "Mobile App Development",
      description: "Build native mobile app for iOS and Android",
      status: "active",
      priority: "medium",
      color: "#5F27CD",
      tags: ["Mobile", "Development"],
      due_date: "2024-11-30",
      created_at: "2024-02-01T10:00:00Z",
      tickets: [
        { id: 4, status: "in-progress", priority: "High" },
        { id: 5, status: "pending", priority: "Medium" },
      ],
      assignees: [{ id: 2, username: "Jane Smith", name: "Jane Smith" }],
    },
    {
      id: 3,
      name: "Database Migration",
      description: "Migrate legacy database to cloud infrastructure",
      status: "completed",
      priority: "low",
      color: "#7BED9F",
      tags: ["Backend", "Infrastructure"],
      due_date: "2024-10-15",
      created_at: "2024-01-10T10:00:00Z",
      tickets: [
        { id: 6, status: "completed", priority: "Low" },
        { id: 7, status: "completed", priority: "Low" },
      ],
      assignees: [{ id: 3, username: "Bob Wilson", name: "Bob Wilson" }],
    },
  ];

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (statusFilter) params.append("status", statusFilter);
      if (sortBy) params.append("sort_by", sortBy);
      if (sortOrder) params.append("sort_order", sortOrder);

      const res = await createAPIEndPoint(
        `projects?${params.toString()}`
      ).fetchAll();
      let fetchedProjects = res.data?.projects || res.data || [];

      // Use dummy data if no projects found (for UI preview)
      if (fetchedProjects.length === 0 && !searchQuery && !statusFilter) {
        fetchedProjects = dummyProjects;
      }

      // Client-side sorting if API doesn't support it
      if (fetchedProjects.length > 0) {
        fetchedProjects = [...fetchedProjects].sort((a, b) => {
          let aVal, bVal;
          switch (sortBy) {
            case "name":
              aVal = (a.name || "").toLowerCase();
              bVal = (b.name || "").toLowerCase();
              break;
            case "status":
              aVal = a.status || "";
              bVal = b.status || "";
              break;
            case "due_date":
              aVal = a.due_date ? new Date(a.due_date).getTime() : 0;
              bVal = b.due_date ? new Date(b.due_date).getTime() : 0;
              break;
            case "created_at":
              aVal = a.created_at ? new Date(a.created_at).getTime() : 0;
              bVal = b.created_at ? new Date(b.created_at).getTime() : 0;
              break;
            default:
              return 0;
          }
          if (sortOrder === "asc") {
            return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
          } else {
            return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
          }
        });
      }

      setProjects(fetchedProjects);
    } catch (err) {
      console.error("Failed to fetch projects", err);
      // Use dummy data on error for UI preview
      setProjects(dummyProjects);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, project) => {
    setAnchorEl(event.currentTarget);
    setSelectedProject(project);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProject(null);
  };

  const handleDelete = async () => {
    if (!selectedProject) return;
    try {
      await createAPIEndPoint(`project/${selectedProject.id}`).delete();
      toast.success("Project deleted successfully");
      fetchProjects();
    } catch (err) {
      toast.error("Failed to delete project");
    }
    handleMenuClose();
  };

  const getProjectStats = (project) => {
    const tickets = project.tickets || [];
    const total = tickets.length;
    const completed = tickets.filter((t) => t.status === "completed").length;
    const inProgress = tickets.filter(
      (t) => t.status === "in-progress" || t.status === "in_progress"
    ).length;
    return { total, completed, inProgress };
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg md:text-xl font-semibold text-sidebar">
          Projects
        </h2>
        <button
          onClick={() => navigate("/projects/new")}
          className="flex items-center gap-1 rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-all"
        >
          <PlusIcon className="h-4 w-4 text-white stroke-[2.5]" />
          New Project
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        {/* Search */}
        <div className="col-span-1 sm:col-span-2 lg:col-span-4">
          <TextField
            label="Search"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
            sx={{ maxWidth: 400 }}
            InputProps={{
              endAdornment: searchQuery?.length > 0 && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setSearchQuery("")}
                    edge="end"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </div>

        {/* View Mode */}
        <div className="col-span-1 sm:col-span-2 lg:col-span-2 flex items-center gap-1 justify-end">
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
              <Squares2X2Icon className="h-5 w-5" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Table View">
            <IconButton
              size="small"
              onClick={() => setViewMode("table")}
              className={
                viewMode === "table"
                  ? "!bg-brand-500 !text-white hover:!bg-brand-600"
                  : "!text-gray-500 hover:!bg-gray-100"
              }
            >
              <ViewColumnsIcon className="h-5 w-5" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Timeline View">
            <IconButton
              size="small"
              onClick={() => setViewMode("timeline")}
              className={
                viewMode === "timeline"
                  ? "!bg-brand-500 !text-white hover:!bg-brand-600"
                  : "!text-gray-500 hover:!bg-gray-100"
              }
            >
              <ChartBarIcon className="h-5 w-5" />
            </IconButton>
          </Tooltip>
        </div>

        {/* User Filter + Clear button row */}
        <div className="mb-0.5 col-span-1 sm:col-span-2 lg:col-span-6 flex flex-col lg:flex-row items-stretch lg:items-center gap-2">
          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter("")}
              className={`px-3 py-[6.15px] !text-xs font-medium rounded-lg border transition-all duration-500 ${statusFilter === ""
                  ? "bg-brand-500 text-white border-brand-500 hover:bg-brand-600"
                  : "border border-[#E5E7EB] text-[#969AA1] hover:bg-gray-50"
                }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter("active")}
              className={`px-3 py-[6.15px] !text-xs font-medium rounded-lg border transition-all duration-500 ${statusFilter === "active"
                  ? "bg-brand-500 text-white border-brand-500 hover:bg-brand-600"
                  : "border border-[#E5E7EB] text-[#969AA1] hover:bg-gray-50"
                }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter("completed")}
              className={`px-3 py-[6.15px] !text-xs font-medium rounded-lg border transition-all duration-500 ${statusFilter === "completed"
                  ? "bg-brand-500 text-white border-brand-500 hover:bg-brand-600"
                  : "border border-[#E5E7EB] text-[#969AA1] hover:bg-gray-50"
                }`}
            >
              Completed
            </button>
            <button
              onClick={() => setStatusFilter("archived")}
              className={`px-3 py-[6.15px] !text-xs font-medium rounded-lg border transition-all duration-500 ${statusFilter === "archived"
                  ? "bg-brand-500 text-white border-brand-500 hover:bg-brand-600"
                  : "border border-[#E5E7EB] text-[#969AA1] hover:bg-gray-50"
                }`}
            >
              Archived
            </button>
          </div>

          {/* Clear Button on the right */}
          <div className="flex lg:ml-auto lg:w-auto">
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("");
                setSortBy("name");
                setSortOrder("asc");
              }}
              className={`px-3 py-[6.15px] shrink-0 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 transition-all ${searchQuery ||
                  statusFilter ||
                  (sortBy !== "name") ||
                  (sortOrder !== "asc")
                  ? "border border-red-500 bg-red-500 text-white hover:bg-red-600 focus:ring-red-500"
                  : "border border-[#E5E7EB] text-gray-400 hover:border-gray-300 hover:text-gray-600 hover:bg-brand-50 focus:ring-gray-500"
                }`}
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Projects Grid/List - Matching Tickets style */}
      {loading ? (
        <div className="overflow-hidden rounded-lg border border-[#E5E7EB]">
          <div className="overflow-auto h-[calc(100dvh-240px)] flex items-center justify-center rounded-lg bg-purple-50">
            <CircularProgress color="primary" />
          </div>
        </div>
      ) : projects.length === 0 ? (
        <div className="overflow-hidden rounded-lg border border-[#E5E7EB]">
          <div className="h-[calc(100dvh-240px)] flex-col gap-1 flex items-center justify-center rounded-lg">
            <p className="text-gray-500 font-normal text-md">
              No projects found
            </p>
            {!searchQuery && !statusFilter && (
              <Button
                variant="contained"
                startIcon={<PlusIcon className="h-5 w-5" />}
                onClick={() => navigate("/projects/new")}
                className="bg-brand-500 hover:bg-brand-600 mt-4"
              >
                Create Project
              </Button>
            )}
          </div>
        </div>
      ) : viewMode === "board" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => {
            const stats = getProjectStats(project);
            const projectColor = project.color || "#5F27CD";
            return (
              <Card
                key={project.id}
                className="p-4 hover:!shadow-lg transition-all cursor-pointer border-l-4 !shadow-md"
                style={{ borderLeftColor: projectColor }}
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Box
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: projectColor }}
                      />
                      <Typography
                        variant="h6"
                        className="font-semibold text-gray-800"
                      >
                        {project.name}
                      </Typography>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge
                        status={project.status || "active"}
                        isInside
                      />
                      {project.priority && (
                        <StatusBadge
                          status={project.priority}
                          isInside
                        />
                      )}
                    </div>
                  </div>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuOpen(e, project);
                    }}
                  >
                    <EllipsisVerticalIcon className="h-5 w-5" />
                  </IconButton>
                </div>
                {project.tags && project.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {project.tags.slice(0, 3).map((tag, idx) => (
                      <Chip
                        key={idx}
                        label={tag}
                        size="small"
                        className="text-xs"
                      />
                    ))}
                    {project.tags.length > 3 && (
                      <Chip
                        label={`+${project.tags.length - 3}`}
                        size="small"
                        className="text-xs"
                      />
                    )}
                  </div>
                )}
                {project.description && (
                  <Typography
                    variant="body2"
                    className="text-gray-600 mb-3 line-clamp-2"
                  >
                    {project.description}
                  </Typography>
                )}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                  <div className="flex items-center gap-4">
                    <span>{stats.total} Tasks</span>
                    <span>{stats.completed} Completed</span>
                  </div>
                  {project.due_date && (
                    <DateWithTooltip date={project.due_date} />
                  )}
                </div>
                {project.assignees && project.assignees.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Typography variant="caption" className="text-gray-500">
                      Assigned to:
                    </Typography>
                    <div className="flex -space-x-2">
                      {project.assignees.slice(0, 3).map((assignee) => (
                        <div
                          key={assignee.id}
                          className="w-6 h-6 rounded-full bg-brand-500 text-white text-xs flex items-center justify-center border-2 border-white"
                          title={assignee.username || assignee.name}
                        >
                          {(assignee.username || assignee.name || "?")[0].toUpperCase()}
                        </div>
                      ))}
                      {project.assignees.length > 3 && (
                        <div className="w-6 h-6 rounded-full bg-gray-300 text-gray-600 text-xs flex items-center justify-center border-2 border-white">
                          +{project.assignees.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ) : viewMode === "timeline" ? (
        <Card className="p-4">
          <div className="space-y-4">
            {projects.map((project) => {
              const stats = getProjectStats(project);
              const projectColor = project.color || "#5F27CD";
              const progress =
                stats.total > 0
                  ? Math.round((stats.completed / stats.total) * 100)
                  : 0;
              return (
                <Card
                  key={project.id}
                  className="p-4 hover:shadow-md transition-shadow cursor-pointer border-l-4"
                  style={{ borderLeftColor: projectColor }}
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Box
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: projectColor }}
                      />
                      <Typography variant="h6" className="font-semibold">
                        {project.name}
                      </Typography>
                      <StatusBadge
                        status={project.status || "active"}
                        isInside
                      />
                    </div>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMenuOpen(e, project);
                      }}
                    >
                      <EllipsisVerticalIcon className="h-5 w-5" />
                    </IconButton>
                  </div>
                  <div className="mb-2">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress: {progress}%</span>
                      <span>{stats.completed}/{stats.total} tasks</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${progress}%`,
                          backgroundColor: projectColor,
                        }}
                      />
                    </div>
                  </div>
                  {project.due_date && (
                    <Typography variant="caption" className="text-gray-500">
                      Due: <DateWithTooltip date={project.due_date} />
                    </Typography>
                  )}
                </Card>
              );
            })}
          </div>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <div className="overflow-hidden rounded-lg border border-[#E5E7EB]">
            <div className="overflow-auto h-[calc(100dvh-308.75px)]">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-white sticky top-0 z-10 whitespace-nowrap">
                  <tr className="text-left !text-xs text-gray-500">
                    <th className="px-4 py-3 border-b border-r border-[#E5E7EB]">
                      #
                    </th>
                    <th className="px-4 py-3 border-b border-r border-[#E5E7EB]">
                      Project Name
                    </th>
                    <th className="px-4 py-3 border-b border-r border-[#E5E7EB]">
                      Status
                    </th>
                    <th className="px-4 py-3 border-b border-r border-[#E5E7EB]">
                      Priority
                    </th>
                    <th className="px-4 py-3 border-b border-r border-[#E5E7EB]">
                      Tasks
                    </th>
                    <th className="px-4 py-3 border-b border-r border-[#E5E7EB]">
                      Progress
                    </th>
                    <th className="px-4 py-3 border-b border-r border-[#E5E7EB]">
                      Due Date
                    </th>
                    <th className="px-4 py-3 border-b border-r border-[#E5E7EB]">
                      Assigned To
                    </th>
                    <th className="px-4 py-3 border-b border-r border-[#E5E7EB]">
                      Created At
                    </th>
                    <th className="px-4 py-3 border-b border-r border-[#E5E7EB]">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white text-sm">
                  {projects.map((project, idx) => {
                    const stats = getProjectStats(project);
                    const progress =
                      stats.total > 0
                        ? Math.round((stats.completed / stats.total) * 100)
                        : 0;
                    const projectColor = project.color || "#5F27CD";
                    return (
                      <tr
                        key={project.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/projects/${project.id}`)}
                      >
                        <td className="px-4 py-3 border-b border-[#E5E7EB]">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3 border-b border-[#E5E7EB] font-medium text-gray-800 max-w-48">
                          <div className="flex items-center gap-2">
                            <Box
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: projectColor }}
                            />
                            <div>
                              <Typography className="font-medium text-gray-800">
                                {toProperCase(project.name)}
                              </Typography>
                              {project.description && (
                                <Typography
                                  variant="caption"
                                  className="text-gray-500 line-clamp-1"
                                >
                                  {project.description}
                                </Typography>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 border-b border-[#E5E7EB]">
                          <StatusBadge
                            status={project.status || "active"}
                            isInside
                          />
                        </td>
                        <td className="px-4 py-3 border-b border-[#E5E7EB]">
                          <StatusBadge
                            status={project.priority || "low"}
                            isInside
                          />
                        </td>
                        <td className="px-4 py-3 border-b border-[#E5E7EB] text-sm text-gray-600">
                          {stats.total} total, {stats.completed} completed
                        </td>
                        <td className="px-4 py-3 border-b border-[#E5E7EB]">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-24">
                              <div
                                className="h-2 rounded-full"
                                style={{
                                  width: `${progress}%`,
                                  backgroundColor: projectColor,
                                }}
                              />
                            </div>
                            <span className="text-xs text-gray-600">
                              {progress}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 border-b border-[#E5E7EB] text-sm text-gray-600">
                          {project.due_date ? (
                            <DateWithTooltip date={project.due_date} />
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-4 py-3 border-b border-[#E5E7EB] text-sm text-gray-600">
                          {project.assignees && project.assignees.length > 0 ? (
                            <span>
                              {toProperCase(
                                project.assignees[0]?.username ||
                                project.assignees[0]?.name ||
                                "N/A"
                              )}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-4 py-3 border-b border-[#E5E7EB] text-sm text-gray-600">
                          {project.created_at ? (
                            convertToCST(project.created_at)
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-4 py-3 border-b border-[#E5E7EB]">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMenuOpen(e, project);
                            }}
                          >
                            <EllipsisVerticalIcon className="h-5 w-5" />
                          </IconButton>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            if (selectedProject) {
              navigate(`/projects/${selectedProject.id}/edit`);
            }
            handleMenuClose();
          }}
        >
          Edit
        </MenuItem>
        <MenuItem onClick={handleDelete} className="text-red-600">
          Delete
        </MenuItem>
      </Menu>
    </div>
  );
}


