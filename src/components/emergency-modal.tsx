import { useEffect, useState } from "react";
import { AlertTriangle, MapPin, X } from "lucide-react";
import { useSOS } from "@/lib/sos-context";
import { Button } from "@/components/ui/button";
import { SafetyCheckDialog } from "./safety-check-dialog";

function fmtElapsed(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(m).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
}

export function EmergencyModal() {
  const { active, reason, startedAt, lastLocation, stopSOS } = useSOS();
  const [now, setNow] = useState(Date.now());
  const [checkOpen, setCheckOpen] = useState(false);
  const [checkCount, setCheckCount] = useState(0);

  useEffect(() => {
    if (!active) { setCheckCount(0); return; }
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);

  // Every 30s show "Are you safe?" confirmation
  useEffect(() => {
    if (!active) return;
    const t = window.setInterval(() => {
      setCheckOpen(true);
      setCheckCount((c) => c + 1);
    }, 30_000);
    return () => clearInterval(t);
  }, [active]);

  if (!active) return null;

  const elapsed = startedAt ? now - startedAt : 0;

  return (
    <div className="fixed inset-0 z-50 bg-emergency text-emergency-foreground flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-6">
        <div className="rounded-full bg-white/15 p-6 pulse-emergency">
          <AlertTriangle className="size-16" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">EMERGENCY ALERT SENT</h1>
          <p className="mt-2 text-sm opacity-90">Trigger: {reason}</p>
        </div>
        <div className="text-6xl font-mono font-bold tabular-nums">{fmtElapsed(elapsed)}</div>

        {lastLocation && (
          <a
            href={`https://maps.google.com/?q=${lastLocation.latitude},${lastLocation.longitude}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium hover:bg-white/25 transition-colors"
          >
            <MapPin className="size-4" />
            {lastLocation.latitude.toFixed(5)}, {lastLocation.longitude.toFixed(5)}
          </a>
        )}

        <p className="text-sm opacity-90 max-w-md">
          Live location is being shared every 45 seconds. Your trusted contacts have been notified via Telegram.
        </p>

        <Button
          size="lg"
          variant="secondary"
          onClick={stopSOS}
          className="mt-4 bg-white text-emergency hover:bg-white/90 font-bold px-8"
        >
          <X className="size-5" /> I'm Safe — End Emergency
        </Button>
      </div>

      <SafetyCheckDialog
        open={checkOpen}
        onOpenChange={setCheckOpen}
        title="Are you safe?"
        description={`Confirm you're okay to end the emergency. (Check ${checkCount})`}
        timeoutSec={15}
        onConfirmSafe={() => { setCheckOpen(false); stopSOS(); }}
        onTimeout={() => setCheckOpen(false)}
      />
    </div>
  );
}
