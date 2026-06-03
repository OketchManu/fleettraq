import React from "react";
import { Polyline, CircleMarker, Popup } from "react-leaflet";
import { getVehicleRouteColor } from "../utils/routeColors";
import { formatDuration } from "../utils/routeAnalysis";

function vehicleLabel(vehicle) {
  if (!vehicle) return "Vehicle";
  const plate = vehicle.licensePlate || vehicle.plateNumber;
  return plate
    ? `${vehicle.make} ${vehicle.model} (${plate})`
    : `${vehicle.make} ${vehicle.model}`;
}

const FleetRouteOverlay = ({
  routesByVehicle,
  stopsByVehicle,
  vehicles = [],
  showRoutes = true,
  showStops = true,
}) => {
  if (!routesByVehicle?.size) return null;

  const vehicleMap = new Map(vehicles.map((v) => [v.id, v]));

  return (
    <>
      {showRoutes &&
        [...routesByVehicle.entries()].map(([vehicleId, points]) => {
          if (points.length < 2) return null;
          const positions = points.map((p) => [Number(p.lat), Number(p.lng)]);
          const color = getVehicleRouteColor(vehicleId);
          const vehicle = vehicleMap.get(vehicleId);
          return (
            <Polyline
              key={`route-${vehicleId}`}
              positions={positions}
              pathOptions={{
                color,
                weight: 4,
                opacity: 0.85,
                lineCap: "round",
                lineJoin: "round",
              }}
            >
              <Popup>
                <div className="text-sm min-w-[160px]">
                  <strong>{vehicleLabel(vehicle)}</strong>
                  <p className="mt-1 text-gray-600">{points.length} GPS points</p>
                </div>
              </Popup>
            </Polyline>
          );
        })}

      {showStops &&
        [...(stopsByVehicle || new Map()).entries()].flatMap(([vehicleId, stops]) => {
          const list = stops || [];
          const color = getVehicleRouteColor(vehicleId);
          const vehicle = vehicleMap.get(vehicleId);
          return list.map((stop, idx) => (
            <CircleMarker
              key={`stop-${vehicleId}-${idx}`}
              center={[stop.lat, stop.lng]}
              radius={8}
              pathOptions={{
                color: "#ffffff",
                weight: 2,
                fillColor: color,
                fillOpacity: 0.95,
              }}
            >
              <Popup>
                <div className="map-popup-card min-w-[200px] p-1 text-sm">
                  <strong className="map-popup-title block mb-1">Stop — {vehicleLabel(vehicle)}</strong>
                  <p className="map-popup-text">
                    <span className="font-semibold">Duration:</span> {formatDuration(stop.durationMs)}
                  </p>
                  <p className="map-popup-muted text-xs mt-1">
                    {new Date(stop.startTime).toLocaleString()} → {new Date(stop.endTime).toLocaleTimeString()}
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          ));
        })}
    </>
  );
};

export default FleetRouteOverlay;
