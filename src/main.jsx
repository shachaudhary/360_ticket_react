import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./routes/App.jsx";
import "./index.css";
import "flowbite";
import { AppProvider } from "./state/AppContext.jsx";
import { ThemeProvider } from "@emotion/react";
import theme from "../theme.js";
import { UserProfileProvider } from "./context/UserProfileContext.jsx";
import { Toaster } from "react-hot-toast"; // ✅ import

ReactDOM.createRoot(document.getElementById("root")).render(
  // <React.StrictMode>
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <UserProfileProvider>
          <AppProvider>
            <App />
            {/* ✅ Global toast container */}
            <Toaster
              position="top-right"
              toastOptions={{
                // Default style
                style: {
                  borderRadius: "10px",
                  background: "#333",
                  color: "#fff",
                  fontSize: "14px",
                  padding: "8px 12px",
                },
                success: {
                  style: {
                    background: "#9C6BFF",
                    color: "#fff",
                  },
                  iconTheme: {
                    primary: "#fff",
                    secondary: "#9C6BFF",
                  },
                },
                error: {
                  style: {
                    background: "#F87160",
                    color: "#fff",
                  },
                  iconTheme: {
                    primary: "#fff",
                    secondary: "#F87160",
                  },
                },
              }}
            />
          </AppProvider>
        </UserProfileProvider>
      </BrowserRouter>
    </ThemeProvider>
  // </React.StrictMode>
);
