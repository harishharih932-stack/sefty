export async function sendTelegramMessage(
  token: string,
  chatId: string,
  text: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!token || !chatId) return { ok: false, error: "Missing token or chat ID" };
  try {
    const url = `https://api.telegram.org/bot${encodeURIComponent(token)}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: false,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.description ?? `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export function formatSOSMessage(opts: {
  name: string;
  phone: string;
  lat?: number;
  lng?: number;
  address?: string;
  battery?: number;
  reason?: string;
  medical?: string;
}): string {
  const lines = ["🚨 <b>EMERGENCY SOS</b> 🚨", ""];
  lines.push(`<b>From:</b> ${escapeHtml(opts.name || "Unknown")}`);
  if (opts.phone) lines.push(`<b>Phone:</b> ${escapeHtml(opts.phone)}`);
  if (opts.reason) lines.push(`<b>Trigger:</b> ${escapeHtml(opts.reason)}`);
  if (opts.lat != null && opts.lng != null) {
    lines.push(
      `<b>Location:</b> <a href="https://maps.google.com/?q=${opts.lat},${opts.lng}">Open in Google Maps</a>`,
    );
    lines.push(`<code>${opts.lat.toFixed(6)}, ${opts.lng.toFixed(6)}</code>`);
  }
  if (opts.address) lines.push(`<b>Address:</b> ${escapeHtml(opts.address)}`);
  if (opts.battery != null) lines.push(`<b>Battery:</b> ${opts.battery}%`);
  if (opts.medical) lines.push(`<b>Medical:</b> ${escapeHtml(opts.medical)}`);
  lines.push("", `<i>${new Date().toLocaleString()}</i>`);
  return lines.join("\n");
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
