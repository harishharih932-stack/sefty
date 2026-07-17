import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { MapPin, Clock, PlayCircle, XCircle } from "lucide-react";
import { useSOS } from "@/lib/sos-context";
import { SafetyCheckDialog } from "./safety-check-dialog";
import { toast } from "sonner";

interface Props { open: boolean; onOpenChange: (o: boolean) => void; }

export function JourneyModal({ open, onOpenChange }: Props) {
  const [destination, setDestination] = useState("");
  const [minutes, setMinutes] = useState(30);
  const [active, setActive] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [checkOpen, setCheckOpen] = useState(false);
  const missedRef = useRef(0);
  const { triggerSOS, lastLocation } = useSOS();

  useEffect(() => {
    if (!active || !startedAt) return;
    const t = window.setInterval(() => {
      const e = Date.now() - startedAt;
      setElapsed(e);
      const overrunPct = (e / (minutes * 60_000) - 1) * 100;
      if (overrunPct > 20) {
        toast.warning("Journey overrun 20% — triggering SOS");
        triggerSOS("Journey Guardian: overdue");
        setActive(false);
      }
    }, 1000);
    return () => clearInterval(t);
  }, [active, startedAt, minutes, triggerSOS]);

  // Prompt every 5 min
  useEffect(() => {
    if (!active) return;
    const t = window.setInterval(() => setCheckOpen(true), 5 * 60_000);
    return () => clearInterval(t);
  }, [active]);

  const start = () => {
    if (!destination.trim()) { toast.error("Enter a destination"); return; }
    setStartedAt(Date.now());
    setActive(true);
    missedRef.current = 0;
    onOpenChange(false);
    toast.success(`Journey started to ${destination}`);
  };

  const stop = () => { setActive(false); setStartedAt(null); toast("Journey ended"); };

  const mm = Math.floor(elapsed / 60000);
  const ss = Math.floor((elapsed % 60000) / 1000);
  const mapSrc = lastLocation
    ? `https://www.google.com/maps?q=${lastLocation.latitude},${lastLocation.longitude}&z=15&output=embed`
    : null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Journey</DialogTitle>
            <DialogDescription>We'll check on you and auto-alert if you're overdue.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="dest">Where are you going?</Label>
              <Input id="dest" placeholder="e.g. Home from office" value={destination} onChange={(e) => setDestination(e.target.value)} />
            </div>
            <div>
              <Label>Expected travel time: <span className="font-mono">{minutes} min</span></Label>
              <Slider value={[minutes]} min={5} max={180} step={5} onValueChange={(v) => setMinutes(v[0])} className="mt-2" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={start} className="w-full"><PlayCircle className="size-4" /> Start Journey</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {active && (
        <Card className="fixed bottom-20 left-1/2 z-40 w-[min(92vw,26rem)] -translate-x-1/2 p-4 shadow-lift border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <MapPin className="size-4 text-emergency shrink-0" />
              <p className="text-sm font-semibold truncate">Journey to {destination}</p>
            </div>
            <Button size="sm" variant="ghost" onClick={stop}><XCircle className="size-4" /></Button>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Clock className="size-3.5" /> {mm}:{String(ss).padStart(2, "0")} / {minutes}:00
          </div>
          {mapSrc && (
            <iframe title="Journey map" src={mapSrc} className="w-full h-32 rounded-md border" loading="lazy" />
          )}
        </Card>
      )}

      <SafetyCheckDialog
        open={checkOpen}
        onOpenChange={setCheckOpen}
        title="Journey check-in"
        description="Still on track? Confirm you're safe."
        timeoutSec={30}
        onConfirmSafe={() => { setCheckOpen(false); missedRef.current = 0; }}
        onTimeout={() => {
          missedRef.current += 1;
          setCheckOpen(false);
          if (missedRef.current >= 2) {
            triggerSOS("Journey Guardian: no response");
            setActive(false);
          }
        }}
      />
    </>
  );
}
