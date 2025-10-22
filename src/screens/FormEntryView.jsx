import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Card,
  Container,
  Divider,
  Typography,
  CircularProgress,
  Button,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { createAPIEndPoint } from "../config/api/api";
import { convertToCST, formatUSPhoneNumber } from "../utils";
import { toProperCase } from "../utils/formatting";
import BackButton from "../components/BackButton";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

// ✅ Small reusable label component
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

export default function FormEntryView() {
  const { id } = useParams();
  console.log("🚀 ~ FormEntryView ~ id:", id);
  const navigate = useNavigate();
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchFormEntry = useCallback(async () => {
    try {
      const res = await createAPIEndPoint(
        `form_entries/details/${id}`
      ).fetchAll();
      setEntry(res.data);
    } catch (err) {
      console.error("Failed to fetch form entry:", err);
      toast.error("Failed to fetch form details.");
      setEntry(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchFormEntry();
  }, [fetchFormEntry]);

  if (loading) {
    return (
      <Box className="absolute inset-0 flex items-center justify-center bg-purple-50">
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (!entry) {
    return (
      <Box className="absolute inset-0 flex items-center justify-center bg-purple-50">
        <Typography color="text.secondary" fontWeight={500}>
          Form not found or failed to load.
        </Typography>
      </Box>
    );
  }

  const submittedBy =
    entry.submitted_by?.username || entry.submitted_by?.email || "N/A";

  const formType = toProperCase(entry.form_type_name);
  const createdAt = convertToCST(entry.created_at);
  const updatedAt = convertToCST(entry.updated_at);

  return (
    <Box sx={{ display: "flex", height: "100%", position: "relative" }}>
      <Box sx={{ flex: 1, overflowY: "auto", pr: 2 }}>
        {/* Header */}
        <div className="flex justify-between items-center">
          <BackButton />
          <div className="flex items-center gap-2 justify-between w-full pl-3">
            <h2 className="text-lg md:text-xl font-semibold text-sidebar">
              {toProperCase(formType)} #{entry.id}
            </h2>

            <Button
              variant="outlined"
              size="small"
              startIcon={<PencilSquareIcon className="h-4 w-4" />}
              onClick={() => navigate(`/form_entries/edit/${id}`)}
              sx={{ borderRadius: 1.25 }}
              className="!border !border-[#E5E7EB] hover:!border-[#ddd]  !text-gray-500 hover:!bg-gray-50 focus:!ring-gray-500 !px-1 !py-1.5"
            >
              Edit
            </Button>
          </div>
        </div>

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
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {/* 🔹 Basic Info */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              <Label title="Form" value={formType} />
              {/* <Label title="Form ID" value={`#${entry.id}`} /> */}
              <Label title="Created By" value={toProperCase(submittedBy)} />
              <Label title="Email" value={entry.submitted_by?.email} />
              <Label
                title="Phone"
                value={formatUSPhoneNumber(entry.submitted_by?.phone)}
              />
              <Label title="Created At" value={createdAt} />
              {/* <Label title="Updated At" value={updatedAt} /> */}
            </div>

            <Divider sx={{ my: 2 }} />

            {/* 🔹 Form Type Description */}
            {entry.form_type_description && (
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="subtitle1"
                  // color="primary"
                  sx={{ mb: 1, fontWeight: 600 }}
                >
                  Description
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", whiteSpace: "pre-wrap" }}
                >
                  {entry.form_type_description}
                </Typography>
              </Box>
            )}

            <Divider sx={{ my: 2 }} />

            {/* 🔹 Field Values */}
            <Typography
              variant="subtitle1"
              // color="primary"
              sx={{ mb: 1, fontWeight: 600 }}
            >
              Form Details
            </Typography>

            {entry.field_values?.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {entry.field_values.map((field, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-gray-200 bg-white p-3 hover:shadow-md transition-all"
                  >
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, color: "#7E858D" }}
                    >
                      {toProperCase(field.field_name.replace(/_/g, " "))}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#2d3436",
                        fontWeight: 500,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {field.field_value || "—"}
                    </Typography>
                  </div>
                ))}
              </div>
            ) : (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1, fontStyle: "italic" }}
              >
                No field values available.
              </Typography>
            )}

            {/* 🔹 Back Button */}
            {/* <div className="mt-6 flex justify-end">
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => navigate("/form_entries")}
              >
                Back to List
              </Button>
            </div> */}
          </Card>
        </Container>
      </Box>
    </Box>
  );
}
