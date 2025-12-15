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
  Card,
  Divider,
} from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { ArrowUpTrayIcon } from "@heroicons/react/24/outline";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import { useFormik } from "formik";
import * as Yup from "yup";
import BackButton from "../components/BackButton";
import { createAPIEndPoint } from "../config/api/api";
import { useApp } from "../state/AppContext";
import toast from "react-hot-toast";

const priorities = ["Low", "High", "Urgent"];

export default function ProjectTicketCreate({ projectId }) {
  const navigate = useNavigate();
  const { user } = useApp();
  const [dragActive, setDragActive] = useState(false);
  const [categories, setCategories] = useState([]);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await createAPIEndPoint("category").fetchAll();
        setCategories(res.data || []);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setCategories([
          { id: 1, name: "Hardware" },
          { id: 2, name: "Software" },
          { id: 3, name: "Network" },
          { id: 4, name: "Other" },
        ]);
      }
    };
    fetchCategories();
  }, []);

  const formik = useFormik({
    initialValues: {
      title: "",
      details: "",
      category_id: "",
      due_date: null,
      priority: "Low",
      files: [],
    },
    validationSchema: Yup.object({
      title: Yup.string().required("Ticket title is required").min(3),
      details: Yup.string().required("Details are required").min(10),
      category_id: Yup.string().required("Please select a category"),
      priority: Yup.string().required("Please select a priority"),
      due_date: Yup.date().nullable().required("Please select a due date"),
      files: Yup.array().nullable(),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const formData = new FormData();
        Object.keys(values).forEach((key) => {
          if (key === "files" && values.files?.length > 0) {
            values.files.forEach((f) => {
              if (!f.isExisting) {
                formData.append("files", f);
              }
            });
          } else if (key === "due_date" && values.due_date) {
            formData.append(
              "due_date",
              dayjs(values.due_date).format("YYYY-MM-DD")
            );
          } else {
            formData.append(key, values[key]);
          }
        });

        formData.append("user_id", user?.id);
        formData.append("clinic_id", 1);
        formData.append("location_id", 30);
        
        // Use project-specific ticket creation endpoint
        if (projectId) {
          await createAPIEndPoint(`project/${projectId}/ticket`).create(formData);
        } else {
          await createAPIEndPoint("ticket").create(formData);
        }
        
        toast.success("Ticket created successfully!");
        if (projectId) {
          navigate(`/projects/${projectId}`);
        } else {
          navigate("/tickets");
        }
      } catch (err) {
        toast.error("Error saving ticket");
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Watch for priority changes and set due_date accordingly
  useEffect(() => {
    const priority = formik.values.priority;
    if (!priority) return;

    let newDate = null;
    if (priority === "Low") {
      newDate = dayjs().add(7, "day");
    } else if (priority === "High") {
      newDate = dayjs().add(1, "day");
    } else if (priority === "Urgent") {
      newDate = dayjs();
    }

    formik.setFieldValue("due_date", newDate, true);
  }, [formik.values.priority]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      formik.setFieldValue("file", e.dataTransfer.files[0]);
    }
  };

  return (
    <Box>
      {/* Main Form Card */}
      <Card className="!p-6 !shadow-md !bg-white !rounded-lg !border !border-gray-100">
        <Box component="form" onSubmit={formik.handleSubmit} className="space-y-6">
          {/* Basic Information Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 rounded-full" style={{ backgroundColor: "#824EF2" }}></div>
              <Typography variant="subtitle1" className="!text-gray-800 !font-semibold !text-base">
                Ticket Information
              </Typography>
            </div>
            
            <TextField
              label="Issue"
              name="title"
              fullWidth
              size="small"
              value={formik.values.title}
              onChange={formik.handleChange}
              error={formik.touched.title && Boolean(formik.errors.title)}
              helperText={formik.touched.title && formik.errors.title}
              placeholder="Enter ticket title..."
              required
              sx={{
                "& .MuiOutlinedInput-root": {
                  "&:hover fieldset": {
                    borderColor: "#824EF2",
                  },
                },
              }}
            />

            <TextField
              label="Details"
              name="details"
              fullWidth
              size="small"
              multiline
              minRows={5}
              value={formik.values.details}
              onChange={formik.handleChange}
              error={formik.touched.details && Boolean(formik.errors.details)}
              helperText={formik.touched.details && formik.errors.details}
              placeholder="Describe the issue or task in detail..."
              required
              sx={{
                "& .MuiOutlinedInput-root": {
                  "&:hover fieldset": {
                    borderColor: "#824EF2",
                  },
                },
              }}
            />
          </div>

          <Divider />

          {/* Category, Priority, and Due Date Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 rounded-full" style={{ backgroundColor: "#824EF2" }}></div>
              <Typography variant="subtitle1" className="!text-gray-800 !font-semibold !text-base">
                Ticket Details
              </Typography>
            </div>
            
            <div className="!grid !grid-cols-1 md:!grid-cols-3 !gap-4">
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  name="category_id"
                  value={formik.values.category_id}
                  onChange={formik.handleChange}
                  label="Category"
                  error={
                    formik.touched.category_id && Boolean(formik.errors.category_id)
                  }
                >
                  {categories.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </Select>
                {formik.touched.category_id && formik.errors.category_id && (
                  <Typography variant="caption" color="error" className="!mt-1 !ml-3">
                    {formik.errors.category_id}
                  </Typography>
                )}
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>Priority</InputLabel>
                <Select
                  name="priority"
                  value={formik.values.priority}
                  onChange={formik.handleChange}
                  label="Priority"
                  error={formik.touched.priority && Boolean(formik.errors.priority)}
                >
                  {priorities.map((p) => (
                    <MenuItem key={p} value={p}>
                      {p}
                    </MenuItem>
                  ))}
                </Select>
                {formik.touched.priority && formik.errors.priority && (
                  <Typography variant="caption" color="error" className="!mt-1 !ml-3">
                    {formik.errors.priority}
                  </Typography>
                )}
              </FormControl>

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
                      helperText: formik.touched.due_date && formik.errors.due_date,
                    },
                  }}
                />
              </LocalizationProvider>
            </div>
          </div>

          <Divider />

          {/* File Upload Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-6 rounded-full" style={{ backgroundColor: "#824EF2" }}></div>
              <Typography variant="subtitle1" className="!text-gray-800 !font-semibold !text-base">
                Attachments
              </Typography>
            </div>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  const newFiles = Array.from(e.dataTransfer.files);
                  formik.setFieldValue("files", [
                    ...(formik.values.files || []),
                    ...newFiles,
                  ]);
                }
              }}
              className={`min-h-40 relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all ${
                dragActive
                  ? "border-brand-500 bg-purple-50 scale-[1.01] shadow-md"
                  : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
              }`}
            >
              <input
                type="file"
                id="fileUpload"
                multiple
                className="hidden"
                onChange={(e) => {
                  const newFiles = Array.from(e.currentTarget.files || []);
                  formik.setFieldValue("files", [
                    ...(formik.values.files || []),
                    ...newFiles,
                  ]);
                }}
              />
              <label
                htmlFor="fileUpload"
                className="cursor-pointer flex flex-col items-center text-sm font-medium text-gray-600"
              >
                <ArrowUpTrayIcon
                  className={`h-8 w-8 mb-2 transition-colors ${
                    dragActive ||
                    (formik.values.files && formik.values.files.length > 0)
                      ? "text-brand-500"
                      : "text-gray-400"
                  }`}
                />
                <span className="block">Drag & drop files here</span>
                <span className="text-gray-400">or click to upload</span>
              </label>
            </div>

            {/* Preview Uploaded Files */}
            {formik.values.files && formik.values.files.length > 0 && (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {formik.values.files.map((file, index) => {
                  const isImage =
                    file.type?.startsWith("image/") ||
                    file.previewUrl?.match(/\.(jpg|jpeg|png|gif|webp)$/i);

                  return (
                    <div
                      key={index}
                      className="relative flex flex-col items-center border rounded-lg p-2"
                    >
                      {isImage ? (
                        <img
                          src={file.previewUrl || URL.createObjectURL(file)}
                          alt={file.name}
                          className="h-28 w-full object-cover rounded"
                        />
                      ) : (
                        <div className="h-28 w-full flex items-center justify-center bg-gray-100 text-xs text-gray-600 rounded">
                          {file.name.endsWith(".pdf") ? "📄 PDF File" : file.name}
                        </div>
                      )}

                      <Typography
                        variant="caption"
                        className="!mt-1 truncate w-full text-center capitalize"
                      >
                        {file.name}
                      </Typography>

                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        onClick={() => {
                          const updated = [...formik.values.files];
                          updated.splice(index, 1);
                          formik.setFieldValue("files", updated);
                        }}
                        sx={{
                          position: "absolute",
                          top: -8,
                          right: -8,
                          minWidth: 0,
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          p: 0,
                          fontSize: 12,
                        }}
                      >
                        ✕
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="!flex !justify-end !gap-3 !pt-4 !border-t !border-gray-200 !mt-6">
            <Button
              variant="outlined"
              onClick={() => navigate(`/projects/${projectId}`)}
              disabled={formik.isSubmitting}
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
              type="submit"
              variant="contained"
              disabled={formik.isSubmitting}
              sx={{
                boxShadow: "none",
                textTransform: "none",
                color: formik.isSubmitting ? "#6B7280" : "white",
                backgroundColor: formik.isSubmitting ? "#F3F4F6" : "#824EF2",
                "&:hover": {
                  backgroundColor: formik.isSubmitting ? "#F3F4F6" : "#6B3BC4",
                },
                "&:disabled": {
                  backgroundColor: "#F3F4F6",
                  color: "#6B7280",
                  cursor: "not-allowed",
                },
                transition: "all 0.2s ease",
                minWidth: 140,
              }}
              className="!px-8"
            >
              {formik.isSubmitting ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress 
                    size={18} 
                    sx={{ 
                      color: "#6B7280",
                      "& .MuiCircularProgress-circle": {
                        strokeLinecap: "round",
                      },
                    }} 
                  />
                  <span>Creating...</span>
                </Box>
              ) : (
                "Create Ticket"
              )}
            </Button>
          </div>
        </Box>
      </Card>
    </Box>
  );
}

