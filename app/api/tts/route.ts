import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get("text");
  if (!text) return NextResponse.json({ error: "text required" }, { status: 400 });

  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const res = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: "ar-XA", name: "ar-XA-Wavenet-B" },
        audioConfig: { audioEncoding: "MP3", speakingRate: 0.85, pitch: 0 },
      }),
    }
  );

  if (!res.ok) return NextResponse.json({ error: "tts_failed" }, { status: 502 });

  const { audioContent } = await res.json();
  const buf = Buffer.from(audioContent, "base64");

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
