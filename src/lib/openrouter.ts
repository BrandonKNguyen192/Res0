// Photograph a paper menu and the venue's guest page builds itself.

export type ExtractedMenu = {
  sections: {
    name: string;
    items: { name: string; description?: string; price?: number }[];
  }[];
};

const PROMPT = `You are reading a photograph of a restaurant menu.
Extract it into JSON with this exact shape:
{"sections":[{"name":"...","items":[{"name":"...","description":"...","price":12.5}]}]}
Rules:
- "price" is a number in the menu's own currency, omit it if unreadable.
- Omit "description" if there is none.
- Preserve the menu's own section order and item order.
- Return ONLY the JSON object, no commentary.`;

export async function extractMenuFromImage(imageDataUrl: string): Promise<ExtractedMenu> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set — run `stripe projects env --pull`.");
  }
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL ?? "google/gemini-2.5-flash",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: PROMPT },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!response.ok) {
    throw new Error(`OpenRouter ${response.status}: ${await response.text()}`);
  }
  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenRouter returned no content");
  const jsonText = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const parsed = JSON.parse(jsonText) as ExtractedMenu;
  if (!Array.isArray(parsed.sections)) {
    throw new Error("OpenRouter response missing sections array");
  }
  return parsed;
}
