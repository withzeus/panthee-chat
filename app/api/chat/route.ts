import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60; // 32B-model generations are slow; raise on a Vercel plan that allows it

// Keeps the backend URL/token server-side only -- never shipped to the browser.
const BACKEND_API_URL = process.env.BACKEND_API_URL;
const BACKEND_API_TOKEN = process.env.BACKEND_API_TOKEN;

export async function POST(req: NextRequest) {
  if (!BACKEND_API_URL) {
    return NextResponse.json({ error: "BACKEND_API_URL is not configured" }, { status: 500 });
  }

  const body = await req.json();
  const { messages, max_tokens } = body ?? {};
  if (!Array.isArray(messages)) {
    return NextResponse.json({ error: "messages must be an array" }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${BACKEND_API_URL.replace(/\/$/, "")}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(BACKEND_API_TOKEN ? { Authorization: `Bearer ${BACKEND_API_TOKEN}` } : {}),
      },
      body: JSON.stringify({ messages, max_tokens: max_tokens ?? 1024 }),
      signal: AbortSignal.timeout(55_000),
    });
  } catch (err) {
    return NextResponse.json({ error: `backend unreachable: ${String(err)}` }, { status: 502 });
  }

  const text = await upstream.text();
  if (!upstream.ok) {
    return NextResponse.json({ error: text || upstream.statusText }, { status: upstream.status });
  }

  return new NextResponse(text, {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
