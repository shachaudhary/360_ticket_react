import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Typography, Box, Stack, Button } from "@mui/material";

const NotFound = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user_profile"));

    if (storedUser) {
      setIsLoggedIn(true);
    } else {
      // 🚀 Automatically redirect to login if not logged in
      window.location.href = "https://dashboard.dental360grp.com/auth/sign-in";
    }
  }, []);

  const handleRedirect = () => {
    if (isLoggedIn) {
      navigate("/"); // internal route for dashboard
    } else {
      window.location.href = "https://dashboard.dental360grp.com/auth/sign-in";
    }
  };

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      height="100vh"
      textAlign="center"
      bgcolor="#000"
    >
      <Stack spacing={2} alignItems="center" justifyContent="center">
        <Typography
          variant="h4"
          fontWeight="bold"
          color="secondary"
          gutterBottom
        >
          404 - Page Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary" maxWidth={400}>
          Sorry, the page you are looking for does not exist or has been moved.
        </Typography>
        <Button onClick={handleRedirect}>
          {isLoggedIn ? "Back to Dashboard" : "Back to Login"}
        </Button>
      </Stack>
    </Box>
  );
};

export default NotFound;
