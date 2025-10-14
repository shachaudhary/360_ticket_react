import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";

function ProtectedRoute({ children }) {
    const location = useLocation();
    const [shouldRedirect, setShouldRedirect] = useState(false);
    const [accessToken, setAccessToken] = useState(localStorage.getItem("access_token"));
    const [isOffline, setIsOffline] = useState(false);
    const toastShown = useRef(false);

    // 🔹 Logout Helper
    const logoutUser = (message) => {
        if (!toastShown.current) {
            toast.error(message || "Session expired. Please log in again.");
            toastShown.current = true;
        }
        setTimeout(() => {
            localStorage.removeItem("access_token");
            setShouldRedirect(true);
        }, 2500);
    };

    // 🔹 Token Validation Function
    const validateToken = async () => {
        if (!accessToken) return;

        try {
            const res = await axios.get("https://api.dental360grp.com/validate_token", {
                headers: { Authorization: `Bearer ${accessToken}` },
                timeout: 7000,
            });

            // ✅ Token invalid
            if (!res.data?.success) {
                logoutUser("Session expired. Please log in again.");
                return;
            }

            // ✅ Token valid
            setIsOffline(false);
        } catch (err) {
            console.error("🔻 Token validation error:", err.message || err);

            // ⚠️ Handle network or timeout issues
            if (err.code === "ECONNABORTED" || err.message?.includes("Network Error") || !err.response) {
                if (!isOffline) {
                    setIsOffline(true);
                }
                return; // 🚫 Do not log out on network errors
            }

            // 🔒 Handle actual authentication failures
            const status = err.response?.status;
            if ([401, 403].includes(status)) {
                logoutUser("Authentication failed. Please log in again.");
            } else {
                toast.error("Unexpected error occurred. Please try again.");
            }
        }
    };

    // 🔹 Revalidate on route change
    useEffect(() => {
        validateToken();
    }, [location.pathname, accessToken]);

    // 🔹 Auto-recheck every 5 minutes
    useEffect(() => {
        const interval = setInterval(validateToken, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [accessToken]);

    // 🔹 Detect reconnection automatically
    useEffect(() => {
        const handleOnline = () => {
            if (isOffline) {
                toast.success("✅ Connection restored.");
                setIsOffline(false);
                validateToken(); // recheck token after reconnect
            }
        };
        window.addEventListener("online", handleOnline);
        return () => window.removeEventListener("online", handleOnline);
    }, [isOffline]);

    // 🔹 Handle token from URL (OAuth redirect)
    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const tokenFromUrl = urlParams.get("token");

        if (tokenFromUrl) {
            localStorage.setItem("access_token", tokenFromUrl);
            setAccessToken(tokenFromUrl);
        } else if (!accessToken && !toastShown.current) {
            toast.error("Unauthorized access. Please log in.");
            toastShown.current = true;
            setShouldRedirect(true);
        }
    }, [location.search, accessToken]);

    // 🔹 Redirect if needed
    useEffect(() => {
        if (shouldRedirect) {
            window.location.href = "https://dashboard.dental360grp.com/auth/sign-in";
        }
    }, [shouldRedirect]);

    // 🔹 Show content even if temporarily offline
    return accessToken
        ? React.createElement(
            "div",
            null,
            isOffline &&
            React.createElement(
                "div",
                {
                    className:
                        "fixed top-0 left-0 w-full text-center py-3 px-4 z-50 backdrop-blur-md " +
                        "bg-gradient-to-r from-amber-400/90 to-yellow-500/90 text-white font-medium " +
                        "shadow-lg animate-slideDown",
                },
                "You’re offline — some features may be temporarily unavailable."
            ),
            children
        )
        : null;

}

export default ProtectedRoute;
