import React, { useState, useRef, useEffect } from "react";
import brandLogo from "../assets/brand-logo.png";
import { createAPIEndPoint } from "../config/api/api";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import { useNavigate, useParams } from "react-router-dom";
import { useApp } from "../state/AppContext";
import { createAPIEndPointAuth } from "../config/api/apiAuth";
import { toProperCase } from "../utils/formatting";
import BackButton from "../components/BackButton";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { Menu, MenuItem, TextField, InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const AppointmentForm = () => {
  const { user } = useApp();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    patientName: "",
    dob: "",
    appointmentDate: "",
    appointmentTime: "",
    location: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [locations, setLocations] = useState([]);
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [providerMenuAnchor, setProviderMenuAnchor] = useState(null);
  const [providerSearchTerm, setProviderSearchTerm] = useState("");

  // Filter providers based on search term
  const filteredProviders = providers.filter((provider) =>
    provider.provider_name
      ?.toLowerCase()
      .includes(providerSearchTerm.toLowerCase())
  );

  // Fetch Locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await createAPIEndPointAuth(
          `clinic_locations/get_all/${user?.clinic_id}`
        ).fetchAll();

        const data = res.data?.locations || [];
        const filtered = data.filter((loc) => {
          const name = (loc.location_name || "").trim().toLowerCase();
          return (
            loc.id !== 25 &&
            loc.id !== 28 &&
            name !== "sales team" &&
            name !== "insurance"
          );
        });

        setLocations(filtered);
      } catch (err) {
        console.error("Error fetching locations:", err);
      }
    };
    if (user?.clinic_id) fetchLocations();
  }, [user?.clinic_id]);

  // Fetch all providers initially
  useEffect(() => {
    const fetchProviders = async () => {
      if (!user?.clinic_id) return;

      try {
        const res = await createAPIEndPointAuth(
          `clinic_providers/get_all/${user.clinic_id}`
        ).fetchAll();
        const data = res.data?.providers || res.data || [];
        setProviders(data);
      } catch (err) {
        console.error("Error fetching providers:", err);
      }
    };
    fetchProviders();
  }, [user?.clinic_id]);

  // Load edit data if in edit mode
  useEffect(() => {
    const loadEditData = async () => {
      if (
        !isEditMode ||
        !id ||
        locations.length === 0 ||
        providers.length === 0
      )
        return;

      try {
        const res = await createAPIEndPoint(
          `form_entries/details/${id}`
        ).fetchAll();
        const entry = res.data;
        if (!entry) return;

        const mapped = {};
        entry.field_values?.forEach((f) => {
          mapped[f.field_name.toLowerCase()] = f.field_value;
        });

        const locationMatch = locations.find(
          (l) =>
            l.location_name.trim().toLowerCase() ===
            mapped["location"]?.trim().toLowerCase()
        );

        // Find matching provider
        const providerMatch = providers.find(
          (p) =>
            p.provider_name?.trim().toLowerCase() ===
            mapped["provider"]?.trim().toLowerCase()
        );

        setFormData({
          patientName: mapped["patient_name"] || "",
          dob: mapped["dob"] || "",
          appointmentDate: mapped["appointment_date"] || "",
          appointmentTime: mapped["appointment_time"] || "",
          location: locationMatch
            ? locationMatch.location_name
            : mapped["location"] || "",
        });

        // Set selected provider if found
        if (providerMatch) {
          setSelectedProvider(providerMatch);
        }
      } catch (err) {
        console.error("Failed to load form for edit:", err);
        setSubmitStatus({
          type: "error",
          message: "Unable to load form data",
        });
      }
    };

    loadEditData();
  }, [isEditMode, id, locations, providers]);

  // Validation functions
  const validateName = (name) => {
    return name.trim().length >= 2 && /^[a-zA-Z\s'-]+$/.test(name);
  };

  const validateDate = (date, field) => {
    if (!date) return false;

    const selected = dayjs(date);
    const today = dayjs().startOf("day");

    if (!selected.isValid()) return false;

    if (field === "dob") {
      // DOB must be in the past
      return selected.isBefore(today, "day");
    }
    if (field === "appointmentDate") {
      // Appointment date can be today or future
      return !selected.isBefore(today, "day");
    }
    return true;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.patientName.trim()) {
      newErrors.patientName = "Patient name is required";
    } else if (!validateName(formData.patientName)) {
      newErrors.patientName =
        "Please enter a valid name (letters only, min 2 characters)";
    }

    if (!formData.dob) {
      newErrors.dob = "Date of birth is required";
    } else if (!validateDate(formData.dob, "dob")) {
      newErrors.dob = "Please enter a valid date of birth";
    }

    if (!formData.appointmentDate) {
      newErrors.appointmentDate = "Appointment date is required";
    } else if (!validateDate(formData.appointmentDate, "appointmentDate")) {
      newErrors.appointmentDate = "Appointment date cannot be in the past";
    }

    if (!formData.appointmentTime) {
      newErrors.appointmentTime = "Appointment time is required";
    }

    if (!selectedProvider) {
      newErrors.provider = "Please select a provider";
    }

    if (!formData.location) {
      newErrors.location = "Please select a location";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleRadioChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const toField = (field_name, field_value) => {
    if (
      field_value === undefined ||
      field_value === null ||
      (typeof field_value === "string" && field_value.trim() === "") ||
      (Array.isArray(field_value) && field_value.length === 0)
    ) {
      return null;
    }
    return {
      field_name,
      field_value: Array.isArray(field_value)
        ? field_value.join(", ")
        : field_value,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isValid = validateForm();
    if (!isValid) {
      setSubmitStatus({
        type: "error",
        message: "Please fix all errors before submitting",
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const submitted_by_id = user?.id;
      const clinic_id = user?.clinic_id;
      const location_id = 30;

      const payload = {
        form_type: "appointment",
        form_type_id: 2,
        submitted_by_id,
        clinic_id,
        location_id,
        field_values: [
          toField("patient_name", formData.patientName),
          toField(
            "dob",
            formData.dob ? dayjs(formData.dob).format("YYYY-MM-DD") : ""
          ),
          toField(
            "appointment_date",
            formData.appointmentDate
              ? dayjs(formData.appointmentDate).format("YYYY-MM-DD")
              : ""
          ),
          toField("appointment_time", formData.appointmentTime),
          toField("provider", selectedProvider?.provider_name || ""),
          toField("location", formData.location),
        ].filter(Boolean),
      };

      console.log("Submitting appointment payload:", payload);

      let response;
      if (isEditMode) {
        response = await createAPIEndPoint(
          `form_entries/field_values/${id}`
        ).patch(payload);
        setSubmitStatus({
          type: "success",
          message: "Appointment updated successfully!",
        });
      } else {
        response = await createAPIEndPoint(
          "form_entries/field_values"
        ).createWithJSONFormat(payload);
        setSubmitStatus({
          type: "success",
          message: "Appointment form submitted successfully.",
        });
      }

      navigate(-1);
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Reset form
      setFormData({
        patientName: "",
        dob: "",
        appointmentDate: "",
        appointmentTime: "",
        location: "",
      });
      setSelectedProvider(null);
      setErrors({});
    } catch (error) {
      console.error("Error submitting form:", error);
      
      const apiMsg =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to submit form. Please try again.";

      setSubmitStatus({
        type: "error",
        message: apiMsg,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center overflow-hidden -ml-1">
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>

      <div className="relative w-full mx-auto">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob hidden lg:block"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#c2dcf7] rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000 hidden lg:block"></div>

        <div className="dental360-form relative bg-white">
          <div className="bg-red text-white p-8 lg:p-12 rounded-t-2xl relative overflow-hidden border">
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-700 rounded-full -translate-x-1/3 translate-y-1/3 opacity-50"></div>

            <div className="flex absolute top-5 left-5">
              <BackButton self="/forms/2/submissions/appointment-form" />
            </div>

            <div className="relative z-10">
              <h1 className="text-4xl text-center font-extrabold mb-6 text-brand-700">
                {isEditMode ? "Edit APPOINTMENT FORM" : "APPOINTMENT FORM"}
              </h1>

              <img
                src={brandLogo}
                alt="Dental 360 & Associates"
                className="h-16 w-full object-contain"
              />

              <div className="space-y-0 text-[13.5px] text-center"></div>
            </div>
          </div>

          <div className="bg-white p-8 lg:p-12 rounded-b-2xl">
            {submitStatus && (
              <div
                className={`mb-6 p-4 rounded-md ${
                  submitStatus.type === "success"
                    ? "bg-purple-50 border border-green-200 text-green-800"
                    : "bg-red-50 border border-red-200 text-red-800"
                }`}
              >
                {submitStatus.message}
              </div>
            )}

            <div className="space-y-8">
              <h3 className="text-2xl font-bold mb-6 pt-4 text-gray-800 border-b pb-2">
                Appointment Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Patient Name */}
                <div>
                  <label
                    htmlFor="patientName"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Patient Name <Asterisk />
                  </label>
                  <input
                    type="text"
                    name="patientName"
                    id="patientName"
                    value={formData.patientName}
                    onChange={handleInputChange}
                    className={`mt-2 block w-full !border-b ${
                      errors.patientName ? "border-red-500" : "border-[rgba(0, 0, 0, 0.42)]"
                    } bg-transparent py-[5.5px] px-1 text-gray-900 placeholder-gray-400 focus:!border-brand-500 focus:outline-none focus:ring-0 sm:text-sm`}
                  />
                  {errors.patientName && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.patientName}
                    </p>
                  )}
                </div>

                {/* Date of Birth */}
                <div>
                  <label
                    htmlFor="dob"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Date of Birth <Asterisk />
                  </label>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      value={formData.dob ? dayjs(formData.dob) : null}
                      onChange={(newValue) => {
                        setFormData((prev) => ({
                          ...prev,
                          dob: newValue ? newValue.format("YYYY-MM-DD") : "",
                        }));
                        if (errors.dob) {
                          setErrors((prev) => ({ ...prev, dob: "" }));
                        }
                      }}
                      maxDate={dayjs()}
                      format="MM/DD/YYYY"
                      slotProps={{
                        textField: {
                          placeholder: "mm/dd/yyyy",
                          fullWidth: true,
                          variant: "standard",
                          sx: {
                            mt: 1,
                            "& .MuiInput-root": {
                              fontSize: "0.875rem",
                              "&:before": {
                                borderBottom: errors.dob
                                  ? "1px solid #ef4444"
                                  : "1px solid #D1D5DB",
                              },
                              "&:hover:not(.Mui-disabled):before": {
                                borderBottom: "1px solid #824EF2 !important",
                              },
                              "&:after": {
                                borderBottom: "2px solid #824EF2 !important",
                              },
                            },
                            "& .MuiInputBase-input": {
                              padding: "10px 4px",
                              fontSize: "0.875rem",
                            },
                          },
                        },
                      }}
                    />
                  </LocalizationProvider>
                  {errors.dob && (
                    <p className="mt-1 text-sm text-red-600">{errors.dob}</p>
                  )}
                </div>

                {/* Appointment Date */}
                <div>
                  <label
                    htmlFor="appointmentDate"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Appointment Date <Asterisk />
                  </label>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      value={
                        formData.appointmentDate
                          ? dayjs(formData.appointmentDate)
                          : null
                      }
                      onChange={(newValue) => {
                        setFormData((prev) => ({
                          ...prev,
                          appointmentDate: newValue
                            ? newValue.format("YYYY-MM-DD")
                            : "",
                        }));
                        if (errors.appointmentDate) {
                          setErrors((prev) => ({
                            ...prev,
                            appointmentDate: "",
                          }));
                        }
                      }}
                      minDate={dayjs()}
                      format="MM/DD/YYYY"
                      slotProps={{
                        textField: {
                          placeholder: "mm/dd/yyyy",
                          fullWidth: true,
                          variant: "standard",
                          sx: {
                            mt: 1,
                            "& .MuiInput-root": {
                              fontSize: "0.875rem",
                              "&:before": {
                                borderBottom: errors.appointmentDate
                                  ? "1px solid #ef4444"
                                  : "1px solid #d1d5db",
                              },
                              "&:hover:not(.Mui-disabled):before": {
                                borderBottom: "1px solid #824EF2",
                              },
                              "&:after": {
                                borderBottom: "2px solid #824EF2",
                              },
                            },
                            "& .MuiInputBase-input": {
                              padding: "10px 4px",
                              fontSize: "0.875rem",
                            },
                          },
                        },
                      }}
                    />
                  </LocalizationProvider>
                  {errors.appointmentDate && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.appointmentDate}
                    </p>
                  )}
                </div>

                {/* Appointment Time */}
                <div>
                  <label
                    htmlFor="appointmentTime"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Appointment Time <Asterisk />
                  </label>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <TimePicker
                      value={
                        formData.appointmentTime
                          ? dayjs(formData.appointmentTime, "hh:mm A")
                          : null
                      }
                      onChange={(newValue) => {
                        setFormData((prev) => ({
                          ...prev,
                          appointmentTime: newValue
                            ? newValue.format("hh:mm A")
                            : "",
                        }));
                        if (errors.appointmentTime) {
                          setErrors((prev) => ({
                            ...prev,
                            appointmentTime: "",
                          }));
                        }
                      }}
                      minutesStep={30}
                      slotProps={{
                        textField: {
                          placeholder: "hh:mm aa",
                          fullWidth: true,
                          variant: "standard",
                          sx: {
                            mt: 1,
                            "& .MuiInput-root": {
                              fontSize: "0.875rem",
                              "&:before": {
                                borderBottom: errors.appointmentTime
                                  ? "1px solid #ef4444"
                                  : "1px solid #d1d5db",
                              },
                              "&:hover:not(.Mui-disabled):before": {
                                borderBottom: "1px solid #824EF2",
                              },
                              "&:after": {
                                borderBottom: "2px solid #824EF2",
                              },
                            },
                            "& .MuiInputBase-input": {
                              padding: "10px 4px",
                              fontSize: "0.875rem",
                            },
                          },
                        },
                      }}
                    />
                  </LocalizationProvider>
                  {errors.appointmentTime && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.appointmentTime}
                    </p>
                  )}
                </div>

                {/* Provider - Full Width */}
                <div className="sm:col-span-2">
                  <label
                    htmlFor="provider"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Provider <Asterisk />
                  </label>
                  <div
                    onClick={(e) => {
                      setProviderMenuAnchor(e.currentTarget);
                      setProviderSearchTerm("");
                    }}
                    className={`mt-2 block w-full border-0 border-b ${
                      errors.provider ? "border-red-500" : "border-gray-300"
                    } bg-transparent py-2.5 px-1 text-gray-900 cursor-pointer hover:border-brand-500 transition-colors sm:text-sm flex items-center justify-between`}
                  >
                    <span
                      className={
                        selectedProvider
                          ? "text-gray-900"
                          : "text-gray-400"
                      }
                    >
                      {selectedProvider
                        ? toProperCase(selectedProvider.provider_name || "")
                        : "Search and select provider..."}
                    </span>
                    <KeyboardArrowDownIcon
                      sx={{ fontSize: 20, color: "#6b7280" }}
                    />
                  </div>
                  {errors.provider && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.provider}
                    </p>
                  )}

                  {/* Provider Menu */}
                  <Menu
                    anchorEl={providerMenuAnchor}
                    open={Boolean(providerMenuAnchor)}
                    onClose={() => {
                      setProviderMenuAnchor(null);
                      setProviderSearchTerm("");
                    }}
                    PaperProps={{
                      sx: {
                        maxHeight: 400,
                        width: providerMenuAnchor
                          ? providerMenuAnchor.offsetWidth
                          : 300,
                        mt: 0.5,
                      },
                    }}
                  >
                    {/* Search Field */}
                    <div className="px-3 py-2 sticky top-0 bg-white z-10 border-b">
                      <TextField
                        size="small"
                        fullWidth
                        placeholder="Search provider..."
                        value={providerSearchTerm}
                        onChange={(e) => setProviderSearchTerm(e.target.value)}
                        autoFocus
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon fontSize="small" />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "8px",
                          },
                        }}
                      />
                    </div>

                    {/* Provider List */}
                    <div className="max-h-72 overflow-auto">
                      {filteredProviders.length > 0 ? (
                        filteredProviders.map((provider) => (
                          <MenuItem
                            key={provider.id}
                            onClick={() => {
                              setSelectedProvider(provider);
                              setProviderMenuAnchor(null);
                              setProviderSearchTerm("");
                              if (errors.provider) {
                                setErrors((prev) => ({
                                  ...prev,
                                  provider: "",
                                }));
                              }
                            }}
                            selected={
                              selectedProvider?.id === provider.id
                            }
                          >
                            <div className="flex flex-col py-1">
                              <span className="font-medium text-gray-800 text-sm">
                                {toProperCase(provider.provider_name || "")}
                              </span>
                              {provider.designation && (
                                <span className="text-xs text-gray-500">
                                  {toProperCase(provider.designation)}
                                </span>
                              )}
                            </div>
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem disabled>
                          <span className="text-gray-500 text-sm">
                            No providers found
                          </span>
                        </MenuItem>
                      )}
                    </div>
                  </Menu>
                </div>
              </div>

              {/* Location Section */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  Office Location (Select One) <Asterisk />
                </label>

                <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  {locations.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">
                      Loading locations...
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {locations.map((loc) => (
                        <label
                          key={loc.id}
                          className={`flex items-center p-2 border rounded-lg cursor-pointer transition-all duration-200 ${
                            formData.location === loc.location_name
                              ? "ring-2 ring-brand-500 border-brand-500 bg-purple-50"
                              : "border-gray-300 bg-white hover:border-brand-300"
                          }`}
                        >
                          <input
                            type="radio"
                            checked={formData.location === loc.location_name}
                            onChange={() =>
                              handleRadioChange("location", loc.location_name)
                            }
                            className="sr-only"
                          />
                          <span className="text-sm font-medium text-gray-700 w-full text-center">
                            {loc.location_name}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {errors.location && (
                  <p className="mt-1 text-sm text-red-600">{errors.location}</p>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`w-full sm:w-auto rounded-md px-8 py-3.5 text-base font-semibold text-white shadow-sm transition-colors duration-300 ${
                    isSubmitting
                      ? "bg-brand-400 cursor-not-allowed"
                      : "bg-brand-500 hover:bg-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                  }`}
                >
                  {isSubmitting
                    ? isEditMode
                      ? "Updating..."
                      : "Submitting..."
                    : isEditMode
                    ? "Update"
                    : "Submit"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentForm;

const Asterisk = () => {
  return <span className="text-red-500">*</span>;
};
