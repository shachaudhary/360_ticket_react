// src/routes/PublicContactRedirect.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import ContactForm from "../screens/ContactUs";
import { getUserData } from "../utils";

export default function PublicContactRedirect() {
  const user = getUserData(); // your auth checker (from localStorage or context)

  // 🔹 If logged in → redirect to internal route
  if (user) {
    return <Navigate to="/form/contact-us" replace />;
  }

  // 🔹 If not logged in → show the public Contact form
  return <ContactForm />;
}
