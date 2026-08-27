import { readFileSync } from "node:fs";
import { join } from "node:path";
import { serverEnv } from "@/lib/env/server";

const NVIDIA_API_BASE = "https://integrate.api.nvidia.com/v1";
// Confirmed live on build.nvidia.com: free endpoint available (not deprecated,
// unlike the Llama instruct models, whose free endpoints have been retired),
// 65M API calls/month, built for chat/instruction-following/reasoning.
const MODEL = "nvidia/nemotron-3-super-120b-a12b";

export type HelpChatMessage = { role: "user" | "assistant"; content: string };

export function isAdminHelpConfigured() {
  return Boolean(serverEnv.NVIDIA_API_KEY);
}

let cachedSystemPrompt: string | null = null;

function buildSystemPrompt() {
  if (cachedSystemPrompt) {
    return cachedSystemPrompt;
  }

  const knowledgeBasePath = join(process.cwd(), "docs", "ADMIN-HELP-KNOWLEDGE-BASE.md");
  const knowledgeBase = readFileSync(knowledgeBasePath, "utf-8");

  cachedSystemPrompt = [
    "You are the help assistant built into the Oh My Kitty admin portal, answering questions from a signed-in staff member about how to use this specific admin panel.",
    "",
    "Answer ONLY using the knowledge base below. It describes exactly how this admin portal works today — do not invent, assume, or describe features, buttons, or steps that aren't in it, even if they sound plausible for a typical e-commerce admin.",
    "",
    "If the knowledge base doesn't cover what's being asked, say clearly that you're not sure and suggest they ask an owner or manager — never guess at steps.",
    "",
    "Keep answers short and direct: the actual steps, not padding. This is a busy staff member trying to get something done, not a chat companion.",
    "",
    "--- KNOWLEDGE BASE ---",
    knowledgeBase
  ].join("\n");

  return cachedSystemPrompt;
}

/** Throws on any failure — callers should catch and show a plain fallback message, never a raw error, to the admin UI. */
export async function askAdminHelp(messages: HelpChatMessage[]): Promise<string> {
  if (!serverEnv.NVIDIA_API_KEY) {
    throw new Error("NVIDIA_API_KEY is not configured.");
  }

  const response = await fetch(`${NVIDIA_API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serverEnv.NVIDIA_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "system", content: buildSystemPrompt() }, ...messages],
      temperature: 0.2,
      max_tokens: 500,
      // This model defaults to emitting visible chain-of-thought reasoning
      // before its actual answer, which burns most of the token budget on
      // a short response and adds latency for no benefit here — this is a
      // direct Q&A tool, not a task that needs visible reasoning.
      chat_template_kwargs: { enable_thinking: false }
    })
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`NVIDIA API request failed (${response.status}): ${body.slice(0, 300)}`);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const reply = data.choices?.[0]?.message?.content;
  if (!reply) {
    throw new Error("NVIDIA API returned no reply content.");
  }

  return reply;
}
