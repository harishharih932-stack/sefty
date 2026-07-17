import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Battery, BatteryLow, MapPin, Phone, Settings, ShieldAlert, ShieldCheck, Wifi, WifiOff, Route as RouteIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SOSButton } from "@/components/sos-button";
import { JourneyModal } from "@/components/journey-modal";
import { SafetyCheckDialog } from "@/components/safety-check-dialog";
import { useSOS } from "@/lib/sos-context";
import { useLocation } from "@/hooks/use-location";
import { useBattery } from "@/hooks/use-battery";
import { useNetwork } from "@/hooks/use-network";
import { useTriggers } from "@/hooks/use-triggers";
import { loadConfig, type AppConfig } from "@/lib/storage";
import { sendTelegramMessage, formatSOSMessage } from "@/lib/telegram";
import { toast } from "sonner";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const navigate = useNavigate();
  const [cfg, setCfg] = useState<AppConfig | null>(null);
  const [journeyOpen, setJourneyOpen] = useState(false);
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [safetyReason, setSafetyReason] = useState<string>("");
  const { active, triggerSOS, updateLocation } = useSOS();
  const loc = useLocation(10_000);
  const battery = useBattery();
  const online = useNetwork();

  useEffect(() => {
    const c = loadConfig();
    if (!c.onboarded) {
      navigate({ to: "/onboarding" });
      return;
    }
    setCfg(c);
    const onChange = () => setCfg(loadConfig());
    window.addEventListener("wsai:config-changed", onChange);
    return () => window.removeEventListener("wsai:config-changed", onChange);
  }, [navigate]);

  useEffect(() => {
    if (loc.coords) updateLocation(loc.coords);
  }, [loc.coords, updateLocation]);

  useTriggers((reason) => { setSafetyReason(reason); setSafetyOpen(true); });

  // Low-battery alert
  useEffect(() => {
    if (!cfg || battery.level == null || battery.charging) return;
    const key = "wsai_lowbat_notified";
    const already = sessionStorage.getItem(key);
    if (battery.level <= cfg.settings.batteryThreshold && !already) {
      sessionStorage.setItem(key, "1");
      toast.warning(`Battery low (${battery.level}%) — notifying contacts`);
      const msg = formatSOSMessage({
        name: cfg.fullName, phone: cfg.phone,
        lat: loc.coords?.latitude, lng: loc.coords?.longitude,
        battery: battery.level, reason: "Low battery alert",
      });
      sendTelegramMessage(cfg.telegramToken, cfg.telegramChatId, msg);
    }
    if (battery.level > cfg.settings.batteryThreshold + 5) sessionStorage.removeItem(key);
  }, [battery.level, battery.charging, cfg, loc.coords]);

  // Offline notice on reconnect
  useEffect(() => {
    if (!cfg) return;
    if (!online) {
      const c = loc.coords;
      if (c) localStorage.setItem("wsai_last_offline", JSON.stringify({ lat: c.latitude, lng: c.longitude, t: Date.now() }));
    } else {
      const raw = localStorage.getItem("wsai_last_offline");
      if (raw) {
        localStorage.removeItem("wsai_last_offline");
        try {
          const d = JSON.parse(raw);
          sendTelegramMessage(cfg.telegramToken, cfg.telegramChatId,
            `📶 <b>Back online.</b> Was offline near <a href="https://maps.google.com/?q=${d.lat},${d.lng}">this location</a> at ${new Date(d.t).toLocaleString()}`);
        } catch { /* noop */ }
      }
    }
  }, [online, cfg, loc.coords]);

  if (!cfg) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 pt-6 pb-8">
      <header className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Hello,</p>
          <h1 className="text-2xl font-bold">{cfg.fullName || "Friend"}</h1>
        </div>
        <div className="flex items-center gap-2">
          <StatusChip active={active} />
          <Button variant="ghost" size="icon" aria-label="Settings" onClick={() => navigate({ to: "/settings" })}>
            <Settings className="size-5" />
          </Button>
        </div>
      </header>

      {!online && (
        <div className="mb-4 rounded-lg border border-warn/40 bg-warn/10 px-3 py-2 text-sm flex items-center gap-2">
          <WifiOff className="size-4" /> You're offline. Alerts will queue until reconnect.
        </div>
      )}
      {battery.level != null && battery.level <= cfg.settings.batteryThreshold && !battery.charging && (
        <div className="mb-4 rounded-lg border border-emergency/40 bg-emergency/10 px-3 py-2 text-sm flex items-center gap-2">
          <BatteryLow className="size-4 text-emergency" /> Battery critically low — location sent to contacts.
        </div>
      )}

      <Card className="p-4">
        <SOSButton active={active} onTrigger={() => triggerSOS("Manual SOS button")} />
      </Card>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <LocationCard loc={loc} />
        <QuickStats battery={battery.level} charging={battery.charging} online={online} />
      </div>

      <Card className="mt-4 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Trusted Contacts</h2>
          <Badge variant="secondary">{cfg.contacts.filter((c) => c.phone).length}/3</Badge>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {cfg.contacts.map((c, i) => (
            <a
              key={i}
              href={c.phone ? `tel:${c.phone}` : undefined}
              className="rounded-lg border border-border p-3 flex items-center gap-3 hover:bg-accent/30 transition-colors"
              aria-label={c.name ? `Call ${c.name}` : `Contact ${i + 1} not set`}
            >
              <div className="rounded-full bg-emergency/10 p-2 text-emergency"><Phone className="size-4" /></div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{c.name || `Contact ${i + 1}`}</p>
                <p className="text-xs text-muted-foreground truncate">{c.phone || "Not set"}</p>
              </div>
            </a>
          ))}
        </div>
      </Card>

      <Card className="mt-4 p-4 flex items-center gap-4">
        <div className="rounded-full bg-primary/10 p-3 text-primary"><RouteIcon className="size-5" /></div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold">Journey Guardian</p>
          <p className="text-xs text-muted-foreground">We'll check on you and auto-alert if you don't reach.</p>
        </div>
        <Button onClick={() => setJourneyOpen(true)}>Start</Button>
      </Card>

      <JourneyModal open={journeyOpen} onOpenChange={setJourneyOpen} />

      <SafetyCheckDialog
        open={safetyOpen}
        onOpenChange={setSafetyOpen}
        title="Are you safe?"
        description={safetyReason}
        timeoutSec={15}
        onConfirmSafe={() => setSafetyOpen(false)}
        onTimeout={() => { setSafetyOpen(false); triggerSOS(safetyReason || "No response to safety check"); }}
      />
    </div>
  );
}

function StatusChip({ active }: { active: boolean }) {
  if (active) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emergency/15 px-3 py-1 text-xs font-semibold text-emergency">
        <ShieldAlert className="size-3.5" /> Emergency
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-safe/15 px-3 py-1 text-xs font-semibold text-safe">
      <ShieldCheck className="size-3.5" /> Safe
    </span>
  );
}

function LocationCard({ loc }: { loc: ReturnType<typeof useLocation> }) {
  const mapUrl = loc.coords ? `https://maps.google.com/?q=${loc.coords.latitude},${loc.coords.longitude}` : null;
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="size-4 text-emergency" />
        <h3 className="text-sm font-semibold">Current Location</h3>
      </div>
      {loc.loading && <p className="text-xs text-muted-foreground">Locating…</p>}
      {loc.error && (
        <p className="text-xs text-emergency flex items-center gap-1"><AlertCircle className="size-3.5" /> {loc.error}</p>
      )}
      {loc.coords && (
        <>
          <p className="text-sm line-clamp-2">{loc.address ?? "Resolving address…"}</p>
          <p className="text-[11px] font-mono text-muted-foreground mt-1">
            {loc.coords.latitude.toFixed(5)}, {loc.coords.longitude.toFixed(5)}
          </p>
          {mapUrl && (
            <Button asChild variant="outline" size="sm" className="mt-2">
              <a href={mapUrl} target="_blank" rel="noreferrer">Share Map</a>
            </Button>
          )}
        </>
      )}
    </Card>
  );
}

function QuickStats({ battery, charging, online }: { battery: number | null; charging: boolean; online: boolean }) {
  return (
    <Card className="p-4 grid grid-cols-2 gap-3">
      <div className="flex items-center gap-2">
        <Battery className={`size-4 ${charging ? "text-safe" : battery != null && battery <= 20 ? "text-emergency" : "text-muted-foreground"}`} />
        <div>
          <p className="text-xs text-muted-foreground">Battery</p>
          <p className="text-sm font-semibold">{battery != null ? `${battery}%${charging ? " ⚡" : ""}` : "—"}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {online ? <Wifi className="size-4 text-safe" /> : <WifiOff className="size-4 text-emergency" />}
        <div>
          <p className="text-xs text-muted-foreground">Network</p>
          <p className="text-sm font-semibold">{online ? "Online" : "Offline"}</p>
        </div>
      </div>
    </Card>
  );
}
