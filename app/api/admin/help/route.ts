import { NextResponse } from "next/server";
import { CommerceError } from "@/lib/commerce/errors";
import { getRequiredAdminActor } from "@/lib/auth/server";
import { askAdminHelp, isAdminHelpConfigured, type HelpChatMessage } from "@/lib/ai/nvidia-help";
import { checkRateLimit } from "@/lib/rate-limit";

const MAX_MESSAGES = 12;
const MAX_MESSAGE_LENGTH = 2000;

type HelpRequestBody = {
  messages?: unknown;
};

export async function POST(request: Request) {
  try {
    const actor = await getRequiredAdminActor();

    if (!checkRateLimit(`ai-help:${actor.uid}`, 15, 60_000)) {
      return NextResponse.json(
        { message: "Too many questions at once — wait a moment and try again." },
        { status: 429 }
      );
    }

    if (!isAdminHelpConfigured()) {
      return NextResponse.json({ message: "Help isn't set up yet — ask an owner." }, { status: 503 });
    }

    const body = (await request.json()) as HelpRequestBody;
    const messages = parseMessages(body.messages);

    const reply = await askAdminHelp(messages);
    return NextResponse.json({ reply });
  } catch (error) {
    if (error instanceof CommerceError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    // Never proxy the raw error (could be an NVIDIA API response body) to the client.
    console.error("Admin help request failed:", error);
    return NextResponse.json({ message: "Couldn't reach help right now. Try again shortly." }, { status: 500 });
  }
}

function parseMessages(input: unknown): HelpChatMessage[] {
  if (!Array.isArray(input)) {
    throw new CommerceError("VALIDATION_ERROR", "Missing conversation messages.");
  }

  const messages = input.slice(-MAX_MESSAGES).map((entry): HelpChatMessage => {
    if (
      typeof entry !== "object" ||
      entry === null ||
      !("role" in entry) ||
      !("content" in entry) ||
      (entry.role !== "user" && entry.role !== "assistant") ||
      typeof entry.content !== "string" ||
      !entry.content.trim()
    ) {
      throw new CommerceError("VALIDATION_ERROR", "Invalid message in conversation.");
    }

    return { role: entry.role, content: entry.content.slice(0, MAX_MESSAGE_LENGTH) };
  });

  if (messages.length === 0) {
    throw new CommerceError("VALIDATION_ERROR", "No question was provided.");
  }

  return messages;
}
