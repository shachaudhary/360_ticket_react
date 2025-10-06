// utils/checkTokenAndAuth.js
import { createAPIEndPointAuth } from "../config/api/apiAuth";
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
      return { success: true, profile };
    } catch (err) {
      console.error("❌ Error fetching profile:", err);

      // 🔹 Handle invalid or expired token
      if (err?.response?.data?.error?.includes("Invalid Bearer token")) {
        toast.error("❌ Invalid or expired token. Redirecting to login...");
        localStorage.removeItem("access_token");
        localStorage.removeItem("user_profile");
        localStorage.removeItem("user_role");

        // 🔹 Redirect to third-party login
        window.location.href = "https://dashboard.dental360grp.com/auth/sign-in";
      } else {
        toast.error("Failed to load profile. Please try again.");
      }

      return { success: false };
    }
  }

  // 🔹 No token in URL → redirect as well
  toast.error("Unauthorized access. Redirecting to login...");
  window.location.href = "https://dashboard.dental360grp.com/auth-sign-in";
  return { success: false };
};
