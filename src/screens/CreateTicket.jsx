import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
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

// const priorities = ["Low", "Medium", "High"];
const priorities = ["Low", "High", "Urgent"];

export default function TicketForm({ isEdit = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useApp();
  const [loadingTicket, setLoadingTicket] = useState(isEdit);
  const [dragActive, setDragActive] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (isEdit && id) {
      const fetchTicket = async () => {
        try {
          const res = await createAPIEndPoint(`ticket/${id}`).fetchAll();
          const t = res.data;

          // Normalize existing files
          const existingFiles = (t.files || []).map((f) => ({
            name: f.name,
            previewUrl: f.url,
            isExisting: true, // mark so we don’t re-upload
          }));

          formik.setValues({
            title: t.title || "",
            details: t.details || "",
            category_id: t.category?.id || "",
            due_date: t.due_date ? dayjs(t.due_date) : null,
            priority: t.priority || "Low",
            files: existingFiles,
          });
        } catch (err) {
          toast.error("Failed to load ticket");
        } finally {
          setLoadingTicket(false);
        }
      };
      fetchTicket();
    }
  }, [id, isEdit]);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await createAPIEndPoint("category").fetchAll();
        setCategories(res.data || []);
      } catch (err) {
        console.error("Error fetching categories:", err);
        // fallback fake categories
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

  const handleCancel = () => {
    navigate("/tickets");
  };

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
      // .min(new Date(), "Due date cannot be in the past"),
      files: Yup.array().nullable(),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const formData = new FormData();
        Object.keys(values).forEach((key) => {
          if (key === "files" && values.files?.length > 0) {
            values.files.forEach((f) => {
              if (!f.isExisting) {
                // only append new files, not already existing ones
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

        let res;
        if (isEdit && id) {
          res = await createAPIEndPoint(`ticket/${id}`).patch(formData);
          toast.success("Ticket updated successfully!");
        } else {
          res = await createAPIEndPoint("ticket").create(formData);
          toast.success("Ticket created successfully!");
        }
        navigate("/tickets");
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
      newDate = dayjs().add(7, "day"); // +7 days
    } else if (priority === "High") {
      newDate = dayjs().add(1, "day"); // Next day
    } else if (priority === "Urgent") {
      newDate = dayjs(); // Today
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

  if (loadingTicket) {
    return (
      <div className="overflow-hidden">
        <div className="overflow-auto h-[calc(100dvh-92px)] flex items-center justify-center">
          <CircularProgress size={40} color="primary" />
        </div>
      </div>
    );
  }

  return (
    <Box component="form" onSubmit={formik.handleSubmit} className=" bg-white">
      <BackButton self={isEdit ? -1 : "/tickets"} />

      <div className="space-y-4 mt-4 border-0">
        <h2 className="text-lg md:text-xl font-semibold mb-1">
          {isEdit ? "Edit Ticket" : "Create New Ticket"}
        </h2>

        {/* Title */}
        <TextField
          // label="Title"
          label="Issue"
          name="title"
          fullWidth
          size="small"
          value={formik.values.title}
          onChange={formik.handleChange}
          error={formik.touched.title && Boolean(formik.errors.title)}
          helperText={formik.touched.title && formik.errors.title}
        />

        {/* Details */}
        <TextField
          label="Details"
          name="details"
          fullWidth
          size="small"
          multiline
          minRows={3}
          value={formik.values.details}
          onChange={formik.handleChange}
          error={formik.touched.details && Boolean(formik.errors.details)}
          helperText={formik.touched.details && formik.errors.details}
        />

        {/* Category */}
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
            <Typography variant="caption" color="error">
              {formik.errors.category_id}
            </Typography>
          )}
        </FormControl>

        {/* Priority */}
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
            <Typography variant="caption" color="error">
              {formik.errors.priority}
            </Typography>
          )}
        </FormControl>

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
                helperText: formik.touched.due_date && formik.errors.due_date,
              },
            }}
          />
        </LocalizationProvider>

        {/* File Upload */}
        {/* File Upload */}
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
          className={`min-h-36 relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all ${
            dragActive
              ? "border-brand-500 bg-green-50 scale-[1.01]"
              : "border-[#D1D5DB] bg-[#FFF]"
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
                  {/* Show preview if image */}
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

                  {/* Filename */}
                  <Typography
                    variant="caption"
                    className="!mt-1 truncate w-full text-center capitalize"
                  >
                    {file.name}
                  </Typography>

                  {/* Remove button */}
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

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button
            variant="outlined"
            color="error"
            onClick={handleCancel}
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
            type="submit"
            variant="contained"
            color="primary"
            sx={{ boxShadow: "none", textTransform: "none", color: "white" }}
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

const Label = ({ title, value }) => (
  <div>
    <Typography variant="caption" sx={{ fontWeight: 500, color: "#7E858D" }}>
      {title}
    </Typography>
    <Typography variant="body2" sx={{ fontWeight: 500, color: "#202321" }}>
      {value || "--"}
    </Typography>
  </div>
);
