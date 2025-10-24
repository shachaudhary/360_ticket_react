import React, { useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Typography,
  Paper,
} from "@mui/material";
import { Send as SendIcon } from "@mui/icons-material";
import { createAPIEndPoint } from "../../config/api/api";
import { getUserData } from "../../utils";
import toast from "react-hot-toast";
import MentionsInput from "../MentionsInput"; // ✅ keep same component

export default function CommentBox({ contactId, onAdd }) {
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
      await createAPIEndPoint(
        `contact_comments/add/${contactId}`
      ).createWithJSONFormat(payload);
      toast.success("Comment added successfully!");
      setComment("");
      setMentions([]);
      onAdd?.();
    } catch (err) {
      console.error("Failed to add comment or mention", err);
      toast.error("Failed to add comment or mention.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Paper elevation={0} sx={{ borderRadius: 3 }}>
      <Typography
        variant="subtitle1"
        fontWeight={600}
        gutterBottom
        color="#0F1A1C"
        sx={{ mb: 1 }}
        className="!text-lg !font-semibold"
      >
        Add a Comment
      </Typography>

      <div className="border bg-white rounded-md">
        <MentionsInput
          value={comment}
          onChange={setComment}
          mentions={mentions}
          setMentions={setMentions}
        />

        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            pr: "12px",
            pb: "12px",
            pt: mentions.length > 0 ? 0.5 : 1,
          }}
        >
          <Button
            onClick={handleSubmit}
            variant="contained"
            startIcon={
              submitting ? (
                <CircularProgress size={16} sx={{ color: "white" }} />
              ) : (
                <SendIcon style={{ fontSize: 14, marginBottom: -1.25 }} />
              )
            }
            disabled={submitting}
            sx={{
              textTransform: "none",
              color: "white",
              px: 1.5,
              borderRadius: 0.75,
              fontWeight: 500,
              boxShadow: "none",
              fontSize: 13,
              maxHeight: 32,
            }}
          >
            {submitting ? "Posting..." : "Post"}
          </Button>
        </Box>
      </div>
    </Paper>
  );
}
