import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import { useFormik } from "formik";
import * as Yup from "yup";
import BackButton from "../components/BackButton";
import { createAPIEndPoint } from "../config/api/api";
import { createAPIEndPointAuth } from "../config/api/apiAuth";
import { useApp } from "../state/AppContext";
import toast from "react-hot-toast";
import { toProperCase } from "../utils/formatting";
import {
  CheckCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const statuses = ["active", "completed", "archived"];
const priorities = ["low", "medium", "high"];

// Color palette for projects (Monday.com style)
const PROJECT_COLORS = [
  "#FF3838", "#FF6B6B", "#FF8E53", "#FFA502", "#FFD32A",
  "#C4E538", "#7BED9F", "#5F27CD", "#00D2D3", "#54A0FF",
  "#2E86DE", "#1B9CFC", "#3742FA", "#A55EEA", "#EE5A6F",
  "#FF6348", "#FF4757", "#FF6B81"
];

const PROJECT_COLOR_NAMES = [
  "Red", "Coral", "Orange", "Amber", "Yellow",
  "Lime", "Green", "Purple", "Teal", "Sky Blue",
  "Blue", "Light Blue", "Indigo", "Violet", "Pink",
  "Tomato", "Rose", "Pink Rose"
];

export default function ProjectForm({ isEdit = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useApp();
  const [loading, setLoading] = useState(isEdit);
  const [teamMembers, setTeamMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedColor, setSelectedColor] = useState(PROJECT_COLORS[0]);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (isEdit && id) {
      fetchProject();
    }
    fetchTeamMembers();
  }, [id, isEdit]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const res = await createAPIEndPoint(`project/${id}`).fetchAll();
      const project = res.data;

      formik.setValues({
        name: project.name || "",
        description: project.description || "",
        status: project.status || "active",
        priority: project.priority || "low",
        due_date: project.due_date ? dayjs(project.due_date) : null,
        assignees: project.assignees || [],
      });
      setSelectedColor(project.color || PROJECT_COLORS[0]);
      setTags(project.tags || []);
    } catch (err) {
      console.error("Failed to fetch project", err);
      toast.error("Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      setSearchLoading(true);
      const res = await createAPIEndPointAuth(
        `clinic_team/search?query=${encodeURIComponent(searchTerm || "")}`
      ).fetchAll();
      setTeamMembers(res?.data?.results || []);
    } catch (err) {
      console.error("Failed to fetch team members", err);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchTeamMembers();
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  const formik = useFormik({
    initialValues: {
      name: "",
      description: "",
      status: "active",
      priority: "low",
      due_date: null,
      assignees: [],
      color: PROJECT_COLORS[0],
      tags: [],
    },
    validationSchema: Yup.object({
      name: Yup.string()
        .required("Project name is required")
        .min(3, "Name must be at least 3 characters"),
      description: Yup.string(),
      status: Yup.string().required("Status is required"),
      priority: Yup.string().required("Priority is required"),
      due_date: Yup.date().nullable(),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const payload = {
          name: values.name,
          description: values.description,
          status: values.status,
          priority: values.priority,
          due_date: values.due_date
            ? dayjs(values.due_date).format("YYYY-MM-DD")
            : null,
          assignee_ids: values.assignees.map((a) => a.user_id || a.id),
          created_by: user?.id,
          clinic_id: user?.clinic_id || 1,
          color: selectedColor,
          tags: tags,
        };

        let res;
        if (isEdit && id) {
          res = await createAPIEndPoint(`project/${id}`).patch(payload);
          toast.success("Project updated successfully!");
          navigate(`/projects/${id}`);
        } else {
          res = await createAPIEndPoint("project").createWithJSONFormat(
            payload
          );
          toast.success("Project created successfully!");
          navigate(`/projects/${res.data?.id || res.data?.project?.id}`);
        }
      } catch (err) {
        console.error("Error saving project", err);
        toast.error(
          err?.response?.data?.error || "Error saving project"
        );
      } finally {
        setSubmitting(false);
      }
    },
  });

  if (loading) {
    return (
      <div className="overflow-hidden">
        <div className="overflow-auto h-[calc(100dvh-92px)] flex items-center justify-center">
          <CircularProgress size={40} color="primary" />
        </div>
      </div>
    );
  }

  return (
    <Box component="form" onSubmit={formik.handleSubmit} className="!bg-white">

      <div className="!space-y-4 !mt-4 !border-0">
        <div className="!flex !items-center !justify-start !gap-2 !mb-1">
          <BackButton self={isEdit ? -1 : "/projects"} />
          <h2 className="!text-lg md:!text-2xl !font-semibold !text-sidebar ">
            {isEdit ? "Edit Project" : "Create New Project"}
          </h2>
        </div>

        {/* Project Color Picker */}
        <div className="!mb-2">
          <Typography variant="body2" className="!text-gray-600 !mb-3 !font-medium !text-sm">
            Project Color
          </Typography>
          <div className="!flex !flex-wrap !gap-2.5 !p-3 !rounded-lg !border !border-gray-200">
            {PROJECT_COLORS.map((color, index) => (
              <Tooltip key={color} title={PROJECT_COLOR_NAMES[index]} arrow>
                <Box
                  onClick={() => setSelectedColor(color)}
                  className="!w-9 !h-9 !rounded-lg !cursor-pointer !border-2 !transition-all hover:!scale-110 !shadow-sm"
                  style={{
                    backgroundColor: color,
                    borderColor: selectedColor === color ? "#374151" : "rgba(0,0,0,0.1)",
                    boxShadow: selectedColor === color ? `0 0 0 3px ${color}20, 0 2px 4px rgba(0,0,0,0.1)` : "none",
                  }}
                >
                  {selectedColor === color && (
                    <CheckCircleIcon className="!w-full !h-full !text-white !p-1.5" />
                  )}
                </Box>
              </Tooltip>
            ))}
          </div>
        </div>

        {/* Basic Information Section */}
        <div className="!space-y-4">
          <TextField
            label="Project Name"
            name="name"
            fullWidth
            size="small"
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.name && Boolean(formik.errors.name)}
            helperText={formik.touched.name && formik.errors.name}
            required
            className="!mb-0"
          />

          <TextField
            label="Description"
            name="description"
            fullWidth
            size="small"
            multiline
            minRows={3}
            value={formik.values.description}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={
              formik.touched.description && Boolean(formik.errors.description)
            }
            helperText={formik.touched.description && formik.errors.description}
            placeholder="Add a detailed description of your project..."
          />
        </div>

        {/* Status and Priority - Side by Side */}
        <div className="!grid !grid-cols-1 md:!grid-cols-2 !gap-4">
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              value={formik.values.status}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              label="Status"
              error={formik.touched.status && Boolean(formik.errors.status)}
            >
              {statuses.map((status) => (
                <MenuItem key={status} value={status}>
                  {toProperCase(status)}
                </MenuItem>
              ))}
            </Select>
            {formik.touched.status && formik.errors.status && (
              <Typography variant="caption" color="error" className="!mt-1 !ml-3">
                {formik.errors.status}
              </Typography>
            )}
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel>Priority</InputLabel>
            <Select
              name="priority"
              value={formik.values.priority}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              label="Priority"
              error={formik.touched.priority && Boolean(formik.errors.priority)}
            >
              {priorities.map((priority) => (
                <MenuItem key={priority} value={priority}>
                  {toProperCase(priority)}
                </MenuItem>
              ))}
            </Select>
            {formik.touched.priority && formik.errors.priority && (
              <Typography variant="caption" color="error" className="!mt-1 !ml-3">
                {formik.errors.priority}
              </Typography>
            )}
          </FormControl>
        </div>

        {/* Due Date */}
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Due Date"
            value={formik.values.due_date}
            onChange={(date) => formik.setFieldValue("due_date", date)}
            minDate={dayjs()}
            slotProps={{
              textField: {
                size: "small",
                fullWidth: true,
                error:
                  formik.touched.due_date && Boolean(formik.errors.due_date),
                helperText:
                  formik.touched.due_date && formik.errors.due_date,
              },
            }}
          />
        </LocalizationProvider>

        {/* Team Members */}
        <Autocomplete
          multiple
          options={teamMembers}
          value={formik.values.assignees}
          onChange={(event, newValue) => {
            formik.setFieldValue("assignees", newValue);
          }}
          onInputChange={(event, newInputValue) => {
            setSearchTerm(newInputValue);
          }}
          getOptionLabel={(option) =>
            option.first_name && option.last_name
              ? `${toProperCase(option.first_name)} ${toProperCase(
                  option.last_name
                )}`
              : toProperCase(option.username || "")
          }
          isOptionEqualToValue={(option, value) =>
            option.user_id === value?.user_id || option.id === value?.id
          }
          loading={searchLoading}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Assign Team Members"
              placeholder="Search team members..."
              size="small"
              className="!mb-0"
            />
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                {...getTagProps({ index })}
                key={option.user_id || option.id}
                label={
                  option.first_name && option.last_name
                    ? `${toProperCase(option.first_name)} ${toProperCase(
                        option.last_name
                      )}`
                    : toProperCase(option.username || "")
                }
                className="!bg-blue-50 !text-blue-700 !border-blue-200"
                size="small"
              />
            ))
          }
        />

        {/* Tags Section */}
        <div className="!space-y-2">
          <Typography variant="body2" className="!text-gray-600 !mb-2 !font-medium !text-sm">
            Tags
          </Typography>
          {tags.length > 0 && (
            <div className="!flex !flex-wrap !gap-2 !mb-3 !p-3 !bg-gray-50 !rounded-lg !border !border-gray-200 !min-h-[60px]">
              {tags.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  onDelete={() => {
                    const newTags = tags.filter((_, i) => i !== index);
                    setTags(newTags);
                  }}
                  className="!bg-white !text-gray-700 !border !border-gray-300 hover:!bg-gray-50"
                  size="small"
                  deleteIcon={<XMarkIcon className="!w-4 !h-4" />}
                />
              ))}
            </div>
          )}
          <TextField
            fullWidth
            size="small"
            placeholder="Add a tag and press Enter"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && tagInput.trim()) {
                e.preventDefault();
                if (!tags.includes(tagInput.trim())) {
                  setTags([...tags, tagInput.trim()]);
                }
                setTagInput("");
              }
            }}
            InputProps={{
              endAdornment: tagInput && (
                <IconButton
                  size="small"
                  onClick={() => {
                    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
                      setTags([...tags, tagInput.trim()]);
                    }
                    setTagInput("");
                  }}
                  className="!text-green-600 hover:!bg-green-50"
                >
                  <CheckCircleIcon className="!h-5 !w-5" />
                </IconButton>
              ),
            }}
          />
        </div>

        {/* Actions */}
        <div className="!flex !justify-end !gap-2 !pt-4 !border-t !border-gray-200 !mt-6">
          <Button
            variant="outlined"
            color="error"
            onClick={() => {
              if (isEdit && id) {
                navigate(`/projects/${id}`);
              } else {
                navigate("/projects");
              }
            }}
            sx={{
              textTransform: "none",
              borderColor: "#E5E7EB",
              color: "#6B7270",
              "&:hover": { borderColor: "#E5E7EB", backgroundColor: "#Fafafa" },
            }}
            className="!px-6"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            sx={{ boxShadow: "none", textTransform: "none", color: "white" }}
            className="!px-6"
          >
            {formik.isSubmitting ? (
              <CircularProgress size={20} sx={{ color: "white" }} />
            ) : isEdit ? (
              "Update"
            ) : (
              "Create"
            )}
          </Button>
        </div>
      </div>
    </Box>
  );
}


