import { Navigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import React, { useState, useEffect, useRef } from "react";

function ProtectedRoute({ children }) {
    const location = useLocation();
    const [shouldRedirect, setShouldRedirect] = useState(false);
    const [accessToken, setAccessToken] = useState(localStorage.getItem("access_token"));
    const toastShown = useRef(false);

    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const tokenFromUrl = urlParams.get("token");

        if (tokenFromUrl) {
            localStorage.setItem("access_token", tokenFromUrl);
            setAccessToken(tokenFromUrl);
        } else if (!accessToken && !toastShown.current) {
            toast.error("Unauthorized access. Please log in.");
            toastShown.current = true;
            setTimeout(() => setShouldRedirect(true), 100);
        }
    }, [location.search, accessToken]);

    if (shouldRedirect) {
        return React.createElement(Navigate, { to: "/auth/sign-in", replace: true });
    }

    return accessToken ? children : null;
}

export default ProtectedRoute;
