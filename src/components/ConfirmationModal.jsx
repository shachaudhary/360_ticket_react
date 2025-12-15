import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  CircularProgress,
} from "@mui/material";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export default function ConfirmationModal({
  open,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  loading = false,
  danger = false,
}) {
  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "12px",
          p: 1,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          pb: 2,
        }}
        color="#EF4444"
      >
        {/* {danger && (
          <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
        )} */}
        <Typography variant="h6" fontWeight={600}>
          {title}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onClose}
          disabled={loading}
          variant="outlined"
          sx={{
            textTransform: "none",
            borderColor: "#E5E7EB",
            color: "#6B7270",
            "&:hover": { 
              borderColor: "#E5E7EB", 
              backgroundColor: "#Fafafa",
            },
            "&:disabled": {
              borderColor: "#E5E7EB",
              color: "#9CA3AF",
              opacity: 0.6,
              cursor: "not-allowed",
            },
            transition: "all 0.2s ease",
          }}
          className="!px-6"
        >
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          variant="contained"
          sx={{
            textTransform: "none",
            boxShadow: "none",
            color: loading ? "#6B7280" : "white",
            backgroundColor: loading ? "#F3F4F6" : (danger ? "#EF4444" : "#824EF2"),
            minWidth: 90,
            "&:hover": {
              backgroundColor: loading ? "#F3F4F6" : (danger ? "#DC2626" : "#6B3BC4"),
            },
            "&:disabled": {
              backgroundColor: "#F3F4F6",
              color: "#6B7280",
              cursor: "not-allowed",
            },
            transition: "all 0.2s ease",
          }}
        >
          {loading ? (
            <>
              <CircularProgress 
                size={18} 
                sx={{ 
                  color: "#6B7280",
                  mr: 1,
                  "& .MuiCircularProgress-circle": {
                    strokeLinecap: "round",
                  },
                }} 
              />
              {confirmText}
            </>
          ) : (
            confirmText
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

