require("dotenv").config();

async function testAiIntegration() {
  const apiKey = process.env.APINEX_API_KEY;
  if (!apiKey) {
    console.error("APINEX_API_KEY is not defined in environment");
    return;
  }
  const baseUrl = process.env.APINEX_BASE_URL || "https://api.apinex.bond/v1";
  const model = process.env.APINEX_MODEL || "free/deepseek-v4.1-flash";

  console.log("=== Testing SafarX AI Chat Suggestions ===");
  console.log("Target Model:", model);

  const testMessage = "Bhaiya main building number 4 ke paas khada hu";
  const isDriverRole = false;

  const systemPrompt = "You are a ride-hailing chat assistant for SafarX. Return valid JSON only with key 'suggestions' as an array of 6 short strings.";
  const userPrompt = `Role: ${isDriverRole ? "driver" : "rider"}, Last message: "${testMessage}". Suggest 6 quick replies in JSON format.`;

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
  });

  const data = await response.json();
  console.log("Status:", response.status);
  console.log("Data:", JSON.stringify(data, null, 2));
  const content = data?.choices?.[0]?.message?.content;
  console.log("Raw Output:", content);

  // Parsing test
  let suggestions = null;
  try {
    suggestions = JSON.parse(content)?.suggestions;
  } catch (e) {
    const jsonMatch = content.match(/\{[\s\S]*"suggestions"[\s\S]*\}/);
    if (jsonMatch) {
      suggestions = JSON.parse(jsonMatch[0])?.suggestions;
    }
  }

  console.log("Parsed Suggestions List:");
  console.table(suggestions);
}

testAiIntegration().catch(console.error);
