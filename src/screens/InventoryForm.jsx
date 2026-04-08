import React, { useEffect, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Card,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { MapPinIcon } from "@heroicons/react/24/outline";
import { MapPin, Mail } from "lucide-react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useApp } from "../state/AppContext";
import { createAPIEndPoint } from "../config/api/api";
import { createAPIEndPointAuth } from "../config/api/apiAuth";
import BackButton from "../components/BackButton";
import toast from "react-hot-toast";
import { toProperCase } from "../utils/formatting";

const DEVICE_TYPES = ["Laptop", "Desktop", "Mobile", "Tablet", "Monitor", "Other"];
const DEVICE_TYPE_PRESETS = ["Laptop", "Desktop", "Mobile", "Tablet", "Monitor"];
const STATUS_OPTIONS = ["Active", "Inactive", "Decommissioned"];

/** API may return a preset label or a custom string — map to select + optional custom. */
function splitDeviceTypeFromApi(raw) {
  if (raw == null || String(raw).trim() === "") return { select: "", custom: "" };
  const s = String(raw).trim();
  const found = DEVICE_TYPE_PRESETS.find((t) => t.toLowerCase() === s.toLowerCase());
  if (found) return { select: found, custom: "" };
  if (s.toLowerCase() === "other") return { select: "Other", custom: "" };
  return { select: "Other", custom: s };
}

/** Value sent to API as `device_type`. */
function effectiveDeviceType(formData) {
  if (formData.device_type === "Other") {
    return (formData.device_type_other ?? "").trim();
  }
  return (formData.device_type ?? "").trim();
}

function normalizeSelectValue(value, options) {
  if (value === undefined || value === null || value === "") return "";
  const s = String(value).trim();
  const found = options.find((o) => o.toLowerCase() === s.toLowerCase());
  return found || s;
}

function pickNestedDevicePayload(raw) {
  if (!raw || typeof raw !== "object") return null;
  const inner = raw.data;
  if (
    inner &&
    typeof inner === "object" &&
    !(Array.isArray(inner)) &&
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

function resolveLocationForForm(d, locationsList) {
  const lid = d.location_id != null && d.location_id !== "" ? Number(d.location_id) : null;
  if (lid == null || Number.isNaN(lid)) return null;
  const match = locationsList.find((l) => Number(l.id) === lid);
  if (match) return match;
  const locDetails = d.location_details;
  const name =
    locDetails?.display_name ||
    locDetails?.location_name ||
    (typeof locDetails === "string" ? locDetails : null) ||
    `Location #${lid}`;
  return {
    id: lid,
    location_name: locDetails?.location_name || name,
    display_name: locDetails?.display_name || locDetails?.location_name || name,
  };
}

function assigneeFromDevice(d) {
  const ud = d.user_details;
  const uid = d.user_id ?? ud?.user_id ?? ud?.id;
  if (uid == null || uid === "") return null;
  const id = Number(uid);
  if (Number.isNaN(id)) return null;
  return {
    user_id: id,
    first_name: ud?.first_name ?? d.assignee_first_name ?? "",
    last_name: ud?.last_name ?? d.assignee_last_name ?? "",
    username:
      ud?.username ||
      d.assignee_username ||
      (ud?.email ? String(ud.email).split("@")[0] : "") ||
      `User #${id}`,
    email: ud?.email ?? d.assignee_email ?? "",
  };
}

const fieldHoverSx = {
  "& .MuiOutlinedInput-root": {
    "&:hover fieldset": { borderColor: "#824EF2" },
  },
};

function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function SectionTitle({ children }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-1 h-6 rounded-full" style={{ backgroundColor: "#824EF2" }} />
      <Typography variant="subtitle1" className="!text-gray-800 !font-semibold !text-base">
        {children}
      </Typography>
    </div>
  );
}

export default function InventoryForm({ isEdit = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useApp();

  const [locations, setLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [loadingDevice, setLoadingDevice] = useState(isEdit);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [tempLocation, setTempLocation] = useState(null);

  const [assigneeSearch, setAssigneeSearch] = useState("");
  const debouncedAssigneeSearch = useDebounce(assigneeSearch, 400);
  const [assigneeResults, setAssigneeResults] = useState([]);
  const [assigneeLoading, setAssigneeLoading] = useState(false);

  const [formData, setFormData] = useState({
    serial_number: "",
    location_id: null,
    assignee: null,
    computer_name: "",
    room_number: "",
    device_type: "",
    device_type_other: "",
    device_name: "",
    device_model: "",
    ip_address: "",
    mac_address: "",
    anydesk_installed: false,
    anydesk_id: "",
    anydesk_password: "",
    device_login_username: "",
    device_login_password: "",
    status: "Active",
  });

  const [errors, setErrors] = useState({});
  const [deviceRecord, setDeviceRecord] = useState(null);

  useEffect(() => {
    const fetchLocations = async () => {
      if (!user?.clinic_id) return;
      setLoadingLocations(true);
      try {
        const res = await createAPIEndPointAuth(
          `clinic_locations/get_all/${user.clinic_id}`
        ).fetchAll();
        const data = res.data?.locations || [];
        const filtered = data.filter((loc) => {
          const name = (loc.location_name || "").trim().toLowerCase();
          return (
            loc.id !== 25 &&
            loc.id !== 28 &&
            loc.id !== 30 &&
            loc.id !== 44 &&
            name !== "sales team" &&
            name !== "insurance" &&
            name !== "anonymous" &&
            name !== "jazmin spanish"
          );
        });
        const sorted = filtered.sort((a, b) => {
          const na = (a.display_name?.trim() || a.location_name?.trim() || "").toLowerCase();
          const nb = (b.display_name?.trim() || b.location_name?.trim() || "").toLowerCase();
          return na.localeCompare(nb);
        });
        setLocations(sorted);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load locations");
      } finally {
        setLoadingLocations(false);
      }
    };
    fetchLocations();
  }, [user?.clinic_id]);

  useEffect(() => {
    if (!isEdit) {
      setDeviceRecord(null);
      return;
    }
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        setLoadingDevice(true);
        const res = await createAPIEndPoint(`devices/${id}`).fetchAll();
        const d = pickNestedDevicePayload(res.data);
        if (cancelled) return;
        if (!d) {
          toast.error("Inventory item not found");
          navigate("/inventory");
          return;
        }
        setDeviceRecord(d);
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          toast.error("Failed to load inventory item");
          navigate("/inventory");
        }
      } finally {
        if (!cancelled) setLoadingDevice(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isEdit, id, navigate]);

  useEffect(() => {
    if (!isEdit || !deviceRecord) return;
    const d = deviceRecord;
    const locObj = resolveLocationForForm(d, locations);
    const dtSplit = splitDeviceTypeFromApi(d.device_type);
    setFormData({
      serial_number: d.serial_number != null ? String(d.serial_number) : "",
      location_id: locObj,
      assignee: assigneeFromDevice(d),
      computer_name: d.computer_name ?? "",
      room_number:
        d.room_number != null && String(d.room_number).trim() !== ""
          ? String(d.room_number)
          : "",
      device_type: dtSplit.select || normalizeSelectValue(d.device_type, DEVICE_TYPES),
      device_type_other: dtSplit.custom,
      device_name: d.device_name ?? "",
      device_model: d.device_model ?? "",
      ip_address: d.ip_address ?? "",
      mac_address: d.mac_address ?? "",
      anydesk_installed: Boolean(d.anydesk_installed),
      anydesk_id: d.anydesk_id != null ? String(d.anydesk_id) : "",
      anydesk_password: d.anydesk_password ?? "",
      device_login_username: d.device_login_username ?? "",
      device_login_password: d.device_login_password ?? "",
      status: normalizeSelectValue(d.status ?? "Active", STATUS_OPTIONS) || "Active",
    });
  }, [isEdit, deviceRecord, locations]);

  useEffect(() => {
    const search = async () => {
      if (!debouncedAssigneeSearch.trim()) {
        setAssigneeResults([]);
        return;
      }
      setAssigneeLoading(true);
      try {
        const res = await createAPIEndPointAuth(
          `clinic_team/search?query=${encodeURIComponent(debouncedAssigneeSearch)}`
        ).fetchAll();
        setAssigneeResults(res?.data?.results || []);
      } catch (e) {
        console.error(e);
        setAssigneeResults([]);
      } finally {
        setAssigneeLoading(false);
      }
    };
    search();
  }, [debouncedAssigneeSearch]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const nextVal = type === "checkbox" ? checked : value;
    setFormData((prev) => {
      const patch = { [name]: nextVal };
      if (name === "device_type" && nextVal !== "Other") {
        patch.device_type_other = "";
      }
      return { ...prev, ...patch };
    });
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    if (name === "device_type" && errors.device_type_other) {
      setErrors((prev) => ({ ...prev, device_type_other: "" }));
    }
  };

  const trimOrNull = (v) => {
    if (v === undefined || v === null) return null;
    const s = String(v).trim();
    return s === "" ? null : s;
  };

  const validate = () => {
    const next = {};
    if (!isEdit) {
      if (!formData.serial_number.trim()) next.serial_number = "Serial number is required";
      if (!formData.location_id?.id) next.location_id = "Location is required";
    }
    if (!isEdit && formData.ip_address.trim()) {
      const ip = formData.ip_address.trim();
      if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) next.ip_address = "Invalid IPv4 format";
    }
    if (formData.mac_address.trim()) {
      const mac = formData.mac_address.trim();
      if (!/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(mac)) {
        next.mac_address = "Use format AA:BB:CC:DD:EE:FF";
      }
    }
    if (formData.device_type === "Other" && !(formData.device_type_other || "").trim()) {
      next.device_type_other = "Enter a custom type";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const buildCreatePayload = () => {
    const payload = {
      clinic_id: user.clinic_id,
      location_id: formData.location_id.id,
      serial_number: formData.serial_number.trim(),
      anydesk_installed: !!formData.anydesk_installed,
      status: formData.status || "Active",
    };
    if (formData.assignee?.user_id) payload.user_id = formData.assignee.user_id;
    const optional = [
      ["computer_name", formData.computer_name],
      ["room_number", formData.room_number],
      ["device_name", formData.device_name],
      ["device_model", formData.device_model],
      ["ip_address", formData.ip_address],
      ["mac_address", formData.mac_address],
      ["anydesk_id", formData.anydesk_id],
      ["anydesk_password", formData.anydesk_password],
      ["device_login_username", formData.device_login_username],
      ["device_login_password", formData.device_login_password],
    ];
    optional.forEach(([k, v]) => {
      const t = trimOrNull(v);
      if (t !== null) payload[k] = t;
    });
    const dtPayload = trimOrNull(effectiveDeviceType(formData));
    if (dtPayload !== null) payload.device_type = dtPayload;
    if (formData.anydesk_installed && trimOrNull(formData.anydesk_password)) {
      payload.anydesk_password = formData.anydesk_password.trim();
    }
    return payload;
  };

  const buildUpdatePayload = () => {
    const payload = {
      anydesk_installed: !!formData.anydesk_installed,
      status: formData.status || "Active",
    };
    if (formData.assignee?.user_id) payload.user_id = formData.assignee.user_id;
    else payload.user_id = null;
    const optional = [
      ["computer_name", formData.computer_name],
      ["room_number", formData.room_number],
      ["device_name", formData.device_name],
      ["device_model", formData.device_model],
      ["ip_address", formData.ip_address],
      ["mac_address", formData.mac_address],
      ["anydesk_id", formData.anydesk_id],
      ["anydesk_password", formData.anydesk_password],
      ["device_login_username", formData.device_login_username],
      ["device_login_password", formData.device_login_password],
    ];
    optional.forEach(([k, v]) => {
      payload[k] = trimOrNull(v);
    });
    payload.device_type = trimOrNull(effectiveDeviceType(formData));
    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fix the highlighted fields.");
      return;
    }
    setIsSubmitting(true);
    try {
      if (isEdit) {
        await createAPIEndPoint("devices/").update(id, buildUpdatePayload());
        toast.success("Inventory updated");
        navigate(`/inventory/${id}`);
      } else {
        await createAPIEndPoint("devices").createWithJSONFormat(buildCreatePayload());
        toast.success("Inventory item created");
        navigate("/inventory");
      }
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Request failed";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () =>
    navigate(isEdit && id ? `/inventory/${id}` : "/inventory");

  const openLocationModal = () => {
    if (isEdit) return;
    setTempLocation(formData.location_id);
    setLocationModalOpen(true);
  };

  if (!user?.is_form_access) {
    return <Navigate to="/dashboard" replace />;
  }

  if ((isEdit && loadingDevice) || loadingLocations) {
    return (
      <div className="overflow-hidden">
        <div className="overflow-auto h-[calc(100dvh-92px)] flex items-center justify-center">
          <CircularProgress size={40} color="primary" />
        </div>
      </div>
    );
  }

  const confirmedLocation = formData.location_id;

  return (
    <Box>
      <div className="!flex !items-center !justify-start !gap-2 !mb-4">
        <BackButton self={isEdit && id ? `/inventory/${id}` : "/inventory"} />
        <h2 className="text-lg md:text-2xl font-semibold text-sidebar mb-1">
          {isEdit ? "Edit inventory" : "Register inventory"}
        </h2>
      </div>

      <Card className="!p-6 !shadow-md !bg-white !rounded-lg !border !border-gray-100">
        <Box component="form" onSubmit={handleSubmit} className="space-y-6">
          {/* Order matches IT Devices Tagging sheet: Location → Room# → Computer → IP → MAC → Serial → Type → Name → Model → AnyDesk → Login */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <div className="w-1 h-6 rounded-full shrink-0" style={{ backgroundColor: "#824EF2" }} />
              <Typography variant="subtitle1" className="!text-gray-800 !font-semibold !text-base">
                Location {!isEdit && <span className="text-red-500">*</span>}
              </Typography>
              {!isEdit && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<MapPinIcon className="h-4 w-4" />}
                  onClick={openLocationModal}
                  sx={{
                    textTransform: "none",
                    borderRadius: 1.25,
                    borderColor: "#824EF2",
                    color: "#824EF2",
                    "&:hover": {
                      borderColor: "#824EF2",
                      backgroundColor: "rgba(130, 78, 242, 0.04)",
                    },
                  }}
                >
                  {confirmedLocation ? "Change location" : "Select location"}
                </Button>
              )}
            </div>
            {errors.location_id && (
              <Typography variant="caption" color="error" className="!block !-mt-2">
                {errors.location_id}
              </Typography>
            )}
            {confirmedLocation ? (
              <div className="bg-purple-50 rounded-lg p-3 border border-purple-200 max-w-xl">
                <Typography variant="body2" className="!font-semibold !text-gray-800 !mb-1">
                  {confirmedLocation.display_name || confirmedLocation.location_name}
                </Typography>
                {confirmedLocation.address && confirmedLocation.address !== "N/A" && (
                  <Typography variant="caption" className="!text-gray-600 !block">
                    <MapPin className="!w-3 !h-3 !inline !mr-1" />
                    {toProperCase(confirmedLocation.address)}
                    {confirmedLocation.city && `, ${toProperCase(confirmedLocation.city)}`}
                    {confirmedLocation.state && `, ${toProperCase(confirmedLocation.state)}`}
                  </Typography>
                )}
              </div>
            ) : (
              <Typography variant="body2" className="!text-gray-500 !italic">
                {isEdit ? "—" : "No location selected"}
              </Typography>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <TextField
                label="Room #"
                name="room_number"
                fullWidth
                size="small"
                value={formData.room_number}
                onChange={handleChange}
                placeholder="e.g. 101"
                sx={fieldHoverSx}
              />
              <TextField
                label="Computer name"
                name="computer_name"
                fullWidth
                size="small"
                value={formData.computer_name}
                onChange={handleChange}
                sx={fieldHoverSx}
              />
            </div>
          </div>

          <Divider />

          <div className="space-y-4">
            <SectionTitle>Network</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                label="IP address"
                name="ip_address"
                fullWidth
                size="small"
                value={formData.ip_address}
                onChange={handleChange}
                placeholder="192.168.1.100"
                error={Boolean(errors.ip_address)}
                helperText={errors.ip_address}
                sx={fieldHoverSx}
              />
              <TextField
                label="MAC address"
                name="mac_address"
                fullWidth
                size="small"
                value={formData.mac_address}
                onChange={handleChange}
                placeholder="AA:BB:CC:DD:EE:FF"
                error={Boolean(errors.mac_address)}
                helperText={errors.mac_address}
                sx={fieldHoverSx}
              />
            </div>
          </div>

          <Divider />

          <div className="space-y-4">
            <SectionTitle>Item identity</SectionTitle>
            <TextField
              label="Serial number"
              name="serial_number"
              fullWidth
              size="small"
              required={!isEdit}
              disabled={isEdit}
              value={formData.serial_number}
              onChange={handleChange}
              error={Boolean(errors.serial_number)}
              helperText={errors.serial_number}
              placeholder="Serial number (unique)"
              sx={fieldHoverSx}
            />

            <div className="flex flex-col gap-3 sm:gap-4">
              <FormControl fullWidth size="small" sx={fieldHoverSx}>
                <label htmlFor="device-type" className="text-sm mb-1 !text-gray-400 !font-semibold">Device type</label>
                {/* <InputLabel id="device-type-label">Device type</InputLabel> */}
                <Select
                  // labelId="device-type-label"
                  name="device_type"
                  value={formData.device_type}
                  // label="Device type"
                  onChange={handleChange}
                  displayEmpty

                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {DEVICE_TYPES.map((t) => (
                    <MenuItem key={t} value={t}>
                      {t}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {formData.device_type === "Other" && (
                <Box
                  sx={{
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "rgba(130, 78, 242, 0.35)",
                    background:
                      "linear-gradient(145deg, rgba(130, 78, 242, 0.06) 0%, rgba(130, 78, 242, 0.02) 100%)",
                    p: { xs: 2, sm: 2.5 },
                    transition: "box-shadow 0.2s ease",
                    boxShadow: "0 1px 3px rgba(15, 26, 28, 0.06)",
                  }}
                >
                  <Typography
                    variant="overline"
                    sx={{
                      display: "block",
                      color: "#824EF2",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      fontSize: { xs: "0.65rem", sm: "0.7rem" },
                      mb: 0.5,
                    }}
                  >
                    Custom type
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1.5, fontSize: { xs: "0.8125rem", sm: "0.875rem" }, lineHeight: 1.45 }}
                  >
                    Enter the hardware category when it is not listed above.
                  </Typography>
                  <TextField
                    name="device_type_other"
                    label="Specify device type"
                    fullWidth
                    size="small"
                    required
                    value={formData.device_type_other}
                    onChange={handleChange}
                    error={Boolean(errors.device_type_other)}
                    helperText={errors.device_type_other}
                    placeholder="e.g. Server, POS, KVM, printer"
                    inputProps={{ "aria-label": "Custom device type" }}
                    sx={{
                      ...fieldHoverSx,
                      "& .MuiOutlinedInput-root": {
                        backgroundColor: "rgba(255,255,255,0.85)",
                      },
                    }}
                  />
                </Box>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <TextField
                  label="Device name"
                  name="device_name"
                  fullWidth
                  size="small"
                  value={formData.device_name}
                  onChange={handleChange}
                  sx={fieldHoverSx}
                />
                <TextField
                  label="Device model"
                  name="device_model"
                  fullWidth
                  size="small"
                  value={formData.device_model}
                  onChange={handleChange}
                  sx={fieldHoverSx}
                />
              </div>
            </div>
          </div>

          <Divider />

          <div className="space-y-4">
            <SectionTitle>AnyDesk (Y/N)</SectionTitle>
            <FormControlLabel
              control={
                <Checkbox
                  name="anydesk_installed"
                  checked={formData.anydesk_installed}
                  onChange={handleChange}
                  sx={{ color: "#824EF2", "&.Mui-checked": { color: "#824EF2" } }}
                />
              }
              label="AnyDesk installed (Y)"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <TextField
                label="AnyDesk ID"
                name="anydesk_id"
                fullWidth
                size="small"
                value={formData.anydesk_id}
                onChange={handleChange}
                inputProps={{ maxLength: 255 }}
                placeholder="Address / ID"
                sx={fieldHoverSx}
              />
              <TextField
                label="AnyDesk password"
                name="anydesk_password"
                type="password"
                fullWidth
                size="small"
                value={formData.anydesk_password}
                onChange={handleChange}
                autoComplete="new-password"
                sx={fieldHoverSx}
              />
            </div>
          </div>

          <Divider />

          <div className="space-y-4">
            <SectionTitle>Device login</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                label="Device login username"
                name="device_login_username"
                fullWidth
                size="small"
                value={formData.device_login_username}
                onChange={handleChange}
                sx={fieldHoverSx}
              />
              <TextField
                label="Device login password"
                name="device_login_password"
                type="password"
                fullWidth
                size="small"
                value={formData.device_login_password}
                onChange={handleChange}
                autoComplete="new-password"
                sx={fieldHoverSx}
              />
            </div>
          </div>

          <Divider />

          {/* <div className="space-y-4">
            <SectionTitle>Additional (not on tagging sheet)</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select name="status" value={formData.status} label="Status" onChange={handleChange}>
                  {STATUS_OPTIONS.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Autocomplete
                size="small"
                options={assigneeResults}
                value={formData.assignee}
                onChange={(_, v) => setFormData((p) => ({ ...p, assignee: v }))}
                onInputChange={(_, v) => setAssigneeSearch(v)}
                isOptionEqualToValue={(a, b) => a?.user_id === b?.user_id}
                getOptionLabel={(o) =>
                  o ? (o.first_name ? `${o.first_name} ${o.last_name || ""}`.trim() : o.username || "") : ""
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Assigned user (optional)"
                    placeholder="Type to search…"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {assigneeLoading && <CircularProgress color="inherit" size={18} />}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                    sx={fieldHoverSx}
                  />
                )}
              />
            </div>
          </div> */}

          <div className="!flex !justify-end !gap-3 !pt-4 !border-t !border-gray-200 !mt-6">
            <Button
              variant="outlined"
              onClick={handleCancel}
              disabled={isSubmitting}
              sx={{
                textTransform: "none",
                borderColor: "#E5E7EB",
                color: "#6B7270",
                "&:hover": { borderColor: "#E5E7EB", backgroundColor: "#Fafafa" },
              }}
              className="!px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              sx={{
                boxShadow: "none",
                textTransform: "none",
                color: "white",
                backgroundColor: "#824EF2",
                "&:hover": { backgroundColor: "#6B3BC4" },
                minWidth: 140,
              }}
              className="!px-8"
            >
              {isSubmitting ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={18} sx={{ color: "white" }} />
                  <span>Saving…</span>
                </Box>
              ) : isEdit ? (
                "Update inventory"
              ) : (
                "Create inventory"
              )}
            </Button>
          </div>
        </Box>
      </Card>

      <Dialog
        open={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle className="!text-lg !font-semibold !flex !items-center !gap-2">
          <MapPinIcon className="!h-5 !w-5 !text-brand-500" />
          Select location
        </DialogTitle>
        <DialogContent dividers>
          <Autocomplete
            size="medium"
            fullWidth
            options={locations}
            value={tempLocation}
            onChange={(_, newValue) => setTempLocation(newValue)}
            loading={loadingLocations}
            filterOptions={(options, params) =>
              options.filter((option) => {
                const q = params.inputValue.toLowerCase();
                const name = (option.display_name || option.location_name || "").toLowerCase();
                const address = (option.address || "").toLowerCase();
                const city = (option.city || "").toLowerCase();
                const state = (option.state || "").toLowerCase();
                return (
                  name.includes(q) || address.includes(q) || city.includes(q) || state.includes(q)
                );
              })
            }
            getOptionLabel={(option) =>
              option ? option.display_name || option.location_name || "" : ""
            }
            isOptionEqualToValue={(option, value) => option.id === value?.id}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-800 text-sm">
                    {option.display_name || option.location_name}
                  </span>
                  {option.email && (
                    <span className="text-xs text-gray-500 mt-1">
                      <Mail className="w-3.5 h-3.5 inline mr-1" /> {option.email}
                    </span>
                  )}
                </div>
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search location"
                placeholder="Type to search…"
                autoComplete="off"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingLocations && <CircularProgress size={20} />}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            noOptionsText={loadingLocations ? "Loading…" : "No locations found"}
          />
          {tempLocation && (
            <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <Typography variant="caption" className="!text-gray-600 !block !mb-2 !font-medium">
                Selected
              </Typography>
              <Typography variant="body2" className="!font-semibold !text-gray-800">
                {tempLocation.display_name || tempLocation.location_name}
              </Typography>
            </div>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.5 }}>
          <Button
            onClick={() => {
              setTempLocation(null);
              setLocationModalOpen(false);
            }}
            variant="outlined"
            sx={{
              textTransform: "none",
              borderColor: "#E5E7EB",
              color: "#6B7270",
              "&:hover": { borderColor: "#E5E7EB", backgroundColor: "#Fafafa" },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              setFormData((p) => ({ ...p, location_id: tempLocation }));
              setLocationModalOpen(false);
            }}
            variant="contained"
            disabled={!tempLocation}
            sx={{
              boxShadow: "none",
              textTransform: "none",
              color: "white",
              minWidth: 90,
              backgroundColor: "#824EF2",
              "&:hover": { backgroundColor: "#6B3BC4" },
            }}
          >
            Use location
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
