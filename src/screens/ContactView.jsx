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
import { toProperCase1 } from "../utils/formatting";
import BackButton from "../components/BackButton";
import { EnvelopeIcon } from "@heroicons/react/24/outline";
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

export default function ContactView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchContact = useCallback(async () => {
    try {
      const res = await createAPIEndPoint(`contact/get_by_id/${id}`).fetchAll();
      setContact(res.data.form);
    } catch (err) {
      console.error("Failed to fetch contact:", err);
      toast.error("Failed to fetch contact details.");
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
      <Box className="absolute inset-0 flex items-center justify-center bg-purple-50">
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (!contact) {
    return (
      <Box className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-purple-50">
        <Typography color="text.secondary" fontWeight={500}>
          Contact not found or failed to load.
        </Typography>
        <BackButton textBtn />
      </Box>
    );
  }

  const createdAt = convertToCST(contact.created_at);

  return (
    <Box sx={{ display: "flex", height: "100%", position: "relative" }}>
      <Box sx={{ flex: 1, overflowY: "auto", pr: 2 }}>
        {/* Header */}
        <div className="flex justify-between items-center">
          <BackButton />
          <div className="flex items-center gap-2 justify-between w-full pl-3">
            <h2 className="text-lg md:text-xl font-semibold text-sidebar">
              Contact #{contact.id}
            </h2>

            {/* <Button
              variant="outlined"
              size="small"
              startIcon={<EnvelopeIcon className="h-4 w-4" />}
              onClick={() => navigate(`/contacts`)}
              sx={{ borderRadius: 1.25 }}
              className="!border !border-[#E5E7EB] hover:!border-[#ddd] !text-gray-500 hover:!bg-gray-50 focus:!ring-gray-500 !px-1 !py-1.5"
            >
              Back to List
            </Button> */}
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
            {/* 🔹 Contact Info */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              <Label title="Name" value={toProperCase1(contact.name)} />
              <Label title="Email" value={contact.email} />
              <Label title="Phone" value={formatUSPhoneNumber(contact.phone)} />
              <Label title="Created At" value={createdAt} />
            </div>

            <Divider sx={{ my: 2 }} />

            {/* 🔹 Message */}
            <Typography
              variant="subtitle1"
              color="primary"
              sx={{ mb: 1, fontWeight: 600 }}
            >
              Message
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: "#2d3436",
                // fontWeight: 500,
                whiteSpace: "pre-wrap",
                border: "1px solid #eee",
                borderRadius: "8px",
                p: 2,
                background: "#fafafa",
              }}
            >
              {contact.message || "—"}
            </Typography>
          </Card>
        </Container>
      </Box>
    </Box>
  );
}
