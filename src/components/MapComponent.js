import { useEffect, useState, useRef } from "react";

const MapComponent = ({ apiKey, center = { lat: 40.7128, lng: -74.0060 }, zoom = 10, mapOptions = {}, markers = [] }) => {
  const mapRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!apiKey) {
      setError("Google Maps API key is required");
      setLoading(false);
      return;
    }

    if (window.google?.maps) {
      initializeMap();
      return;
    }

    setLoading(true);
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => initializeMap();
    script.onerror = () => {
      setError("Failed to load Google Maps API");
      setLoading(false);
    };
    document.head.appendChild(script);

    return () => {
      if (!window.google?.maps) document.head.removeChild(script);
    };
  }, [apiKey]);

  useEffect(() => {
    if (mapInstance && markers.length) {
      markers.forEach((markerData) => {
        const marker = new window.google.maps.Marker({
          position: markerData.position,
          map: mapInstance,
          title: markerData.title || ""
        });
        if (markerData.infoContent) {
          const infoWindow = new window.google.maps.InfoWindow({
            content: markerData.infoContent
          });
          marker.addListener("click", () => infoWindow.open(mapInstance, marker));
        }
      });
    }
  }, [mapInstance, markers]);

  const initializeMap = () => {
    if (!mapRef.current) return;
    try {
      const map = new window.google.maps.Map(mapRef.current, { center, zoom, ...mapOptions });
      setMapInstance(map);
      setLoading(false);
    } catch (err) {
      setError("Error initializing Google Maps: " + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="map-container">
      {loading && <div className="map-loading">Loading Google Maps...</div>}
      {error && <div className="map-error">Error: {error}</div>}
      <div ref={mapRef} style={{ height: "500px", width: "100%", display: loading ? "none" : "block" }} />
    </div>
  );
};

export default MapComponent;