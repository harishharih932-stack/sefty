import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { loadConfig } from "./storage";
import { formatSOSMessage, sendTelegramMessage } from "./telegram";
import { SOSPlugin } from "./sos-plugin";

type SOSState = {
  active: boolean;
  reason: string | null;
  startedAt: number | null;
  lastLocation: GeolocationCoordinates | null;
};

type SOSContextValue = SOSState & {
  triggerSOS: (reason: string) => Promise<void>;
  stopSOS: () => Promise<void>;
  updateLocation: (coords: GeolocationCoordinates) => void;
};

const SOSContext = createContext<SOSContextValue | null>(null);

export function SOSProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SOSState>({
    active: false,
    reason: null,
    startedAt: null,
    lastLocation: null,
  });

  const intervalRef = useRef<number | null>(null);

  const updateLocation = useCallback((coords: GeolocationCoordinates) => {
    setState((s) => ({ ...s, lastLocation: coords }));
  }, []);

  const sendAlert = useCallback(
    async (reason: string, coords: GeolocationCoordinates | null, followUp = false) => {
      const cfg = loadConfig();
      const battery = await getBattery();
      const msg = formatSOSMessage({
        name: cfg.fullName,
        phone: cfg.phone,
        lat: coords?.latitude,
        lng: coords?.longitude,
        battery,
        reason: followUp ? `${reason} (location update)` : reason,
        medical: [cfg.bloodGroup && `Blood ${cfg.bloodGroup}`, cfg.allergies].filter(Boolean).join(" · "),
      });
      const res = await sendTelegramMessage(cfg.telegramToken, cfg.telegramChatId, msg);
      if (!res.ok && !followUp) {
        toast.error(`Telegram alert failed: ${res.error}`);
      }
    },
    [],
  );

  const triggerSOS = useCallback(
    async (reason: string) => {
      if (state.active) return;
      const startedAt = Date.now();
      setState({ active: true, reason, startedAt, lastLocation: state.lastLocation });

      // Vibrate
      try { navigator.vibrate?.([300, 100, 300, 100, 600]); } catch { /* noop */ }

      // Native trigger (photo + native telegram if wrapped)
      SOSPlugin.triggerTestSOS().catch(() => {});

      // Get fresh location
      const coords = await getCurrentPosition().catch(() => state.lastLocation);
      if (coords && "latitude" in coords) {
        setState((s) => ({ ...s, lastLocation: coords }));
      }
      await sendAlert(reason, coords as GeolocationCoordinates | null);

      // Repeat every 45s
      intervalRef.current = window.setInterval(async () => {
        const c = await getCurrentPosition().catch(() => null);
        if (c) setState((s) => ({ ...s, lastLocation: c }));
        await sendAlert(reason, c, true);
      }, 45_000);
    },
    [sendAlert, state.active, state.lastLocation],
  );

  const stopSOS = useCallback(async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setState({ active: false, reason: null, startedAt: null, lastLocation: state.lastLocation });
    SOSPlugin.stopSOS().catch(() => {});
    const cfg = loadConfig();
    if (cfg.telegramToken && cfg.telegramChatId) {
      await sendTelegramMessage(cfg.telegramToken, cfg.telegramChatId, "✅ <b>Emergency ended</b> — user marked safe.");
    }
  }, [state.lastLocation]);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const value = useMemo<SOSContextValue>(
    () => ({ ...state, triggerSOS, stopSOS, updateLocation }),
    [state, triggerSOS, stopSOS, updateLocation],
  );

  return <SOSContext.Provider value={value}>{children}</SOSContext.Provider>;
}

export function useSOS() {
  const ctx = useContext(SOSContext);
  if (!ctx) throw new Error("useSOS must be used within SOSProvider");
  return ctx;
}

function getCurrentPosition(): Promise<GeolocationCoordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("no geolocation"));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve(p.coords),
      (e) => reject(e),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 5000 },
    );
  });
}

async function getBattery(): Promise<number | undefined> {
  try {
    const b = await (navigator as any).getBattery?.();
    if (b) return Math.round(b.level * 100);
  } catch { /* noop */ }
  return undefined;
}
