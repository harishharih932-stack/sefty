import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title?: string;
  description?: string;
  timeoutSec?: number;
  onConfirmSafe: () => void;
  onTimeout: () => void;
}

export function SafetyCheckDialog({
  open, onOpenChange, title = "Are you safe?", description = "Confirm you're okay.",
  timeoutSec = 10, onConfirmSafe, onTimeout,
}: Props) {
  const [remaining, setRemaining] = useState(timeoutSec);

  useEffect(() => {
    if (!open) { setRemaining(timeoutSec); return; }
    setRemaining(timeoutSec);
    const t = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(t);
          onTimeout();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [open, timeoutSec, onTimeout]);

  const pct = Math.max(0, Math.min(100, (remaining / timeoutSec) * 100));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Progress value={pct} />
          <p className="text-xs text-muted-foreground text-center">Responding in {remaining}s…</p>
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="outline" onClick={() => { onOpenChange(false); onTimeout(); }}>
            No, keep alert
          </Button>
          <Button onClick={onConfirmSafe} className="bg-safe hover:bg-safe/90 text-white">
            I'm Safe
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
