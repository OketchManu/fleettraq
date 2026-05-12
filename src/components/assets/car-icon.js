import L from "leaflet";

// Create a custom car icon using SVG — car inside a location pin
export const createCarIcon = (color = "#facc15") => {
  return L.divIcon({
    html: `
      <div style="position: relative; width: 44px; height: 54px; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.45));">
        <svg width="44" height="54" viewBox="0 0 44 54" fill="none" xmlns="http://www.w3.org/2000/svg">

          <!-- Pin shape: rounded top, pointed bottom -->
          <path d="M22 2C12.059 2 4 10.059 4 20C4 31.5 22 52 22 52C22 52 40 31.5 40 20C40 10.059 31.941 2 22 2Z"
            fill="#1a1a2e" stroke="${color}" stroke-width="1.5"/>

          <!-- Windshield glare (subtle highlight on pin) -->
          <ellipse cx="22" cy="14" rx="10" ry="6" fill="white" opacity="0.04"/>

          <!-- ── REALISTIC CAR BODY ── -->
          <!-- Main car body (lower) -->
          <rect x="9" y="23" width="26" height="9" rx="1.5" fill="${color}" opacity="0.95"/>

          <!-- Car roof / cabin -->
          <path d="M14 23 C14.5 18.5 16 17 18 17 L26 17 C28 17 29.5 18.5 30 23Z"
            fill="${color}" opacity="0.85"/>

          <!-- Windshield (front) -->
          <path d="M27.5 23 C27.2 20 26.2 18.2 25 17.5 L26 17 C28 17 29.5 18.5 30 23Z"
            fill="white" opacity="0.25"/>

          <!-- Rear windshield -->
          <path d="M16.5 23 C16.8 20 17.8 18.2 19 17.5 L18 17 C16 17 14.5 18.5 14 23Z"
            fill="white" opacity="0.15"/>

          <!-- Side window divider line -->
          <line x1="22" y1="17.2" x2="22" y2="23" stroke="${color}" stroke-width="0.8" opacity="0.5"/>

          <!-- Car body bottom strip / sill -->
          <rect x="9" y="30" width="26" height="2" rx="0.5" fill="${color}" opacity="0.5"/>

          <!-- Front bumper -->
          <rect x="9" y="31" width="5" height="1.5" rx="0.5" fill="${color}" opacity="0.7"/>
          <rect x="30" y="31" width="5" height="1.5" rx="0.5" fill="${color}" opacity="0.7"/>

          <!-- Headlight left -->
          <rect x="9.5" y="24" width="3.5" height="2" rx="0.8" fill="white" opacity="0.9"/>
          <!-- Headlight right -->
          <rect x="31" y="24" width="3.5" height="2" rx="0.8" fill="white" opacity="0.9"/>

          <!-- Taillight left -->
          <rect x="9.5" y="27" width="3" height="1.5" rx="0.5" fill="#ff4444" opacity="0.85"/>
          <!-- Taillight right -->
          <rect x="31.5" y="27" width="3" height="1.5" rx="0.5" fill="#ff4444" opacity="0.85"/>

          <!-- Wheel arch left -->
          <path d="M10 32 Q13 34.5 16 32" stroke="${color}" stroke-width="1.2" fill="none" opacity="0.6"/>
          <!-- Wheel arch right -->
          <path d="M28 32 Q31 34.5 34 32" stroke="${color}" stroke-width="1.2" fill="none" opacity="0.6"/>

          <!-- Wheel left -->
          <circle cx="14" cy="32.5" r="3" fill="#111" stroke="${color}" stroke-width="1.2"/>
          <circle cx="14" cy="32.5" r="1.2" fill="${color}" opacity="0.7"/>

          <!-- Wheel right -->
          <circle cx="30" cy="32.5" r="3" fill="#111" stroke="${color}" stroke-width="1.2"/>
          <circle cx="30" cy="32.5" r="1.2" fill="${color}" opacity="0.7"/>

          <!-- Door line -->
          <line x1="22" y1="23" x2="22" y2="32" stroke="${color}" stroke-width="0.7" opacity="0.35"/>

          <!-- Door handle left -->
          <rect x="17" y="26" width="3" height="0.8" rx="0.4" fill="white" opacity="0.5"/>
          <!-- Door handle right -->
          <rect x="24" y="26" width="3" height="0.8" rx="0.4" fill="white" opacity="0.5"/>

        </svg>

        <!-- Pulse dot at pin tip -->
        <div style="
          position: absolute;
          bottom: -3px;
          left: 50%;
          transform: translateX(-50%);
          width: 7px;
          height: 7px;
          background: ${color};
          border-radius: 50%;
          opacity: 0.85;
          animation: carPulse 1.8s ease-in-out infinite;
        "></div>

        <style>
          @keyframes carPulse {
            0%, 100% { opacity: 0.4; transform: translateX(-50%) scale(0.75); box-shadow: 0 0 0 0 rgba(250,204,21,0.4); }
            50%       { opacity: 1;   transform: translateX(-50%) scale(1.15); box-shadow: 0 0 0 5px rgba(250,204,21,0); }
          }
        </style>
      </div>
    `,
    className: "custom-car-icon",
    iconSize: [44, 54],
    iconAnchor: [22, 54],
    popupAnchor: [0, -56],
  });
};

// Default car icon
export const CarIcon = createCarIcon("#facc15");