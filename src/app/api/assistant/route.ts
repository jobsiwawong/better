import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildWorkspaceContext } from "@/lib/assistant-context";
import { db } from "@/lib/db";

/** Key from Settings (entered in-app) takes priority over the env var. */
async function resolveApiKey(): Promise<string | undefined> {
  const settings = await db.settings.findUnique({
    where: { id: "singleton" },
    select: { anthropicApiKey: true },
  });
  return settings?.anthropicApiKey?.trim() || process.env.ANTHROPIC_API_KEY?.trim() || undefined;
}

// Model toggle exposed in the UI. Both run at high effort with adaptive
// thinking; Opus is the deeper/more capable option, Sonnet the faster one.
const MODELS = {
  sonnet: "claude-sonnet-5",
  opus: "claude-opus-4-8",
} as const;
type ModelKey = keyof typeof MODELS;

const SYSTEM_PROMPT = `You are the built-in assistant of "Better", a personal chief-of-staff app. The user's full workspace (notes, meeting notes, tasks) is provided below. You help them synthesize across it: pull together notes on a theme or time period, summarize weeks, draft new notes or emails from existing material, find connections, and prepare export-ready documents.

Guidelines:
- Ground everything in the workspace data; never invent notes, tasks, dates, or people. If the workspace doesn't contain what's asked for, say so briefly.
- When asked to gather/compile material (e.g. "all notes about X from June"), organize it clearly with headers and include source note titles and dates so items are traceable.
- When drafting (emails, notes, summaries), produce a clean, ready-to-use draft in Markdown. For emails include a Subject line.
- Interpret time references against today's date given below.
- Be concise and well-structured. Use Markdown headings, bullet lists, and bold sparingly but effectively. The output may be exported as-is.`;

export async function POST(request: NextRequest) {
  const apiKey = await resolveApiKey();
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "No Anthropic API key set yet. Click the ✨ button in the top bar to add one.",
      },
      { status: 503 }
    );
  }

  let prompt: string;
  let modelKey: ModelKey;
  try {
    const body = await request.json();
    prompt = String(body.prompt ?? "").trim();
    modelKey = body.model === "opus" ? "opus" : "sonnet";
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  const workspace = await buildWorkspaceContext();
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const client = new Anthropic({ apiKey });
  const stream = client.messages.stream({
    model: MODELS[modelKey],
    max_tokens: 64000,
    thinking: { type: "adaptive" },
    output_config: { effort: "high" },
    system: [
      { type: "text", text: SYSTEM_PROMPT },
      {
        type: "text",
        text: `Today is ${today}.\n\n<workspace>\n${workspace}\n</workspace>`,
      },
    ],
    messages: [{ role: "user", content: prompt }],
  });

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      stream.on("text", (delta) => {
        controller.enqueue(encoder.encode(delta));
      });
      stream.on("error", (err) => {
        controller.enqueue(
          encoder.encode(`\n\n[Assistant error: ${err.message ?? "request failed"}]`)
        );
        controller.close();
      });
      stream.on("end", () => controller.close());
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
