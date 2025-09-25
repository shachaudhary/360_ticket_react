import React, { useState } from "react";
import {
  Box,
  ClickAwayListener,
  Menu,
  MenuItem,
  Typography,
  IconButton,
  Badge,
} from "@mui/material";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import PersonIcon from "@mui/icons-material/Person";
import LockIcon from "@mui/icons-material/Lock";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import NotificationsIcon from "@mui/icons-material/Notifications"; // 🔔
import { useNavigate } from "react-router-dom";
import { getUserData } from "../state/AppContext";
import { toProperCase } from "../utils/formatting";

// ✅ avatar with initials
const ColorAvatar = ({ name }) => {
  const initials = name
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <Box
      sx={{
        width: 36,
        height: 36,
        borderRadius: "50%",
        // bgcolor: "primary.main",
        // bgcolor: "#F3F4F6",
        bgcolor: "#2bcb6b",
        color: "#FFF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 600,
        fontSize: 14,
      }}
    >
      {initials}
    </Box>
  );
};

const ProfilePopover = ({ isMobile = false }) => {
  const navigate = useNavigate();

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user_profile") || "null");
  } catch {
    user = null;
  }

  const userData = getUserData() || {};
  const userRole = userData?.user_role ?? "";
  const userName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim();

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_profile");
    localStorage.removeItem("user_role");
    navigate("/auth/sign-in");
  };

  return (
    <ClickAwayListener onClickAway={handleClose}>
      <Box sx={{ ml: 1, display: "flex", alignItems: "center", gap: 1 }}>
        {/* 🔔 Notification Icon */}
        <IconButton
          sx={{ color: "white" }}
          size="small"
          onClick={() => navigate("/notifications")}
        >
          <Badge
            // badgeContent={3}
            color="error"
            sx={{ mr: 1 }}

          >
            <NotificationsIcon fontSize="medium" className="!text-[30px] !text-[#2BCB6B] !text-opacity-100 brightness-150 !bg-white !bg-opacity-10 hover:!bg-opacity-25 p-[5px] rounded-full" />
          </Badge>
        </IconButton>

        {/* Avatar + Name */}
        <div
          onClick={handleClick}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            borderRadius: "8px",
            transition: "background 0.2s",
          }}
        >
          <ColorAvatar name={userName || "User"} />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              lineHeight: 1.2,
            }}
          >
            <span
              style={{
                fontWeight: 500,
                maxWidth: "150px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                fontSize: 14,
                color: "white",
              }}
              title={toProperCase(userName)}
            >
              {toProperCase(userName) || "User"}
            </span>
            <span
              style={{
                fontSize: 11.725,
                color: "#ddd",
                textTransform: "capitalize",
                marginTop: 1,
              }}
            >
              {toProperCase(userRole)}
            </span>
          </div>
          <ArrowDropDownIcon sx={{ color: "white" }} />
        </div>

        {/* MUI Menu with arrow */}
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          sx={{
            mt: 1,
            "& .MuiPaper-root": {
              overflow: "visible",
              borderRadius: "12px",
              minWidth: 200,
              py: 1,
              backgroundColor: "#fff",
              color: "#333",
              boxShadow: "0px 4px 12px rgba(0,0,0,0.15)",
            },
            "& .MuiPaper-root::before": {
              content: '""',
              position: "absolute",
              width: 12,
              height: 12,
              top: -6,
              right: isMobile ? "unset" : 24,
              backgroundColor: "#fff",
              transform: "rotate(45deg)",
              zIndex: 1,
              boxShadow: "-1px -1px 3px rgba(0,0,0,0.05)",
            },
          }}
        >
          <MenuItem
            onClick={() => {
              navigate("/profile");
              handleClose();
            }}
            sx={{
              display: "flex",
              alignItems: "center",
              px: 2,
              py: 1,
              "&:hover": { backgroundColor: "rgba(0,0,0,0.04)" },
            }}
          >
            <PersonIcon sx={{ mr: 1, color: "#1fb058" }} />
            <Typography variant="body2">Profile</Typography>
          </MenuItem>

          {/* <MenuItem
            onClick={() => {
              navigate("/account/change-password");
              handleClose();
            }}
            sx={{
              display: "flex",
              alignItems: "center",
              px: 2,
              py: 1,
              "&:hover": { backgroundColor: "rgba(0,0,0,0.04)" },
            }}
          >
            <LockIcon sx={{ mr: 1, color: "#1fb058" }} />
            <Typography variant="body2">Account</Typography>
          </MenuItem> */}

          <MenuItem
            onClick={handleLogout}
            sx={{
              display: "flex",
              alignItems: "center",
              px: 2,
              py: 1,
              "&:hover": { backgroundColor: "rgba(231,76,60,0.08)" },
            }}
          >
            <ExitToAppIcon sx={{ mr: 1, color: "#e74c3c" }} />
            <Typography variant="body2" sx={{ color: "#e74c3c" }}>
              Logout
            </Typography>
          </MenuItem>
        </Menu>
      </Box>
    </ClickAwayListener>
  );
};

export default ProfilePopover;
