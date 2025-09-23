import moment from "moment-timezone";



export const getUserData = () => {
  try {
    const storedData = localStorage.getItem("user_profile");
    // console.log("🗃️ Raw localStorage user_profile:", storedData);

    if (!storedData || storedData === "undefined" || storedData === "null") {
      return {};
    }

    const parsedData = JSON.parse(storedData);
    // console.log("✅ Parsed user_data:", parsedData);

    return typeof parsedData === "object" ? parsedData : {};
  } catch (error) {
    console.error("🚨 Failed to parse user_profile:", error);
    return {};
  }
};



export const logoutUser = (navigate) => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user_profile');
  localStorage.removeItem("callDirection");
  navigate('/auth/sign-in');
};

export const formatDate = (dateString) => {
  if (!dateString) return "Unknown date";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};



export function convertToCST(timeStr, fromTz = "UTC") {
  let timeObj = moment.tz(timeStr, fromTz);
  let cstTime = timeObj.tz("America/Chicago");
  return cstTime.format("MMM DD, hh:mm A");
}

export function formatMessageTime(isoString) {
  if (!isoString) return "00:00 PM";

  const chicagoTime = moment.utc(isoString).tz("America/Chicago");
  const now = moment().tz("America/Chicago");

  if (chicagoTime.isSame(now, "day")) {
    return chicagoTime.format("hh:mm A");
  } else if (chicagoTime.isSame(now.clone().subtract(1, "day"), "day")) {
    return "Yesterday";
  } else {
    return chicagoTime.format("MM/DD/YYYY");
  }
}



export function formatUSPhoneNumber(number) {
  if (typeof number !== "string") return number || "N/A";

  const digits = number.replace(/\D/g, '');
  const cleaned = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;

  if (cleaned.length !== 10) return number;

  const areaCode = cleaned.slice(0, 3);
  const centralOffice = cleaned.slice(3, 6);
  const lineNumber = cleaned.slice(6);

  return `+1 (${areaCode}) ${centralOffice}-${lineNumber}`;
}