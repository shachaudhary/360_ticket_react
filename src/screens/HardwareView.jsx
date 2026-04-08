import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CircularProgress,
  Container,
  Divider,
  Typography,
} from "@mui/material";
import { useNavigate, useParams, Navigate, useLocation } from "react-router-dom";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { createAPIEndPoint } from "../config/api/api";
import BackButton from "../components/BackButton";
import { convertToCST } from "../utils";
import { toProperCase } from "../utils/formatting";
import { useApp } from "../state/AppContext";
import toast from "react-hot-toast";
// import HardwareDeviceStatusChip from "../components/HardwareDeviceStatusChip";

function pickDevicePayload(raw) {
  if (!raw || typeof raw !== "object") return null;
  const inner = raw.data;
  if (
    inner &&
    typeof inner === "object" &&
    !Array.isArray(inner) &&
    (inner.serial_number !== undefined ||
      inner.id !== undefined ||
      inner.computer_name !== undefined)
  ) {
    return inner;
  }
  if (raw.serial_number !== undefined || raw.id !== undefined || raw.computer_name !== undefined) {
    return raw;
  }
  return inner && typeof inner === "object" ? inner : raw;
}

function locationNameFromDetails(device) {
  const ld = device?.location_details;
  if (!ld || typeof ld !== "object") return "";
  const name = String(ld.display_name || ld.location_name || "").trim();
  return name;
}

function locationLabelFromDevice(device) {
  if (!device) return "—";
  const fromDetails = locationNameFromDetails(device);
  if (fromDetails) return fromDetails;
  if (device.location_id != null && device.location_id !== "") {
    return `ID ${device.location_id}`;
  }
  return "—";
}

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
      {value ?? "—"}
    </Typography>
  </div>
);

export default function HardwareView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useApp();
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDevice = useCallback(async () => {
    if (!id) return;
    try {
      const res = await createAPIEndPoint(`devices/${id}`).fetchAll();
      const d = pickDevicePayload(res.data);
      setDevice(d || null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load device");
      setDevice(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDevice();
  }, [fetchDevice, location.key]);

  if (!user?.is_form_access) {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <Box className="flex items-center justify-center bg-purple-50 min-h-[calc(100dvh-57.5px)] -m-5">
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (!device) {
    return (
      <Box className="flex flex-col items-center justify-center gap-3 py-16">
        <Typography color="text.secondary" fontWeight={600}>
          Device not found
        </Typography>
        <BackButton self="/hardware" textBtn />
      </Box>
    );
  }

  const yn = (v) => (v ? "Yes" : "No");
  const locationLabel = locationLabelFromDevice(device);

  return (
    <Box>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <BackButton self="/hardware" />
          <h2 className="text-lg md:text-xl font-semibold text-sidebar">
            Device details
          </h2>
        </div>
        <Button
          variant="outlined"
          size="small"
          startIcon={<PencilSquareIcon className="h-4 w-4" />}
          onClick={() => navigate(`/hardware/${id}/edit`)}
          sx={{
            textTransform: "none",
            borderRadius: 1.25,
            borderColor: "#E5E7EB",
            color: "#374151",
            "&:hover": { borderColor: "#d1d5db", backgroundColor: "#f9fafb" },
          }}
        >
          Edit
        </Button>
      </div>

      <Container disableGutters sx={{ maxWidth: "100% !important" }}>
        <Card
          sx={{
            p: { xs: 2, sm: 3 },
            border: "1px solid #E5E7EB",
            borderRadius: 2,
            boxShadow: "none",
           
          }}
        >
          <Typography variant="subtitle2" className="!text-brand-600 !font-semibold !mb-3">
            Overview
          </Typography>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Status (commented out)
            <div>
              <Typography variant="body2" sx={{ fontWeight: 600, color: "#7E858D" }}>
                Status
              </Typography>
              <Box sx={{ mt: 0.75 }}>
                <HardwareDeviceStatusChip status={device.status} />
              </Box>
            </div>
            */}
            <Label title="Location" value={locationLabel} />
            <Label title="Room #" value={device.room_number?.trim() || "—"} />
            <Label title="Computer name" value={device.computer_name || "—"} />
            <Label title="Serial number" value={device.serial_number || "—"} />
            <Label
              title="Device type"
              value={device.device_type ? toProperCase(device.device_type) : "—"}
            />
            <Label title="Device name" value={device.device_name || "—"} />
            <Label title="Device model" value={device.device_model || "—"} />
          </div>

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle2" className="!text-brand-600 !font-semibold !mb-3">
            Network
          </Typography>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Label title="IP address" value={device.ip_address || "—"} />
            <Label title="MAC address" value={device.mac_address || "—"} />
          </div>

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle2" className="!text-brand-600 !font-semibold !mb-3">
            AnyDesk
          </Typography>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Label title="Installed (Y/N)" value={yn(device.anydesk_installed)} />
            <Label title="AnyDesk password" value={device.anydesk_password || "—"} />
          </div>

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle2" className="!text-brand-600 !font-semibold !mb-3">
            Device login
          </Typography>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Label title="Username" value={device.device_login_username || "—"} />
            <Label title="Password" value={device.device_login_password || "—"} />
          </div>

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle2" className="!text-brand-600 !font-semibold !mb-3">
            Record
          </Typography>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Label
              title="Assigned user ID"
              value={device.user_id != null ? String(device.user_id) : "—"}
            />
            <Label
              title="Updated"
              value={device.updated_at ? convertToCST(device.updated_at) : "—"}
            />
            <Label
              title="Created"
              value={device.created_at ? convertToCST(device.created_at) : "—"}
            />
          </div>
        </Card>
      </Container>
    </Box>
  );
}
