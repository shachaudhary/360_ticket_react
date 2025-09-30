import React, { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Layout from "../ui/Layout.jsx";
import Dashboard from "../screens/Dashboard.jsx";
import Tickets from "../screens/Tickets.jsx";
import Profile from "../screens/Profile.jsx";
import Login from "../screens/Login.jsx";
import TicketView from "../screens/TicketView.jsx";
import ForgotPassword from "../screens/ForgotPassword.jsx";
import ResetPassword from "../screens/ResetPassword.jsx";
import ProtectedRoute from "../hooks/ProtectedRoute.js";
import { AnimatePresence } from "framer-motion";
import PageTransition from "../components/PageTransition.jsx";
import Settings from "../screens/Settings.jsx";
import Notifications from "../screens/Notifications.jsx";
import TicketForm from "../screens/CreateTicket.jsx";

export default function App() {
  const location = useLocation();

  // 🔹 Map routes to page titles
  const routeTitles = {
    "/dashboard": "Dashboard",
    "/tickets": "Tickets",
    "/tickets/new": "Create Ticket",
    "/profile": "Profile",
    "/notifications": "Notifications",
    "/settings": "Settings",
    "/auth/sign-in": "Sign In",
    "/auth/forgot-password": "Forgot Password",
    "/auth/reset-password": "Reset Password",
  };

  useEffect(() => {
    const defaultTitle = "Support 360"; // fallback title
    const currentPath = location.pathname;

    // Try exact match first
    let pageTitle = routeTitles[currentPath];

    // Handle dynamic routes (like /tickets/:id)
    if (!pageTitle && currentPath.startsWith("/tickets/")) {
      pageTitle = "Ticket Details";
    }

    document.title = pageTitle ? ` Support 360 | ${pageTitle}` : defaultTitle;
  }, [location]);

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/auth/sign-in" element={<Login />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route
            path="dashboard"
            element={
              <PageTransition>
                <Dashboard />
              </PageTransition>
            }
          />
          <Route
            path="tickets"
            element={
              <PageTransition>
                <Tickets />
              </PageTransition>
            }
          />
          <Route
            path="tickets/new"
            element={
              <PageTransition>
                <TicketForm />
              </PageTransition>
            }
          />
          <Route
            path="/tickets/:id/edit"
            element={<TicketForm isEdit={true} />}
          />
          <Route
            path="tickets/:id"
            element={
              <PageTransition>
                <TicketView />
              </PageTransition>
            }
          />
          <Route
            path="/profile"
            element={
              <PageTransition>
                <Profile />
              </PageTransition>
            }
          />
          <Route
            path="/notifications"
            element={
              <PageTransition>
                <Notifications />
              </PageTransition>
            }
          />
          <Route
            path="/settings"
            element={
              <PageTransition>
                <Settings />
              </PageTransition>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}
