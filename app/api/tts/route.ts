import { NextResponse } from "next/server";

// Try Google Translate TTS first (free, no API key). Fall back to VoiceRSS if blocked/failed.
async function fetchGoogleTTS(text: string): Promise<ArrayBuffer | null> {
  // Google Translate's unofficial TTS endpoint — used by their own translation widget
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ar&client=tw-ob&q=${encodeURIComponent(text)}`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://translate.google.com/",
        "Accept": "audio/mpeg,*/*",
      },
    });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("audio")) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

async function fetchVoiceRSS(text: string): Promise<ArrayBuffer | null> {
  const apiKey = process.env.VOICERSS_API_KEY;
  if (!apiKey) return null;
  const url = `https://api.voicerss.org/?key=${apiKey}&hl=ar-sa&src=${encodeURIComponent(text)}&c=MP3&f=22khz_16bit_mono&r=-1`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get("text");
  if (!text) return NextResponse.json({ error: "text required" }, { status: 400 });

  // Google Translate TTS limit is ~200 chars; truncate just in case
  const safeText = text.length > 195 ? text.slice(0, 195) : text;

  let buf = await fetchGoogleTTS(safeText);
  let source = "google";

  if (!buf) {
    buf = await fetchVoiceRSS(safeText);
    source = "voicerss";
  }

  if (!buf) {
    return NextResponse.json({ error: "tts_unavailable" }, { status: 503 });
  }

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "public, max-age=3600",
      "X-TTS-Source": source,
    },
  });
}
