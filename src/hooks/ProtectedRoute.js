import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

function ProtectedRoute({ children }) {
    const location = useLocation();
    const [shouldRedirect, setShouldRedirect] = useState(false);
    const [accessToken, setAccessToken] = useState(localStorage.getItem("access_token"));
    const toastShown = useRef(false);

    // ✅ Validate token with API
    const validateToken = async () => {
        if (!accessToken) return;

        try {
            const res = await axios.get("https://api.dental360grp.com/validate_token", {
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (!res.data.success) {
                localStorage.removeItem("access_token");
                if (!toastShown.current) {
                    toast.error("Session expired. Please log in again.");
                    toastShown.current = true;
                }
                setShouldRedirect(true);
            }
        } catch (err) {
            console.error("Token validation error:", err);
            localStorage.removeItem("access_token");
            if (!toastShown.current) {
                toast.error("Authentication error. Please log in again.");
                toastShown.current = true;
            }
            setShouldRedirect(true);
        }
    };

    // 🔹 Validate when route changes
    useEffect(() => {
        validateToken();
    }, [location.pathname, accessToken]);

    // 🔹 Background validation every 5 min
    useEffect(() => {
        const interval = setInterval(validateToken, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [accessToken]);

    // 🔹 Handle token passed in URL (after auth redirect)
    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const tokenFromUrl = urlParams.get("token");

        if (tokenFromUrl) {
            localStorage.setItem("access_token", tokenFromUrl);
            setAccessToken(tokenFromUrl);

            // Clean the URL after saving token
            const cleanUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
        } else if (!accessToken && !toastShown.current) {
            toast.error("Unauthorized access. Please log in.");
            toastShown.current = true;
            setShouldRedirect(true);
        }
    }, [location.search, accessToken]);

    // 🔹 Redirect safely if invalid
    useEffect(() => {
        if (shouldRedirect) {
            // 👇 Correct URL — no /auth-sign-in
            window.location.href = "https://dashboard.dental360grp.com/";
        }
    }, [shouldRedirect]);

    // 🔹 Prevent rendering before auth ready
    if (!accessToken && !shouldRedirect) return null;

    return accessToken ? children : null;
}

export default ProtectedRoute;
