export interface Contact {
  name: string;
  phone: string;
}

export interface AppConfig {
  fullName: string;
  phone: string;
  contacts: [Contact, Contact, Contact];
  bloodGroup?: string;
  allergies?: string;
  telegramToken: string;
  telegramChatId: string;
  onboarded: boolean;
  settings: {
    volumeTrigger: boolean;
    voiceTrigger: boolean;
    shakeTrigger: boolean;
    fallDetection: boolean;
    shakeSensitivity: number; // 1-10
    batteryThreshold: number; // percent
    voicePhrases: string[];
  };
}

const KEY = "wsai_config_v1";

export const defaultConfig: AppConfig = {
  fullName: "",
  phone: "",
  contacts: [
    { name: "", phone: "" },
    { name: "", phone: "" },
    { name: "", phone: "" },
  ],
  bloodGroup: "",
  allergies: "",
  telegramToken: "",
  telegramChatId: "",
  onboarded: false,
  settings: {
    volumeTrigger: true,
    voiceTrigger: true,
    shakeTrigger: true,
    fallDetection: true,
    shakeSensitivity: 6,
    batteryThreshold: 15,
    voicePhrases: ["help help help", "bachao bachao", "emergency"],
  },
};

export function loadConfig(): AppConfig {
  if (typeof window === "undefined") return defaultConfig;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultConfig;
    const parsed = JSON.parse(raw);
    return {
      ...defaultConfig,
      ...parsed,
      settings: { ...defaultConfig.settings, ...(parsed.settings ?? {}) },
      contacts: parsed.contacts ?? defaultConfig.contacts,
    };
  } catch {
    return defaultConfig;
  }
}

export function saveConfig(cfg: AppConfig) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(cfg));
  // Bridge to native (Capacitor) — stub-safe
  try {
    (window as any).Capacitor?.Plugins?.SOSPlugin?.saveConfig?.({
      telegramToken: cfg.telegramToken,
      telegramChatId: cfg.telegramChatId,
      contact1: cfg.contacts[0],
      contact2: cfg.contacts[1],
      contact3: cfg.contacts[2],
    });
  } catch {
    /* noop */
  }
  window.dispatchEvent(new CustomEvent("wsai:config-changed"));
}
