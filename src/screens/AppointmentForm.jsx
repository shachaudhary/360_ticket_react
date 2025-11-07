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
import { Autocomplete, TextField } from "@mui/material";

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

// Debounce helper
function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

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
  const [providerSearchTerm, setProviderSearchTerm] = useState("");
  const [providerSearchResults, setProviderSearchResults] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);

  const debouncedProviderSearch = useDebounce(providerSearchTerm, 400);

  // Time slots for appointment
  const timeSlots = [
    "08:00 AM",
    "08:30 AM",
    "09:00 AM",
    "09:30 AM",
    "10:00 AM",
    "10:30 AM",
    "11:00 AM",
    "11:30 AM",
    "12:00 PM",
    "12:30 PM",
    "01:00 PM",
    "01:30 PM",
    "02:00 PM",
    "02:30 PM",
    "03:00 PM",
    "03:30 PM",
    "04:00 PM",
    "04:30 PM",
    "05:00 PM",
  ];

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
        setProviderSearchResults(data); // Show all providers initially
      } catch (err) {
        console.error("Error fetching providers:", err);
      }
    };
    fetchProviders();
  }, [user?.clinic_id]);

  // Filter providers locally based on debounced search term
  useEffect(() => {
    if (!debouncedProviderSearch) {
      setProviderSearchResults(providers);
      return;
    }

    // Local filtering - no API call
    const filtered = providers.filter((p) =>
      p.provider_name
        ?.toLowerCase()
        .includes(debouncedProviderSearch.toLowerCase())
    );
    setProviderSearchResults(filtered);
  }, [debouncedProviderSearch, providers]);

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
                    className={`mt-2 block w-full border-b ${
                      errors.patientName ? "border-red-500" : "border-gray-300"
                    } bg-transparent py-2.5 px-1 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-0 sm:text-sm`}
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
                  <input
                    type="date"
                    name="dob"
                    id="dob"
                    value={formData.dob}
                    onChange={handleInputChange}
                    max={dayjs().format("YYYY-MM-DD")}
                    className={`mt-2 block w-full border-b ${
                      errors.dob ? "border-red-500" : "border-gray-300"
                    } bg-transparent py-2.5 px-1 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-0 sm:text-sm`}
                  />
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
                  <input
                    type="date"
                    name="appointmentDate"
                    id="appointmentDate"
                    value={formData.appointmentDate}
                    onChange={handleInputChange}
                    min={dayjs().format("YYYY-MM-DD")}
                    className={`mt-2 block w-full border-b ${
                      errors.appointmentDate
                        ? "border-red-500"
                        : "border-gray-300"
                    } bg-transparent py-2.5 px-1 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-0 sm:text-sm`}
                  />
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
                  <select
                    name="appointmentTime"
                    id="appointmentTime"
                    value={formData.appointmentTime}
                    onChange={handleInputChange}
                    className={`mt-2 block w-full border-0 border-b ${
                      errors.appointmentTime
                        ? "border-red-500"
                        : "border-gray-300"
                    } bg-transparent py-2.5 px-1 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-0 sm:text-sm appearance-none`}
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: "right 0.5rem center",
                      backgroundRepeat: "no-repeat",
                      backgroundSize: "1.5em 1.5em",
                      paddingRight: "2.5rem",
                    }}
                  >
                    <option value="">Select time</option>
                    {timeSlots.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
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
                  <div className="mt-2">
                    <Autocomplete
                      fullWidth
                      size="small"
                      options={providerSearchResults}
                      value={selectedProvider}
                      onChange={(e, newValue) => {
                        setSelectedProvider(newValue);
                        if (errors.provider) {
                          setErrors((prev) => ({ ...prev, provider: "" }));
                        }
                      }}
                      filterOptions={(x) => x}
                      getOptionLabel={(option) =>
                        option ? toProperCase(option.provider_name || "") : ""
                      }
                      isOptionEqualToValue={(option, value) =>
                        option?.id === value?.id
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Search and select provider..."
                          onChange={(e) =>
                            setProviderSearchTerm(e.target.value)
                          }
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              paddingTop: "6px",
                              paddingBottom: "6px",
                              borderRadius: "0px",
                              border: "none",
                              borderBottom: errors.provider
                                ? "1px solid #ef4444"
                                : "1px solid #d1d5db",
                              "&:hover": {
                                borderBottom: "1px solid #3b82f6",
                              },
                              "&.Mui-focused": {
                                borderBottom: "1px solid #3b82f6",
                                boxShadow: "none",
                              },
                              "& fieldset": {
                                border: "none",
                              },
                            },
                          }}
                        />
                      )}
                      renderOption={(props, option) => (
                        <li {...props} key={option.id}>
                          <div className="flex flex-col py-1">
                            <span className="font-medium text-gray-700">
                              {toProperCase(option.provider_name || "")}
                            </span>
                            {option.designation && (
                              <span className="text-xs text-gray-500">
                                {toProperCase(option.designation)}
                              </span>
                            )}
                          </div>
                        </li>
                      )}
                    />
                  </div>
                  {errors.provider && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.provider}
                    </p>
                  )}
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
                              ? "ring-2 ring-blue-500 border-blue-500 bg-indigo-50"
                              : "border-gray-300 bg-white hover:border-indigo-300"
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
                      ? "bg-indigo-400 cursor-not-allowed"
                      : "bg-blue-500 hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
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
