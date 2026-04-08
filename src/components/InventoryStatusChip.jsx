import { Chip } from "@mui/material";
import { chipStyle } from "../utils/common";
import { getInventoryStatusDisplay } from "../utils/inventoryDeviceStatus";

/** Status chip for inventory list and detail — same label/styling everywhere. */
export default function InventoryStatusChip({ status, sx, ...props }) {
  return (
    <Chip
      label={getInventoryStatusDisplay(status)}
      size="small"
      variant="filled"
      sx={{ ...chipStyle, ...sx }}
      {...props}
    />
  );
}
