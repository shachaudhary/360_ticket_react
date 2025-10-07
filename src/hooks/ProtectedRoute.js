import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";

function ProtectedRoute({ children }) {
    const location = useLocation();
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    const toastShown = useRef(false);

    const validateToken = async () => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            setIsAuthenticated(false);
            return;
        }

        try {
            const res = await axios.get("https://api.dental360grp.com/validate_token", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setIsAuthenticated(res.data.success);
        } catch {
            setIsAuthenticated(false);
        }
    };

    useEffect(() => {
        validateToken();
    }, [location.pathname]);

    useEffect(() => {
        if (isAuthenticated === false) {
            if (!toastShown.current) {
                toast.error("Session expired. Please log in again.");
                toastShown.current = true;
            }
            window.location.href = "https://dashboard.dental360grp.com/auth/sign-in";
        }
    }, [isAuthenticated]);

    if (isAuthenticated === null) return null; // waiting for validation

    return isAuthenticated ? children : null;
}

export default ProtectedRoute;
