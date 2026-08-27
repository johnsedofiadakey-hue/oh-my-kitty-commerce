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

/** What's actually on each admin page — lets the AI describe what she's looking at right now instead of speaking generically. */
const PAGE_CONTEXT: Record<string, string> = {
  "/admin": "the Dashboard — revenue/orders/POS-cash/low-stock summary cards, a Recent orders table, and a Needs attention list.",
  "/admin/products": "the Products page — a list of products; clicking one opens an edit drawer with fields including title, price, was-price (sale), category, shop position, and an image upload field.",
  "/admin/categories": "the Categories page — create/quick-edit categories, toggle active, upload a category photo.",
  "/admin/taxonomy": "the Taxonomy page — manages shared classification lists (product types, concerns, routines) that product forms pull from.",
  "/admin/content": "the Content & Media page — a 'Site content' section of editable fields (WhatsApp number, pickup location, SMS templates, shop status/message), and an 'Upload an image' section with a Media library list below it.",
  "/admin/orders": "the Orders page — a numbered 'Needs attention' queue (oldest first) with an inline status dropdown per row, and a collapsed 'Completed' section. Clicking a row opens full detail including refund/void.",
  "/admin/customers": "the Customers page — view/create/update customer records.",
  "/admin/promotions": "the Promotions page — create/edit discount codes: code, percent or fixed amount, date range, usage limit, product/category/channel restrictions, and a 'requires manager approval' toggle.",
  "/admin/inventory": "the Inventory page — a list of product variants; clicking one opens a drawer with a stock adjustment form and that variant's movement history.",
  "/admin/delivery": "the Delivery page (Owner only) — manage delivery zones and pricing.",
  "/admin/reports": "the Reports page — discount usage and top products by revenue.",
  "/admin/audit": "the Audit log page — a record of privileged actions with who did what and when.",
  "/admin/users": "the Users & roles page (Owner only) — add/deactivate staff, assign roles, toggle POS access, and a permission-checkbox editor for creating custom roles.",
  "/admin/settings": "the Settings page (Owner only) — store name, receipt footer, and a read-only list of recent POS shifts.",
  "/admin/account": "the My Account page — change your own password (current password, new password, confirm)."
};

/** Curated real screenshots the widget can show inline. Keep this list in sync with public/admin-help/*.png. */
const AVAILABLE_SCREENSHOTS: Record<string, string> = {
  "dashboard": "the Dashboard overview",
  "products-list": "the Products list",
  "products-edit-image-upload": "a product's edit drawer, showing the image upload field",
  "orders-queue": "the Orders 'Needs attention' queue with the inline status dropdown",
  "orders-refund-void": "an order's detail view with the refund/void controls",
  "promotions-create": "the promotion creation form",
  "content-shop-status": "the Shop status toggle on Content & Media",
  "users-role-editor": "the custom role permission editor on Users & roles"
};

let cachedStaticPrompt: string | null = null;

function buildStaticSystemPrompt() {
  if (cachedStaticPrompt) {
    return cachedStaticPrompt;
  }

  const knowledgeBasePath = join(process.cwd(), "docs", "ADMIN-HELP-KNOWLEDGE-BASE.md");
  const knowledgeBase = readFileSync(knowledgeBasePath, "utf-8");
  const screenshotList = Object.entries(AVAILABLE_SCREENSHOTS)
    .map(([key, description]) => `- ${key}: ${description}`)
    .join("\n");

  cachedStaticPrompt = [
    "You are a personal assistant built into the Oh My Kitty admin portal, sitting next to a novice staff member and walking her through using this specific admin panel. Talk like a patient, friendly human helper standing over her shoulder, not a generic support bot.",
    "",
    "Answer ONLY using the knowledge base below. It describes exactly how this admin portal works today — do not invent, assume, or describe features, buttons, or steps that aren't in it, even if they sound plausible for a typical e-commerce admin.",
    "",
    "If the knowledge base doesn't cover what's being asked, say clearly that you're not sure and suggest she ask an owner or manager — never guess at steps.",
    "",
    "How to answer:",
    "- If the request needs more than one action, number every step (1., 2., 3. ...) — one concrete action per step, in the order she should do them.",
    "- Describe what she should actually be looking at: name the button/field/section by its real label, and briefly say where on the page it tends to be (e.g. 'in the top-right', 'inside the edit drawer that opens').",
    "- If you're told what page she's currently on, ground your answer in that — don't repeat 'go to that page' if she's already there; describe what's in front of her right now.",
    "- Use plain, everyday language. Never assume she knows admin/e-commerce jargon.",
    "- When a step means going to a specific admin page, write it as a link in this exact form: [Page Name](/admin/path) — using only real paths from the knowledge base. This becomes a clickable link in her chat, so use it whenever it helps her get there in one tap. Example: '1. Open [Promotions](/admin/promotions) and click New code.'",
    "- When a picture of the real screen would genuinely help, and one of the screenshots below matches, insert a marker on its own line in this exact form: [[screenshot:key]] — using only a key from the list below. Only do this when it clearly matches; never invent a key.",
    "- Never use markdown emphasis like **text**, __text__, or *text* — this chat only renders plain text and the two special forms above. Write page names as plain words unless they're a clickable link in the exact form above.",
    "- Keep the whole answer focused and as short as it can be while still being clear — this is someone trying to get something done, not read a manual.",
    "",
    "Available screenshots:",
    screenshotList,
    "",
    "--- KNOWLEDGE BASE ---",
    knowledgeBase
  ].join("\n");

  return cachedStaticPrompt;
}

function buildSystemPrompt(currentPath?: string) {
  const staticPrompt = buildStaticSystemPrompt();
  if (!currentPath) {
    return staticPrompt;
  }

  const pageDescription = PAGE_CONTEXT[currentPath];
  if (!pageDescription) {
    return staticPrompt;
  }

  return `${staticPrompt}\n\n--- CURRENT SCREEN ---\nShe is currently on ${pageDescription}`;
}

/** Throws on any failure — callers should catch and show a plain fallback message, never a raw error, to the admin UI. */
export async function askAdminHelp(messages: HelpChatMessage[], currentPath?: string): Promise<string> {
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
      messages: [{ role: "system", content: buildSystemPrompt(currentPath) }, ...messages],
      temperature: 0.2,
      max_tokens: 700,
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
