import { env } from "@/env";

export interface ChatSuggestionOptions {
  lastMessage: string;
  role?: "rider" | "driver" | "user" | "partner";
}

const DEFAULT_RIDER_FALLBACKS = [
  "Main gate par hi khada hu",
  "2 minute me aa raha hu",
  "Location map par verify karein",
  "Bhaiya aap kahan pahunche?",
  "Bas 1 minute me bahar aa raha hu",
  "Thank you, ride shuru karein",
];

const DEFAULT_DRIVER_FALLBACKS = [
  "Main 2 minute me pahunch raha hu",
  "Gate ke paas aa gaya hu",
  "Sir OTP share kijiye please",
  "Pickup location par wait kar raha hu",
  "Thoda traffic hai, bas 1 min",
  "Main location par khada hu",
];

/**
 * Extracts and parses JSON from AI model response.
 * Handles markdown code fences and raw string formats.
 */
function extractSuggestionsFromJson(content: string): string[] | null {
  try {
    // 1. Direct JSON parse attempt
    const parsed = JSON.parse(content);
    if (parsed && Array.isArray(parsed.suggestions) && parsed.suggestions.length > 0) {
      return parsed.suggestions.slice(0, 6);
    }
  } catch {
    // 2. Extract JSON block if wrapped in markdown ```json ... ```
    const jsonMatch = content.match(/\{[\s\S]*"suggestions"[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed && Array.isArray(parsed.suggestions) && parsed.suggestions.length > 0) {
          return parsed.suggestions.slice(0, 6);
        }
      } catch {
        // continue
      }
    }
  }
  return null;
}

/**
 * Calls APInex AI Gateway (DeepSeek Flash Free) to generate smart quick replies
 * for active rides in SafarX.
 */
export async function generateChatSuggestions({
  lastMessage,
  role = "rider",
}: ChatSuggestionOptions): Promise<string[]> {
  const isDriverRole = role === "driver" || role === "partner";
  const defaultFallbacks = isDriverRole
    ? DEFAULT_DRIVER_FALLBACKS
    : DEFAULT_RIDER_FALLBACKS;

  const apiKey = env.APINEX_API_KEY;
  const baseUrl = env.APINEX_BASE_URL || "https://api.apinex.bond/v1";
  const model = env.APINEX_MODEL || "free/deepseek-v4.1-flash";

  if (!apiKey) {
    console.warn("[APInex] Missing APINEX_API_KEY in .env, using contextual fallbacks");
    return defaultFallbacks;
  }

  const systemPrompt =
    "You are a ride-hailing chat assistant for SafarX. Return valid JSON only with key 'suggestions' as an array of 6 short strings in natural Hinglish/English.";

  const userPrompt = `Role: ${isDriverRole ? "driver" : "passenger"}, Last message: "${lastMessage.trim()}". Suggest 6 quick replies in JSON format.`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 16000); // 16s timeout to allow DeepSeek reasoning to complete

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(
        `[APInex] API returned status ${response.status}: ${response.statusText}`
      );
      return defaultFallbacks;
    }

    const data = await response.json();
    const rawContent = data?.choices?.[0]?.message?.content || "";

    const suggestions = extractSuggestionsFromJson(rawContent);
    if (suggestions && suggestions.length > 0) {
      return suggestions;
    }

    console.warn("[APInex] Could not parse suggestions from response, using fallbacks:", rawContent);
    return defaultFallbacks;
  } catch (err: unknown) {
    const isAbort = err instanceof Error && err.name === "AbortError";
    console.warn(
      `[APInex] ${isAbort ? "Request timed out" : "Request failed"}, using smart fallbacks:`,
      err instanceof Error ? err.message : err
    );
    return defaultFallbacks;
  }
}
