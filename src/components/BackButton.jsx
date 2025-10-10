import React from "react";
import { IconButton } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";

// Component to render the back button
const BackButton = ({ self = null }) => {
  const navigate = useNavigate();

  // Handle the back navigation
  const handleBack = () => {
    if (self) {
      navigate(self);
    } else {
      navigate(-1); // Go back to the previous page
    }
  };

  return (
    <IconButton
      color="primary.main"
      onClick={handleBack}
      sx={{
        display: "flex",
        alignItems: "center",
        width: "fit-content",
        padding: "7px",
        backgroundColor: "primary.main", // Light grey background
        borderRadius: "24px",
        "&:hover": {
          backgroundColor: "#824EF2",
          color: "primary.main",
        },
      }}
    >
      <ChevronLeftIcon color="#fff" sx={{ fontSize: "20px", color: "#fff" }} />
    </IconButton>
  );
};

export default BackButton;
