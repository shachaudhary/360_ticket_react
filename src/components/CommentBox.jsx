import React, { useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Typography,
  Paper,
  Divider,
  IconButton,
} from "@mui/material";
import { Send as SendIcon } from "@mui/icons-material";
import { PaperClipIcon, XMarkIcon } from "@heroicons/react/24/outline";
import axios from "axios";
import { createAPIEndPoint } from "../config/api/api";
import { getUserData } from "../utils";
import toast from "react-hot-toast";
import MentionsInput from "./MentionsInput";

export default function CommentBox({ ticketId, onAdd }) {
  const user = getUserData();
  const [comment, setComment] = useState("");
  const [mentions, setMentions] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState([]);

  const handleFileSelect = (selectedFiles) => {
    const newFiles = Array.from(selectedFiles).map((file) => ({
      name: file.name,
      file: file,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!comment.trim() && mentions.length === 0 && files.length === 0) {
      toast.error("Please enter a comment, tag someone, or attach a file.");
      return;
    }

    setSubmitting(true);
    try {
      if (files.length > 0) {
        // If files are attached, use FormData
        const BASE_URL = import.meta.env.VITE_APP_BASE_URL;
        const X_API_Key = import.meta.env.VITE_APP_X_API_Key;
        const token = typeof localStorage !== 'undefined' && localStorage.getItem('access_token');
        const url = `${BASE_URL}/ticket/activity/${ticketId}`;

        const formData = new FormData();
        formData.append("user_id", user?.id);
        if (comment.trim()) {
          formData.append("comment", comment);
        }
        if (mentions.length > 0) {
          formData.append("user_ids", JSON.stringify(mentions.map((m) => m.user_id)));
        }
        files.forEach((fileObj) => {
          formData.append("files", fileObj.file);
        });

        const res = await axios.post(url, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-API-Key': X_API_Key,
            "ngrok-skip-browser-warning": "true",
          },
        });

        onAdd?.(res.data);
      } else {
        // If no files, use JSON format
        const payload = {
          user_id: user?.id,
          ...(comment.trim() && { comment }),
          ...(mentions.length > 0 && {
            user_ids: mentions.map((m) => m.user_id),
          }),
        };

        const res = await createAPIEndPoint(
          `ticket/activity/${ticketId}`
        ).createWithJSONFormat(payload);

        onAdd?.(res.data);
      }

      setComment("");
      setMentions([]);
      setFiles([]);
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
      sx={
        {
          // p: 1.5,
          // borderRadius: 3,
          // border: "1px solid #e0e0e0",
          // background: "#fafafa",
        }
      }
    >
      {/* <Typography
        variant="subtitle1"
        fontWeight={600}
        gutterBottom
        // color="primary"
        color="#0F1A1C"
        sx={{ mb: 1 }}
        className="!text-lg !font-semibold"
      >
        Add a Comment
      </Typography> */}

      <div className="border bg-white rounded-md">
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

        {/* File Attachments Section */}
        {files.length > 0 && (
          <Box sx={{ px: "12px", pt: 1, pb: 0.5 }}>
            <Typography variant="caption" sx={{ color: "#7E858D", fontWeight: 600, mb: 1, display: "block" }}>
              Attachments ({files.length})
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {files.map((fileObj, idx) => (
                <Box
                  key={idx}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    px: 1,
                    py: 0.5,
                    bgcolor: "#f3f4f6",
                    borderRadius: 1,
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <PaperClipIcon className="h-3 w-3 text-gray-500" />
                  <Typography variant="caption" sx={{ color: "#374151", fontSize: "11px", maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {fileObj.name}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveFile(idx)}
                    sx={{
                      p: 0.25,
                      ml: 0.5,
                      "&:hover": { bgcolor: "rgba(239, 68, 68, 0.1)" },
                    }}
                  >
                    <XMarkIcon className="h-3 w-3 text-gray-500" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 1,
            pr: "12px",
            pb: "12px",
            pt: files.length > 0 ? 1 : "12px",
          }}
        >
          <input
            type="file"
            id="commentFileUpload"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.currentTarget.files && e.currentTarget.files.length > 0) {
                handleFileSelect(e.currentTarget.files);
              }
            }}
          />
          <IconButton
            component="label"
            htmlFor="commentFileUpload"
            size="small"
            sx={{
              border: "1px solid #E5E7EB",
              color: "#6B7270",
              "&:hover": { 
                borderColor: "#D1D5DB", 
                bgcolor: "#F9FAFB" 
              },
              borderRadius: 0.75,
              width: 32,
              height: 32,
            }}
          >
            <PaperClipIcon className="h-4 w-4" />
          </IconButton>
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
