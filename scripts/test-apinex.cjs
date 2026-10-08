async function testApinex() {
  const url = process.env.APINEX_BASE_URL ? `${process.env.APINEX_BASE_URL}/chat/completions` : "https://api.apinex.bond/v1/chat/completions";
  const apiKey = process.env.APINEX_API_KEY;
  if (!apiKey) {
    console.error("APINEX_API_KEY is not defined in environment");
    return;
  }
  const model = process.env.APINEX_MODEL || "free/deepseek-v4.1-flash";

  console.log("Calling APInex with model:", model);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "system",
            content: "You are a ride-hailing assistant. Return JSON only with key suggestions as an array of 6 short strings.",
          },
          {
            role: "user",
            content: "Role: rider, Last message: Main location par pahunch gaya hu",
          },
        ],
      }),
    });

    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

testApinex();
