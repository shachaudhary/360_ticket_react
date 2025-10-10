import { createTheme } from "@mui/material/styles";

const sidebar = "#0F1A1C";
const brand = "#9C6BFF";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: brand },
    secondary: { main: "#186f3c" },
    background: {
      default: "#F9FAFB", // light gray background like Tailwind
      paper: "#FFFFFF",   // white cards
    },
    text: {
      primary: "#111827", // Tailwind gray-900
      secondary: "#6B7280", // Tailwind gray-500
    },
  },
  shape: {
    // borderRadius: 12,
    borderRadius: "8px",
  },
  typography: {
    fontFamily: [
      "Inter",
      "ui-sans-serif",
      "system-ui",
      "-apple-system",
      "BlinkMacSystemFont",
      "Segoe UI",
      "Roboto",
      "Helvetica Neue",
      "Arial",
      "Noto Sans",
      "sans-serif",
    ].join(","),
    h6: { fontWeight: 600 },
    button: { fontWeight: 600 },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: sidebar,
          color: "#fff",
          boxShadow: "none",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: sidebar,
          color: "#cbd5e1",
          borderRight: "none",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 6,
          paddingLeft: 16,
          paddingRight: 16,
          "&:hover": {
            // backgroundColor: "#249e56", // darker brand
            boxShadow: "none"
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: "outlined",
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          // borderRadius: 6,
          //   backgroundColor: "#F9FAFB",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "#E5E7EB", // Tailwind gray-200
          },
          "& .MuiPickersOutlinedInput-notchedOutline": {
            borderColor: "#E5E7EB !important", // Tailwind gray-200
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#D1D5DB", // Tailwind gray-300
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: brand,
            borderWidth: 2,
          },
        },
        input: {
          padding: "9px 14px",
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: 14,
          fontWeight: 500,
          color: "#6B7280", // Tailwind gray-500
          "&.Mui-focused": {
            color: brand,
          },
        },
      },
    },
  },
});

export default theme;
