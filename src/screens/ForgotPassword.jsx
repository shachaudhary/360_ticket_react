import React, { useState } from "react";
import {
  Box,
  Button,
  Container,
  CssBaseline,
  Paper,
  Typography,
  TextField,
  Avatar,
  CircularProgress,
} from "@mui/material";
import LockResetIcon from "@mui/icons-material/LockReset";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { createAPIEndPointAuth } from "../config/api/apiAuth";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import bgImage from "../assets/bg-image.jpg";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleForgetPassword = async (values) => {
    try {
      setLoading(true);
      const data = { email: values.email };
      const response = await createAPIEndPointAuth("forgot-password").create(
        data
      );
      toast.success(response.data.message || "Reset link sent successfully!");
      navigate("/auth/reset-password");
    } catch (error) {
      toast.error(
        error?.response?.data?.error ||
          "Failed to reset password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const formik = useFormik({
    initialValues: { email: "" },
    validationSchema: Yup.object({
      email: Yup.string()
        .email("Please enter a valid email address")
        .required("Email is required"),
    }),
    onSubmit: (values) => handleForgetPassword(values),
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
              boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.15)", // same style as Login
            }}
          >
            <Avatar sx={{ m: 1, bgcolor: "primary.main" }}>
              <LockResetIcon />
            </Avatar>
            <Typography component="h1" variant="h5" fontWeight="bold">
              Forgot Password
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              gutterBottom
              mt={1}
              textAlign="center"
            >
              Enter your email to reset your password.
            </Typography>

            {/* Form */}
            <Box
              component="form"
              onSubmit={formik.handleSubmit}
              sx={{ mt: 2, width: "100%" }}
            >
              <TextField
                fullWidth
                label="Email"
                size="small"
                margin="normal"
                variant="outlined"
                type="email"
                {...formik.getFieldProps("email")}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
              />

              <Button
                type={loading ? "button" : "submit"}
                fullWidth
                variant="contained"
                color="primary"
                sx={{
                  mt: 2,
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

            {/* Back to Login */}
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

export default ForgotPassword;
