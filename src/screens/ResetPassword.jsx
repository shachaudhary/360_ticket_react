import React, { useState } from "react";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Avatar,
  CssBaseline,
  Paper,
  IconButton,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { createAPIEndPointAuth } from "../config/api/apiAuth";
import { Link, useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";
import bgImage from "../assets/bg-image.jpg";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

  // ✅ Validation schema
  const validationSchema = Yup.object().shape({
    otp: Yup.string()
      .required("OTP is required")
      .length(6, "OTP must be 6 digits"),
    newPassword: Yup.string()
      .min(8, "Password must be at least 8 characters")
      .required("New password is required"),
  });

  // ✅ API handler
  const handleResetPassword = async (values) => {
    try {
      setLoading(true);
      const data = {
        otp: values.otp,
        new_password: values.newPassword,
      };

      const response = await createAPIEndPointAuth("verify-otp").create(data);
      toast.success(response.data.message || "Password reset successfully!");
      navigate("/auth/sign-in");
    } catch (error) {
      toast.error(
        error?.response?.data?.error ||
          "Failed to reset password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ✅ Formik setup
  const formik = useFormik({
    initialValues: { otp: "", newPassword: "" },
    validationSchema,
    onSubmit: (values) => handleResetPassword(values),
  });

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100dvh",
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 2,
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.15)", // ✨ same as Login/Forgot
            }}
          >
            <Avatar sx={{ m: 1, bgcolor: "primary.main" }}>
              <LockIcon />
            </Avatar>
            <Typography component="h1" variant="h5" fontWeight="bold">
              Reset Password
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              gutterBottom
              mt={1}
              textAlign="center"
            >
              Enter the OTP and your new password below.
            </Typography>

            {/* Form */}
            <Box
              component="form"
              onSubmit={formik.handleSubmit}
              sx={{ mt: 0, width: "100%" }}
            >
              <TextField
                fullWidth
                label="OTP"
                size="small"
                margin="normal"
                variant="outlined"
                {...formik.getFieldProps("otp")}
                error={formik.touched.otp && Boolean(formik.errors.otp)}
                helperText={formik.touched.otp && formik.errors.otp}
              />

              <TextField
                fullWidth
                label="New Password"
                size="small"
                margin="normal"
                variant="outlined"
                type={showPassword ? "text" : "password"}
                {...formik.getFieldProps("newPassword")}
                error={
                  formik.touched.newPassword &&
                  Boolean(formik.errors.newPassword)
                }
                helperText={
                  formik.touched.newPassword && formik.errors.newPassword
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={togglePasswordVisibility} edge="end">
                        {showPassword ? (
                          <VisibilityOff sx={{ fontSize: 18 }} />
                        ) : (
                          <Visibility sx={{ fontSize: 18 }} />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type={loading ? "button" : "submit"}
                fullWidth
                variant="contained"
                color="primary"
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.2,
                  borderRadius: 2,
                  color: "white",
                  fontWeight: "bold",
                }}
              >
                {loading ? (
                  <CircularProgress size={24} sx={{ color: "white" }} />
                ) : (
                  "Reset Password"
                )}
              </Button>
            </Box>

            {/* Back to login */}
            <Link
              to="/auth/sign-in"
              style={{
                fontSize: 14,
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                marginTop: 8,
              }}
            >
              <ArrowBackIcon
                style={{ marginRight: 6, marginBottom: -2.5, fontSize: 16 }}
              />{" "}
              Back to Login
            </Link>
          </Paper>
        </Box>
      </Container>
    </div>
  );
};

export default ResetPassword;
