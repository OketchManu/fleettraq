function downloadTextFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function escapeCsv(value) {
  const s = String(value ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function buildRouteCsv(points, vehicleLabel = "Vehicle") {
  const sorted = [...points].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  const header = "vehicle,timestamp,lat,lng,speed_kmh,method,device_id";
  const rows = sorted.map((p) =>
    [
      escapeCsv(vehicleLabel),
      escapeCsv(p.timestamp),
      p.lat,
      p.lng,
      p.speedKmh ?? "",
      escapeCsv(p.method || "gps"),
      escapeCsv(p.deviceId || ""),
    ].join(",")
  );
  return [header, ...rows].join("\n");
}

export function buildRouteGpx(points, trackName = "FleetTraq Route") {
  const sorted = [...points].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  const trkpts = sorted
    .map((p) => {
      const time = p.timestamp ? `<time>${new Date(p.timestamp).toISOString()}</time>` : "";
      return `      <trkpt lat="${p.lat}" lon="${p.lng}">${time}</trkpt>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="FleetTraq" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>${trackName.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>`;
}

export function downloadRouteCsv(points, vehicleLabel, filenameBase = "route") {
  const safe = filenameBase.replace(/[^\w-]+/g, "_");
  downloadTextFile(`${safe}.csv`, buildRouteCsv(points, vehicleLabel), "text/csv;charset=utf-8");
}

export function downloadRouteGpx(points, vehicleLabel, filenameBase = "route") {
  const safe = filenameBase.replace(/[^\w-]+/g, "_");
  downloadTextFile(
    `${safe}.gpx`,
    buildRouteGpx(points, vehicleLabel),
    "application/gpx+xml;charset=utf-8"
  );
}

export function downloadAllRoutesZipLike(routesByVehicle, vehicles, format = "csv") {
  for (const [vehicleId, points] of routesByVehicle.entries()) {
    if (!points?.length) continue;
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    const label = vehicle
      ? `${vehicle.make}_${vehicle.model}`.replace(/\s+/g, "_")
      : vehicleId.slice(0, 8);
    const name = vehicle ? `${vehicle.make} ${vehicle.model}` : "Vehicle";
    if (format === "gpx") {
      downloadRouteGpx(points, name, `fleettraq_${label}`);
    } else {
      downloadRouteCsv(points, name, `fleettraq_${label}`);
    }
  }
}
