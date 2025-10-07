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
    const defaultTitle = "Support 360";
    const currentPath = location.pathname;
    let pageTitle = routeTitles[currentPath];

    // Handle dynamic ticket details
    if (!pageTitle && currentPath.startsWith("/tickets/")) {
      pageTitle = "Ticket Details";
    }

    document.title = pageTitle ? `Support 360 | ${pageTitle}` : defaultTitle;
  }, [location]);

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* 🔹 Auth Routes (optional for future use) */}
        {/* <Route path="/auth/sign-in" element={<Login />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} /> */}

        {/* 🔹 Redirect root to dashboard */}
        <Route index element={<Navigate to="/dashboard" replace />} />

        {/* 🔒 Protected Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <PageTransition>
                  <Dashboard />
                </PageTransition>
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* 🔒 Protected Tickets List */}
        <Route
          path="/tickets"
          element={
            <ProtectedRoute>
              <Layout>
                <PageTransition>
                  <Tickets />
                </PageTransition>
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* 🔒 Protected New Ticket */}
        <Route
          path="/tickets/new"
          element={
            <ProtectedRoute>
              <Layout>
                <PageTransition>
                  <TicketForm />
                </PageTransition>
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* 🔒 Protected Edit Ticket */}
        <Route
          path="/tickets/:id/edit"
          element={
            <ProtectedRoute>
              <Layout>
                <TicketForm isEdit={true} />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* 🔒 Protected Ticket Details */}
        <Route
          path="/tickets/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <PageTransition>
                  <TicketView />
                </PageTransition>
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* 🔒 Protected Profile */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <PageTransition>
                  <Profile />
                </PageTransition>
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* 🔒 Protected Notifications */}
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Layout>
                <PageTransition>
                  <Notifications />
                </PageTransition>
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* 🔒 Protected Settings */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Layout>
                <PageTransition>
                  <Settings />
                </PageTransition>
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* 🔁 Catch-all fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AnimatePresence>
  );
}
