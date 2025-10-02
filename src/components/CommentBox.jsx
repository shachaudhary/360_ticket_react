import React, { useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Typography,
  Paper,
  Divider,
} from "@mui/material";
import { Send as SendIcon } from "@mui/icons-material";
import { createAPIEndPoint } from "../config/api/api";
import { getUserData } from "../utils";
import toast from "react-hot-toast";
import MentionsInput from "./MentionsInput";

export default function CommentBox({ ticketId, onAdd }) {
  const user = getUserData();
  const [comment, setComment] = useState("");
  const [mentions, setMentions] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!comment.trim() && mentions.length === 0) {
      toast.error("Please enter a comment or tag someone.");
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
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        // borderRadius: 3,
        border: "1px solid #e0e0e0",
        background: "#fafafa",
      }}
    >
      <Typography
        variant="subtitle1"
        fontWeight={600}
        gutterBottom
        sx={{ mb: 1 }}
      >
        Add a Comment
      </Typography>

      <MentionsInput
        value={comment}
        onChange={setComment}
        mentions={mentions}
        setMentions={setMentions}
      />

      {/* Show mentions */}
      {/* {mentions.length > 0 && (
        <Box
          sx={{
            mt: 1,
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          {mentions.map((m) => (
            <Chip
              key={m.user_id}
              label={`@${m.first_name} ${m.last_name}`}
              size="small"
              variant="outlined"
              color="primary"
              onDelete={() =>
                setMentions((prev) =>
                  prev.filter((mm) => mm.user_id !== m.user_id)
                )
              }
            />
          ))}
        </Box>
      )} */}

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          onClick={handleSubmit}
          variant="contained"
          startIcon={
            submitting ? (
              <CircularProgress size={16} sx={{ color: "white" }} />
            ) : (
              <SendIcon />
            )
          }
          disabled={submitting}
          sx={{
            textTransform: "none",
            borderRadius: 2,
            fontWeight: 600,
            px: 3,
            minHeight: 40,
          }}
        >
          {submitting ? "Posting..." : "Post"}
        </Button>
      </Box>
    </Paper>
  );
}
