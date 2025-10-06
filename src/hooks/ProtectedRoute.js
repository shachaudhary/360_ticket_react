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


// import { Navigate, useLocation } from "react-router-dom";
// import toast from "react-hot-toast";
// import React, { useState, useEffect, useRef } from "react";
// import axios from "axios";

// function ProtectedRoute({ children }) {
//     const location = useLocation();
//     const [shouldRedirect, setShouldRedirect] = useState(false);
//     const [accessToken, setAccessToken] = useState(localStorage.getItem("access_token"));
//     const toastShown = useRef(false);

//     // 🔹 Validate token whenever location changes
//     useEffect(() => {
//         const validateToken = async () => {
//             if (!accessToken) return;

//             try {
//                 const res = await axios.get("https://api.dental360grp.com/validate_token", {
//                     headers: { Authorization: `Bearer ${accessToken}` },
//                 });

//                 if (!res.data.success) {
//                     localStorage.removeItem("access_token");
//                     if (!toastShown.current) {
//                         toast.error("Session expired. Please log in again.");
//                         toastShown.current = true;
//                     }
//                     setShouldRedirect(true);
//                 }
//             } catch (err) {
//                 console.error("Token validation error:", err);
//                 localStorage.removeItem("access_token");
//                 if (!toastShown.current) {
//                     toast.error("Authentication error. Please log in again.");
//                     toastShown.current = true;
//                 }
//                 setShouldRedirect(true);
//             }
//         };

//         validateToken();
//     }, [location.pathname, accessToken]);

//     // 🔹 Optional: background check every 5 minutes
//     useEffect(() => {
//         const interval = setInterval(async () => {
//             if (!accessToken) return;
//             try {
//                 const res = await axios.get("https://api.dental360grp.com/validate_token", {
//                     headers: { Authorization: `Bearer ${accessToken}` },
//                 });

//                 if (!res.data.success) {
//                     localStorage.removeItem("access_token");
//                     if (!toastShown.current) {
//                         toast.error("Session expired. Please log in again.");
//                         toastShown.current = true;
//                     }
//                     setShouldRedirect(true);
//                 }
//             } catch {
//                 localStorage.removeItem("access_token");
//                 if (!toastShown.current) {
//                     toast.error("Authentication error. Please log in again.");
//                     toastShown.current = true;
//                 }
//                 setShouldRedirect(true);
//             }
//         }, 5 * 60 * 1000);

//         return () => clearInterval(interval);
//     }, [accessToken]);

//     // Handle token in URL (first login redirect)
//     useEffect(() => {
//         const urlParams = new URLSearchParams(location.search);
//         const tokenFromUrl = urlParams.get("token");

//         if (tokenFromUrl) {
//             localStorage.setItem("access_token", tokenFromUrl);
//             setAccessToken(tokenFromUrl);
//         } else if (!accessToken && !toastShown.current) {
//             toast.error("Unauthorized access. Please log in.");
//             toastShown.current = true;
//             setTimeout(() => setShouldRedirect(true), 100);
//         }
//     }, [location.search, accessToken]);

//     // 🔹 FIXED: must **return** Navigate
//     if (shouldRedirect) {
//         return React.createElement(Navigate, { to: "/auth/sign-in", replace: true });
//     }

//     return accessToken ? children : null;
// }

// export default ProtectedRoute;
