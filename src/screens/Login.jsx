import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { createAPIEndPointAuth } from "../config/api/apiAuth";
import { Link, useNavigate } from "react-router-dom";
import { useUserProfile } from "../context/UserProfileContext";
import OTPInput from "react-otp-input";
import toast from "react-hot-toast";
import { logoutUser } from "../utils";
import {
  Box,
  Button,
  Container,
  CssBaseline,
  Paper,
  Typography,
  TextField,
  IconButton,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Avatar from "@mui/material/Avatar";
import { useApp } from "../state/AppContext";

export default function Login() {
  const { fetchUser } = useApp();
  const navigate = useNavigate();
  const { getUser } = useUserProfile();

  const [loading, setLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [showQrCode, setShowQrCode] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [otp, setOtp] = useState("");
  const [check, setCheck] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

  // 🔹 Login API
  const login = async (email, password) => {
    try {
      setLoading(true);
      const data = { email, password };
      const response = await createAPIEndPointAuth("login").create(data);

      setTempToken(response.data.temp_token);
      setShowQrCode(true);

      if (response.data.qr_code) {
        setQrCodeUrl(`data:image/png;base64,${response.data.qr_code}`);
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast.error(
        error?.response?.data?.error || "Login failed. Please try again."
      );
    }
  };

  // 🔹 Verify OTP
  const verifyOtp = async () => {
    if (otp.length < 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    try {
      setCheck(true);
      const data = { token: otp, temp_token: tempToken };
      const response = await createAPIEndPointAuth("verify_2fa").create(data);

      localStorage.setItem("access_token", response.data.token);
      toast.success(response?.data?.message || "OTP verified successfully!");
      checkAuthProfile();
    } catch (error) {
      setCheck(false);
      toast.error(error?.response?.data?.error || "OTP verification failed.");
    }
  };

  // 🔹 Auth Profile
  const checkAuthProfile = async () => {
    try {
      const response = await createAPIEndPointAuth("auth_profile").fetchAll();
      const data = response.data;

      localStorage.setItem("user_profile", JSON.stringify(data.profile));
      localStorage.setItem("user_role", data.profile.user_role);

      await fetchUser();
      await checkDashboard(data);
    } catch (error) {
      setCheck(false);
      console.error("Error fetching auth profile:", error);
    }
  };

  // 🔹 Dashboard check
  const checkDashboard = async (profileData) => {
    try {
      await createAPIEndPointAuth("dashboard/check").create({
        profile: profileData.profile,
      });
      setTimeout(() => navigate("/home"), 1000);
      getUser();
      setCheck(false);
    } catch (error) {
      setCheck(false);
      if (
        error.response?.data?.error?.includes("Dashboard name does not match")
      ) {
        toast.error("Access to this dashboard is not permitted.");
        setShowQrCode(false);
        logoutUser(navigate);
      } else {
        toast.error("Dashboard verification failed. Please try again.");
      }
    }
  };

  useEffect(() => {
    if (otp.length === 6) verifyOtp();
  }, [otp]);

  // 🔹 Formik setup
  const formik = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema: Yup.object({
      email: Yup.string()
        .email("Please enter a valid email address")
        .required("Email is required"),
      password: Yup.string().required("Password is required"),
    }),
    onSubmit: (values) => login(values.email, values.password),
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-lime-200">
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
              py: 2,
              px: 4,
              borderRadius: 2,
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.15)", // ✨ nicer custom shadow
            }}
          >
            <Avatar sx={{ m: 1, bgcolor: "primary.main" }}>
              <LockOutlinedIcon />
            </Avatar>
            <Typography component="h1" variant="h5" fontWeight="bold">
              {qrCodeUrl ? "Verify OTP" : "Sign in"}
            </Typography>

            {!showQrCode && (
              <Typography
                variant="body2"
                color="text.secondary"
                gutterBottom
                mt={1}
              >
                Enter your credentials to continue
              </Typography>
            )}

            {!showQrCode ? (
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
                  {...formik.getFieldProps("email")}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={formik.touched.email && formik.errors.email}
                />

                <TextField
                  fullWidth
                  label="Password"
                  size="small"
                  margin="normal"
                  variant="outlined"
                  type={showPassword ? "text" : "password"}
                  {...formik.getFieldProps("password")}
                  error={
                    formik.touched.password && Boolean(formik.errors.password)
                  }
                  helperText={formik.touched.password && formik.errors.password}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={togglePasswordVisibility}
                          edge="end"
                          size="small"
                        >
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

                {/* 🔹 Forgot Password link */}
                <Typography
                  variant="body2"
                  sx={{
                    // mt: 1,
                    // mb: 1,
                    color: "primary.main",
                    cursor: "pointer",
                    textAlign: "right",
                    fontSize: 14,
                    fontWeight: "500",
                    "&:hover": { textDecoration: "underline" },
                  }}
                  onClick={() => navigate("/auth/forgot-password")}
                >
                  Forgot Password?
                </Typography>

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
                    color: "white", // ✨ force text white
                    fontWeight: "bold",
                    // boxShadow: 2, // subtle shadow for button
                  }}
                >
                  {loading ? (
                    <CircularProgress size={24} sx={{ color: "white" }} />
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </Box>
            ) : (
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                sx={{ mt: 2, width: "100%" }}
              >
                {qrCodeUrl && (
                  <Box mb={2}>
                    <img
                      src={qrCodeUrl}
                      alt="QR Code"
                      style={{ width: "150px", height: "150px" }}
                    />
                  </Box>
                )}
                <Typography
                  variant="body2"
                  fontWeight={500}
                  mb={2}
                  color="#2d3436"
                >
                  Enter OTP
                </Typography>

                <div className="otp-input">
                  <OTPInput
                    value={otp}
                    onChange={(value) => setOtp(value)}
                    numInputs={6}
                    shouldAutoFocus
                    isInputNum
                    inputStyle={{
                      width: "40px",
                      height: "40px",
                      margin: "0 4px",
                      fontSize: "16px",
                      borderRadius: "8px",
                      border: "1px solid #ccc",
                      textAlign: "center",
                    }}
                    renderInput={(props) => <input {...props} />}
                  />
                </div>

                <Button
                  onClick={verifyOtp}
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
                    boxShadow: 2,
                  }}
                >
                  {check ? (
                    <CircularProgress size={24} sx={{ color: "white" }} />
                  ) : (
                    "Verify"
                  )}
                </Button>

                <Typography
                  variant="body2"
                  sx={{
                    // color: "primary.main",
                    mb: 1,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    "&:hover": { textDecoration: "underline" },
                  }}
                  onClick={() => setShowQrCode(false)}
                >
                  <ArrowBackIcon
                    style={{ marginRight: 6, marginBottom: -2.5, fontSize: 16 }}
                  />{" "}
                  Back to Login
                </Typography>

                {/* <Link
                  to="/auth/sign-in"
                  onClick={() => setShowQrCode(false)}
                  style={{
                    fontSize: 14,
                    // textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    marginTop: 8,
                  }}
                >
                  <ArrowBackIcon
                    style={{ marginRight: 6, marginBottom: -2.5, fontSize: 16 }}
                  />{" "}
                  Back to Login
                </Link> */}
              </Box>
            )}
          </Paper>
        </Box>
      </Container>
    </div>
  );
}
