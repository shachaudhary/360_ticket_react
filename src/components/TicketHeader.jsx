import React, { useEffect, useState } from "react";
import { Stack, Button, CircularProgress, Box } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import PersonIcon from "@mui/icons-material/Person";
import Tooltip from "@mui/material/Tooltip";
import toast from "react-hot-toast";

import { createAPIEndPoint } from "../config/api/api";
import StatusBadge from "./StatusBadge";
import { useApp } from "../state/AppContext";

/* ================================
   STATUS ACTION CONFIG
================================ */
const STATUS_ACTIONS = {
  pending: [
    {
      label: "Mark In Progress",
      status: "in_progress",
      icon: <PlayArrowIcon />,
      styles: {
        backgroundColor: "#54a0ff",
        "&:hover": { backgroundColor: "#2e86de" },
      },
    },
  ],

  in_progress: [
    {
      label: "Mark Completed",
      status: "completed",
      icon: <CheckCircleIcon />,
      styles: {
        backgroundColor: "#2ed896",
        "&:hover": { backgroundColor: "#2ed589" },
      },
    },
  ],

  // ✅ UPDATED: completed → only reopen to in_progress
  completed: [
    {
      label: "Reopen Ticket",
      status: "in_progress",
      icon: <PlayArrowIcon />,
      styles: {
        backgroundColor: "#54a0ff",
        "&:hover": { backgroundColor: "#2e86de" },
      },
    },
  ],
};


/* ================================
   COMPONENT
================================ */
export default function TicketHeader({ ticket, onUpdate, fetchAgain }) {
  const { user } = useApp();

  const [submitting, setSubmitting] = useState(false);
  const [following, setFollowing] = useState(false);

  /* ------------------------------
     SAFETY GUARD
  ------------------------------ */
  if (!ticket) return null;

  /* ------------------------------
     FOLLOW STATE SYNC
  ------------------------------ */
  useEffect(() => {
    if (ticket?.followups?.length && user?.id) {
      setFollowing(ticket.followups.some(f => f.user_id === user.id));
    } else {
      setFollowing(false);
    }
  }, [ticket, user]);

  /* ------------------------------
     STATUS HANDLING
  ------------------------------ */
  const currentStatus = ticket.status?.toLowerCase();
  const actions = STATUS_ACTIONS[currentStatus] || [];

  const handleStatusUpdate = async (newStatus) => {
    if (submitting) return;

    setSubmitting(true);
    try {
      await createAPIEndPoint(`ticket/${ticket.id}`).patch({
        status: newStatus,
        updated_by: user?.id,
      });

      onUpdate?.({ ...ticket, status: newStatus });
      fetchAgain?.();

      toast.success(`Ticket moved to ${newStatus.replace("_", " ")}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    } finally {
      setSubmitting(false);
    }
  };

  /* ------------------------------
     FOLLOW / UNFOLLOW
  ------------------------------ */
  const handleFollowToggle = async () => {
    const next = !following;
    setFollowing(next);

    try {
      const formData = new FormData();
      formData.append(
        next ? "followup_user_ids_add" : "followup_user_ids_remove",
        user?.id
      );

      await createAPIEndPoint(`ticket/${ticket.id}`).patch(formData);

      toast.success(next ? "Following ticket" : "Unfollowed ticket");
    } catch (err) {
      console.error(err);
      setFollowing(!next);
      toast.error("Action failed");
    }
  };

  /* ================================
     RENDER
  ================================ */
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      justifyContent="space-between"
      alignItems={{ xs: "stretch", sm: "center" }}
      spacing={2}
      mb={2}
      sx={{ width: "100%" }}
    >
      {/* LEFT SIDE */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ xs: "flex-start", sm: "center" }}
      >
        <h2 className="text-lg md:text-xl font-medium text-sidebar">
          Ticket <span className="font-semibold">#{ticket.id}</span>
        </h2>

        <Button
          variant={following ? "outlined" : "contained"}
          size="small"
          onClick={handleFollowToggle}
          startIcon={following ? <PersonIcon /> : <PersonAddAlt1Icon />}
          sx={{
            textTransform: "none",
            borderRadius: "14px",
            boxShadow: "none",
            minHeight: 35,
            ...(following
              ? {
                borderColor: "#0984e3",
                color: "#0984e3",
                "&:hover": { backgroundColor: "#E3F2FD" },
              }
              : {
                backgroundColor: "#0984e3",
                "&:hover": { backgroundColor: "#74b9ff" },
              }),
          }}
        >
          {following ? "Following" : "Follow"}
        </Button>
      </Stack>

      {/* RIGHT SIDE */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="flex-end"
      >
        <Tooltip title="Current status" arrow>
          <span>
            <StatusBadge status={ticket.status} isBigger />
          </span>
        </Tooltip>

        {actions.map((action) => (
          <Button
            key={action.status}
            size="small"
            variant="contained"
            disabled={submitting}
            onClick={() => handleStatusUpdate(action.status)}
            startIcon={!submitting && action.icon}
            sx={{
              textTransform: "none",
              borderRadius: "14px",
              minHeight: 35,
              color: "white",
              boxShadow: "none",
              ...action.styles,
            }}
          >
            {submitting ? (
              <CircularProgress size={18} sx={{ color: "white" }} />
            ) : (
              action.label
            )}
          </Button>
        ))}
      </Stack>
    </Stack>
  );
}
