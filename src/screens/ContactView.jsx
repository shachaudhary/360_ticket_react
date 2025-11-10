import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Card,
  Container,
  Divider,
  Typography,
  CircularProgress,
  Button,
  Chip,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "react-router-dom";
import { createAPIEndPoint } from "../config/api/api";
import { convertToCST, formatUSPhoneNumber } from "../utils";
import { toProperCase, toProperCase1 } from "../utils/formatting";
import BackButton from "../components/BackButton";
import StatusBadge from "../components/StatusBadge";
import { ExternalLink, UserCircle } from "lucide-react";
import toast from "react-hot-toast";

/* ---------------- Label Component ---------------- */
const Label = ({ title, value }) => (
  <div>
    <Typography variant="body2" sx={{ fontWeight: 600, color: "#7E858D" }}>
      {title}
    </Typography>
    <Typography
      variant="body2"
      sx={{
        fontWeight: 500,
        color: "#2d3436",
        wordBreak: "break-word",
        whiteSpace: "pre-wrap",
      }}
    >
      {value || "—"}
    </Typography>
  </div>
);

/* ---------------- Comments List ---------------- */
const CommentsList = ({ comments }) => (
  <Box className="space-y-2">
    {comments?.length > 0 ? (
      <AnimatePresence>
        {comments.map((c, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            layout
            className="rounded-lg border bg-[#E5E7EB] bg-opacity-10 hover:bg-gray-50 p-3 text-sm"
          >
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-gray-500">
                {toProperCase1(c.username) || "N/A"}
              </span>
              <span className="text-xs text-gray-500">
                {convertToCST(c.created_at)}
              </span>
            </div>
            <div className="text-gray-700 break-words">
              {c.comment.split(" ").map((word, i) => (
                <span
                  key={i}
                  className={
                    word.startsWith("@")
                      ? "mr-1 text-blue-600 font-medium underline"
                      : "mr-1"
                  }
                >
                  {word}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    ) : (
      <Typography variant="body2" color="text.secondary">
        No comments yet
      </Typography>
    )}
  </Box>
);

/* ---------------- Main Component ---------------- */
export default function ContactView() {
  const { id } = useParams();
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchContact = useCallback(async () => {
    try {
      const res = await createAPIEndPoint(`contact/get_by_id/${id}`).fetchAll();
      setContact(res.data.form);
    } catch (err) {
      console.error("Failed to fetch contact:", err);
      toast.error("Failed to load contact details.");
      setContact(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchContact();
  }, [fetchContact]);

  if (loading) {
    return (
      <Box className="absolute inset-0 flex items-center justify-center bg-gray-50">
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (!contact) {
    return (
      <Box className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-50">
        <Typography variant="h6" fontWeight={600} color="text.secondary">
          Contact Not Found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          This contact doesn’t exist or was removed.
        </Typography>
        <BackButton textBtn />
      </Box>
    );
  }

  const ticket = contact.tickets?.[0];
  const assignee = ticket?.assignees?.[0];
  const comments = ticket?.comments || [];
  const createdAt = convertToCST(contact.created_at);



  return (
    <Box sx={{ display: "flex", height: "100%", position: "relative" }}>
      <Box sx={{ flex: 1, overflowY: "auto", pr: 2 }}>
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between w-full gap-3">
          <div className="flex items-center gap-3">
            <BackButton />
            <h2 className="text-lg md:text-xl font-semibold text-sidebar">
              Contact #{contact.id}
            </h2>
            <StatusBadge status={contact.status} isBigger />
          </div>

          {ticket && (
            <Button
              variant="outlined"
              size="small"
              onClick={() =>
                window.open(
                  `/tickets/${ticket.id}`,
                  "_blank",
                  "noopener,noreferrer"
                )
              }
              sx={{ borderRadius: 1.25 }}
              className="!border !border-[#E5E7EB] hover:!border-[#ddd] 
               !text-gray-600 hover:!bg-gray-50 focus:!ring-gray-500 
               !px-3 !py-1.5 transition-all flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4 text-gray-500" />
              View Ticket
            </Button>
          )}
        </div>

        {/* Details Card */}
        <Container maxWidth="1440px" sx={{ mt: 2, px: "0px !important" }}>
          <Card
            sx={{
              width: "100%",
              bgcolor: "background.paper",
              border: "1px solid #ddd",
              borderRadius: "16px",
              boxShadow: 0,
              p: 2,
              height: { xs: "auto", md: "calc(100dvh - 144px)" },
              overflowY: "auto",
              "&::-webkit-scrollbar": { width: 0 },
            }}
          >
            {/* Contact Info */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              <Label title="Name" value={toProperCase1(contact.name)} />
              <Label title="Email" value={contact.email} />
              <Label title="Phone" value={formatUSPhoneNumber(contact.phone)} />
              <Label title="Created At" value={createdAt} />

              {/* Category */}
              <Box className="mt-2">
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: "#7E858D", mb: 0.5 }}
                >
                  Category
                </Typography>
                <Chip
                  label={toProperCase(contact?.data?.predicted_category) || "—"}
                  variant="filled"
                  sx={{
                    fontSize: 11.75,
                    fontWeight: 500,
                    borderRadius: "6px",
                    color: "#6B7280",
                    border: "1px solid #E5E7EB",
                    background: "white",
                    height: 27.5,
                    "& .MuiChip-label": {
                      px: "7px !important",
                    },
                  }}
                />
              </Box>

              {/* <Divider sx={{ my: 2 }} />

            <Label
              title="Assigned To"
              value={
                toProperCase(assignee?.assign_to_username) || "Unassigned"
              }
            /> */}

              <Box className="mt-2">
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: "#7E858D", mb: 0.5 }}
                >
                  Assigned To
                </Typography>

                {assignee?.assign_to_username ? (
                  <Chip
                    icon={<UserCircle size={16} strokeWidth={1.75} />}
                    label={toProperCase1(assignee.assign_to_username)}
                    sx={{
                      backgroundColor: "#f3e8ff", // soft orange background
                      color: "#824EF2", // vivid orange text
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      borderRadius: "10px",
                      pr: 0.5,
                      pl: 1,
                      "& .MuiChip-icon": {
                        color: "#824EF2",
                        marginLeft: "0px",
                        marginRight: "0px",
                        fontSize: "1rem",
                      },
                      "& .MuiChip-label": {
                        overflow: "visible",
                        lineHeight: 1,
                        marginTop: -0.45,
                        px: 1,
                        py: 0.4,
                      },
                    }}
                  />
                ) : (
                  <Chip
                    icon={<UserCircle size={16} strokeWidth={1.75} />}
                    label="Unassigned"
                    sx={{
                      backgroundColor: "#f9fafb",
                      color: "#6b7280",
                      fontWeight: 500,
                      fontSize: "0.85rem",
                      borderRadius: "10px",
                      "& .MuiChip-icon": { color: "#9ca3af" },
                    }}
                  />
                )}
              </Box>
            </div>

            <Divider sx={{ my: 2 }} />

            {/* Message */}
            <Typography
              variant="subtitle1"
              color="primary"
              sx={{ fontWeight: 600, color: "#7E858D", mb: 0.5 }}
            >
              Message
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: "#2d3436",
                whiteSpace: "pre-wrap",
                border: "1px solid #eee",
                borderRadius: "8px",
                p: 2,
                background: "#fcfcfc",
              }}
            >
              {contact.message || "—"}
            </Typography>

            <Divider sx={{ my: 2 }} />

            {/* Comments Section */}
            <Typography
              variant="subtitle1"
              // color="primary"
              sx={{ mb: 1, fontWeight: 600 }}
            >
              Ticket Comments
            </Typography>
            <CommentsList comments={comments} />
          </Card>
        </Container>
      </Box>
    </Box>
  );
}
