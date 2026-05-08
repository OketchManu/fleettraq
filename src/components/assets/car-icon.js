// src/components/assets/car-icon.js
import L from "leaflet";

// Create a custom car icon using SVG
export const createCarIcon = (color = "#facc15") => {
  return L.divIcon({
    html: `
      <div style="position: relative; width: 48px; height: 48px;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 13L4 10C4 9.44772 4.44772 9 5 9H19C19.5523 9 20 9.44772 20 10L19 13M5 13H3V16H5M5 13H19M19 13H21V16H19M5 16C5 17.1046 4.10457 18 3 18C1.89543 18 1 17.1046 1 16C1 14.8954 1.89543 14 3 14C4.10457 14 5 14.8954 5 16ZM19 16C19 17.1046 18.1046 18 17 18C15.8954 18 15 17.1046 15 16C15 14.8954 15.8954 14 17 14C18.1046 14 19 14.8954 19 16Z" 
          stroke="${color}" stroke-width="2" fill="none"/>
          <rect x="7" y="12" width="10" height="2" fill="${color}"/>
          <circle cx="7" cy="16" r="1.5" fill="${color}" stroke="${color}"/>
          <circle cx="17" cy="16" r="1.5" fill="${color}" stroke="${color}"/>
        </svg>
        <div style="position: absolute; bottom: -4px; left: 50%; transform: translateX(-50%); width: 8px; height: 8px; background-color: #22c55e; border-radius: 50%; animation: pulse 1.5s infinite;"></div>
        <style>
          @keyframes pulse {
            0%, 100% { opacity: 0.4; transform: translateX(-50%) scale(0.8); }
            50% { opacity: 1; transform: translateX(-50%) scale(1.2); }
          }
        </style>
      </div>
    `,
    className: "custom-car-icon",
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -24],
  });
};

// Default car icon
export const CarIcon = createCarIcon("#facc15");