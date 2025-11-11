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
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
  Tooltip,
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
import SearchIcon from "@mui/icons-material/Search";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

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

  // 🔹 Category update state
  const [categories, setCategories] = useState([]);
  const [categoryMenuAnchor, setCategoryMenuAnchor] = useState(null);
  const [updatingCategory, setUpdatingCategory] = useState(false);
  const [categorySearchTerm, setCategorySearchTerm] = useState("");

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

  // 🔹 Fetch Categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await createAPIEndPoint("category").fetchAll();
        setCategories(res.data || []);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  // 🔹 Filter categories based on search
  const filteredCategories = categories.filter((cat) =>
    cat.name?.toLowerCase().includes(categorySearchTerm.toLowerCase())
  );

  // 🔹 Handle Category Update
  const handleCategoryUpdate = async (categoryName) => {
    setUpdatingCategory(true);
    try {
      await createAPIEndPoint(`contact/update_category/`).update(id, {
        category: categoryName,
      });

      toast.success(`Category updated to ${toProperCase(categoryName)}`);
      setCategoryMenuAnchor(null);
      setCategorySearchTerm("");
      fetchContact(); // Refresh contact data
    } catch (err) {
      console.error("Failed to update category", err);
      toast.error("Failed to update category");
    } finally {
      setUpdatingCategory(false);
    }
  };

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
                <Tooltip title="Click to change category" arrow>
                  <div className="cursor-pointer inline-block">
                    <Chip
                      label={toProperCase(contact?.data?.predicted_category) || "N/A"}
                      deleteIcon={
                        <KeyboardArrowDownIcon
                          sx={{
                            fontSize: 14,
                            color: "#6B7280 !important",
                            opacity: 0.7,
                            px: 0.25,
                          }}
                        />
                      }
                      onDelete={(e) => {
                        setCategoryMenuAnchor(
                          e.currentTarget.closest(".MuiChip-root")
                        );
                        setCategorySearchTerm("");
                      }}
                      onClick={(e) => {
                        setCategoryMenuAnchor(e.currentTarget);
                        setCategorySearchTerm("");
                      }}
                      variant="filled"
                      sx={{
                        fontSize: 11.75,
                        fontWeight: 500,
                        borderRadius: "6px",
                        color: "#6B7280",
                        border: "1px solid #E5E7EB",
                        background: "white",
                        height: 27.5,
                        cursor: "pointer",
                        "&:hover": {
                          backgroundColor: "#F3F4F6",
                        },
                        "& .MuiChip-label": {
                          px: "7px !important",
                          pr: "4px !important",
                        },
                        "& .MuiChip-deleteIcon": {
                          margin: "0 4px 0 -2px",
                          "&:hover": {
                            color: "#6B7280 !important",
                          },
                        },
                      }}
                    />
                  </div>
                </Tooltip>
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

      {/* Category Update Menu */}
      <Menu
        anchorEl={categoryMenuAnchor}
        open={Boolean(categoryMenuAnchor)}
        onClose={() => {
          setCategoryMenuAnchor(null);
          setCategorySearchTerm("");
        }}
        PaperProps={{
          sx: {
            borderRadius: "12px",
            border: "1px solid #E5E7EB",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
            minWidth: 200,
            maxHeight: 400,
            mt: 0.5,
          },
        }}
      >
        {/* Search Field */}
        <div className="px-3 py-2 sticky top-0 bg-white z-10 border-b">
          <TextField
            size="small"
            fullWidth
            placeholder="Search category..."
            value={categorySearchTerm}
            onChange={(e) => setCategorySearchTerm(e.target.value)}
            autoFocus
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "8px",
                fontSize: "14px",
              },
              "& .MuiInputAdornment-root": {
                marginRight: "-6px !important",
              },
            }}
          />
        </div>

        {/* Header */}
        <div className="px-2 py-1">
          <Typography
            variant="caption"
            className="!px-2 !py-1 !text-brand-500 !font-medium !text-xs"
          >
            Update Category
          </Typography>
        </div>

        {/* Category List */}
        <div className="max-h-60 overflow-auto">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((category) => {
              const currentCategory = contact?.data?.predicted_category;
              const isCurrentCategory =
                currentCategory?.toLowerCase() === category.name?.toLowerCase();

              return (
                <MenuItem
                  key={category.id}
                  onClick={() => {
                    if (!isCurrentCategory) {
                      handleCategoryUpdate(category.name);
                    }
                  }}
                  disabled={isCurrentCategory || updatingCategory}
                  sx={{
                    fontSize: "14px",
                    py: 1,
                    px: 2,
                    mx: 1,
                    my: 0.25,
                    borderRadius: "8px",
                    "&:hover": {
                      backgroundColor: "#F3F4F6",
                    },
                    ...(isCurrentCategory && {
                      backgroundColor: "#F3F4F6",
                      color: "#9CA3AF",
                    }),
                  }}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{toProperCase(category.name)}</span>
                    {updatingCategory && isCurrentCategory && (
                      <CircularProgress size={14} sx={{ ml: 1 }} />
                    )}
                    {isCurrentCategory && (
                      <span className="text-xs text-gray-400 ml-2">
                        (Current)
                      </span>
                    )}
                  </div>
                </MenuItem>
              );
            })
          ) : (
            <MenuItem disabled>
              <span className="text-gray-500 text-sm">No categories found</span>
            </MenuItem>
          )}
        </div>
      </Menu>
    </Box>
  );
}
