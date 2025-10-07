import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

function ProtectedRoute({ children }) {
    const location = useLocation();
    const [isAuthChecked, setIsAuthChecked] = useState(false);
    const [accessToken, setAccessToken] = useState(localStorage.getItem("access_token"));
    const redirecting = useRef(false);
    const toastShown = useRef(false);

    // ✅ Validate token (safe + debounced)
    const validateToken = async () => {
        const token = localStorage.getItem("access_token");
        if (!token) return setIsAuthChecked(true); // no token → no redirect yet

        try {
            const res = await axios.get("https://api.dental360grp.com/validate_token", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res?.data?.success) {
                setAccessToken(token);
                setIsAuthChecked(true);
            } else {
                handleLogout("Session expired. Please log in again.");
            }
        } catch (err) {
            console.warn("Token validation error:", err?.message);
            handleLogout("Authentication error. Please log in again.");
        }
    };

    // ✅ Single logout + redirect handler
    const handleLogout = (message) => {
        if (redirecting.current) return;
        redirecting.current = true;

        localStorage.removeItem("access_token");
        if (!toastShown.current) {
            toast.error(message);
            toastShown.current = true;
        }

        // Safe redirect to dashboard root, not /auth-sign-in
        window.location.href = "https://dashboard.dental360grp.com/";
    };

    // 🔹 Validate once on mount
    useEffect(() => {
        validateToken();
    }, []);

    // 🔹 Background validation every 5 minutes
    useEffect(() => {
        const interval = setInterval(validateToken, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    // 🔹 Handle token in URL after auth redirect
    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const tokenFromUrl = urlParams.get("token");

        if (tokenFromUrl) {
            localStorage.setItem("access_token", tokenFromUrl);
            setAccessToken(tokenFromUrl);

            // clean URL once token saved
            const cleanUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);

            // reload only once after login redirect
            window.location.reload();
        }
    }, [location.search]);

    // 🧩 Don’t render until auth check is complete
    if (!isAuthChecked) return null;

    // 🔒 If no valid token → redirect handled in handleLogout()
    if (!accessToken) return null;

    return children;
}

export default ProtectedRoute;
