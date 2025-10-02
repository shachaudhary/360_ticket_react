import { Box, Typography } from "@mui/material";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
import CircleIcon from "@mui/icons-material/Circle";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ChangeHistoryIcon from "@mui/icons-material/ChangeHistory";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import LowPriorityIcon from "@mui/icons-material/LowPriority";
import HorizontalRuleIcon from "@mui/icons-material/HorizontalRule";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

export const statusColors = {
  // Payment Statuses
  received: "#C9F7C9", // Soft Green
  urgent: "#FFEBEE", // same as high (light red)
  high: "#FFF8E1", // move high to amber now
  update: "#FFF8E1", // move high to amber now
  low: "#E8F5E9", // green
  paid: "#C9F7C9", // Soft Green
  unpaid: "#FFF3CD", // Light Yellow
  refund: "#E3F2FD", // Light Blue
  comment: "#E3F2FD", // Light Blue
  failed: "#FFCDD2", // Soft Red
  queued: "#E3F2FD",

  // General Statuses
  // initiated: "#D4F8E8",
  ringing: "#FFE8B3",
  pending: "#FFE8B3",
  receiving: "#FFE8B3",
  sending: "#FFE8B3",
  "not interested": "#FDE2E2",
  "connected, not interested": "#FDE2E2",
  busy: "#FFF0F0", // Light red-pink background
  missed: "#FFE0E0", // Light pink background (like 'not connected')
  "connected, interested": "#D1FADF",
  "not connected": "#FFE0E0",
  // connected: "#C3DAFE",
  connected: "#D4F8E8",
  initiated: "#C3DAFE",
  ended: "#C3DAFE",
  "in-progress": "#C3DAFE",
  "in progress": "#C3DAFE",
  in_progress: "#C3DAFE",
  active: "#C9F7C9",
  completed: "#C9F7C9",
  delivered: "#C9F7C9",
  complete: "#C9F7C9",
  "ended-customer-ended-call": "#E5E5E5",
  enabled: "#D4F8E8",
  disabled: "#E0E0E0",
  "no-answer": "#FFCDD2",
  voicemail: "#E1BEE7", // Soft Purple
  "silence-timed-out": "#FDE2E2", // Light Gray
  "updating...": "#F0F0F0",
  info: "#E1F5FE",
  success: "#C8E6C9",
  error: "#FFCDD2",
  warning: "#FFF9C4",
  draft: "#FFF9C4", // very light blue
  new: "#FFF9C4",
  tag: "#EDE7F6",
  followup: "#E3F2FD",
  assign: "#E8F5E9",
  default: "#F0F0F0",
};

export const textColors = {
  // Payment Statuses
  received: "#007A33", // Dark Green
  urgent: "#D32F2F", // same as high (strong red)
  high: "#F9A825", // amber
  update: "#F9A825", // amber
  low: "#388E3C", // green
  paid: "#007A33", // Dark Green
  unpaid: "#D88700", // Amber
  refund: "#0B409C", // Navy Blue
  comment: "#0B409C", // Navy Blue
  failed: "#B71C1C", // Crimson
  queued: "#0B409C", // Navy Blue text

  // General Statuses
  // initiated: "#007A33",
  ringing: "#D88700",
  pending: "#D88700",
  receiving: "#D88700",
  sending: "#D88700",
  "connected, interested": "#05603A",
  "not interested": "#C62828",
  "connected, not interested": "#C62828",
  "not connected": "#C62828",
  busy: "#D32F2F", // Darker red for contrast
  missed: "#C62828", // Strong red text
  // connected: "#0B409C",
  initiated: "#0B409C",
  connected: "#007A33",
  ended: "#0B409C",
  "in-progress": "#0B409C",
  "in progress": "#0B409C",
  in_progress: "#0B409C",
  active: "#007A33",
  completed: "#007A33",
  delivered: "#007A33",
  complete: "#007A33",
  "ended-customer-ended-call": "#4E4E4E",
  enabled: "#388E3C",
  disabled: "#9E9E9E",
  "no-answer": "#B71C1C",
  voicemail: "#6A1B9A", // Deep Purple
  "silence-timed-out": "#C62828", // Dark Gray
  "updating...": "#6C757D",
  info: "#0B409C",
  success: "#007A33",
  error: "#B71C1C",
  warning: "#D88700",
  draft: "#D88700", // deep blue
  new: "#D88700",
  tag: "#4527A0",
  followup: "#0B409C",
  assign: "#2E7D32",
  default: "#6C757D",
};

export const shortenStatus = (status) => {
  const statusMap = {
    high: "High",
    medium: "Medium",
    low: "Low",
    // Payment status labels
    queued: "Queued",
    received: "Received",
    paid: "Paid",
    unpaid: "Unpaid",
    refund: "Refunded",
    failed: "Failed",

    // General statuses
    initiated: "Initiated",
    ringing: "Ringing",
    pending: "Pending",
    "not Interested": "Not Interested",
    "connected, not interested": "Connected & Not Interested",
    "connected, interested": "Connected & Interested",
    "not connected": "Not Connected",
    busy: "Busy",
    missed: "Missed",
    connected: "Connected",
    ended: "Connected",
    "in-progress": "Completed",
    in_progress: "In Progress",
    active: "Active",
    completed: "Completed",
    complete: "Complete",
    "ended-customer-ended-call": "Customer Ended",
    enabled: "Enabled",
    disabled: "Disabled",
    "no-answer": "No Answer",
    voicemail: "Voicemail",
    "silence-timed-out": "Silence Timed Out",
    "updating...": "Updating...",
    info: "Info",
    success: "Success",
    error: "Error",
    warning: "Warning",
    new: "New",
    tag: "Tag",
    followup: "Follow-up",
    assign: "Assigned",
    draft: "Draft",
  };

  return statusMap[status] || status || "Unknown";
};

// ✅ helper to pick icon
// const getPriorityIcon = (status, color) => {
//   switch (status) {
//     case "urgent":
//       return <PriorityHighIcon fontSize="inherit" sx={{ color, mr: 0.25 }} />;
//     case "high":
//       return <ArrowUpwardIcon fontSize="inherit" sx={{ color, mr: 0.25 }} />;
//     case "low":
//       return <ArrowDownwardIcon fontSize="inherit" sx={{ color, mr: 0.25 }} />;
//     default:
//       return null;
//   }
// };
const getPriorityIcon = (status, color) => {
  switch (status) {
    case "urgent":
      return <WarningAmberIcon fontSize="inherit" sx={{ color, mr: 0.25 }} />;
    case "high":
      return (
        <LowPriorityIcon
          fontSize="inherit"
          sx={{ color, mr: 0.25, rotate: "180deg", transform: "scaleX(-1)" }}
        />
      );
    case "low":
      return <LowPriorityIcon fontSize="inherit" sx={{ color, mr: 0.25 }} />;
    default:
      return null;
  }
};

export default function StatusBadge({
  status,
  isInside = false,
  errorColor = false,
  isBigger = false,
  customRadius = "12px",
}) {
  const normalizedStatus = status?.toLowerCase?.().trim();
  const bgColor = statusColors[normalizedStatus] || statusColors.default;
  const textColor = textColors[normalizedStatus] || textColors.default;

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        px: isBigger ? 2 : isInside ? 1.15 : 1.5,
        py: isInside ? 0.75 : 0.875,
        minWidth: isInside ? 48 : 75,
        borderRadius: customRadius ? customRadius : "14px",
        backgroundColor: errorColor ? "#FFCDD2" : bgColor,
        color: errorColor ? "#B71C1C" : textColor,
        textTransform: "capitalize",
        minHeight: isBigger ? 35 : 22,
        whiteSpace: "nowrap",
        textAlign: "center",
      }}
    >
      {/* ✅ Show priority icon */}
      {getPriorityIcon(normalizedStatus, textColor)}
      <Typography
        variant="caption"
        fontWeight="600"
        fontSize={isBigger ? 13 : isInside ? 11 : 12}
        lineHeight={1.05}
        textAlign="center"
      >
        {shortenStatus(normalizedStatus)}
      </Typography>
    </Box>
  );
}

// export default function StatusBadge({
//   status,
//   isInside = false,
//   errorColor = false,
// }) {
//   const normalizedStatus = status?.toLowerCase?.().trim(); // Safely lowercase
//   const bgColor = statusColors[normalizedStatus] || statusColors.default;
//   const textColor = textColors[normalizedStatus] || textColors.default;
//   return (
//     <Box
//       sx={{
//         display: "inline-flex",
//         alignItems: "center",
//         justifyContent: "center",
//         px: isInside ? 1.15 : 1.5,
//         py: isInside ? 0.75 : 0.875,
//         minWidth: isInside ? 55 : 75, // Ensures consistent size
//         borderRadius: "12px",
//         backgroundColor: errorColor ? "#FFCDD2" : bgColor,
//         color: errorColor ? "#B71C1C" : textColor,
//         textTransform: "capitalize",
//         minHeight: 22,
//         // opacity: 0.85,
//         whiteSpace: "nowrap",
//       }}
//     >
//       <Typography variant="caption" fontWeight="600" lineHeight={1.05}>
//         {shortenStatus(status)}
//       </Typography>
//     </Box>
//   );
// }
