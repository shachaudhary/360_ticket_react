import React, { useEffect, useState } from "react";
import { Stack, Typography, Button, CircularProgress, Box } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { createAPIEndPoint } from "../config/api/api";
import toast from "react-hot-toast";
import StatusBadge, { textColors } from "./StatusBadge";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import PersonIcon from "@mui/icons-material/Person";
import { useApp } from "../state/AppContext";

export default function TicketHeader({ ticket, onUpdate, fetchAgain }) {
  const { user } = useApp();
  const [submitting, setSubmitting] = useState(false);
  const [following, setFollowing] = useState(false); // 🔹 local state for follow

  // ✅ Sync following state with ticket.followups
  useEffect(() => {
    if (ticket?.followups?.length && user?.id) {
      const isFollowing = ticket.followups.some((f) => f.user_id === user.id);
      setFollowing(isFollowing);
    } else {
      setFollowing(false);
    }
  }, [ticket, user]);

  // 🔹 Handle status updates after API success
  const handleStatusUpdate = async (newStatus) => {
    setSubmitting(true);

    try {
      await createAPIEndPoint(`ticket/${ticket.id}`).patch({
        updated_by: user?.id,
        status: newStatus,
      });

      // ✅ update locally only after API hit succeeds
      onUpdate?.({ ...ticket, status: newStatus });
      fetchAgain?.();
      toast.success(`Ticket marked as ${newStatus.replace("_", " ")}`);
    } catch (err) {
      console.error("Failed to update ticket", err);
      toast.error("Failed to update ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  // 🔹 Handle Follow/Unfollow toggle
  const handleFollowToggle = async () => {
    try {
      const newFollowing = !following;
      setFollowing(newFollowing);

      const formData = new FormData();
      formData.append(
        newFollowing ? "followup_user_ids_add" : "followup_user_ids_remove",
        user?.id
      );

      await createAPIEndPoint(`ticket/${ticket.id}`).patch(formData);

      toast.success(
        newFollowing
          ? "You are now following this ticket"
          : "Unfollowed this ticket"
      );
    } catch (err) {
      console.error("Failed to follow/unfollow ticket", err);
      toast.error("Something went wrong");
      setFollowing(following); // rollback state on error
    }
  };

  const currentStatus = ticket.status?.toLowerCase();

  // 🔹 Decide next action based on status
  let nextAction = null;
  if (currentStatus === "pending") {
    nextAction = {
      label: "Mark In Progress",
      status: "in_progress",
      icon: <PlayArrowIcon />,
      styles: {
        backgroundColor: "#54a0ff",
        color: "white",
        "&:hover": { backgroundColor: "#2e86de" },
      },
    };
  } else if (
    currentStatus === "in_progress" ||
    currentStatus === "in progress"
  ) {
    nextAction = {
      label: "Mark Completed",
      status: "completed",
      icon: <CheckCircleIcon />,
      styles: {
        backgroundColor: "#2ed896",
        color: "white",
        "&:hover": { backgroundColor: "#2ed589" },
      },
    };
  }

  return (
    <Stack
      direction={{ xs: "column", sm: "row" }} // ✅ column on mobile, row on sm+
      justifyContent="space-between"
      alignItems={{ xs: "stretch", sm: "center" }}
      spacing={{ xs: 2, sm: 0 }}
      mb={2}
      sx={{ width: "100%" }}
    >
      {/* Left side: Ticket heading + Follow button */}
      <Stack 
        direction={{ xs: "column", sm: "row" }} 
        spacing={{ xs: 1.5, sm: 2 }} 
        alignItems={{ xs: "flex-start", sm: "center" }} 
        flexWrap="wrap"
        sx={{ width: { xs: "100%", sm: "auto" } }}
      >
        <h2 className="text-lg md:text-xl font-medium text-sidebar whitespace-nowrap">
          Ticket <span className="font-bwold">#{ticket.id}</span>
        </h2>

        <Button
          variant={following ? "outlined" : "contained"}
          size="small"
          onClick={handleFollowToggle}
          startIcon={following ? <PersonIcon /> : <PersonAddAlt1Icon />}
          sx={{
            textTransform: "none",
            boxShadow: "none",
            borderRadius: "14px",
            fontWeight: 500,
            px: 1.5,
            minHeight: 35,
            width: { xs: "100%", sm: "auto" },
            ...(following
              ? {
                  borderColor: "#0984e3",
                  color: "#0984e3",
                  "&:hover": { backgroundColor: "#E3F2FD" },
                }
              : {
                  backgroundColor: "#0984e3",
                  color: "white",
                  "&:hover": { backgroundColor: "#74b9ff" },
                }),
          }}
        >
          {following ? "Following" : "Follow"}
        </Button>
      </Stack>

      {/* Right side: Status + Actions */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        alignItems={{ xs: "stretch", sm: "center" }}
        flexWrap="wrap"
        justifyContent={{ xs: "stretch", sm: "flex-end" }}
        sx={{ width: { xs: "100%", sm: "auto" } }}
      >
        <Box sx={{ width: { xs: "100%", sm: "auto" }, display: "flex", justifyContent: { xs: "flex-start", sm: "center" } }}>
          <StatusBadge status={ticket.status} isBigger={true} />
        </Box>

        {nextAction && (
          <Button
            variant="contained"
            size="small"
            onClick={() => handleStatusUpdate(nextAction.status)}
            disabled={submitting}
            sx={{
              textTransform: "none",
              color: "white",
              px: 1.5,
              borderRadius: "14px",
              fontWeight: 500,
              boxShadow: "none",
              minHeight: 35,
              width: { xs: "100%", sm: "auto" },
              ...nextAction.styles,
            }}
            startIcon={!submitting && nextAction.icon}
          >
            {submitting ? (
              <CircularProgress size={18} sx={{ color: "white" }} />
            ) : (
              nextAction.label
            )}
          </Button>
        )}
      </Stack>
    </Stack>
  );
}
