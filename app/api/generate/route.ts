import Anthropic from "@anthropic-ai/sdk";

import { getPlatform, type Platform } from "@/lib/platforms";
import type { GenerateRequest, GenerateResponse } from "@/lib/types";

// Route handlers are not cached by default; this one always runs at request time.
export const runtime = "nodejs";

const MODEL = "claude-opus-4-8";

export async function POST(request: Request): Promise<Response> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY is not set. Add it to .env.local and restart." },
      { status: 500 },
    );
  }

  let body: GenerateRequest;
  try {
    body = (await request.json()) as GenerateRequest;
  } catch {
    return Response.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const brief = typeof body.brief === "string" ? body.brief.trim() : "";
  const platformIds = Array.isArray(body.platforms) ? body.platforms : [];

  if (!brief) {
    return Response.json({ error: "A content brief is required." }, { status: 400 });
  }

  const selected = platformIds
    .map(getPlatform)
    .filter((p): p is Platform => Boolean(p));

  if (selected.length === 0) {
    return Response.json(
      { error: "Select at least one valid platform." },
      { status: 400 },
    );
  }

  const platformRules = selected
    .map((p) => `- ${p.label} (id: "${p.id}"): ${p.guideline}`)
    .join("\n");

  const system = `You are an expert content marketer for the "One Idea, Every Format" tool.
Given a single content brief, you adapt it into platform-tailored posts. Match the tone,
length, and formatting conventions of each requested platform exactly.

Platform requirements:
${platformRules}

Rules:
- Write only the publishable post copy in "content" — no labels, preamble, or explanation.
- Put hashtags ONLY in the "hashtags" field (space-separated, each starting with #).
  Do NOT include hashtags inside "content".
- For platforms where hashtags don't fit (e.g. LinkedIn), return an empty string for "hashtags".
- For X (Twitter), the combined length of "content" plus "hashtags" must stay within 280 characters.
- Keep the core message and key facts from the brief consistent across all platforms.
- Return exactly one entry per requested platform, using the exact platform id listed above.`;

  const client = new Anthropic();

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system,
      messages: [
        {
          role: "user",
          content: `Content brief:\n\n${brief}\n\nGenerate adapted posts for these platforms: ${selected
            .map((p) => p.id)
            .join(", ")}.`,
        },
      ],
      output_config: {
        format: {
          type: "json_schema",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["results"],
            properties: {
              results: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["platform", "content", "hashtags"],
                  properties: {
                    platform: { type: "string", enum: selected.map((p) => p.id) },
                    content: { type: "string" },
                    hashtags: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (message.stop_reason === "refusal") {
      return Response.json(
        { error: "The request was declined by the model's safety system." },
        { status: 422 },
      );
    }

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return Response.json(
        { error: "The model returned no content." },
        { status: 502 },
      );
    }

    const parsed = JSON.parse(textBlock.text) as GenerateResponse;
    return Response.json(parsed);
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      return Response.json(
        { error: `Anthropic API error: ${err.message}` },
        { status: err.status ?? 502 },
      );
    }
    return Response.json({ error: "Failed to generate content." }, { status: 500 });
  }
}
