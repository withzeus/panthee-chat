"use client";

import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

type Role = "user" | "assistant";
type Message = { role: Role; content: string };

function splitThink(content: string): { think: string | null; answer: string } {
  // The chat template puts the opening <think>\n in the *prompt*, not the
  // completion, so generated text is "reasoning</think>answer" with no
  // opening tag -- only look for the closing one.
  const idx = content.indexOf("</think>");
  if (idx === -1) return { think: null, answer: content };
  return { think: content.slice(0, idx).trim(), answer: content.slice(idx + "</think>".length).trim() };
}

function Bubble({ role, content }: Message) {
  const { think, answer } = role === "assistant" ? splitThink(content) : { think: null, answer: content };
  return (
    <div className={`flex ${role === "user" ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[85%] flex flex-col gap-1.5">
        {think && (
          <details className="text-sm text-neutral-400 bg-transparent">
            <summary className="cursor-pointer select-none">reasoning</summary>
            <div className="mt-1 whitespace-pre-wrap opacity-80">{think}</div>
          </details>
        )}
        <div
          className={`rounded-2xl px-4 py-2.5 prose-chat ${
            role === "user" ? "bg-accent text-white" : "bg-bubble text-neutral-100"
          }`}
        >
          <ReactMarkdown>{answer}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setError(null);
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, max_tokens: 1024 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      const reply: string = data.choices[0].message.content;
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setBusy(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }

  return (
    <div className="mx-auto flex h-dvh max-w-3xl flex-col px-4">
      <header className="flex items-center justify-between py-4 border-b border-border">
        <h1 className="text-lg font-medium">Panthee</h1>
        <button
          onClick={() => {
            setMessages([]);
            setError(null);
          }}
          className="text-sm text-neutral-400 hover:text-neutral-200"
        >
          Reset
        </button>
      </header>

      <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-4">
        {messages.length === 0 && (
          <p className="text-neutral-500 text-sm mt-8 text-center">
            Say hello — Burmese and English both work.
          </p>
        )}
        {messages.map((m, i) => (
          <Bubble key={i} role={m.role} content={m.content} />
        ))}
        {busy && <p className="text-sm text-neutral-500 px-1">thinking…</p>}
        {error && <p className="text-sm text-red-400 px-1">{error}</p>}
        <div ref={bottomRef} />
      </div>

      <div className="py-4 border-t border-border">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder="Message Panthee..."
            className="flex-1 resize-none rounded-xl bg-surface border border-border px-3 py-2.5 outline-none focus:border-accent"
          />
          <button
            onClick={send}
            disabled={busy || !input.trim()}
            className="rounded-xl bg-accent px-4 py-2.5 text-white disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
