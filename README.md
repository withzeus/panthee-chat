# panthee-chat

ChatGPT/Claude-style web chat frontend for the fine-tuned model in
[not-mugi/panthee](https://github.com/not-mugi/panthee) — a Burmese-QLoRA'd
DeepSeek-R1-Distill-Qwen-32B-Uncensored running on a Vast.ai GPU instance.

Next.js 15 (App Router) + Tailwind. The browser never talks to the GPU
instance directly — `app/api/chat/route.ts` is a server-side proxy that holds
the backend URL and auth token, so nothing about the instance leaks to the
client.

## Architecture

```
browser --(HTTPS)--> Vercel (this app) --server-side fetch--> backend model API
                                                                (serve.py on the
                                                                 Vast.ai instance,
                                                                 behind a Cloudflare
                                                                 Tunnel for a stable
                                                                 HTTPS hostname)
```

A stable HTTPS hostname for the backend is required — Vercel serves this app
over HTTPS, and a browser page over HTTPS can only be proxied *server-side* to
plain HTTP/self-signed endpoints (the server route here does that fine), but
you still want the backend hostname to survive the GPU instance restarting
(its raw IP:port doesn't). That's what the Cloudflare Tunnel is for; see the
panthee repo's README for exposing `serve.py`.

## Local dev

```bash
npm install
cp .env.example .env.local   # fill in BACKEND_API_URL (+ BACKEND_API_TOKEN if needed)
npm run dev
```

## Deploy (Vercel)

1. Import this repo in Vercel.
2. Set the same two env vars (`BACKEND_API_URL`, `BACKEND_API_TOKEN`) in
   Project Settings → Environment Variables.
3. Deploy. Add a custom domain (e.g. `chat.mugi-tech.com`) under
   Project Settings → Domains — this works regardless of where mugi-tech.com's
   DNS is hosted, Vercel just needs one CNAME/A record at your registrar.

## Notes

- Generation on a 32B model is slow (multi-second to tens of seconds per
  reply). `maxDuration` is set to 60s in the API route — Vercel's Hobby plan
  caps function duration at 60s; if replies get cut off, either reduce
  `max_tokens` in `components/Chat.tsx` or move to a Vercel plan with a higher
  cap.
- The model is a reasoning model (DeepSeek-R1-distill) and may emit a leading
  `<think>...</think>` block; the UI collapses that into a "reasoning"
  disclosure and shows only the final answer by default.
- No conversation persistence yet (state lives in the browser tab only).
