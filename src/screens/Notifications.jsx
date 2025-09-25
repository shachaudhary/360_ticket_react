import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  Typography,
  IconButton,
  Tooltip,
  Divider,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import StatusBadge from "../components/StatusBadge";
import { createAPIEndPoint } from "../config/api/api";
import { useApp } from "../state/AppContext";
import { convertToCST } from "../utils";
import toast from "react-hot-toast";

// ✅ Animations
import { CSSTransition, TransitionGroup } from "react-transition-group";

export default function ActivityFeed() {
  const { user } = useApp();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await createAPIEndPoint(
        `notifications?user_id=${user?.id || 56}`
      ).fetchAll();
      setActivities(res?.data?.notifications || []);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
      toast.error("Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  // 🔹 Delete single
  const handleDeleteOne = async (id) => {
    try {
      await createAPIEndPoint(
        `notifications/${id}?user_id=`
      ).delete(user?.id);
      setActivities((prev) => prev.filter((n) => n.id !== id)); // animate out
      toast.success("Notification deleted");
    } catch (err) {
      console.error("Failed to delete notification", err);
      toast.error("Failed to delete notification");
    }
  };

  // 🔹 Clear all
  const handleClearAll = async () => {
    try {
      await createAPIEndPoint(
        `notifications/clear_all?user_id=${user?.id || 56}`
      ).delete();
      setActivities([]);
      toast.success("All notifications cleared");
    } catch (err) {
      console.error("Failed to clear notifications", err);
      toast.error("Failed to clear notifications");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg md:text-xl font-semibold">Notifications</h2>
        <div className="overflow-hidden rounded-lg border border-[#E5E7EB]">
          <div className="h-[calc(100vh-135px)] flex items-center justify-center bg-green-50">
            <CircularProgress size={28} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg md:text-xl font-semibold">Notifications</h2>
        {/* {activities.length > 0 && (
          <button
            onClick={handleClearAll}
            className="h-9 rounded-lg px-3 text-xs font-medium border border-red-500 text-red-500 hover:bg-red-50 focus:ring-red-500"
          >
            Clear All
          </button>
        )} */}
      </div>

      {/* Card */}
      <Card
        sx={{
          borderRadius: "0px",
          overflow: "hidden",
          backgroundColor: "#fff",
          boxShadow:
            "rgba(14, 63, 126, 0.04) 0px 0px 0px 1px, rgba(42, 51, 69, 0.04) 0px 1px 1px -0.5px, rgba(42, 51, 70, 0.04) 0px 3px 3px -1.5px, rgba(42, 51, 70, 0.04) 0px 6px 6px -3px, rgba(14, 63, 126, 0.04) 0px 12px 12px -6px, rgba(14, 63, 126, 0.04) 0px 24px 24px -12px",
          maxHeight: "calc(100dvh - 140px)",
          overflowY: "auto",
        }}
      >
        {activities.length === 0 ? (
          <Box className="p-6 text-center h-[calc(100vh-140px)]   flex items-center justify-center text-gray-500 text-sm">
            No notifications found
          </Box>
        ) : (
          <TransitionGroup>
            {activities.map((a, idx) => (
              <CSSTransition key={a.id} timeout={300} classNames="fade">
                <div>
                  <Box
                    className="flex flex-col sm:flex-row sm:items-start sm:justify-between
                               p-5 hover:bg-gray-50 transition"
                  >
                    {/* Content */}
                    <Box className="flex-1 mb-3 sm:mb-0">
                      <Box className="flex items-center gap-2 mb-1 flex-wrap">
                        <StatusBadge
                          status={a.notification_type}
                          isInside
                          customRadius="6px"
                        />
                        <Typography
                          variant="subtitle2"
                          className="font-semibold text-gray-800"
                        >
                          {a.ticket_title}
                        </Typography>
                      </Box>

                      <Typography
                        variant="body2"
                        className="text-gray-600 mb-1 leading-snug"
                      >
                        {a.message}
                      </Typography>
                    </Box>

                    {/* Right side */}
                    <Box
                      className="flex flex-row sm:flex-col 
                                 items-center sm:items-end 
                                 justify-between sm:justify-start 
                                 gap-2 min-w-full sm:min-w-[160px]"
                    >
                      <Tooltip title={convertToCST(a.created_at)}>
                        <Box className="flex items-center text-xs text-gray-500 gap-1">
                          <AccessTimeIcon sx={{ fontSize: 16 }} />
                          {convertToCST(a.created_at)}
                        </Box>
                      </Tooltip>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteOne(a.id)}
                        className="!text-gray-400 !bg-slate-50 hover:!bg-slate-100 hover:!text-slate-400 !rounded-md"
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>

                  {/* Divider */}
                  {idx !== activities.length - 1 && (
                    <Divider sx={{ backgroundColor: "#E5E7EB", mx: 2.5 }} />
                  )}
                </div>
              </CSSTransition>
            ))}
          </TransitionGroup>
        )}
      </Card>
    </div>
  );
}
