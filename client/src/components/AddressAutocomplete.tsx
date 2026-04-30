import { MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type AddressValue = {
  address: string;
  latitude?: number | null;
  longitude?: number | null;
};

type AddressAutocompleteProps = {
  label: string;
  value: AddressValue;
  onChange: (value: AddressValue) => void;
  required?: boolean;
};

declare global {
  interface Window {
    google?: any;
  }
}

let googleMapsPromise: Promise<void> | null = null;

function loadGoogleMaps() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return Promise.reject(new Error("Google Maps API key is not configured"));
  }
  if (window.google?.maps?.places) {
    return Promise.resolve();
  }
  if (!googleMapsPromise) {
    googleMapsPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>("script[data-google-maps='places']");
      if (existingScript) {
        existingScript.addEventListener("load", () => resolve(), { once: true });
        existingScript.addEventListener("error", () => reject(new Error("Google Maps failed to load")), { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.dataset.googleMaps = "places";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Google Maps failed to load"));
      document.head.appendChild(script);
    });
  }
  return googleMapsPromise;
}

export function AddressAutocomplete({ label, value, onChange, required }: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const onChangeRef = useRef(onChange);
  const [mapsReady, setMapsReady] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    loadGoogleMaps()
      .then(() => setMapsReady(true))
      .catch(() => setMapsReady(false));
  }, []);

  useEffect(() => {
    if (!mapsReady || !inputRef.current || !window.google?.maps?.places) {
      return;
    }

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      fields: ["formatted_address", "geometry", "name"]
    });

    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      const address = place.formatted_address || place.name || inputRef.current?.value || "";
      const location = place.geometry?.location;
      onChangeRef.current({
        address,
        latitude: location ? location.lat() : null,
        longitude: location ? location.lng() : null
      });
    });

    return () => {
      listener?.remove?.();
    };
  }, [mapsReady]);

  return (
    <label className="block text-sm font-medium">
      {label}
      <div className="relative mt-1">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={17} />
        <input
          ref={inputRef}
          className="focus-ring w-full rounded-md border border-zinc-300 bg-white py-2 pl-9 pr-3 shadow-sm transition placeholder:text-zinc-400 hover:border-zinc-400"
          value={value.address}
          onChange={(event) =>
            onChange({
              address: event.target.value,
              latitude: null,
              longitude: null
            })
          }
          placeholder={mapsReady ? "Search and select delivery location" : "Type delivery address"}
          required={required}
        />
      </div>
      <p className="mt-1 text-xs text-zinc-500">
        {mapsReady ? "Select a Google suggestion to store the exact map pin." : "Google picker is unavailable until the API key is configured."}
      </p>
    </label>
  );
}
