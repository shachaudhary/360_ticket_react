// utils/checkTokenAndAuth.js
import { createAPIEndPointAuth } from "../config/api/apiAuth";
import { logoutUser } from "./index";
import toast from "react-hot-toast";

/**
 * Checks token in URL and validates auth profile.
 * If token found → sets it → fetches profile → redirects.
 */
export const checkTokenAndAuth = async (navigate, url) => {
  const urlParams = new URLSearchParams(window.location.search);
  const tokenFromUrl = urlParams.get("token");

  if (tokenFromUrl) {
    localStorage.setItem("access_token", tokenFromUrl);
    console.log("🔐 Token set from URL:", tokenFromUrl);

    try {
      const response = await createAPIEndPointAuth("auth_profile").fetchAll();
      const profile = response.data.profile;

      localStorage.setItem("user_profile", JSON.stringify(profile));
      localStorage.setItem("user_role", profile.user_role);
      console.log("✅ Auth Profile Loaded:", profile);

      navigate(url, { replace: true });
      // ✅ Give React Router a short delay before reloading
      setTimeout(() => {
        window.location.reload();
      }, 300);
      return { success: true, profile };
    } catch (err) {
      if (err?.response?.data?.error?.includes("Invalid Bearer token")) {
        toast.error("❌ Invalid or expired token. Please login again.");
        logoutUser(navigate);
      } else {
        console.error("❌ Error fetching profile:", err);
        toast.error("Failed to load profile.");
      }
      return { success: false };
    }
  }

  return { success: false };
};