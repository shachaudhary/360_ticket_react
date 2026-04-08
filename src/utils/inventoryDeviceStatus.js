import { toProperCase } from "./formatting";

/** Label for inventory item status (API `status` on device records). */
export function getInventoryStatusDisplay(status) {
  if (status === undefined || status === null || String(status).trim() === "") {
    return "Active";
  }
  return toProperCase(String(status).trim());
}
