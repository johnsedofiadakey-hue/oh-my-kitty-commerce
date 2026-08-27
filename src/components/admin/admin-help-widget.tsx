"use client";

import { useRef, useState, type FormEvent } from "react";

type ChatMessage = { role: "user" | "assistant"; content: string };

export function AdminHelpWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = input.trim();
    if (!question || sending) {
      return;
    }

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: question }];
    setMessages(nextMessages);
    setInput("");
    setError("");
    setSending(true);

    try {
      const response = await fetch("/api/admin/help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages })
      });

      const body = (await response.json().catch(() => null)) as { reply?: string; message?: string } | null;
      if (!response.ok || !body?.reply) {
        throw new Error(body?.message ?? "Couldn't reach help right now.");
      }

      setMessages([...nextMessages, { role: "assistant", content: body.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't reach help right now.");
    } finally {
      setSending(false);
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
      });
    }
  }

  return (
    <div className="admin-help-widget">
      {open ? (
        <div className="admin-help-panel" role="dialog" aria-label="Admin help">
          <div className="admin-help-panel-header">
            <span>Ask for help</span>
            <button aria-label="Close help" onClick={() => setOpen(false)} type="button">
              ×
            </button>
          </div>
          <div className="admin-help-messages" ref={listRef}>
            {messages.length === 0 ? (
              <p className="admin-help-empty">
                Ask anything about using this admin — e.g. &ldquo;how do I refund an order?&rdquo;
              </p>
            ) : null}
            {messages.map((message, index) => (
              <div className={`admin-help-message ${message.role}`} key={index}>
                {message.content}
              </div>
            ))}
            {sending ? <div className="admin-help-message assistant admin-help-thinking">Thinking…</div> : null}
          </div>
          {error ? <p className="admin-help-error">{error}</p> : null}
          <form className="admin-help-form" onSubmit={handleSubmit}>
            <input
              disabled={sending}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Type a question…"
              value={input}
            />
            <button disabled={sending || !input.trim()} type="submit">
              Send
            </button>
          </form>
        </div>
      ) : null}
      <button
        aria-expanded={open}
        aria-label={open ? "Close help" : "Open help"}
        className="admin-help-trigger"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        {open ? "×" : "?"}
      </button>
    </div>
  );
}
