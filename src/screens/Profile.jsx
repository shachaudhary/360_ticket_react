import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { createAPIEndPointAuth } from "../../src/config/api/apiAuth";
import { getUserData } from "../../src/utils";
import TimeZoneSelect from "../components/TimeZoneSelect.jsx";
import BackButton from "../components/BackButton.jsx";

export default function ProfileForm() {
  const navigate = useNavigate();
  const userData = getUserData();
  const userId = userData?.id ?? null;

  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(true);

  // 🔹 Format phone number (US format)
  const formatPhoneNumber = (value) => {
    const cleaned = value.replace(/\D/g, ""); // Remove non-numeric characters
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);

    if (!match) return value;

    const formatted = !match[2]
      ? match[1]
      : `(${match[1]}) ${match[2]}${match[3] ? `-${match[3]}` : ""}`;

    return formatted.length > 14 ? formatted.slice(0, 14) : formatted;
  };

  // Fetch user profile
  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) return;
      try {
        const response = await createAPIEndPointAuth("user").fetchById(
          `/${userId}`
        );
        setUser(response.data);
      } catch (error) {
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      email: user.email || "",
      phone: user.phone || "",
      address: user.address || "",
      timezone: user.timezone || "",
    },
    validationSchema: Yup.object({
      first_name: Yup.string().required("First name is required"),
      last_name: Yup.string().required("Last name is required"),
      email: Yup.string().email("Invalid email").required("Email is required"),
      phone: Yup.string().required("Phone is required"),
      address: Yup.string().required("Address is required"),
      timezone: Yup.string().required("Timezone is required"),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await createAPIEndPointAuth("user/").update(userId, values);
        toast.success("Profile updated successfully!");
        navigate("/dashboard"); // redirect after save
      } catch (error) {
        toast.error(error?.response?.data?.message || "Profile update failed");
      } finally {
        setSubmitting(false);
      }
    },
  });

  // 🔹 Handle phone input formatting
  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    formik.setFieldValue("phone", formatted);
  };

  const handleCancel = () => {
    navigate(-1);
  };

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
    <Box component="form" onSubmit={formik.handleSubmit} className="bg-white">
      <BackButton self={"/dashboard"} />

      <div className="space-y-4 mt-4">
        <h2 className="text-lg md:text-xl font-semibold text-sidebar mb-1">
          Edit Profile
        </h2>

        {/* First Name */}
        <TextField
          label="First Name"
          name="first_name"
          fullWidth
          size="small"
          {...formik.getFieldProps("first_name")}
          error={formik.touched.first_name && Boolean(formik.errors.first_name)}
          helperText={formik.touched.first_name && formik.errors.first_name}
        />

        {/* Last Name */}
        <TextField
          label="Last Name"
          name="last_name"
          fullWidth
          size="small"
          {...formik.getFieldProps("last_name")}
          error={formik.touched.last_name && Boolean(formik.errors.last_name)}
          helperText={formik.touched.last_name && formik.errors.last_name}
        />

        {/* Email (disabled) */}
        <TextField
          label="Email"
          name="email"
          fullWidth
          size="small"
          {...formik.getFieldProps("email")}
          disabled
          error={formik.touched.email && Boolean(formik.errors.email)}
          helperText={formik.touched.email && formik.errors.email}
        />

        {/* Phone */}
        <TextField
          label="Phone"
          name="phone"
          fullWidth
          size="small"
          value={formik.values.phone}
          onChange={handlePhoneChange}
          error={formik.touched.phone && Boolean(formik.errors.phone)}
          helperText={formik.touched.phone && formik.errors.phone}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <span style={{ color: "#111827", fontSize: 14 }}>+1</span>
              </InputAdornment>
            ),
          }}
          inputProps={{
            inputMode: "numeric",
            maxLength: 14,
          }}
        />

        {/* Address */}
        <TextField
          label="Address"
          name="address"
          fullWidth
          size="small"
          {...formik.getFieldProps("address")}
          error={formik.touched.address && Boolean(formik.errors.address)}
          helperText={formik.touched.address && formik.errors.address}
        />

        {/* Timezone Select */}
        <TimeZoneSelect
          values={formik.values}
          handleChange={formik.handleChange}
          handleBlur={formik.handleBlur}
          touched={formik.touched}
          errors={formik.errors}
        />

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
              "Update Profile"
            )}
          </Button>
        </div>
      </div>
    </Box>
  );
}
