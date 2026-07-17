/**
 * Bridge to native Capacitor SOSPlugin. Falls back to safe stubs on web.
 * Real Kotlin implementation lives in the Android module.
 */
type SOSBridge = {
  saveConfig?: (cfg: unknown) => Promise<void> | void;
  isAccessibilityEnabled?: () => Promise<{ enabled: boolean }> | { enabled: boolean };
  openAccessibilitySettings?: () => Promise<void> | void;
  triggerTestSOS?: () => Promise<void> | void;
  stopSOS?: () => Promise<void> | void;
};

function bridge(): SOSBridge | undefined {
  if (typeof window === "undefined") return undefined;
  // Capacitor registers native plugins under window.Capacitor.Plugins.<Name>,
  // NOT window.<Name> directly. The old code read window.SOSPlugin, which
  // never exists — so every native call (saveConfig, triggerTestSOS, etc.)
  // was silently a no-op on the real device.
  return (window as any).Capacitor?.Plugins?.SOSPlugin;
}

export const SOSPlugin = {
  isNative(): boolean {
    return !!bridge();
  },
  async isAccessibilityEnabled(): Promise<boolean> {
    const b = bridge();
    if (!b?.isAccessibilityEnabled) return false;
    try {
      const r = await b.isAccessibilityEnabled();
      return !!r?.enabled;
    } catch {
      return false;
    }
  },
  async openAccessibilitySettings() {
    const b = bridge();
    if (b?.openAccessibilitySettings) return b.openAccessibilitySettings();
    console.info("[SOSPlugin stub] openAccessibilitySettings");
  },
  async triggerTestSOS() {
    const b = bridge();
    if (b?.triggerTestSOS) return b.triggerTestSOS();
    console.info("[SOSPlugin stub] triggerTestSOS");
  },
  async stopSOS() {
    const b = bridge();
    if (b?.stopSOS) return b.stopSOS();
    console.info("[SOSPlugin stub] stopSOS");
  },
};
