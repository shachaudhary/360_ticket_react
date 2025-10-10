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
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const NewHireForm = () => {
  const { user } = useApp();
  console.log("🚀 ~ NewHireForm ~ user:", user);
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id; // true when editing

  const [formData, setFormData] = useState({
    form_type: "",
    formTypeOther: "",
    requestorName: "",
    requestDate: dayjs().format("YYYY-MM-DD"),
    newHireName: "",
    email: "",
    jobTitle: "",
    jobTitleOther: "",
    hireType: "",
    department: "",
    location: "",
    // locationOther: "",
    payType: "",
    payRate: "",
    supervisor: "",
    startDate: "",
  });

  const jobTitleOtherRef = useRef(null);
  const locationOtherRef = useRef(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [locations, setLocations] = useState([]);
  const [formTypes, setFormTypes] = useState([]);

  // 🔹 Fetch Form Types (dynamic)
  // useEffect(() => {
  //   const fetchFormTypes = async () => {
  //     try {
  //       const res = await createAPIEndPoint("form_types").fetchAll();
  //       const data = res.data?.form_types || [];
  //       setFormTypes(data);
  //     } catch (err) {
  //       console.error("Error fetching form types:", err);
  //     }
  //   };
  //   fetchFormTypes();
  // }, []);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, form_type: "Hire" }));
  }, []);

  // 🔹 Fetch Locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await createAPIEndPointAuth(
          `clinic_locations/get_all/${user?.clinic_id}`
        ).fetchAll();

        const data = res.data?.locations || [];

        // 🧹 Clean / Filter any unwanted entries
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

  useEffect(() => {
    if (formData.jobTitle === "Other" && jobTitleOtherRef.current) {
      jobTitleOtherRef.current.focus();
    }
  }, [formData.jobTitle]);

  useEffect(() => {
    if (formData.location === "Other" && locationOtherRef.current) {
      locationOtherRef.current.focus();
    }
  }, [formData.location]);

  useEffect(() => {
    if (
      formData.form_type === "Other" &&
      document.getElementById("formTypeOther")
    ) {
      document.getElementById("formTypeOther").focus();
    }
  }, [formData.form_type]);

  const jobTitleOptions = [
    "Receptionist",
    "TX Coordinator",
    "Dental Assistant",
    "Lead Dental Assistant",
    "Office Manager",
    "Regional Manager",
    "Other",
  ];

  const hireTypes = ["Full-Time", "Part-Time", "Temporary", "Contract"];
  const departments = ["General", "Ortho", "Pedo", "Management"];
  const payTypes = ["Hourly", "Salary", "Per Diem"];

  // const ilLocations = [
  //   "Mundelein",
  //   "Clark",
  //   "Kimball",
  //   "Armitage",
  //   "Logan Square",
  //   "Irving Park",
  //   "Belmont",
  //   "North Ave",
  //   "Bucktown",
  //   "Lawndale",
  //   "Cermak",
  //   "Berwyn",
  //   "Little Village",
  //   "California",
  //   "Pulaski",
  // ];

  // const wiLocations = [
  //   "Kenosha",
  //   "Oak Creek",
  //   "Mitchell",
  //   "Greenfield Village",
  //   "Marion",
  //   "Waukesha",
  //   "Sussex",
  // ];

  // 🧠 Converts backend snake_case form_type_name → UI label
  const normalizeFormType = (backendType) => {
    if (!backendType) return "";
    const map = {
      new_hire: "New Hire",
      transfer: "Transfer",
      termination: "Termination",
      promotion: "Promotion",
      status_change: "Status Change",
      other: "Other",
    };
    return map[backendType.toLowerCase()] || backendType;
  };

  useEffect(() => {
    if (isEditMode && id) {
      (async () => {
        try {
          const res = await createAPIEndPoint(`form_entries/${id}`).fetchAll();
          const entry = res.data;
          if (!entry) return;

          const mapped = {};
          entry.field_values?.forEach((f) => {
            mapped[f.field_name.toLowerCase()] = f.field_value;
          });
          const normalizedType = normalizeFormType(entry.form_type_name);
          setFormData({
            form_type: normalizedType,
            formTypeOther:
              normalizedType === "Other" ? entry.form_type_name : "",
            newHireName: mapped["employee_name"] || "",
            startDate: mapped["joining_date"] || "",
            jobTitle:
              jobTitleOptions.includes(mapped["position"]) ||
              !mapped["position"]
                ? mapped["position"]
                : "Other",
            jobTitleOther:
              !jobTitleOptions.includes(mapped["position"]) &&
              mapped["position"]
                ? mapped["position"]
                : "",
            department: mapped["department"] || "",
            requestDate: mapped["request_date"] || dayjs().format("YYYY-MM-DD"),
            email: mapped["email"] || "",
            location: locations.some(
              (l) =>
                l.location_name.toLowerCase() ===
                mapped["location"]?.toLowerCase()
            )
              ? mapped["location"]
              : mapped["location"]
              ? "Other"
              : "",
            // locationOther: !locations.some(
            //   (l) =>
            //     l.location_name.toLowerCase() ===
            //     mapped["location"]?.toLowerCase()
            // )
            //   ? mapped["location"]
            //   : "",
            hireType: mapped["hire_type"] || "",
            payType: mapped["pay_type"] || "",
            payRate: mapped["pay_rate"] || "",
            supervisor: mapped["supervisor"] || "",
            requestorName: mapped["requestor_name"] || "",
          });
        } catch (err) {
          console.error("Failed to load form for edit:", err);
          Swal.fire("Error", "Unable to load form data", "error");
        }
      })();
    }
  }, [isEditMode, id]);

  // Custom validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePayRate = (value) => {
    const numValue = parseFloat(value.replace(/,/g, ""));
    return !isNaN(numValue) && numValue > 0;
  };

  // ✅ Drop-in replacement (no plugins needed)
  const validateDate = (date, field) => {
    if (!date) return false;

    const selected = dayjs(date);
    const today = dayjs().startOf("day");

    if (!selected.isValid()) return false;

    if (field === "requestDate") {
      // allow today or past: NOT after today
      return !selected.isAfter(today, "day");
    }
    if (field === "startDate") {
      // allow today or future: NOT before today
      return !selected.isBefore(today, "day");
    }
    return true;
  };

  const validateName = (name) => {
    return name.trim().length >= 2 && /^[a-zA-Z\s'-]+$/.test(name);
  };

  const validateForm = () => {
    const newErrors = {};

    // if (!formData.requestorName.trim()) {
    //   newErrors.requestorName = "Requestor name is required";
    // } else if (!validateName(formData.requestorName)) {
    //   newErrors.requestorName =
    //     "Please enter a valid name (letters only, min 2 characters)";
    // }

    // if (!formData.requestDate) {
    //   newErrors.requestDate = "Request date is required";
    // } else if (!validateDate(formData.requestDate, "requestDate")) {
    //   newErrors.requestDate = "Request date cannot be in the future";
    // }

    if (!formData.form_type) {
      newErrors.form_type = "Please select a form type";
    }

    if (!formData.newHireName.trim()) {
      newErrors.newHireName = "New hire name is required";
    } else if (!validateName(formData.newHireName)) {
      newErrors.newHireName =
        "Please enter a valid name (letters only, min 2 characters)";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.jobTitle) {
      newErrors.jobTitle = "Please select a job title";
    }

    if (formData.jobTitle === "Other" && !formData.jobTitleOther.trim()) {
      newErrors.jobTitleOther = "Please enter a custom job title";
    }

    if (!formData.hireType) {
      newErrors.hireType = "Please select a hire type";
    }

    if (!formData.department) {
      newErrors.department = "Please select a department";
    }

    if (!formData.location) {
      newErrors.location = "Please select an office location";
    }

    // if (formData.location === "Other" && !formData.locationOther.trim()) {
    //   newErrors.locationOther = "Please enter a custom location";
    // }

    if (!formData.payType) {
      newErrors.payType = "Please select a pay rate basis";
    }

    if (!formData.payRate.trim()) {
      newErrors.payRate = "Pay rate is required";
    } else if (!validatePayRate(formData.payRate)) {
      newErrors.payRate = "Please enter a valid numeric pay rate";
    }

    if (!formData.supervisor.trim()) {
      newErrors.supervisor = "Supervisor name is required";
    } else if (!validateName(formData.supervisor)) {
      newErrors.supervisor = "Please enter a valid supervisor name";
    }

    if (!formData.startDate) {
      newErrors.startDate = "Start date is required";
    } else if (!validateDate(formData.startDate, "startDate")) {
      newErrors.startDate = "Start date cannot be in the past";
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

  const handleJobTitleSelect = (value) => {
    setFormData((prev) => ({
      ...prev,
      jobTitle: value,
      jobTitleOther: value === "Other" ? prev.jobTitleOther : "",
    }));
    if (errors.jobTitle) setErrors((prev) => ({ ...prev, jobTitle: "" }));
  };

  const handleRadioChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      // ...(name === "location" && value !== "Other"
      //   ? { locationOther: "" }
      //   : {}),
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // ⬅️ Put this helper above handleSubmit (e.g., after other funcs)
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

    // ✅ 1. Validate first
    const isValid = validateForm();
    if (!isValid) {
      setSubmitStatus({
        type: "error",
        message: "Please fix all errors before submitting",
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // ✅ 2. Begin submission
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const submitted_by_id = user?.id;
      const clinic_id = user?.clinic_id;
      const location_id = 2;

      const payload = {
        // form_type: formData.form_type,
        // form_type_id:
        //   formTypes.find((t) => t.name === formData.form_type)?.id || null,
        form_type: "hire",
        form_type_id: 1, // since we are skipping dynamic types
        submitted_by_id,
        clinic_id,
        location_id,
        field_values: [
          toField("employee_name", formData.newHireName),
          toField(
            "joining_date",
            formData.startDate
              ? dayjs(formData.startDate).format("YYYY-MM-DD")
              : ""
          ),
          toField(
            "position",
            formData.jobTitle === "Other"
              ? formData.jobTitleOther
              : formData.jobTitle
          ),
          toField("department", formData.department),
          toField(
            "request_date",
            formData.requestDate
              ? dayjs(formData.requestDate).format("YYYY-MM-DD")
              : ""
          ),
          toField("requestor_name", formData.requestorName),
          toField("email", formData.email),
          toField("location", formData.location),
          // toField(
          //   "location",
          //   formData.location === "Other"
          //     ? formData.locationOther
          //     : formData.location
          // ),
          toField("hire_type", formData.hireType),
          toField("pay_type", formData.payType),
          toField("pay_rate", formData.payRate),
          toField("supervisor", formData.supervisor),
        ].filter(Boolean),
      };

      console.log("Submitting payload:", payload);

      // ✅ 3. API call
      let response;
      if (isEditMode) {
        response = await createAPIEndPoint(`form_entries/${id}`).update(
          payload
        );
        setSubmitStatus({
          type: "success",
          message: "Form updated successfully!",
        });
      } else {
        response = await createAPIEndPoint(
          "form_entries/field_values"
        ).createWithJSONFormat(payload);
        setSubmitStatus({
          type: "success",
          message: "New hire form submitted successfully.",
        });
      }

      navigate("/forms");

      window.scrollTo({ top: 0, behavior: "smooth" }); // scroll up for success too (nice UX)

      // if (isEditMode) {
      // }
      // ✅ 5. Reset form
      setFormData({
        form_type: "",
        formTypeOther: "",
        requestorName: "",
        requestDate: dayjs().format("YYYY-MM-DD"),
        newHireName: "",
        email: "",
        jobTitle: "",
        jobTitleOther: "",
        hireType: "",
        department: "",
        location: "",
        // locationOther: "",
        payType: "",
        payRate: "",
        supervisor: "",
        startDate: "",
      });
      setErrors({});
    } catch (err) {
      console.error("Submission error:", err);

      const apiMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to submit form. Please try again.";

      setSubmitStatus({
        type: "error",
        message: apiMsg,
      });

      // ✅ Always scroll to top on API error
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // <div className="bg-[#e6eef8] flex items-center justify-center p-4 overflow-hidden">
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

      {/* <div className="relative w-full max-w-5xl mx-auto"> */}
      <div className="relative w-full mx-auto">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob hidden lg:block"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#c2dcf7] rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000 hidden lg:block"></div>

        {/* <div className="dental360-form relative bg-white shadow-2xl rounded-2xl"> */}
        <div className="dental360-form relative bg-white">
          <div className="bg-red text-white p-8 lg:p-12 rounded-t-2xl relative overflow-hidden border">
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-700 rounded-full -translate-x-1/3 translate-y-1/3 opacity-50"></div>

            <div className="flex absolute top-5 left-5">
              <BackButton self="/forms" />
            </div>

            <div className="relative z-10">
              {/* <h2 className="text-2xl font-bold mb-1 text-indigo-300">
                Dental 360 & Associates
              </h2> */}

              <h1 className="text-4xl text-center font-extrabold mb-6 text-brand-700">
                NEW HIRE FORM
              </h1>

              <img
                src={brandLogo}
                alt="Dental 360 & Associates"
                className="h-16 w-full object-contain"
              />
              {/* <h1 className="text-4xl font-extrabold tracking-tight text-center text-[#004AAD] mb-2 uppercase">
                NEW HIRE FORM
              </h1> */}

              <p className="text-sm text-gray-700 mt-5 mb-3 text-center">
                To be completed by Regional Manager or Office Manager and
                submitted to HR via email.
              </p>

              <div className="space-y-0 text-[13.5px] text-center">
                {/* <span className="font-semibold text-blue-400 block">
                  Submission Emails:
                </span> */}
                <div className="flex items-center justify-center gap-3">
                  {[
                    "hr@dental360grp.com",
                    "eliza.g@dental360grp.com",
                    "sanam.j@dental360grp.com",
                  ].map((email) => (
                    <a
                      key={email}
                      href={`mailto:${email}`}
                      title={`Email ${email}`}
                      className="text-gray-400 hover:text-blue-600 hover:underline underline-offset-2 transition-colors"
                    >
                      {email}
                    </a>
                  ))}
                </div>
              </div>
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
            {/* 
            <h3 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">
              Requestor Information
            </h3> */}

            <div className="space-y-8">
              {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="requestorName"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Name of Requestor
                  </label>
                  <input
                    type="text"
                    name="requestorName"
                    id="requestorName"
                    value={formData.requestorName}
                    onChange={handleInputChange}
                    className={`mt-2 block w-full border-b ${
                      errors.requestorName
                        ? "border-red-500"
                        : "border-gray-300"
                    } bg-transparent py-2.5 px-1 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-0 sm:text-sm`}
                  />
                  {errors.requestorName && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.requestorName}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="requestDate"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Date of Request <Asterisk />
                  </label>
                  <input
                    type="date"
                    name="requestDate"
                    id="requestDate"
                    disabled
                    value={formData.requestDate}
                    // onChange={handleInputChange}
                    className={`mt-2 block w-full border-b ${
                      errors.requestDate ? "border-red-500" : "border-gray-300"
                    } bg-transparent py-2.5 px-1 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-0 sm:text-sm`}
                  />
                  {errors.requestDate && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.requestDate}
                    </p>
                  )}
                </div>
              </div> */}

              {/* 🆕 FORM TYPE SELECTION SECTION */}
              {/* <h3 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">
                Form Type
              </h3> */}

              {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Select Form Type <Asterisk />
                  </label>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {formTypes.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">
                        Loading form types...
                      </p>
                    ) : (
                      formTypes.map((type) => (
                        <label
                          key={type.id}
                          className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                            formData.form_type === type.name
                              ? "ring-2 ring-blue-500 border-blue-500 bg-indigo-50"
                              : "border-gray-300 hover:border-indigo-300"
                          }`}
                        >
                          <input
                            type="radio"
                            checked={formData.form_type === type.name}
                            onChange={() =>
                              handleRadioChange("form_type", type.name)
                            }
                            className="sr-only"
                          />
                          <span className="text-sm font-medium text-gray-700 text-center">
                            {toProperCase(type.name)}
                          </span>
                        </label>
                      ))
                    )}
                  </div>

                  {errors.form_type && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.form_type}
                    </p>
                  )}

                  {formData.form_type === "Other" && (
                    <div className="mt-3">
                      <label
                        htmlFor="formTypeOther"
                        className="block text-sm font-semibold text-gray-700"
                      >
                        Specify Form Type <Asterisk />
                      </label>
                      <input
                        type="text"
                        name="formTypeOther"
                        id="formTypeOther"
                        value={formData.formTypeOther || ""}
                        onChange={handleInputChange}
                        placeholder="e.g., Leave of Absence"
                        className={`mt-2 block w-full border-b ${
                          errors.formTypeOther
                            ? "border-red-500"
                            : "border-gray-300"
                        } bg-transparent py-2.5 px-1 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-0 sm:text-sm`}
                      />
                      {errors.formTypeOther && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.formTypeOther}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div> */}

              <h3 className="text-2xl font-bold mb-6 pt-4 text-gray-800 border-b pb-2">
                Position Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="newHireName"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Name <Asterisk />
                  </label>
                  <input
                    type="text"
                    name="newHireName"
                    id="newHireName"
                    value={formData.newHireName}
                    onChange={handleInputChange}
                    className={`mt-2 block w-full border-b ${
                      errors.newHireName ? "border-red-500" : "border-gray-300"
                    } bg-transparent py-2.5 px-1 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-0 sm:text-sm`}
                  />
                  {errors.newHireName && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.newHireName}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Email Address <Asterisk />
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`mt-2 block w-full border-b ${
                      errors.email ? "border-red-500" : "border-gray-300"
                    } bg-transparent py-2.5 px-1 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-0 sm:text-sm`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Job Title/Position (Select One) <Asterisk />
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {jobTitleOptions.map((title) => (
                      <label
                        key={title}
                        className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                          formData.jobTitle === title
                            ? "ring-2 ring-blue-500 border-blue-500 bg-indigo-50"
                            : "border-gray-300 hover:border-indigo-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.jobTitle === title}
                          onChange={() => handleJobTitleSelect(title)}
                          className="h-4 w-4 rounded  text-blue-500 focus:ring-blue-500 mr-2"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {title}
                        </span>
                      </label>
                    ))}
                  </div>
                  {errors.jobTitles && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.jobTitles}
                    </p>
                  )}

                  {/* 👇 Show custom input when Other is selected */}
                  {formData.jobTitle === "Other" && (
                    <div className="mt-3">
                      <label
                        htmlFor="jobTitleOther"
                        className="block text-sm font-semibold text-gray-700"
                      >
                        Specify Job Title <Asterisk />
                      </label>
                      <input
                        type="text"
                        name="jobTitleOther"
                        id="jobTitleOther"
                        value={formData.jobTitleOther}
                        onChange={handleInputChange}
                        placeholder="e.g., Treatment Coordinator (Floater)"
                        className={`mt-2 block w-full border-b ${
                          errors.jobTitleOther
                            ? "border-red-500"
                            : "border-gray-300"
                        } bg-transparent py-2.5 px-1 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-0 sm:text-sm`}
                      />
                      {errors.jobTitleOther && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.jobTitleOther}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Type of Hire <Asterisk />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {hireTypes.map((type) => (
                      <label
                        key={type}
                        className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                          formData.hireType === type
                            ? "ring-2 ring-blue-500 border-blue-500 bg-indigo-50"
                            : "border-gray-300 hover:border-indigo-300"
                        }`}
                      >
                        <input
                          type="radio"
                          checked={formData.hireType === type}
                          onChange={() => handleRadioChange("hireType", type)}
                          className="sr-only"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {type}
                        </span>
                      </label>
                    ))}
                  </div>
                  {errors.hireType && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.hireType}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Department <Asterisk />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {departments.map((dept) => (
                      <label
                        key={dept}
                        className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                          formData.department === dept
                            ? "ring-2 ring-blue-500 border-blue-500 bg-indigo-50"
                            : "border-gray-300 hover:border-indigo-300"
                        }`}
                      >
                        <input
                          type="radio"
                          checked={formData.department === dept}
                          onChange={() => handleRadioChange("department", dept)}
                          className="sr-only"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {dept}
                        </span>
                      </label>
                    ))}
                  </div>
                  {errors.department && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.department}
                    </p>
                  )}
                </div>
              </div>
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

                  {/*
    ✅ Removed “Other” location option and input box below
    <div>
      <label
        className={`flex items-center p-2 border rounded-lg cursor-pointer transition-all duration-200 ${
          formData.location === "Other"
            ? "ring-2 ring-blue-500 border-blue-500 bg-indigo-50"
            : "border-gray-300 bg-white hover:border-indigo-300"
        }`}
      >
        <input
          type="radio"
          checked={formData.location === "Other"}
          onChange={() => handleRadioChange("location", "Other")}
          className="sr-only"
        />
        <span className="text-sm font-medium text-gray-700 w-full text-center">
          Other
        </span>
      </label>
    </div>
    */}
                </div>

                {errors.location && (
                  <p className="mt-1 text-sm text-red-600">{errors.location}</p>
                )}

                {/*
  ✅ Commented out “Specify Location” input since “Other” is removed
  {formData.location === "Other" && (
    <div className="mt-3">
      <label
        htmlFor="locationOther"
        className="block text-sm font-semibold text-gray-700"
      >
        Specify Location <Asterisk />
      </label>
      <input
        type="text"
        name="locationOther"
        id="locationOther"
        value={formData.locationOther}
        onChange={handleInputChange}
        placeholder="e.g., Elmhurst (New site)"
        className={`mt-2 block w-full border-b ${
          errors.locationOther
            ? "border-red-500"
            : "border-gray-300"
        } bg-transparent py-2.5 px-1 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-0 sm:text-sm`}
      />
      {errors.locationOther && (
        <p className="mt-1 text-sm text-red-600">
          {errors.locationOther}
        </p>
      )}
    </div>
  )}
  */}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Pay Rate Basis <Asterisk />
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {payTypes.map((type) => (
                      <label
                        key={type}
                        className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                          formData.payType === type
                            ? "ring-2 ring-blue-500 border-blue-500 bg-indigo-50"
                            : "border-gray-300 hover:border-indigo-300"
                        }`}
                      >
                        <input
                          type="radio"
                          checked={formData.payType === type}
                          onChange={() => handleRadioChange("payType", type)}
                          className="sr-only"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {type}
                        </span>
                      </label>
                    ))}
                  </div>
                  {errors.payType && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.payType}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="payRate"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Pay Rate Value ($) <Asterisk />
                  </label>
                  <input
                    type="text"
                    name="payRate"
                    id="payRate"
                    value={formData.payRate}
                    onChange={handleInputChange}
                    placeholder="e.g., 25.00 or 75,000"
                    className={`mt-2 block w-full border-b ${
                      errors.payRate ? "border-red-500" : "border-gray-300"
                    } bg-transparent py-2.5 px-1 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-0 sm:text-sm`}
                  />
                  {errors.payRate && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.payRate}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="supervisor"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Reports to (Direct Supervisor) <Asterisk />
                  </label>
                  <input
                    type="text"
                    name="supervisor"
                    id="supervisor"
                    value={formData.supervisor}
                    onChange={handleInputChange}
                    placeholder="Full Name of Manager"
                    className={`mt-2 block w-full border-b ${
                      errors.supervisor ? "border-red-500" : "border-gray-300"
                    } bg-transparent py-2.5 px-1 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-0 sm:text-sm`}
                  />
                  {errors.supervisor && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.supervisor}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="startDate"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Start Date <Asterisk />
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    id="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className={`mt-2 block w-full border-b ${
                      errors.startDate ? "border-red-500" : "border-gray-300"
                    } bg-transparent py-2.5 px-1 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-0 sm:text-sm`}
                  />
                  {errors.startDate && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.startDate}
                    </p>
                  )}
                </div>
              </div>

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

export default NewHireForm;

const Asterisk = () => {
  return <span className="text-red-500">*</span>;
};
