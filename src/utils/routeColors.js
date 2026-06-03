const ROUTE_COLORS = [
  "#eab308",
  "#06b6d4",
  "#a855f7",
  "#22c55e",
  "#f97316",
  "#ec4899",
  "#3b82f6",
  "#14b8a6",
  "#ef4444",
  "#8b5cf6",
];

export function getVehicleRouteColor(vehicleId, fallbackIndex = 0) {
  if (!vehicleId) return ROUTE_COLORS[fallbackIndex % ROUTE_COLORS.length];
  let hash = 0;
  for (let i = 0; i < vehicleId.length; i += 1) {
    hash = vehicleId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return ROUTE_COLORS[Math.abs(hash) % ROUTE_COLORS.length];
}

export { ROUTE_COLORS };
