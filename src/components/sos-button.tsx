import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onTrigger: () => void;
  active: boolean;
}

export function SOSButton({ onTrigger, active }: Props) {
  return (
    <div className="relative flex flex-col items-center justify-center py-6">
      {active && (
        <>
          <span className="pointer-events-none absolute inset-0 m-auto size-40 rounded-full bg-emergency/30 ring-pulse" />
          <span className="pointer-events-none absolute inset-0 m-auto size-40 rounded-full bg-emergency/20 ring-pulse [animation-delay:600ms]" />
        </>
      )}
      <button
        type="button"
        aria-label="Trigger emergency SOS"
        onClick={onTrigger}
        className={cn(
          "relative size-40 rounded-full bg-emergency text-emergency-foreground",
          "flex flex-col items-center justify-center gap-1",
          "shadow-elegant transition-transform active:scale-95",
          "focus:outline-none focus:ring-4 focus:ring-emergency/40",
          active && "pulse-emergency",
        )}
      >
        <AlertTriangle className="size-10" strokeWidth={2.4} aria-hidden />
        <span className="text-2xl font-bold tracking-wider">SOS</span>
        <span className="text-[10px] uppercase tracking-widest opacity-90">Tap to alert</span>
      </button>
      <p className="mt-4 text-xs text-muted-foreground">Press and hold volume key 3× or say a safe word</p>
    </div>
  );
}
