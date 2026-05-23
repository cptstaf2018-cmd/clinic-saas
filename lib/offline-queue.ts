"use client";

export type OfflineActionType = "appointment.createWithPatient" | "medicalRecord.create";

export type OfflineAction = {
  id: string;
  type: OfflineActionType;
  label: string;
  createdAt: string;
  attempts: number;
  lastError?: string;
  payload: Record<string, unknown>;
};

const STORAGE_KEY = "clinicplt.offlineQueue.v1";
const CHANGE_EVENT = "clinicplt:offline-queue-change";

function safeParse(value: string | null): OfflineAction[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: OfflineAction[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function getOfflineQueue() {
  if (typeof window === "undefined") return [];
  return safeParse(window.localStorage.getItem(STORAGE_KEY));
}

export function addOfflineAction(action: Omit<OfflineAction, "id" | "createdAt" | "attempts">) {
  const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const queue = getOfflineQueue();
  const item: OfflineAction = {
    ...action,
    id,
    createdAt: new Date().toISOString(),
    attempts: 0,
  };

  writeQueue([...queue, item]);
  return item;
}

export function removeOfflineAction(id: string) {
  writeQueue(getOfflineQueue().filter((item) => item.id !== id));
}

export function updateOfflineAction(id: string, patch: Partial<OfflineAction>) {
  writeQueue(getOfflineQueue().map((item) => (item.id === id ? { ...item, ...patch } : item)));
}

export function subscribeOfflineQueue(listener: () => void) {
  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

async function parseError(res: Response) {
  const data = await res.json().catch(() => null);
  return data?.error || "تعذر الرفع الآن";
}

async function postJson(url: string, payload: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function syncOfflineAction(action: OfflineAction) {
  if (action.type === "appointment.createWithPatient") {
    const patient = await postJson("/api/patients", {
      name: action.payload.patientName,
      whatsappPhone: action.payload.patientPhone,
    });

    await postJson("/api/appointments", {
      patientId: patient.id,
      date: action.payload.date,
    });

    return;
  }

  if (action.type === "medicalRecord.create") {
    await postJson("/api/medical-records", action.payload);
    return;
  }

  throw new Error("عملية غير معروفة");
}

