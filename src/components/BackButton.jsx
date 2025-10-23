import React from "react";
import { IconButton, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";

const BackButton = ({ self = null, isSmall = false, textBtn = false }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (self) navigate(self);
    else navigate(-1);
  };

  // 🟢 Text-style button (outlined)
  if (textBtn) {
    return (
      <Button
        onClick={handleBack}
        variant="outlined"
        size="small"
        // startIcon={<ChevronLeftIcon />}
        sx={{
          borderRadius: "8px",
          textTransform: "none",
          fontWeight: 600,
          // borderColor: "primary.main",
          minHeight: 32,

          color: "primary.main",
          "&:hover": {
            backgroundColor: "primary.main",
            color: "#fff",
            borderColor: "primary.main",
          },
        }}
      >
        <span style={{ marginBottom: 1 }}>Back</span>
      </Button>
    );
  }

  // 🟢 Default icon-only button
  return (
    <IconButton
      onClick={handleBack}
      sx={{
        display: "flex",
        alignItems: "center",
        width: "fit-content",
        padding: isSmall ? "5.5px" : "7px",
        backgroundColor: "primary.main",
        borderRadius: "24px",
        "&:hover": {
          backgroundColor: "secondary.main",
          color: "primary.main",
        },
      }}
    >
      <ChevronLeftIcon
        sx={{ fontSize: isSmall ? "17px" : "20px", color: "#fff" }}
      />
    </IconButton>
  );
};

export default BackButton;
