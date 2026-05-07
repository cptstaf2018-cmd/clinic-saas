import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get("text");
  if (!text) return NextResponse.json({ error: "text required" }, { status: 400 });

  const apiKey = process.env.VOICERSS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const url = `https://api.voicerss.org/?key=${apiKey}&hl=ar-sa&src=${encodeURIComponent(text)}&c=MP3&f=48khz_16bit_stereo&r=0`;

  const res = await fetch(url);

  if (!res.ok) return NextResponse.json({ error: "tts_failed" }, { status: 502 });

  const buf = await res.arrayBuffer();

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
