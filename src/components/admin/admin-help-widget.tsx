"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";

type ChatMessage = { role: "user" | "assistant"; content: string };

const SCREENSHOT_MARKER = /^\[\[screenshot:([a-z0-9-]+)\]\]$/;
const LINK_PATTERN = /\[([^\]]+)\]\((\/admin[a-z0-9/-]*)\)/g;
// Safety net: the model is instructed not to use markdown emphasis, but strip it if it slips
// through anyway — this chat has no bold rendering, so raw ** or __ would otherwise leak to the user.
const STRAY_EMPHASIS_PATTERN = /\*\*(.+?)\*\*|__(.+?)__/g;

export function AdminHelpWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

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
        body: JSON.stringify({ messages: nextMessages, currentPath: pathname })
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
                {message.role === "assistant" ? renderAssistantContent(message.content) : message.content}
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

/** Renders an assistant reply: [[screenshot:key]] markers become inline reference images, [text](/admin/path) becomes a real clickable link, everything else is plain text. */
function renderAssistantContent(content: string): ReactNode {
  return content.split("\n").map((line, lineIndex) => {
    const screenshotMatch = SCREENSHOT_MARKER.exec(line.trim());
    if (screenshotMatch) {
      const key = screenshotMatch[1];
      return (
        <span className="admin-help-screenshot" key={lineIndex}>
          <Image alt="" height={168} src={`/admin-help/${key}.png`} width={300} />
        </span>
      );
    }

    return (
      <span key={lineIndex}>
        {renderLineWithLinks(line)}
        {lineIndex < content.split("\n").length - 1 ? <br /> : null}
      </span>
    );
  });
}

function renderLineWithLinks(rawLine: string): ReactNode[] {
  const line = rawLine.replace(STRAY_EMPHASIS_PATTERN, (_match, double, single) => double ?? single);
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  LINK_PATTERN.lastIndex = 0;

  while ((match = LINK_PATTERN.exec(line))) {
    if (match.index > lastIndex) {
      parts.push(line.slice(lastIndex, match.index));
    }

    const [, label, href] = match;
    parts.push(
      <Link className="admin-help-link" href={href as Route} key={match.index}>
        {label}
      </Link>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < line.length) {
    parts.push(line.slice(lastIndex));
  }

  return parts;
}
