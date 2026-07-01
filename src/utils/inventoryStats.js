export function getInventoryLocationLabel(device, locationsById = {}) {
  const ld = device?.location_details;
  const fromDetails = ld?.display_name || ld?.location_name;
  if (fromDetails && String(fromDetails).trim()) return String(fromDetails).trim();
  if (locationsById[device?.location_id]) return locationsById[device.location_id];
  if (device?.location_id != null) return `Location #${device.location_id}`;
  return "Unknown";
}

export function buildInventoryStats(devices, locationsById = {}) {
  const list = Array.isArray(devices) ? devices : [];
  const by_location = {};
  const by_device_type = {};
  const by_status = {};
  let anydesk_installed = 0;
  let active_count = 0;

  list.forEach((device) => {
    const loc = getInventoryLocationLabel(device, locationsById);
    by_location[loc] = (by_location[loc] || 0) + 1;

    const type = String(device.device_type || "Other").trim() || "Other";
    by_device_type[type] = (by_device_type[type] || 0) + 1;

    const status = String(device.status || "Active").trim() || "Active";
    by_status[status] = (by_status[status] || 0) + 1;
    if (status.toLowerCase() === "active") active_count += 1;

    if (device.anydesk_installed) anydesk_installed += 1;
  });

  return {
    total_devices: list.length,
    active_count,
    anydesk_installed,
    by_location,
    by_device_type,
    by_status,
  };
}

export function inventoryStatsToChartData(stats) {
  const locationData = Object.entries(stats?.by_location || {})
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const deviceTypeData = Object.entries(stats?.by_device_type || {})
    .map(([name, value]) => ({ name, value }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);

  const statusData = Object.entries(stats?.by_status || {})
    .map(([name, value]) => ({ name, value }))
    .filter((item) => item.value > 0);

  return { locationData, deviceTypeData, statusData };
}
