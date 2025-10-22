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
import { createAPIEndPoint } from "../config/api/api";

export default function ContactForm() {
  const [formData, setFormData] = useState({
    clinic_id: 1,
    first_name: "",
    last_name: "",
    phone: "+1 ",
    email: "",
    message: "",
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const [apiError, setApiError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

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

  const handleSubmit = async () => {
    const fieldsToValidate = ["first_name", "last_name", "phone", "email"];
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
      setLoading(true); // 🔹 start loader
      const response = await createAPIEndPoint(
        "contact/submit"
      ).createWithJSONFormat(formData);

      if (response.data.status === "success") {
        setSubmitted(true);
        setErrorPopup(false);
        setErrorMessage("");
        setFormData({
          first_name: "",
          last_name: "",
          phone: "",
          email: "",
          message: "",
        });
        setTouched({});
        setErrors({});
      } else {
        setErrorMessage("Something went wrong. Please try again later.");
        setErrorPopup(true);
      }
    } catch (error) {
      console.error("❌ API Error:", error);
      setErrorMessage("Failed to send message. Please check your connection.");
      setErrorPopup(true);
    } finally {
      setLoading(false); // 🔹 stop loader
    }
  };

  return (
    // <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 sm:p-6 lg:p-8">
    <div className="flex items-center justify-center">
      <div className="w-full max-w-3xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="grid grid-cols-1 lg:grid-cols-7 gap-0 shadow-2xl rounded-3xl overflow-hidden"
        >
          {/* LEFT SIDE INFO */}
          {/* <motion.div
            initial={{ opacity: 0, rotateY: -15 }}
            animate={{ opacity: 1, rotateY: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-2 bg-gradient-to-br from-blue-500 to-blue-600 p-8 lg:p-10 text-white relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-400/20 rounded-full blur-2xl translate-y-24 -translate-x-24"></div>

            <div className="relative z-10">
              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-2xl lg:text-3xl font-bold mb-3"
              >
                Get in Touch
              </motion.h2>
              <p className="text-blue-100 mb-12 text-base">
                We'd love to hear from you. Our team is always here to help.
              </p>

              <div className="space-y-8">
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-start gap-5 group"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm group-hover:bg-white/30 transition-all duration-300">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-2">Visit Us</h4>
                    <p className="text-blue-100 leading-relaxed text-sm">
                      3435 W Irving Park Rd
                      <br />
                      Chicago, IL 60618
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="flex items-start gap-5 group"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm group-hover:bg-white/30 transition-all duration-300">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-2">Call Us</h4>
                    <p className="text-blue-100 leading-relaxed text-sm">
                      +1 773-588-8200
                      <br />
                      (888) 969-9934
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="flex items-start gap-5 group"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm group-hover:bg-white/30 transition-all duration-300">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-2">Email</h4>
                    <p className="text-blue-100 leading-relaxed text-sm">
                      info@dental360usa.com
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div> */}

          {/* RIGHT SIDE FORM */}
          <motion.div
            initial={{ opacity: 0, rotateY: 15 }}
            animate={{ opacity: 1, rotateY: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            // className="lg:col-span-5 bg-white p-8 lg:p-10"
            className="lg:col-span-full bg-white p-8 lg:p-10"
          >
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-3">
              Send us a Message
            </h2>
            <p className="text-gray-600 mb-8 text-sm">
              Fill out the form below and we'll get back to you as soon as
              possible.
            </p>

            <div className="space-y-6">
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

              <div>
                <label className="text-gray-700 font-semibold text-xs block mb-2">
                  Message
                </label>
                <textarea
                  name="message"
                  rows={5}
                  placeholder="Tell us how we can help you..."
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={formData.message}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:!outline-none focus:!border-blue-500 focus:!ring-4 focus:!ring-blue-100 transition-all duration-300 bg-white/50"
                />
              </div>

              <motion.button
                type="button"
                onClick={handleSubmit}
                onHoverStart={() => setIsHovering(true)}
                onHoverEnd={() => setIsHovering(false)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading}
                className={`w-full sm:w-auto ${
                  loading ? "cursor-not-allowed opacity-80" : ""
                } bg-gradient-to-r from-blue-600 to-blue-600 hover:from-blue-700 hover:to-blue-700 text-white font-semibold text-sm px-10 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 group`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    Send Message
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
                Thank You!
              </h3>
              <p className="text-gray-600 mb-8 leading-relaxed text-sm">
                Your message has been successfully submitted. We'll get back to
                you shortly.
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
