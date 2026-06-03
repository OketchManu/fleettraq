import React, { useEffect } from "react";
import { Marker, useMap } from "react-leaflet";
import { CarIcon } from "./assets/car-icon";

const RoutePlaybackMarker = ({ points, index }) => {
  const map = useMap();

  useEffect(() => {
    const point = points?.[index];
    if (!point) return;
    map.panTo([Number(point.lat), Number(point.lng)], { animate: true, duration: 0.35 });
  }, [index, points, map]);

  const point = points?.[index];
  if (!point) return null;

  return (
    <Marker
      position={[Number(point.lat), Number(point.lng)]}
      icon={CarIcon}
      zIndexOffset={1000}
    />
  );
};

export function RoutePlaybackControls({
  darkMode,
  points,
  playing,
  onPlayPause,
  onReset,
  speedMultiplier,
  onSpeedChange,
  progressIndex,
  onScrub,
  playbackVehicleLabel,
}) {
  const max = Math.max(points.length - 1, 0);
  const pct = max > 0 ? Math.round((progressIndex / max) * 100) : 0;

  return (
    <div
      className={`p-3 border-t flex flex-col gap-3 ${
        darkMode ? "border-white/10 bg-black/20" : "border-gray-200 bg-gray-50"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className={`text-xs font-semibold ${darkMode ? "text-yellow-300" : "text-amber-700"}`}>
          Playback{playbackVehicleLabel ? `: ${playbackVehicleLabel}` : ""}
        </span>
        <button
          type="button"
          onClick={onPlayPause}
          disabled={points.length < 2}
          className="px-3 py-1.5 rounded-lg bg-yellow-500 text-black text-sm font-semibold disabled:opacity-40"
        >
          {playing ? "Pause" : "Play"}
        </button>
        <button
          type="button"
          onClick={onReset}
          disabled={points.length < 2}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
            darkMode ? "bg-white/10 text-gray-200" : "bg-gray-200 text-gray-800"
          } disabled:opacity-40`}
        >
          Reset
        </button>
        <label className={`ml-auto flex items-center gap-2 text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
          Speed
          <select
            value={speedMultiplier}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className={`rounded-lg px-2 py-1 text-sm ${
              darkMode ? "bg-white/10 text-white border border-white/10" : "bg-white border border-gray-200"
            }`}
          >
            <option value={0.5}>0.5×</option>
            <option value={1}>1×</option>
            <option value={2}>2×</option>
            <option value={5}>5×</option>
          </select>
        </label>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={max}
          value={progressIndex}
          onChange={(e) => onScrub(Number(e.target.value))}
          className="flex-1 accent-yellow-500"
          disabled={points.length < 2}
        />
        <span className={`text-xs font-mono w-10 text-right ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          {pct}%
        </span>
      </div>
      {points[progressIndex] && (
        <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
          {new Date(points[progressIndex].timestamp).toLocaleString()} · point {progressIndex + 1} of{" "}
          {points.length}
        </p>
      )}
    </div>
  );
}

export default RoutePlaybackMarker;
