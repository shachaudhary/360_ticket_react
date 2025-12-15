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
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import ClearIcon from "@mui/icons-material/Clear";
import {
  PlusIcon,
  ViewColumnsIcon,
  Squares2X2Icon,
  EllipsisVerticalIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { createAPIEndPoint } from "../config/api/api";
import { useApp } from "../state/AppContext";
import toast from "react-hot-toast";
import { convertToCST } from "../utils";
import { toProperCase } from "../utils/formatting";
import StatusBadge from "../components/StatusBadge";
import DateWithTooltip from "../components/DateWithTooltip";
import CustomTablePagination from "../components/CustomTablePagination";
import ConfirmationModal from "../components/ConfirmationModal";
import dayjs from "dayjs";

export default function ProjectsList() {
  const navigate = useNavigate();
  const { user } = useApp();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("board"); // 'board', 'table', 'timeline', 'calendar'
  const [statusFilter, setStatusFilter] = useState("my_projects");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [sortBy, setSortBy] = useState("name"); // 'name', 'status', 'due_date', 'created_at'
  const [sortOrder, setSortOrder] = useState("asc"); // 'asc', 'desc'
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // Static status options
  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "completed", label: "Completed" },
    { value: "archived", label: "Archived" },
  ];

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchProjects();
  }, [searchQuery, statusFilter, priorityFilter, startDate, endDate, page, rowsPerPage]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (statusFilter && statusFilter !== "my_projects") {
        params.append("status", statusFilter);
      }
      if (statusFilter === "my_projects" && user?.id) {
        params.append("created_by", user.id.toString());
      }
      if (priorityFilter) params.append("priority", priorityFilter);
      if (startDate) params.append("start_date", dayjs(startDate).format("YYYY-MM-DD"));
      if (endDate) params.append("end_date", dayjs(endDate).format("YYYY-MM-DD"));
      params.append("page", (page + 1).toString()); // API uses 1-indexed
      params.append("per_page", rowsPerPage.toString());

      const res = await createAPIEndPoint(
        `projects?${params.toString()}`
      ).fetchAll();

      const fetchedProjects = res.data?.projects || [];
      const paginationData = res.data?.pagination || {
        page: 1,
        per_page: 10,
        total: 0,
        pages: 1,
      };

      setProjects(fetchedProjects);
      setTotalCount(paginationData.total || 0);
    } catch (err) {
      console.error("Failed to fetch projects", err);
      toast.error("Failed to load projects");
      setProjects([]);
      setTotalCount(0);
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

  const handleDeleteClick = () => {
    setDeleteModalOpen(true);
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (!selectedProject) return;
    try {
      setDeleting(true);
      await createAPIEndPoint(`project/${selectedProject.id}`).delete();
      toast.success("Project deleted successfully");
      fetchProjects();
      setDeleteModalOpen(false);
      setSelectedProject(null);
    } catch (err) {
      toast.error("Failed to delete project");
    } finally {
      setDeleting(false);
    }
  };

  const getProjectStats = (project) => {
    // Use ticket_count from API instead of calculating from tickets array
    const total = project.ticket_count || 0;

    // Get status counts from ticket_status_counts if available
    const statusCounts = project.ticket_status_counts || {};
    const completed = statusCounts.completed || 0;
    const inProgress = statusCounts.in_progress || statusCounts["in progress"] || 0;

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
        <div className="col-span-1 sm:col-span-2 lg:col-span-2">
          <TextField
            label="Search"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
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

        {/* Priority Filter */}
        <div className="col-span-1">
          <FormControl fullWidth size="small">
            <InputLabel>Priority</InputLabel>
            <Select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(0);
              }}
              label="Priority"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
            </Select>
          </FormControl>
        </div>

        {/* Start Date */}
        <div className="col-span-1 sm:col-span-1 lg:col-span-1">
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={(date) => {
                setStartDate(date);
                setPage(0);
              }}
              maxDate={endDate}
              slotProps={{
                textField: { size: "small", fullWidth: true },
              }}
            />
          </LocalizationProvider>
        </div>

        {/* End Date */}
        <div className="col-span-1 sm:col-span-1 lg:col-span-1">
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={(date) => {
                setEndDate(date);
                setPage(0);
              }}
              minDate={startDate}
              slotProps={{
                textField: { size: "small", fullWidth: true },
              }}
            />
          </LocalizationProvider>
        </div>

        {/* View Mode */}
        <div className="col-span-1 flex items-center gap-1 justify-end">
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

        {/* Status Filter Buttons + Clear button row */}
        <div className="mb-0.5 col-span-1 sm:col-span-2 lg:col-span-6 flex flex-col lg:flex-row items-stretch lg:items-center gap-2">
          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                if (statusFilter === "my_projects") {
                  setStatusFilter("");
                } else {
                  setStatusFilter("my_projects");
                }
                setPage(0);
              }}
              className={`px-3 py-[6.15px] !text-xs font-medium rounded-lg border transition-all duration-500 ${statusFilter === "my_projects"
                ? "bg-brand-500 text-white border-brand-500 hover:bg-brand-600"
                : "border border-[#E5E7EB] text-[#969AA1] hover:bg-gray-50"
                }`}
            >
              My Projects
            </button>
            {statusOptions.map((status) => {
              // Handle both object format {value, label} and string format
              const statusValue = typeof status === "string" ? status : status.value || status.id;
              const statusLabel = typeof status === "string"
                ? toProperCase(status)
                : status.label || status.name || toProperCase(statusValue);

              return (
                <button
                  key={statusValue}
                  onClick={() => {
                    setStatusFilter(statusValue);
                    setPage(0);
                  }}
                  className={`px-3 py-[6.15px] !text-xs font-medium rounded-lg border transition-all duration-500 ${statusFilter === statusValue
                    ? "bg-brand-500 text-white border-brand-500 hover:bg-brand-600"
                    : "border border-[#E5E7EB] text-[#969AA1] hover:bg-gray-50"
                    }`}
                >
                  {statusLabel}
                </button>
              );
            })}
            <button
              onClick={() => {
                setStatusFilter("");
                setPage(0);
              }}
              className={`px-3 py-[6.15px] !text-xs font-medium rounded-lg border transition-all duration-500 ${statusFilter === ""
                ? "bg-brand-500 text-white border-brand-500 hover:bg-brand-600"
                : "border border-[#E5E7EB] text-[#969AA1] hover:bg-gray-50"
                }`}
            >
              All
            </button>
          </div>

          {/* Clear Button on the right */}
          <div className="flex lg:ml-auto lg:w-auto">
            {(searchQuery ||
              (statusFilter && statusFilter !== "my_projects") ||
              priorityFilter ||
              startDate ||
              endDate) && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("my_projects"); // Reset to default "My Projects"
                    setPriorityFilter("");
                    setStartDate(null);
                    setEndDate(null);
                    setPage(0);
                  }}
                  className="px-3 py-[6.15px] shrink-0 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 transition-all border border-red-500 bg-red-500 text-white hover:bg-red-600 focus:ring-red-500"
                >
                  Clear
                </button>
              )}
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
                // sx={{
                //   boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important",
                //   "&:hover": {
                //     boxShadow: `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), 0 0 0 1px ${projectColor}40, 0 0 20px ${projectColor}30 !important`,
                //   },
                // }}
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
                    {project.tags.slice(0, 3).map((tag, idx) => {
                      const tagName = typeof tag === 'string' ? tag : (tag.tag_name || tag.name || tag);
                      const tagId = typeof tag === 'object' ? tag.id : idx;
                      return (
                        <Chip
                          key={tagId}
                          label={tagName}
                          size="small"
                          className="text-xs"
                        />
                      );
                    })}
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
                    className="!text-gray-600 !mb-3 line-clamp-2"
                  >
                    {project.description}
                  </Typography>
                )}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                  <div className="flex items-center gap-4">
                    <span>{stats.total} {stats.total === 1 ? "Ticket" : "Tickets"}</span>
                  </div>
                  {project.due_date && (
                    <DateWithTooltip date={project.due_date} />
                  )}
                </div>
                {(project.team_members || project.assignees)?.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Typography variant="caption" className="text-gray-500">
                      Assigned to:
                    </Typography>
                    <div className="flex -space-x-2">
                      {(project.team_members || project.assignees || []).slice(0, 3).map((member) => (
                        <Tooltip key={member.user_id || member.id} title={member.username || member.name}>
                          <div
                            className="w-6 h-6 rounded-full bg-orange-400 text-white text-xs flex items-center justify-center border-2 border-white"
                          >
                            {(member.username || member.name || "?")[0].toUpperCase()}
                          </div>
                        </Tooltip>
                      ))}
                      {(project.team_members || project.assignees || []).length > 3 && (
                        <div className="w-6 h-6 rounded-full bg-gray-300 text-gray-600 text-xs flex items-center justify-center border-2 border-white">
                          +{(project.team_members || project.assignees || []).length - 3}
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
        <Card className="p-4 !px-0 !shadow-none">
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
                  className="p-4 hover:!shadow-lg transition-shadow cursor-pointer border-l-4 !shadow-md"
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
                      <span>{stats.total} {stats.total === 1 ? "ticket" : "tickets"}</span>
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
                          {page * rowsPerPage + idx + 1}
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
                          {stats.total} {stats.total === 1 ? "ticket" : "tickets"}
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
                          {(project.team_members || project.assignees)?.length > 0 ? (
                            <span>
                              {toProperCase(
                                (project.team_members || project.assignees)[0]?.username ||
                                (project.team_members || project.assignees)[0]?.name ||
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

      {/* Pagination - Only show for table view */}
      {viewMode === "table" && projects.length > 0 && (
        <CustomTablePagination
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
          page={page}
          setPage={setPage}
          totalCount={totalCount}
        />
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
        {/* <MenuItem onClick={handleDeleteClick} className="text-red-600">
          Delete
        </MenuItem> */}
      </Menu>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedProject(null);
        }}
        onConfirm={handleDelete}
        title="Delete Project"
        message={`Are you sure you want to delete "${selectedProject?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        loading={deleting}
        danger={true}
      />
    </div>
  );
}


