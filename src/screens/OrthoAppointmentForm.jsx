import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Phone,
  Mail,
  Send,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Autocomplete, TextField } from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { createAPIEndPoint } from "../config/api/api";
import { createAPIEndPointAppointment } from "../config/api/apiAppointment";
import { useApp } from "../state/AppContext";
import { toProperCase1 } from "../utils/formatting";

// Static ortho locations based on the image and JSON data
const ORTHO_LOCATIONS = [
  {
    id: 37,
    display_name: "Dental 360 - Belmont",
    location_name: "Dental 360 Belmont",
    address: "4849 W. Belmont Ave",
    city: "Chicago",
    state: "IL",
    postal_code: "60641",
    phone: "(773) 930-4943",
    email: "belmont@dental360grp.com",
    hours: "Dr. Herrera - Tuesday (1st-4th Week)",
  },
  {
    id: 23,
    display_name: "Dental 360 - Berwyn",
    location_name: "Dental 360 Berwyn",
    address: "6301 W. Berwyn Rd, Berwyn, IL 60402",
    city: "berwyn",
    state: "illinois",
    postal_code: "60402",
    phone: "(708) 998-5305",
    email: "berwyn@dental360grp.com",
    hours: "Dr. Shaymaa - Thursday (1st Week), Thursday (2nd Week)",
  },
  {
    id: 22,
    display_name: "Dental 360 - Bucktown",
    location_name: "Bucktown",
    address: "2500 W North Ave",
    city: "CHICAGO",
    state: "illinois",
    postal_code: "60647",
    phone: null,
    email: "bucktown@dental360grp.com",
    hours: "Dr. Herrera - Thursday (2nd, 3rd, 4th Week)",
  },
  {
    id: 41,
    display_name: "Dental 360 - Clark",
    location_name: "Clark",
    address: "6720 N. Clark Ave",
    city: "Chicago",
    state: "IL",
    postal_code: "60626",
    phone: "(773) 338-8470",
    email: "clark@dental360grp.com",
    hours: "Dr. Bhukar - Friday (1st Week), Friday (3rd Week)",
  },
  {
    id: 1,
    display_name: "Dental 360 - Irving Park Famly Dental",
    location_name: "Irving Park Family Dentist",
    address: "3435 W Irving Park Rd, Chicago IL ",
    city: null,
    state: "Illinois",
    postal_code: "60618",
    phone: null,
    email: null,
    hours: "Dr. Herrera - Wednesday (1st, 2nd, 4th, 5th Week), Saturday (3rd Week)",
  },
  {
    id: 20,
    display_name: "Dental 360 - Kenosha",
    location_name: "Dental 360 Kenosha",
    address: "3726 Roosevelt Rd, Kenosha, WI 53142",
    city: "Kenosha",
    state: "WI",
    postal_code: "53142",
    phone: "(262) 652-7956",
    email: "kenosha@dental360grp.com",
    hours: "Dr. Shaymaa - Wednesday (1st Week), Thursday (4th Week)",
  },
  {
    id: 12,
    display_name: "Dental 360 - Lawndale",
    location_name: "Lawndale Dental LLC",
    address: "3600 W Roosevelt Rd, Chicago, IL ",
    city: "Chicago",
    state: "Illinois",
    postal_code: "60624",
    phone: "(773) 565-4042",
    email: "lawndale@dental360grp.com",
    hours: "Dr. Shaymaa - Monday (2nd Week), Monday (4th Week)",
  },
  {
    id: 27,
    display_name: "Dental 360 - Little Village",
    location_name: "Little Village Smiles 360",
    address: "3855 Little Village Smiles, Chicago IL ",
    city: "CHICAGO",
    state: "illinois",
    postal_code: "60647-4640",
    phone: "(773) 487-8325",
    email: "littlevillage@dental360grp.com",
    hours: "Dr. Herrera - Monday (1st Week), Monday (3rd Week)",
  },
  {
    id: 40,
    display_name: "Dental 360 - Logan Square",
    location_name: "Dental 360 Logan Square",
    address: "2314 N. Milwaukee Ave Suite B",
    city: "Chicago",
    state: "IL",
    postal_code: "60647",
    phone: "(123) 123-1231",
    email: "logansquare@dental360grp.com",
    hours: "Dr. Bhukar - Friday (2nd Week)",
  },
  {
    id: 18,
    display_name: "Dental 360 - Mitchell St",
    location_name: "Mitchell Street Dental",
    address: "710 W Historic Mitchell St Milwaukee, Wisconsin 53204",
    city: "MILWAUKEE",
    state: "WISCONSIN",
    postal_code: "53204",
    phone: "(414) 420-1621",
    email: "mitchell@dental360grp.com",
    hours: "Dr. Shaymaa - Various schedules",
  },
  {
    id: 13,
    display_name: "Dental 360 - Mundelein",
    location_name: "Mundelein Dental Clinic",
    address: "3074 W IL Route 60, Mundelein IL ",
    city: "Mundelein",
    state: "Illinois",
    postal_code: "60060",
    phone: "(847) 970-7070",
    email: "Mundelein@dental360grp.com",
    hours: "Dr. Shaymaa - Tuesday (1st Week), Tuesday (3rd Week)",
  },
  {
    id: 15,
    display_name: "Dental 360 - North Ave",
    location_name: "Family Dental Group, Inc",
    address: "3855 W North Avenue, Chicago IL ",
    city: "CHICAGO",
    state: "illinois",
    postal_code: "60647-4640",
    phone: "(773) 782-8900",
    email: "northave@dental360grp.com",
    hours: "Dr. Herrera - Thursday (1st Week)",
  },
  {
    id: 31,
    display_name: "Dental 360 - Oak Creek",
    location_name: "Dental 360 Oak Creek LLC",
    address: "132 E Drexel Ave OakCreek WI 53154",
    city: "OAK CREEK",
    state: "WI ",
    postal_code: "53154-2123",
    phone: "(262) 533-8387",
    email: "oakcreek@dental360grp.com",
    hours: "Dr. Shaymaa - Wednesday (2nd Week)",
  },
  {
    id: 17,
    display_name: "Dental 360 - Village (Brown Deer)",
    location_name: "Village Dental LLC",
    address: "4420 W Bradley Rd",
    city: "BROWN DEER",
    state: "WI",
    postal_code: "53223",
    phone: "(414) 354-2300",
    email: "village@dental360grp.com",
    hours: "Dr. Shaymaa - Monday (1st Week), Thursday (2nd Week), Wednesday (4th Week)",
  },
  {
    id: 21,
    display_name: "Dental 360 - Waukesha",
    location_name: "Dental 360 Waukesha",
    address: "444 W Sunset Dr",
    city: "WAUKESHA",
    state: "WI",
    postal_code: "53189-7407",
    phone: "(262) 232-8461",
    email: "waukesha@dental360grp.com",
    hours: "Dr. Shaymaa - Wednesday (2nd Week), Tuesday (4th Week)",
  },
];

export default function OrthoAppointmentForm() {
  const { user } = useApp();
  const [formData, setFormData] = useState({
    clinic_id: 1,
    first_name: "",
    last_name: "",
    phone: "+1 ",
    email: "",
    patient_name: "",
    dob: null,
    details: "",
    location_id: null,
    location: "",
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const [errorPopup, setErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "phone") {
      // Remove all non-digits
      let digits = value.replace(/\D/g, "");

      // Auto-add +1 if missing
      if (digits.length > 0 && !digits.startsWith("1")) {
        digits = "1" + digits;
      }

      // Format as +1 (XXX) XXX-XXXX
      let formatted = "+1";
      if (digits.length > 1) {
        formatted += " (" + digits.slice(1, 4);
      }
      if (digits.length >= 4) {
        formatted += ") " + digits.slice(4, 7);
      }
      if (digits.length >= 7) {
        formatted += "-" + digits.slice(7, 11);
      }

      setFormData((prev) => ({ ...prev, phone: formatted }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleLocationChange = (event, newValue) => {
    if (newValue) {
      setFormData((prev) => ({
        ...prev,
        location: newValue.display_name,
        location_id: newValue.id,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        location: "",
        location_id: null,
      }));
    }
    if (errors.location) {
      setErrors((prev) => ({ ...prev, location: "" }));
    }
  };

  const selectedLocation = ORTHO_LOCATIONS.find(
    (loc) => loc.id === formData.location_id
  ) || null;

  const validateField = (name, value) => {
    let error = "";

    switch (name) {
      case "first_name":
        if (!value.trim()) error = "First name is required";
        break;

      case "last_name":
        if (!value.trim()) error = "Last name is required";
        break;

      case "phone": {
        const digits = value.replace(/\D/g, "");
        if (!digits) error = "Phone is required";
        else if (digits.length !== 11 || !digits.startsWith("1"))
          error = "Enter a valid 10-digit US phone number";
        break;
      }

      case "email":
        if (!value.trim()) error = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          error = "Invalid email format";
        break;

      case "patient_name":
        if (!value.trim()) error = "Patient name is required";
        break;

      case "dob":
        if (!value) error = "Date of birth is required";
        break;

      case "location":
        if (!value.trim()) error = "Location is required";
        break;

      default:
        break;
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
    return !error;
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, formData[name]);
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

  const handleSubmit = async () => {
    const fieldsToValidate = [
      "first_name",
      "last_name",
      "phone",
      "email",
      "patient_name",
      "dob",
      "location",
    ];
    let isValid = true;
    const newTouched = {};

    fieldsToValidate.forEach((field) => {
      newTouched[field] = true;
      if (!validateField(field, formData[field])) {
        isValid = false;
      }
    });

    setTouched(newTouched);
    if (!isValid) {
      setErrorMessage("Please fill in all required fields correctly.");
      setErrorPopup(true);
      return;
    }

    try {
      setLoading(true);
      const submitted_by_id = user?.id;
      const clinic_id = user?.clinic_id || 1;

      const payload = {
        form_type: "ortho_appointment",
        form_type_id: 2,
        submitted_by_id,
        clinic_id,
        location_id: formData.location_id || 30, // Use selected location_id or default
        parent_first_name: formData.first_name,
        parent_last_name: formData.last_name,
        parent_phone: formData.phone,
        parent_email: formData.email,
        patient_name: formData.patient_name,
        dob: formData.dob ? dayjs(formData.dob).format("YYYY-MM-DD") : null,
        details: formData.details || null,
        location: formData.location,
      };

      const response = await createAPIEndPointAppointment(
        "appointment/create/ortho"
      ).createWithJSONFormat(payload);

      if (response.data) {
        setSubmitted(true);
        setErrorPopup(false);
        setErrorMessage("");
        setFormData({
          first_name: "",
          last_name: "",
          phone: "+1 ",
          email: "",
          patient_name: "",
          dob: null,
          details: "",
          location_id: null,
          location: "",
        });
        setTouched({});
        setErrors({});
      } else {
        setErrorMessage("Something went wrong. Please try again later.");
        setErrorPopup(true);
      }
    } catch (error) {
      console.error("❌ API Error:", error);
      setErrorMessage("Failed to submit appointment. Please check your connection.");
      setErrorPopup(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-3xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="grid grid-cols-1 lg:grid-cols-7 gap-0 shadow-lg rounded-xl overflow-hidden"
        >
          {/* RIGHT SIDE FORM */}
          <motion.div
            initial={{ opacity: 0, rotateY: 15 }}
            animate={{ opacity: 1, rotateY: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-full bg-white p-8 lg:p-10"
          >
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-3">
              Ortho Appointment Request
            </h2>
            <p className="text-gray-600 mb-8 text-sm">
              Fill out the form below to request an orthodontic appointment.
            </p>

            <div className="space-y-6">
              {/* Parent/Guardian Information */}
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Parent/Guardian Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-gray-700 font-semibold text-xs block mb-2">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="first_name"
                      type="text"
                      onChange={handleChange}
                      onBlur={handleBlur}
                      value={formData.first_name}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:!outline-none focus:!border-blue-500 focus:!ring-4 focus:!ring-blue-100 transition-all duration-300 bg-white/50"
                      placeholder="John"
                    />
                    {touched.first_name && errors.first_name && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-500 text-xs mt-2 flex items-center gap-1"
                      >
                        {errors.first_name}
                      </motion.p>
                    )}
                  </div>

                  <div>
                    <label className="text-gray-700 font-semibold text-xs block mb-2">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="last_name"
                      type="text"
                      onChange={handleChange}
                      onBlur={handleBlur}
                      value={formData.last_name}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:!outline-none focus:!border-blue-500 focus:!ring-4 focus:!ring-blue-100 transition-all duration-300 bg-white/50"
                      placeholder="Doe"
                    />
                    {touched.last_name && errors.last_name && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-500 text-xs mt-2 flex items-center gap-1"
                      >
                        {errors.last_name}
                      </motion.p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
                  <div>
                    <label className="text-gray-700 font-semibold text-xs block mb-2">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="phone"
                      type="text"
                      placeholder="(773) 588-8200"
                      onChange={handleChange}
                      onBlur={handleBlur}
                      value={formData.phone}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:!outline-none focus:!border-blue-500 focus:!ring-4 focus:!ring-blue-100 transition-all duration-300 bg-white/50"
                    />
                    {touched.phone && errors.phone && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-500 text-xs mt-2 flex items-center gap-1"
                      >
                        {errors.phone}
                      </motion.p>
                    )}
                  </div>

                  <div>
                    <label className="text-gray-700 font-semibold text-xs block mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      onChange={handleChange}
                      onBlur={handleBlur}
                      value={formData.email}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:!outline-none focus:!border-blue-500 focus:!ring-4 focus:!ring-blue-100 transition-all duration-300 bg-white/50"
                    />
                    {touched.email && errors.email && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-500 text-xs mt-2 flex items-center gap-1"
                      >
                        {errors.email}
                      </motion.p>
                    )}
                  </div>
                </div>
              </div>

              {/* Patient Information */}
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Patient Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-gray-700 font-semibold text-xs block mb-2">
                      Patient Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="patient_name"
                      type="text"
                      onChange={handleChange}
                      onBlur={handleBlur}
                      value={formData.patient_name}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:!outline-none focus:!border-blue-500 focus:!ring-4 focus:!ring-blue-100 transition-all duration-300 bg-white/50"
                      placeholder="Patient's full name"
                    />
                    {touched.patient_name && errors.patient_name && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-500 text-xs mt-2 flex items-center gap-1"
                      >
                        {errors.patient_name}
                      </motion.p>
                    )}
                  </div>

                  <div>
                    <label className="text-gray-700 font-semibold text-xs block mb-2">
                      Date of Birth <span className="text-red-500">*</span>
                    </label>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        value={formData.dob}
                        onChange={(date) => {
                          setFormData((prev) => ({ ...prev, dob: date }));
                          if (errors.dob) {
                            setErrors((prev) => ({ ...prev, dob: "" }));
                          }
                        }}
                        maxDate={dayjs()}
                        slotProps={{
                          textField: {
                            size: "small",
                            fullWidth: true,
                            error: touched.dob && !!errors.dob,
                            helperText: touched.dob && errors.dob,
                            className: "w-full",
                            sx: {
                              "& .MuiOutlinedInput-root": {
                                borderRadius: "12px",
                                border: "2px solid #E5E7EB",
                                "&:hover": {
                                  borderColor: "#93C5FD",
                                },
                                "&.Mui-focused": {
                                  borderColor: "#3B82F6",
                                },
                              },
                            },
                          },
                        }}
                      />
                    </LocalizationProvider>
                  </div>
                </div>
              </div>

              {/* Details Section */}
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Additional Details
                </h3>
                <div>
                  <label className="text-gray-700 font-semibold text-xs block mb-2">
                    Details / Notes
                  </label>
                  <textarea
                    name="details"
                    rows={5}
                    placeholder="Please provide any additional information about the appointment request, preferred dates/times, or special requirements..."
                    onChange={handleChange}
                    onBlur={handleBlur}
                    value={formData.details}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:!outline-none focus:!border-blue-500 focus:!ring-4 focus:!ring-blue-100 transition-all duration-300 bg-white/50"
                  />
                </div>
              </div>

              {/* Location Section */}
              <div>
                <label className="text-gray-700 font-semibold text-xs block mb-2">
                  Preferred Location <span className="text-red-500">*</span>
                </label>
                <Autocomplete
                  size="small"
                  fullWidth
                  options={ORTHO_LOCATIONS}
                  value={selectedLocation}
                  onChange={handleLocationChange}
                  getOptionLabel={(option) => {
                    if (!option) return "";
                    return option.display_name || "";
                  }}
                  filterOptions={(options, { inputValue }) => {
                    const searchTerm = inputValue.toLowerCase();
                    return options.filter((option) => {
                      const locationName = (option.display_name || "").toLowerCase();
                      const address = (option.address || "").toLowerCase();
                      const city = (option.city || "").toLowerCase();
                      const state = (option.state || "").toLowerCase();
                      return (
                        locationName.includes(searchTerm) ||
                        address.includes(searchTerm) ||
                        city.includes(searchTerm) ||
                        state.includes(searchTerm)
                      );
                    });
                  }}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  renderOption={(props, option) => {
                    const addressParts = [
                      option.address && option.address !== "N/A" ? toProperCase1(option.address) : null,
                      option.state && option.state !== "N/A" ? toProperCase1(option.state) : null,
                      option.postal_code && option.postal_code !== "0" ? option.postal_code : null,
                    ].filter(Boolean);
                    const fullAddress = addressParts.join(", ");
                    const isSelected = selectedLocation && selectedLocation.id === option.id;

                    return (
                      <li
                        {...props}
                        key={option.id}
                        className={`py-2.5 px-3 cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? "bg-gray-100"
                            : "hover:bg-gray-100"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-800 text-sm">
                            {option.display_name}
                          </span>
                          {fullAddress && (
                            <span className="text-xs text-gray-600 mt-0.5">
                              {fullAddress}
                            </span>
                          )}
                        </div>
                      </li>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Select a location..."
                      className="!bg-white"
                      autoComplete="off"
                      inputProps={{
                        ...params.inputProps,
                        autoComplete: "off",
                        autoCorrect: "off",
                        autoCapitalize: "off",
                        spellCheck: "false",
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "12px",
                          border: "2px solid #E5E7EB",
                          "&:hover": {
                            borderColor: "#93C5FD",
                          },
                          "&.Mui-focused": {
                            borderColor: "#3B82F6",
                            "& fieldset": {
                              borderColor: "#3B82F6",
                            },
                          },
                          "& fieldset": {
                            border: "none",
                          },
                        },
                      }}
                    />
                  )}
                  noOptionsText="No locations found"
                />
                {/* Display selected location details */}
                {selectedLocation && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex flex-col gap-1">
                      {selectedLocation.address && selectedLocation.address !== "N/A" && (
                        <div className="flex items-start gap-2">
                          <MapPin className="w-3.5 h-3.5 text-gray-500 mt-0.5 flex-shrink-0" />
                          <span className="text-xs text-gray-700">
                            {[
                              selectedLocation.address && selectedLocation.address !== "N/A"
                                ? toProperCase1(selectedLocation.address)
                                : null,
                              selectedLocation.state && selectedLocation.state !== "N/A"
                                ? toProperCase1(selectedLocation.state)
                                : null,
                              selectedLocation.postal_code && selectedLocation.postal_code !== "0"
                                ? selectedLocation.postal_code
                                : null,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </span>
                        </div>
                      )}
                      {selectedLocation.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                          <span className="text-xs text-gray-700">{selectedLocation.phone}</span>
                        </div>
                      )}
                      {selectedLocation.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                          <span className="text-xs text-gray-700">{selectedLocation.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <motion.button
                type="button"
                onClick={handleSubmit}
                onHoverStart={() => setIsHovering(true)}
                onHoverEnd={() => setIsHovering(false)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading}
                className={`w-full sm:w-auto ${loading ? "cursor-not-allowed opacity-80" : ""
                  } bg-gradient-to-r from-blue-600 to-blue-600 hover:from-blue-700 hover:to-blue-700 text-white font-semibold text-sm px-10 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 group`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    Request Appointment
                    <motion.div
                      animate={{ x: isHovering ? 5 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Send className="w-5 h-5" />
                    </motion.div>
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* SUCCESS POPUP */}
      <AnimatePresence>
        {submitted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4"
            onClick={() => setSubmitted(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full blur-3xl opacity-50"></div>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
              </motion.div>

              <h3 className="text-xl font-bold text-gray-800 mb-3">
                Appointment Request Submitted!
              </h3>
              <p className="text-gray-600 mb-8 leading-relaxed text-sm">
                Your orthodontic appointment request has been successfully submitted. We'll contact you shortly to confirm your appointment.
              </p>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSubmitted(false)}
                className="bg-gradient-to-r from-blue-600 to-blue-600 hover:from-blue-700 hover:to-blue-700 text-white font-semibold text-sm px-8 py-3 rounded-xl shadow-lg transition-all duration-300"
              >
                Close
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ERROR POPUP */}
      <AnimatePresence>
        {errorPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4"
            onClick={() => setErrorPopup(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-100 rounded-full blur-3xl opacity-50"></div>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <AlertTriangle className="w-20 h-20 text-red-500 mx-auto mb-6" />
              </motion.div>

              <h3 className="text-xl font-bold text-gray-800 mb-3">
                Submission Failed
              </h3>
              <p className="text-gray-600 mb-8 leading-relaxed text-sm">
                {errorMessage ||
                  "Something went wrong. Please try again later."}
              </p>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setErrorPopup(false)}
                className="bg-gradient-to-r from-red-600 to-red-600 hover:from-red-700 hover:to-red-700 text-white font-semibold text-sm px-8 py-3 rounded-xl shadow-lg transition-all duration-300"
              >
                Close
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

