import { useEffect, useState } from "react";

export interface LocationState {
  coords: GeolocationCoordinates | null;
  address: string | null;
  error: string | null;
  loading: boolean;
}

export function useLocation(refreshMs = 10_000): LocationState {
  const [state, setState] = useState<LocationState>({
    coords: null,
    address: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState({ coords: null, address: null, error: "Geolocation not supported", loading: false });
      return;
    }

    let cancelled = false;

    const fetchLoc = () => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          if (cancelled) return;
          const coords = pos.coords;
          setState((s) => ({ ...s, coords, error: null, loading: false }));
          // Reverse geocode via free service
          try {
            const r = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&zoom=16`,
              { headers: { Accept: "application/json" } },
            );
            const data = await r.json();
            if (!cancelled && data?.display_name) {
              setState((s) => ({ ...s, address: data.display_name }));
            }
          } catch { /* noop */ }
        },
        (e) => {
          if (cancelled) return;
          setState((s) => ({ ...s, error: e.message, loading: false }));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
      );
    };

    fetchLoc();
    const id = window.setInterval(fetchLoc, refreshMs);
    return () => { cancelled = true; clearInterval(id); };
  }, [refreshMs]);

  return state;
}
