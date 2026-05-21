import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CircularProgress,
  Container,
  Dialog,
  DialogContent,
  Divider,
  IconButton,
  Typography,
} from "@mui/material";
import { useNavigate, useParams, Navigate, useLocation } from "react-router-dom";
import { ArrowTopRightOnSquareIcon, PencilSquareIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { PhotoIcon } from "@heroicons/react/24/solid";
import { createAPIEndPoint } from "../config/api/api";
import BackButton from "../components/BackButton";
import { convertToCST } from "../utils";
import { toProperCase } from "../utils/formatting";
import { useApp } from "../state/AppContext";
import toast from "react-hot-toast";
// import InventoryStatusChip from "../components/InventoryStatusChip";

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

function deviceImagesFromRecord(device) {
  if (!device || typeof device !== "object") return [];
  const seen = new Set();
  const list = [];
  const add = (url, name) => {
    const u = url != null ? String(url).trim() : "";
    if (!u || seen.has(u)) return;
    seen.add(u);
    list.push({
      url: u,
      name: name || u.split("/").pop() || "Device image",
    });
  };
  const pushEntry = (entry, fallbackName) => {
    if (!entry) return;
    if (typeof entry === "string") {
      add(entry, fallbackName);
      return;
    }
    add(entry.url, entry.name || fallbackName);
  };
  [device.device_images, device.images, device.files].forEach((arr) => {
    if (!Array.isArray(arr)) return;
    arr.forEach((img, i) => pushEntry(img, `Image ${i + 1}`));
  });
  add(device.device_image_url, "Device image");
  return list;
}

function SectionHeading({ children }) {
  return (
    <Typography variant="subtitle2" className="!text-brand-600 !font-semibold !mb-3">
      {children}
    </Typography>
  );
}

function DevicePhotosGallery({ images }) {
  const [preview, setPreview] = useState(null);

  if (!images?.length) return null;

  return (
    <>
      <SectionHeading>Device photos</SectionHeading>
      <div
        className={
          images.length === 1
            ? "max-w-[180px]"
            : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-w-2xl"
        }
      >
        {images.map((img, idx) => (
          <button
            key={`${img.url}-${idx}`}
            type="button"
            onClick={() => setPreview(img)}
            className="group text-left rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm hover:shadow hover:border-brand-200 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          >
            <div className="relative h-24 bg-gray-100 overflow-hidden">
              <img
                src={img.url}
                alt={img.name}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              <span className="absolute bottom-1 right-1 rounded bg-black/55 px-1.5 py-0.5 text-[9px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity">
                View
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1.5 border-t border-gray-100">
              <PhotoIcon className="h-3.5 w-3.5 shrink-0 text-brand-500" />
              <Typography
                variant="caption"
                className="!text-gray-600 !text-[11px] !font-medium truncate"
                title={img.name}
              >
                {img.name}
              </Typography>
            </div>
          </button>
        ))}
      </div>

      <Dialog
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2, overflow: "hidden" } }}
      >
        {preview && (
          <>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: 2,
                py: 1.25,
                borderBottom: "1px solid #E5E7EB",
                bgcolor: "#fafafa",
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#374151" }} noWrap>
                {preview.name}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <IconButton
                  size="small"
                  component="a"
                  href={preview.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open image in new tab"
                >
                  <ArrowTopRightOnSquareIcon className="h-5 w-5 text-gray-600" />
                </IconButton>
                <IconButton size="small" onClick={() => setPreview(null)} aria-label="Close">
                  <XMarkIcon className="h-5 w-5 text-gray-600" />
                </IconButton>
              </Box>
            </Box>
            <DialogContent sx={{ p: 0, bgcolor: "#111" }}>
              <img
                src={preview.url}
                alt={preview.name}
                className="w-full max-h-[70vh] object-contain"
              />
            </DialogContent>
          </>
        )}
      </Dialog>
    </>
  );
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

export default function InventoryView() {
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
      toast.error("Failed to load inventory item");
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
          Inventory item not found
        </Typography>
        <BackButton self="/inventory" textBtn />
      </Box>
    );
  }

  const yn = (v) => (v ? "Yes" : "No");
  const locationLabel = locationLabelFromDevice(device);
  const deviceImages = deviceImagesFromRecord(device);

  return (
    <Box>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <BackButton self="/inventory" />
          <h2 className="text-lg md:text-xl font-semibold text-sidebar">
            Inventory details
          </h2>
        </div>
        <Button
          variant="outlined"
          size="small"
          startIcon={<PencilSquareIcon className="h-4 w-4" />}
          onClick={() => navigate(`/inventory/${id}/edit`)}
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
          <SectionHeading>Overview</SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Status (commented out)
            <div>
              <Typography variant="body2" sx={{ fontWeight: 600, color: "#7E858D" }}>
                Status
              </Typography>
              <Box sx={{ mt: 0.75 }}>
                <InventoryStatusChip status={device.status} />
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

          {deviceImages.length > 0 && (
            <>
              <Divider sx={{ my: 3 }} />
              <DevicePhotosGallery images={deviceImages} />
            </>
          )}

          <Divider sx={{ my: 3 }} />

          <SectionHeading>Network</SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Label title="IP address" value={device.ip_address || "—"} />
            <Label title="MAC address" value={device.mac_address || "—"} />
          </div>

          <Divider sx={{ my: 3 }} />

          <SectionHeading>AnyDesk</SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Label title="Installed (Y/N)" value={yn(device.anydesk_installed)} />
            <Label
              title="AnyDesk ID"
              value={
                device.anydesk_id != null && String(device.anydesk_id).trim() !== ""
                  ? String(device.anydesk_id)
                  : "—"
              }
            />
            <Label title="AnyDesk password" value={device.anydesk_password || "—"} />
          </div>

          <Divider sx={{ my: 3 }} />

          <SectionHeading>Device login</SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Label title="Username" value={device.device_login_username || "—"} />
            <Label title="Password" value={device.device_login_password || "—"} />
          </div>

          <Divider sx={{ my: 3 }} />

          <SectionHeading>Record</SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* <Label
              title="Assigned user ID"
              value={device.user_id != null ? String(device.user_id) : "—"}
            /> */}
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
