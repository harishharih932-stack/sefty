import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { loadConfig } from "@/lib/storage";
import { useSOS } from "@/lib/sos-context";

/**
 * Wires up in-app emergency triggers: volume-key taps, voice keywords,
 * shake detection, and fall detection. Reads current settings from
 * localStorage on every relevant event so toggles take effect immediately.
 */
export function useTriggers(onSafetyCheck?: (reason: string) => void) {
  const { triggerSOS, active } = useSOS();
  const activeRef = useRef(active);
  activeRef.current = active;

  // Volume-key rapid taps
  useEffect(() => {
    let taps: number[] = [];
    const onKey = (e: KeyboardEvent) => {
      const cfg = loadConfig();
      if (!cfg.settings.volumeTrigger) return;
      // "AudioVolumeUp/Down" only fires on some devices; also accept ArrowUp/Down as fallback
      const isVol = e.key === "AudioVolumeUp" || e.key === "AudioVolumeDown";
      if (!isVol) return;
      const now = Date.now();
      taps = taps.filter((t) => now - t < 2000);
      taps.push(now);
      if (taps.length >= 3 && !activeRef.current) {
        taps = [];
        try { navigator.vibrate?.([80, 60, 80, 60, 200]); } catch { /* noop */ }
        toast.warning("Volume trigger detected", { description: "Sending SOS…" });
        triggerSOS("Volume key trigger");
      } else if (taps.length > 0) {
        toast(`Volume tap ${taps.length}/3`, { duration: 800 });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [triggerSOS]);

  // Voice trigger
  useEffect(() => {
    const cfg = loadConfig();
    if (!cfg.settings.voiceTrigger) return;
    const SR: any =
      (typeof window !== "undefined" && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition));
    if (!SR) return;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    let stopped = false;
    rec.onresult = (ev: any) => {
      const text = Array.from(ev.results)
        .map((r: any) => r[0]?.transcript ?? "")
        .join(" ")
        .toLowerCase();
      const c = loadConfig();
      const hit = c.settings.voicePhrases.find((p) => p && text.includes(p.toLowerCase()));
      if (hit && !activeRef.current) {
        toast.warning(`Voice trigger: "${hit}"`);
        triggerSOS(`Voice phrase: "${hit}"`);
      }
    };
    rec.onend = () => { if (!stopped) { try { rec.start(); } catch { /* noop */ } } };
    rec.onerror = () => { /* silently retry on end */ };
    try { rec.start(); } catch { /* noop */ }
    return () => { stopped = true; try { rec.stop(); } catch { /* noop */ } };
  }, [triggerSOS]);

  // Shake + fall detection via DeviceMotion
  useEffect(() => {
    const onMotion = (e: DeviceMotionEvent) => {
      const cfg = loadConfig();
      const acc = e.accelerationIncludingGravity || e.acceleration;
      if (!acc) return;
      const mag = Math.hypot(acc.x ?? 0, acc.y ?? 0, acc.z ?? 0);
      // Shake threshold scaled by sensitivity (1..10 → 30..12)
      const shakeThreshold = 30 - cfg.settings.shakeSensitivity * 1.8;
      const fallThreshold = 40;
      const now = Date.now();

      if (cfg.settings.shakeTrigger && mag > shakeThreshold) {
        shakeCounter.push(now);
        shakeCounter = shakeCounter.filter((t) => now - t < 1500);
        if (shakeCounter.length >= 4 && !activeRef.current) {
          shakeCounter = [];
          onSafetyCheck?.("Shake detected");
        }
      }
      if (cfg.settings.fallDetection && mag > fallThreshold && !activeRef.current) {
        onSafetyCheck?.("Possible fall detected");
      }
    };
    let shakeCounter: number[] = [];
    window.addEventListener("devicemotion", onMotion);
    return () => window.removeEventListener("devicemotion", onMotion);
  }, [onSafetyCheck]);
}

export async function requestMotionPermission(): Promise<boolean> {
  const DM: any = (window as any).DeviceMotionEvent;
  if (DM && typeof DM.requestPermission === "function") {
    try {
      const r = await DM.requestPermission();
      return r === "granted";
    } catch {
      return false;
    }
  }
  return true;
}
