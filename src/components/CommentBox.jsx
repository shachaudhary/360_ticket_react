import React, { useState, useRef } from "react";
import {
  Box,
  TextField,
  Button,
  Chip,
  CircularProgress,
  Typography,
  Popover,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { createAPIEndPointAuth } from "../config/api/apiAuth";
import { getUserData } from "../utils";
import { createAPIEndPoint } from "../config/api/api";
import toast from "react-hot-toast";
import MentionsInput from "./MentionsInput";

export default function CommentBox({ ticketId, onAdd }) {
  const user = getUserData();
  const [comment, setComment] = useState("");
  const [mentions, setMentions] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!comment.trim() && mentions.length === 0) {
      toast.error("Please enter a comment or tag someone before submitting.");
      return;
    }

    const payload = {
      user_id: user?.id,
      ...(comment.trim() && { comment }),
      ...(mentions.length > 0 && {
        user_ids: mentions.map((m) => m.user_id),
      }),
    };

    setSubmitting(true);
    try {
      const res = await createAPIEndPoint(
        `ticket/activity/${ticketId}`
      ).createWithJSONFormat(payload);

      onAdd?.(res.data);
      setComment("");
      setMentions([]);
    } catch (err) {
      console.error("Failed to add comment/tag", err);
      toast.error("Failed to add comment or mention.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    // <div className="mt-6 rounded-xl border border-gray-200 p-3 relative">
    <div className="w-full relative">
      <Typography
        variant="h6"
        fontWeight={600}
        color="primary"
        gutterBottom
        className="!mb-3 !text-lg"
      >
        Comments
      </Typography>

      {/* 🔹 Integrated MentionsInput */}
      <MentionsInput
        value={comment}
        onChange={setComment}
        mentions={mentions}
        setMentions={setMentions}
      />

      {/* Show selected mentions */}
      {/* {mentions.length > 0 && (
        <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
          {mentions.map((m) => (
            <Chip
              key={m.user_id}
              label={`@${m.first_name} ${m.last_name}`}
              size="small"
              variant="outlined"
              onDelete={() =>
                setMentions((prev) =>
                  prev.filter((mm) => mm.user_id !== m.user_id)
                )
              }
            />
          ))}
        </Box>
      )} */}

      <Box className="flex justify-end mt-2">
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={submitting}
          sx={{
            textTransform: "none",
            color: "white",
            px: 2.5,
            borderRadius: 2,
            fontWeight: 500,
            boxShadow: "none",
            fontSize: 13,
            minHeight: 36,
          }}
        >
          {submitting ? (
            <CircularProgress size={20} sx={{ color: "white" }} />
          ) : (
            "Add"
          )}
        </Button>
      </Box>
    </div>
  );
}
