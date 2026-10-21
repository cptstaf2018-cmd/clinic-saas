/**
 * Installing the site as an app. Chrome and Edge fire `beforeinstallprompt` once, early, on any page; we keep it so
 * an install button can open it later. iPhone has no such prompt, so the button explains "Add to Home Screen".
 */
type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

export type InstallMode = "hidden" | "prompt" | "ios" | "manual";

let deferred: InstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

/** Called once from the root layout, so the event is caught whichever page it fires on. */
export function captureInstallPrompt(): void {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferred = event as InstallPromptEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    installed = true;
    emit();
  });
}

export function subscribeInstall(listener: () => void): () => void {
  listeners.add(listener);
  const media = window.matchMedia("(display-mode: standalone)");
  media.addEventListener("change", listener);
  return () => {
    listeners.delete(listener);
    media.removeEventListener("change", listener);
  };
}

export function installMode(): InstallMode {
  const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (installed || standalone) return "hidden";
  if (deferred) return "prompt";
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return ios ? "ios" : "manual";
}

/** Opens the browser's own install dialog. False when there is none to open, or the browser refused to open it. */
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  const event = deferred;
  try {
    await event.prompt();
  } catch {
    return false; // e.g. not counted as a user tap: keep the event for the next tap
  }
  deferred = null;
  const { outcome } = await event.userChoice;
  if (outcome === "accepted") installed = true;
  emit();
  return true;
}
