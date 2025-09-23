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
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { useFormik } from "formik";
import * as Yup from "yup";
import BackButton from "../components/BackButton";
import { createAPIEndPoint } from "../config/api/api";
import { useApp } from "../state/AppContext";
import toast from "react-hot-toast";

// const priorities = ["Low", "Medium", "High"];
const priorities = ["Low", "High", "Urgent"];

export default function TicketForm() {
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
      file: null,
    },
    validationSchema: Yup.object({
      title: Yup.string().required("Ticket title is required").min(3),
      details: Yup.string().required("Details are required").min(10),
      category_id: Yup.string().required("Please select a category"),
      priority: Yup.string().required("Please select a priority"),
      due_date: Yup.date().nullable().required("Please select a due date"),
      // .min(new Date(), "Due date cannot be in the past"),
      file: Yup.mixed().nullable(),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const formData = new FormData();
        Object.keys(values).forEach((key) => {
          if (key === "file" && values.file) {
            formData.append("files", values.file);
          } else if (key === "due_date" && values.due_date) {
            // ✅ Fix: format Dayjs → YYYY-MM-DD
            formData.append(
              "due_date",
              dayjs(values.due_date).format("YYYY-MM-DD")
            );
          } else {
            formData.append(key, values[key]);
          }
        });

        // Add required fields for backend
        formData.append("clinic_id", 1);
        formData.append("location_id", 30);
        formData.append("user_id", user?.id);

        const res = await createAPIEndPoint("ticket").create(formData);
        console.log("Ticket created:", res.data);
        // ✅ Show toast here
        toast.success("Ticket created successfully!");
        navigate("/tickets");
      } catch (error) {
        console.error("Error creating ticket:", error);
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

  return (
    <Box component="form" onSubmit={formik.handleSubmit} className=" bg-white">
      <BackButton self="/tickets" />

      <div className="space-y-4 mt-4 border-0">
        <h2 className="text-lg md:text-xl font-semibold mb-1">
          Create New Ticket
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
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`min-h-36 relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all ${
            dragActive
              ? "border-brand-500 bg-green-50 scale-[1.01]"
              : "border-[#D1D5DB] bg-[#FFF]"
          }`}
        >
          <input
            type="file"
            id="fileUpload"
            className="hidden"
            onChange={(e) =>
              formik.setFieldValue("file", e.currentTarget.files[0])
            }
          />
          <label
            htmlFor="fileUpload"
            className="cursor-pointer flex flex-col items-center text-sm font-medium text-gray-600"
          >
            <ArrowUpTrayIcon
              className={`h-8 w-8 mb-2 transition-colors ${
                dragActive || formik.values.file
                  ? "text-brand-500"
                  : "text-gray-400"
              }`}
            />
            {formik.values.file ? (
              <span className="text-gray-500 !text-sm font-medium">
                {formik.values.file.name}
              </span>
            ) : (
              <>
                <span className="block">Drag & drop file here</span>
                <span className="text-gray-400">or click to upload</span>
              </>
            )}
          </label>
        </div>

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
