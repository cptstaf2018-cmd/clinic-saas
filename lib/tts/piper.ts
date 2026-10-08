import type { TtsSession } from "@mintplex-labs/piper-tts-web";

/**
 * Open-source Arabic speech (Piper, MIT) that runs inside the waiting-room browser itself:
 * no server, no API key, no per-call cost. The voice model (about 63 MB) downloads once
 * and the browser keeps it, so later visits start instantly. Browser-only: call from effects.
 */
const VOICE_ID = "ar_JO-kareem-medium";

let session: Promise<TtsSession> | null = null;

/** Starts (or joins) loading the voice. `onProgress` gets 0-100 while the model downloads. */
export function loadArabicVoice(onProgress?: (percent: number) => void): Promise<TtsSession> {
  session ??= import("@mintplex-labs/piper-tts-web")
    .then(({ TtsSession: Session }) =>
      Session.create({
        voiceId: VOICE_ID,
        progress: (p) => {
          if (p.total > 0) onProgress?.(Math.min(100, Math.round((p.loaded * 100) / p.total)));
        },
      })
    )
    .catch((error: unknown) => {
      session = null; // let the next call retry instead of caching a failure
      throw error;
    });
  return session;
}

/** Speaks `text` and returns a WAV file. */
export async function synthesizeArabic(text: string): Promise<Blob> {
  const voice = await loadArabicVoice();
  return voice.predict(text);
}
