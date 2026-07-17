import { useEffect, useState } from "react";

export function useBattery() {
  const [level, setLevel] = useState<number | null>(null);
  const [charging, setCharging] = useState<boolean>(false);

  useEffect(() => {
    let bat: any = null;
    let cancelled = false;

    const attach = async () => {
      try {
        bat = await (navigator as any).getBattery?.();
        if (!bat || cancelled) return;
        const update = () => {
          setLevel(Math.round(bat.level * 100));
          setCharging(bat.charging);
        };
        update();
        bat.addEventListener("levelchange", update);
        bat.addEventListener("chargingchange", update);
      } catch { /* noop */ }
    };
    attach();
    return () => {
      cancelled = true;
      if (bat) {
        try {
          bat.removeEventListener("levelchange", () => {});
          bat.removeEventListener("chargingchange", () => {});
        } catch { /* noop */ }
      }
    };
  }, []);

  return { level, charging };
}
