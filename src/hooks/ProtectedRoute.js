// import { useLocation } from "react-router-dom";
// import toast from "react-hot-toast";
// import React, { useState, useEffect, useRef } from "react";
// import axios from "axios";

// function ProtectedRoute({ children }) {
//   const location = useLocation();
//   const [shouldRedirect, setShouldRedirect] = useState(false);
//   const [accessToken, setAccessToken] = useState(localStorage.getItem("access_token"));
//   const [isChecking, setIsChecking] = useState(true);
//   const toastShown = useRef(false);

//   // ✅ Helper: handle logout cleanly
//   const handleLogout = (message = "Session expired. Please log in again.") => {
//     localStorage.removeItem("access_token");
//     if (!toastShown.current) {
//       toast.error(message);
//       toastShown.current = true;
//     }
//     setShouldRedirect(true);
//   };

//   // ✅ Validate token safely
//   const validateToken = async () => {
//     if (!accessToken) {
//       setIsChecking(false);
//       return handleLogout("Unauthorized access. Please log in.");
//     }

//     try {
//       const res = await axios.get("https://api.dental360grp.com/validate_token", {
//         headers: { Authorization: `Bearer ${accessToken}` },
//         timeout: 8000, // prevent hanging forever
//       });

//       if (!res.data?.success) {
//         handleLogout("Session expired. Please log in again.");
//       } else {
//         // ✅ Token valid, stay logged in
//         setShouldRedirect(false);
//       }
//     } catch (err) {
//       console.error("Token validation error:", err.message || err);

//       // ✅ Handle specific cases
//       if (err.code === "ERR_NETWORK" || err.message?.includes("Network Error")) {
//         // Network temporarily down — don’t log out
//         console.warn("Network issue detected — skipping logout.");
//         toast.dismiss(); // remove old toasts if any
//         if (!toastShown.current) {
//           toast.error("Network connection lost. Reconnecting...");
//           toastShown.current = true;
//         }

//         // Allow temporary pass until next check
//         setShouldRedirect(false);
//       } else if (err.response && err.response.status === 401) {
//         // Backend explicitly says token invalid
//         handleLogout("Authentication expired. Please log in again.");
//       } else {
//         // Other unexpected error
//         console.warn("Unknown auth error:", err);
//       }
//     } finally {
//       setIsChecking(false);
//     }
//   };

//   // 🔹 Run on route change or token change
//   useEffect(() => {
//     validateToken();
//   }, [location.pathname, accessToken]);

//   // 🔹 Background revalidation every 5 minutes
//   useEffect(() => {
//     const interval = setInterval(validateToken, 5 * 60 * 1000);
//     return () => clearInterval(interval);
//   }, [accessToken]);

//   // 🔹 Handle token from URL (after login redirect)
//   useEffect(() => {
//     const urlParams = new URLSearchParams(location.search);
//     const tokenFromUrl = urlParams.get("token");

//     if (tokenFromUrl) {
//       localStorage.setItem("access_token", tokenFromUrl);
//       setAccessToken(tokenFromUrl);
//     }
//   }, [location.search]);

//   // 🔹 Handle redirect logic
//   useEffect(() => {
//     if (shouldRedirect) {
//       window.location.href = "https://dashboard.dental360grp.com/auth/sign-in";
//     }
//   }, [shouldRedirect]);

//   // Prevent flashing on first load
//   if (isChecking) return null;

//   return accessToken && !shouldRedirect ? children : null;
// }

// export default ProtectedRoute;


import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

function ProtectedRoute({ children }) {
    const location = useLocation();
    const [shouldRedirect, setShouldRedirect] = useState(false);
    const [accessToken, setAccessToken] = useState(localStorage.getItem("access_token"));
    const toastShown = useRef(false);

    // 🔹 Validate token
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

    // 🔹 Validate on route change
    useEffect(() => {
        validateToken();
    }, [location.pathname, accessToken]);

    // 🔹 Background check every 5 minutes
    useEffect(() => {
        const interval = setInterval(validateToken, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [accessToken]);

    // 🔹 Handle token in URL (first login redirect)
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

    return accessToken ? children : null;
}

export default ProtectedRoute;
