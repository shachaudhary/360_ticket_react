import { Chip } from "@mui/material";
import { chipStyle } from "../utils/common";
import { getHardwareStatusDisplay } from "../utils/hardwareDeviceStatus";

/**
 * Device status chip — same label/styling in Hardware list and Hardware view.
 */
export default function HardwareDeviceStatusChip({ status, sx, ...props }) {
  return (
    <Chip
      label={getHardwareStatusDisplay(status)}
      size="small"
      variant="filled"
      sx={{ ...chipStyle, ...sx }}
      {...props}
    />
  );
}
