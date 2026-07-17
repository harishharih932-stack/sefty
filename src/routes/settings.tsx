import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Save, Send, Trash2, Plus, Accessibility } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { loadConfig, saveConfig, type AppConfig } from "@/lib/storage";
import { sendTelegramMessage } from "@/lib/telegram";
import { SOSPlugin } from "@/lib/sos-plugin";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

function SettingsPage() {
  const navigate = useNavigate();
  const [cfg, setCfg] = useState<AppConfig | null>(null);
  const [newPhrase, setNewPhrase] = useState("");
  const [accEnabled, setAccEnabled] = useState<boolean | null>(null);

  useEffect(() => { setCfg(loadConfig()); }, []);
  useEffect(() => {
    if (SOSPlugin.isNative()) SOSPlugin.isAccessibilityEnabled().then(setAccEnabled);
  }, []);

  if (!cfg) return null;

  const upd = (patch: Partial<AppConfig>) => setCfg({ ...cfg, ...patch });
  const updSettings = (patch: Partial<AppConfig["settings"]>) => setCfg({ ...cfg, settings: { ...cfg.settings, ...patch } });
  const save = () => { saveConfig(cfg); toast.success("Settings saved"); };
  const testTelegram = async () => {
    const r = await sendTelegramMessage(cfg.telegramToken, cfg.telegramChatId, "✅ SafeGuard test from settings");
    if (r.ok) toast.success("Sent"); else toast.error(r.error || "Failed");
  };

  return (
    <div className="mx-auto max-w-2xl px-4 pt-6 pb-8">
      <header className="mb-4 flex items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="Back" onClick={() => navigate({ to: "/" })}>
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="text-2xl font-bold">Settings</h1>
        <Button className="ml-auto" onClick={save}><Save className="size-4" /> Save</Button>
      </header>

      <Section title="Emergency triggers">
        <ToggleRow label="Volume button (3 rapid presses)" checked={cfg.settings.volumeTrigger} onChange={(v) => updSettings({ volumeTrigger: v })} />
        <ToggleRow label="Voice trigger" checked={cfg.settings.voiceTrigger} onChange={(v) => updSettings({ voiceTrigger: v })} />
        <ToggleRow label="Shake detection" checked={cfg.settings.shakeTrigger} onChange={(v) => updSettings({ shakeTrigger: v })} />
        <ToggleRow label="Fall detection" checked={cfg.settings.fallDetection} onChange={(v) => updSettings({ fallDetection: v })} />
        <div className="pt-2">
          <Label>Shake sensitivity: <span className="font-mono">{cfg.settings.shakeSensitivity}</span></Label>
          <Slider value={[cfg.settings.shakeSensitivity]} min={1} max={10} step={1} onValueChange={(v) => updSettings({ shakeSensitivity: v[0] })} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-1">Low → less sensitive · High → more sensitive</p>
        </div>
        <div className="pt-2">
          <Label>Battery alert threshold: <span className="font-mono">{cfg.settings.batteryThreshold}%</span></Label>
          <Slider value={[cfg.settings.batteryThreshold]} min={10} max={50} step={5} onValueChange={(v) => updSettings({ batteryThreshold: v[0] })} className="mt-2" />
        </div>
      </Section>

      <Section title="Voice phrases">
        <div className="space-y-2">
          {cfg.settings.voicePhrases.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input value={p} onChange={(e) => {
                const arr = [...cfg.settings.voicePhrases]; arr[i] = e.target.value;
                updSettings({ voicePhrases: arr });
              }} />
              <Button size="icon" variant="ghost" aria-label="Remove" onClick={() => {
                updSettings({ voicePhrases: cfg.settings.voicePhrases.filter((_, j) => j !== i) });
              }}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <Input placeholder="Add new phrase" value={newPhrase} onChange={(e) => setNewPhrase(e.target.value)} />
            <Button variant="outline" onClick={() => {
              if (!newPhrase.trim()) return;
              updSettings({ voicePhrases: [...cfg.settings.voicePhrases, newPhrase.trim()] });
              setNewPhrase("");
            }}>
              <Plus className="size-4" /> Add
            </Button>
          </div>
        </div>
      </Section>

      <Section title="Trusted contacts">
        {cfg.contacts.map((c, i) => (
          <div key={i} className="grid grid-cols-2 gap-2">
            <Input placeholder={`Contact ${i + 1} name`} value={c.name} onChange={(e) => {
              const contacts = [...cfg.contacts] as AppConfig["contacts"];
              contacts[i] = { ...contacts[i], name: e.target.value };
              upd({ contacts });
            }} />
            <Input placeholder="Phone" type="tel" value={c.phone} onChange={(e) => {
              const contacts = [...cfg.contacts] as AppConfig["contacts"];
              contacts[i] = { ...contacts[i], phone: e.target.value };
              upd({ contacts });
            }} />
          </div>
        ))}
      </Section>

      <Section title="Telegram">
        <div>
          <Label>Bot token</Label>
          <Input value={cfg.telegramToken} onChange={(e) => upd({ telegramToken: e.target.value.trim() })} />
        </div>
        <div>
          <Label>Chat ID</Label>
          <Input value={cfg.telegramChatId} onChange={(e) => upd({ telegramChatId: e.target.value.trim() })} />
        </div>
        <Button variant="outline" onClick={testTelegram}><Send className="size-4" /> Test</Button>
      </Section>

      <Section title="Background protection">
        <p className="text-xs text-muted-foreground">
          Enables SOS triggers when SafeGuard is closed. Requires the Android accessibility service (native app only).
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => SOSPlugin.openAccessibilitySettings()}>
            <Accessibility className="size-4" /> Open Accessibility Settings
          </Button>
          <Button variant="outline" onClick={async () => {
            const e = await SOSPlugin.isAccessibilityEnabled();
            setAccEnabled(e);
            toast(e ? "Background protection is ON" : "Background protection is OFF");
          }}>
            Check Status
          </Button>
        </div>
        {accEnabled !== null && (
          <p className="text-xs">Status: <span className={accEnabled ? "text-safe font-semibold" : "text-emergency font-semibold"}>{accEnabled ? "Active" : "Inactive"}</span></p>
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-4 mb-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">{title}</h2>
      <Separator className="mb-3" />
      <div className="space-y-3">{children}</div>
    </Card>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <Label className="text-sm">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
