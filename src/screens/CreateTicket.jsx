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
  Card,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
} from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { ArrowUpTrayIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { MapPin, Phone, Mail } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import { useFormik } from "formik";
import * as Yup from "yup";
import BackButton from "../components/BackButton";
import { createAPIEndPoint } from "../config/api/api";
import { createAPIEndPointAuth } from "../config/api/apiAuth";
import { useApp } from "../state/AppContext";
import toast from "react-hot-toast";
import { toProperCase } from "../utils/formatting";

// const priorities = ["Low", "Medium", "High"];
const priorities = ["Low", "High", "Urgent"];

export default function TicketForm({ isEdit = false, projectId }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useApp();
  const [loadingTicket, setLoadingTicket] = useState(isEdit);
  const [dragActive, setDragActive] = useState(false);
  const [categories, setCategories] = useState([]);

  // Location state
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [locationSearchTerm, setLocationSearchTerm] = useState("");
  const [loadingLocations, setLoadingLocations] = useState(false);

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

  // Fetch locations from API
  useEffect(() => {
    const fetchLocations = async () => {
      if (!user?.clinic_id) return;

      setLoadingLocations(true);
      try {
        const res = await createAPIEndPointAuth(
          `clinic_locations/get_all/${user.clinic_id}`
        ).fetchAll();

        const data = res.data?.locations || [];
        const filtered = data.filter((loc) => {
          const name = (loc.location_name || "").trim().toLowerCase();
          return (
            loc.id !== 25 && // Sales Team
            loc.id !== 28 && // Insurance
            loc.id !== 30 && // Anonymous
            name !== "sales team" &&
            name !== "insurance" &&
            name !== "anonymous"
          );
        });

        const sorted = filtered.sort((a, b) => {
          const nameA = (a.display_name?.trim() || a.location_name?.trim() || "").toLowerCase();
          const nameB = (b.display_name?.trim() || b.location_name?.trim() || "").toLowerCase();
          return nameA.localeCompare(nameB);
        });

        setLocations(sorted);
      } catch (err) {
        console.error("Error fetching locations:", err);
      } finally {
        setLoadingLocations(false);
      }
    };

    fetchLocations();
  }, [user?.clinic_id]);

  const handleCancel = () => {
    if (isEdit && id) {
      navigate(`/tickets/${id}`);
    } else {
      navigate(projectId ? `/projects/${projectId}` : "/tickets");
    }
  };

  const formik = useFormik({
    initialValues: {
      title: "",
      details: "",
      category_id: "",
      due_date: null,
      priority: "Low",
      files: [],
      location_id: null,
    },
    validationSchema: Yup.object({
      title: Yup.string().required("Ticket title is required").min(3),
      details: Yup.string().required("Details are required").min(10),
      category_id: Yup.string().required("Please select a category"),
      priority: Yup.string().required("Please select a priority"),
      due_date: Yup.date().nullable().required("Please select a due date"),
      // .min(new Date(), "Due date cannot be in the past"),
      files: Yup.array().nullable(),
      location_id: Yup.number().nullable(),
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
        formData.append("clinic_id", user?.clinic_id || 1);
        if (values.location_id) {
          formData.append("location_id", values.location_id);
        }
        if (projectId) {
          formData.append("project_id", projectId);
        }

        let res;
        if (isEdit && id) {
          res = await createAPIEndPoint(`ticket/${id}`).patch(formData);
          toast.success("Ticket updated successfully!");
          navigate(`/tickets/${id}`);
        } else {
          res = await createAPIEndPoint("ticket").create(formData);
          toast.success("Ticket created successfully!");
          if (projectId) {
            navigate(`/projects/${projectId}`);
          } else {
            navigate("/tickets");
          }
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
    <Box>
      <div className="!flex !items-center !justify-start !gap-2 !mb-4">
        <BackButton self={isEdit ? -1 : projectId ? `/projects/${projectId}` : "/tickets"} />
        <h2 className="text-lg md:text-2xl font-semibold text-sidebar mb-1">
          {isEdit ? "Edit Ticket" : "Create New Ticket"}
        </h2>
      </div>

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

          {/* Location Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 rounded-full" style={{ backgroundColor: "#824EF2" }}></div>
              <Typography variant="subtitle1" className="!text-gray-800 !font-semibold !text-base">
                Location (Optional)
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<MapPinIcon className="h-4 w-4" />}
                onClick={() => setLocationModalOpen(true)}
                sx={{
                  textTransform: "none",
                  borderRadius: 1.25,
                  borderColor: "#824EF2",
                  color: "#824EF2",
                  "&:hover": {
                    borderColor: "#824EF2",
                    backgroundColor: "rgba(130, 78, 242, 0.04)",
                  },
                }}
              >
                {selectedLocation ? "Change" : "Add"} Location
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex-1">
                {selectedLocation ? (
                  <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                    <Typography variant="body2" className="!font-semibold !text-gray-800 !mb-1">
                      {selectedLocation.location_name || selectedLocation.display_name}
                    </Typography>
                    {selectedLocation.address && selectedLocation.address !== "N/A" && (
                      <Typography variant="caption" className="!text-gray-600 !block">
                        <MapPin className="!w-3 !h-3 !inline !mr-1" />
                        {toProperCase(selectedLocation.address)}
                        {selectedLocation.city && selectedLocation.city !== "N/A" && `, ${toProperCase(selectedLocation.city)}`}
                        {selectedLocation.state && selectedLocation.state !== "N/A" && `, ${toProperCase(selectedLocation.state)}`}
                      </Typography>
                    )}
                  </div>
                ) : (
                  <Typography variant="body2" className="!text-gray-500 !italic">
                    No location selected
                  </Typography>
                )}
              </div>

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
              className={`min-h-40 relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all ${dragActive
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
                  className={`h-8 w-8 mb-2 transition-colors ${dragActive ||
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
          </div>

          {/* Actions */}
          <div className="!flex !justify-end !gap-3 !pt-4 !border-t !border-gray-200 !mt-6">
            <Button
              variant="outlined"
              onClick={handleCancel}
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
                  <span>{isEdit ? "Updating..." : "Creating..."}</span>
                </Box>
              ) : isEdit ? (
                "Update"
              ) : (
                "Create Ticket"
              )}
            </Button>
          </div>
        </Box>
      </Card>

      {/* Location Modal */}
      <Dialog
        open={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle className="!text-lg !font-semibold !flex !items-center !gap-2">
          <MapPinIcon className="!h-5 !w-5 !text-brand-500" />
          {selectedLocation ? "Change Location" : "Add Location"}
        </DialogTitle>
        <DialogContent dividers>
          <Autocomplete
            size="medium"
            fullWidth
            options={locations}
            value={selectedLocation}
            onChange={(e, newValue) => setSelectedLocation(newValue)}
            onInputChange={(e, newInputValue) => setLocationSearchTerm(newInputValue)}
            loading={loadingLocations}
            filterOptions={(options, params) => {
              const filtered = options.filter((option) => {
                const searchLower = params.inputValue.toLowerCase();
                const name = (option.display_name || option.location_name || "").toLowerCase();
                const address = (option.address || "").toLowerCase();
                const city = (option.city || "").toLowerCase();
                const state = (option.state || "").toLowerCase();
                return (
                  name.includes(searchLower) ||
                  address.includes(searchLower) ||
                  city.includes(searchLower) ||
                  state.includes(searchLower)
                );
              });
              return filtered;
            }}
            getOptionLabel={(option) =>
              option ? (option.display_name || option.location_name || "") : ""
            }
            isOptionEqualToValue={(option, value) => option.id === value?.id}
            renderOption={(props, option) => {
              const isSelected = selectedLocation && selectedLocation.id === option.id;

              return (
                <li
                  {...props}
                  key={option.id}
                  className={`!py-2.5 !px-3 !cursor-pointer !transition-all !duration-200 ${isSelected
                    ? "!bg-gray-100"
                    : "hover:!bg-gray-100"
                    }`}
                >
                  <div className="!flex !flex-col">
                    <span className="!font-semibold !text-gray-800 !text-sm">
                      {option.location_name || option.display_name}
                    </span>
                    {option.email && (
                      <span className="!text-xs !text-gray-500 !mt-1">
                        <Mail className="!w-3.5 !h-3.5 !inline !mr-1" /> {option.email}
                      </span>
                    )}
                  </div>
                </li>
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search Location"
                placeholder="Type to search locations..."
                autoComplete="off"
                inputProps={{
                  ...params.inputProps,
                  autoComplete: "off",
                }}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingLocations && <CircularProgress size={20} />}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            noOptionsText={loadingLocations ? "Loading locations..." : "No locations found"}
          />
          {selectedLocation && (
            <div className="!mt-4 !p-3 !bg-purple-50 !rounded-lg !border !border-purple-200">
              <Typography variant="caption" className="!text-gray-600 !block !mb-2 !font-medium">
                Selected Location:
              </Typography>
              <Typography variant="body2" className="!font-semibold !text-gray-800 !mb-1">
                {selectedLocation.display_name || selectedLocation.location_name}
              </Typography>
              {selectedLocation.address && selectedLocation.address !== "N/A" && (
                <Typography variant="caption" className="!text-gray-600 !block">
                  {toProperCase(selectedLocation.address)}
                  {selectedLocation.city && selectedLocation.city !== "N/A" && `, ${toProperCase(selectedLocation.city)}`}
                  {selectedLocation.state && selectedLocation.state !== "N/A" && `, ${toProperCase(selectedLocation.state)}`}
                </Typography>
              )}
            </div>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.5 }}>
          <Button
            onClick={() => setLocationModalOpen(false)}
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
            onClick={() => {
              formik.setFieldValue("location_id", selectedLocation?.id || null);
              setLocationModalOpen(false);
            }}
            variant="contained"
            color="primary"
            sx={{
              boxShadow: "none",
              textTransform: "none",
              color: "white",
              minWidth: 90,
            }}
          >
            {selectedLocation ? "Select" : "Clear"}
          </Button>
        </DialogActions>
      </Dialog>
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
