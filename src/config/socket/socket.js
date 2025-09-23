// src/config/socket.js
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_APP_SOCKET_URL;
console.log(" SOCKET_URL:", SOCKET_URL);

const socket = io(SOCKET_URL, {
    autoConnect: false,
    transports: ["websocket", "polling"],
    reconnectionAttempts: 3,
});

socket.onAny((event, ...args) => {
    console.log("[socket] event:", event, "args:", args);
});
socket.on("connect_error", (err) =>
    console.error("❌ connect_error →", err.message)
);
socket.on("disconnect", (reason) =>
    console.warn("⚠️ disconnected →", reason)
);
socket.on("reconnect_failed", () =>
    console.error("🔌 gave up reconnecting")
);

export default socket;
