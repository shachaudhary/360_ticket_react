import { useEffect, useState } from "react";
import {
  IconButton,
  Popover,
  Box,
  Typography,
  useMediaQuery,
} from "@mui/material";
import toast from "react-hot-toast";
import { createAPIEndPointAuth } from "../config/api/apiAuth";
import { Squares2X2Icon } from "@heroicons/react/24/outline";

const AppMenu = () => {
  const isMobile = useMediaQuery("(min-width: 600px)");
  let token =
    typeof localStorage !== "undefined" && localStorage.getItem("access_token");

  const [anchorEl, setAnchorEl] = useState(null);

  let user = null;
  if (typeof localStorage !== "undefined") {
    try {
      user = JSON.parse(localStorage.getItem("user_profile") || "null");
    } catch {
      user = null;
    }
  }

  const userId = user?.id ?? null;
  const [apps, setApps] = useState([]);

  const fetchUserApps = async () => {
    try {
      const response = await createAPIEndPointAuth(
        "user_dashboards/"
      ).fetchById(userId);

      const filteredDashboards = response.data.dashboards.filter(
        (dashboard) => dashboard.name !== "support"
      );

      setApps(filteredDashboards || []);
    } catch (err) {
      toast.error(err?.response?.data?.error || "Error fetching dashboards");
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUserApps();
    }
  }, [userId]);

  const handleClick = (event) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  const redirectToDashboard = (url) => {
    try {
      if (url) {
        const redirectURL = `${url}?token=${token}`;
        window.open(redirectURL, "_blank");
      } else {
        toast.error("No redirect URL found in response");
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || "Error opening dashboard");
    }
  };

  return (
    <Box display="flex" alignItems="center">
      {/* Apps Button */}
      <IconButton
        onClick={handleClick}
        sx={{
          border: "1px solid #DDE1E5",
          borderRadius: "8px",
          bgcolor: "white",
          color: "#374151",
          "&:hover": {
            bgcolor: "#f3f4f6",
          },
          p: 0.75,
        }}
      >
        <Squares2X2Icon className="h-5 w-5" />
      </IconButton>

      {/* Popover Menu */}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        sx={{
          mt: 2,
          ml:-2,
          "& .MuiPaper-root": {
            position: "relative",
            borderRadius: 2,
            maxWidth: "300px",
            padding: "8px",
            overflow: "visible",
            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.15)",
            border: "1px solid #DDE1E5",
          },
          "& .MuiPaper-root::before": {
            content: '""',
            position: "absolute",
            width: 14,
            height: 14,
            top: -7.5,
            left: isMobile ? 28 : 24,
            backgroundColor: "white",
            transform: "rotate(45deg)",
            borderLeft: "1px solid #DDE1E5",
            borderTop: "1px solid #DDE1E5",
            boxShadow: "-1px -1px 3px rgba(0,0,0,0.08)",
            zIndex: 1,
          },
        }}
      >
        <div className="grid grid-cols-3 gap-5 px-2 py-3.5">
          {apps && apps.length > 0 ? (
            apps.map((app, index) => (
              <div
                key={index}
                onClick={() => redirectToDashboard(app.dashboard_url)}
                className="cursor-pointer flex flex-col items-center justify-center"
              >
                <div className="w-[34px] h-[34px] flex items-center justify-center rounded-full bg-brand-500 hover:bg-brand-600 transition-a shadow-sm">
                  <span className="text-white font-semibold text-sm uppercase !font-sans">
                    {app?.name?.charAt(0) || "?"}
                  </span>
                </div>
                <Typography
                  mt={1}
                  textAlign="center"
                  variant="body2"
                  className="!text-xs text-gray-500 capitalize "
                >
                  {app?.name || "Unknown"}
                </Typography>
              </div>
            ))
          ) : (
            <Typography className="text-gray-400 col-span-3 text-center py-2">
              No apps found
            </Typography>
          )}
        </div>
      </Popover>
    </Box>
  );
};

export default AppMenu;
