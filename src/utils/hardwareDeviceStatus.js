import { toProperCase } from "./formatting";

/** Normalize API status for display (list + view use the same rules). */
export function getHardwareStatusDisplay(status) {
  if (status == null) return "Active";
  const s = String(status).trim();
  if (!s) return "Active";
  return toProperCase(s);
}
