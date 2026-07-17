import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ShieldCheck, User, MessageCircle, LockKeyhole, ArrowRight, ArrowLeft, Send, Camera, MapPin, Mic, Bell, Accessibility } from "lucide-react";
import { defaultConfig, loadConfig, saveConfig, type AppConfig } from "@/lib/storage";
import { sendTelegramMessage } from "@/lib/telegram";
import { SOSPlugin } from "@/lib/sos-plugin";
import { requestMotionPermission } from "@/hooks/use-triggers";

export const Route = createFileRoute("/onboarding")({ component: Onboarding });

const STEPS = ["Welcome", "Your Info", "Contacts", "Telegram", "Permissions"] as const;

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [cfg, setCfg] = useState<AppConfig>(() => {
    const existing = loadConfig();
    return existing.onboarded ? existing : defaultConfig;
  });

  const set = (patch: Partial<AppConfig>) => setCfg((c) => ({ ...c, ...patch }));
  const setContact = (i: 0 | 1 | 2, patch: Partial<{ name: string; phone: string }>) => {
    const contacts = [...cfg.contacts] as AppConfig["contacts"];
    contacts[i] = { ...contacts[i], ...patch };
    setCfg((c) => ({ ...c, contacts }));
  };

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const finish = () => {
    if (!cfg.fullName.trim()) { toast.error("Please enter your name"); setStep(1); return; }
    if (!cfg.contacts.some((c) => c.phone.trim())) { toast.error("Add at least one emergency contact"); setStep(2); return; }
    saveConfig({ ...cfg, onboarded: true });
    toast.success("Setup complete — you're protected");
    navigate({ to: "/" });
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="rounded-full bg-emergency/10 p-2 text-emergency"><ShieldCheck className="size-5" /></div>
          <p className="text-sm font-semibold">SafeGuard Setup</p>
          <span className="ml-auto text-xs text-muted-foreground">Step {step + 1} of {STEPS.length}</span>
        </div>
        <Progress value={((step + 1) / STEPS.length) * 100} />
      </div>

      <Card className="p-6">
        {step === 0 && <Welcome />}
        {step === 1 && <UserInfo cfg={cfg} set={set} />}
        {step === 2 && <Contacts cfg={cfg} setContact={setContact} />}
        {step === 3 && <Telegram cfg={cfg} set={set} />}
        {step === 4 && <Permissions />}

        <div className="mt-6 flex items-center justify-between gap-2">
          <Button variant="ghost" onClick={prev} disabled={step === 0}>
            <ArrowLeft className="size-4" /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={next}>Next <ArrowRight className="size-4" /></Button>
          ) : (
            <Button onClick={finish} className="bg-emergency hover:bg-emergency/90 text-emergency-foreground">
              Finish Setup
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

function Welcome() {
  return (
    <div className="text-center py-4">
      <div className="mx-auto rounded-full bg-emergency/10 p-4 w-fit text-emergency"><ShieldCheck className="size-10" /></div>
      <h1 className="mt-4 text-2xl font-bold">Welcome to SafeGuard</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Personal safety in your pocket. Instant SOS, voice & shake triggers, live location sharing,
        and Telegram alerts to your trusted contacts — even when your phone is locked.
      </p>
      <ul className="mt-6 space-y-2 text-left text-sm">
        <Feat icon={<ShieldCheck className="size-4" />} title="One-tap SOS" desc="Send location & alert instantly" />
        <Feat icon={<Mic className="size-4" />} title="Voice trigger" desc="Say a safe word to alert" />
        <Feat icon={<MessageCircle className="size-4" />} title="Telegram alerts" desc="Reliable delivery to family" />
      </ul>
    </div>
  );
}

function Feat({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <li className="flex items-start gap-3 rounded-lg border border-border p-3">
      <div className="rounded-md bg-accent/50 p-2 text-emergency">{icon}</div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </li>
  );
}

function UserInfo({ cfg, set }: { cfg: AppConfig; set: (p: Partial<AppConfig>) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2"><User className="size-5 text-emergency" /><h2 className="font-semibold">Your Info</h2></div>
      <div>
        <Label htmlFor="name">Full name *</Label>
        <Input id="name" value={cfg.fullName} onChange={(e) => set({ fullName: e.target.value })} placeholder="e.g. Priya Sharma" />
      </div>
      <div>
        <Label htmlFor="phone">Your phone</Label>
        <Input id="phone" type="tel" value={cfg.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="+91 …" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="blood">Blood group</Label>
          <Input id="blood" value={cfg.bloodGroup} onChange={(e) => set({ bloodGroup: e.target.value })} placeholder="O+" />
        </div>
        <div>
          <Label htmlFor="allergy">Allergies</Label>
          <Input id="allergy" value={cfg.allergies} onChange={(e) => set({ allergies: e.target.value })} placeholder="Penicillin…" />
        </div>
      </div>
    </div>
  );
}

function Contacts({ cfg, setContact }: { cfg: AppConfig; setContact: (i: 0 | 1 | 2, p: Partial<{ name: string; phone: string }>) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold">Emergency contacts</h2>
        <p className="text-xs text-muted-foreground">They'll get your SOS alerts. Add at least one.</p>
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="grid grid-cols-2 gap-3 rounded-lg border border-border p-3">
          <div className="col-span-2 text-xs font-semibold text-muted-foreground">Contact {i + 1}</div>
          <Input placeholder="Name" value={cfg.contacts[i].name} onChange={(e) => setContact(i as 0 | 1 | 2, { name: e.target.value })} />
          <Input placeholder="Phone" type="tel" value={cfg.contacts[i].phone} onChange={(e) => setContact(i as 0 | 1 | 2, { phone: e.target.value })} />
        </div>
      ))}
    </div>
  );
}

function Telegram({ cfg, set }: { cfg: AppConfig; set: (p: Partial<AppConfig>) => void }) {
  const [testing, setTesting] = useState(false);
  const test = async () => {
    if (!cfg.telegramToken || !cfg.telegramChatId) { toast.error("Enter both token and chat ID"); return; }
    setTesting(true);
    const r = await sendTelegramMessage(cfg.telegramToken, cfg.telegramChatId,
      `✅ <b>SafeGuard test</b>\n${cfg.fullName || "User"} — your Telegram is connected.`);
    setTesting(false);
    if (r.ok) toast.success("Test message sent!"); else toast.error(r.error || "Failed");
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2"><MessageCircle className="size-5 text-emergency" /><h2 className="font-semibold">Telegram Alerts</h2></div>
      <div className="rounded-lg bg-accent/40 p-3 text-xs space-y-1">
        <p><strong>How to get these:</strong></p>
        <p>1. Open Telegram and message <a className="underline" href="https://t.me/BotFather" target="_blank" rel="noreferrer">@BotFather</a> → <code>/newbot</code> → copy the token.</p>
        <p>2. Start a chat with your bot, then visit <code>https://api.telegram.org/bot&lt;TOKEN&gt;/getUpdates</code> to find your chat ID.</p>
      </div>
      <div>
        <Label htmlFor="tok">Bot token</Label>
        <Input id="tok" value={cfg.telegramToken} onChange={(e) => set({ telegramToken: e.target.value.trim() })} placeholder="1234567:AA…" />
      </div>
      <div>
        <Label htmlFor="chat">Chat ID</Label>
        <Input id="chat" value={cfg.telegramChatId} onChange={(e) => set({ telegramChatId: e.target.value.trim() })} placeholder="123456789" />
      </div>
      <Button onClick={test} disabled={testing} variant="outline" className="w-full">
        <Send className="size-4" /> {testing ? "Sending…" : "Test Send Alert"}
      </Button>
    </div>
  );
}

function Permissions() {
  const req = async () => {
    const perms: string[] = [];
    if (navigator.geolocation) navigator.geolocation.getCurrentPosition(() => perms.push("location"), () => {});
    try { await navigator.mediaDevices?.getUserMedia({ audio: true }).then((s) => s.getTracks().forEach((t) => t.stop())); } catch { /* noop */ }
    try { await Notification.requestPermission(); } catch { /* noop */ }
    await requestMotionPermission();
    toast.success("Permissions requested");
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2"><LockKeyhole className="size-5 text-emergency" /><h2 className="font-semibold">Permissions</h2></div>
      <p className="text-sm text-muted-foreground">SafeGuard needs these to protect you:</p>
      <div className="grid grid-cols-2 gap-2">
        <PermTile icon={<MapPin />} label="Location" />
        <PermTile icon={<Camera />} label="Camera" />
        <PermTile icon={<Mic />} label="Microphone" />
        <PermTile icon={<Bell />} label="Notifications" />
        <PermTile icon={<Accessibility />} label="Accessibility" />
      </div>
      <Button onClick={req} variant="outline" className="w-full">Grant permissions</Button>
      <Button onClick={() => SOSPlugin.openAccessibilitySettings()} className="w-full">
        Enable Background Protection
      </Button>
    </div>
  );
}

function PermTile({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="rounded-lg border border-border p-3 flex items-center gap-2 text-sm">
      <span className="text-emergency [&_svg]:size-4">{icon}</span> {label}
    </div>
  );
}
