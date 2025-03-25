import { useJsApiLoader } from "@react-google-maps/api";

const googleMapsOptions = {
  id: "google-map-script",
  googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "",
  libraries: ["places"],
  version: "weekly",
};

export const useGoogleMapsLoader = () => {
  return useJsApiLoader(googleMapsOptions);
};