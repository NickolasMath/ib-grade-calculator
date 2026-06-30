const OPENAI_API_URL = "https://api.openai.com/v1/responses";

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  if (req.body && typeof req.body === "object") {
    return Promise.resolve(req.body);
  }
  if (typeof req.body === "string") {
    return Promise.resolve(JSON.parse(req.body || "{}"));
  }
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function buildPrompt(profile) {
  return `
You are an IB university admissions planning assistant.

Use the student's IB profile and preferences to produce a cautious first-pass university application strategy.

Rules:
- Do not guarantee admission.
- Do not invent exact university entry requirements.
- If you mention university examples, label them as examples to verify on official websites.
- Prioritize Reach / Target / Safety tiers, academic fit, subject fit, score-improvement advice, and next steps.
- Keep the answer practical and concise.
- Use English.

Student profile:
${JSON.stringify(profile, null, 2)}

Return this structure:
1. Profile snapshot
2. Main strengths and risks
3. Reach / Target / Safety strategy
4. Score and subject improvement priorities
5. Application preparation checklist
6. Verification disclaimer
`;
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    return res.end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return sendJson(res, 500, {
      error: "OPENAI_API_KEY is not configured on the server.",
    });
  }

  try {
    const profile = await readBody(req);
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        input: buildPrompt(profile),
        temperature: 0.3,
        max_output_tokens: 1200,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return sendJson(res, response.status, {
        error: data.error?.message || "OpenAI request failed.",
      });
    }

    const guidance =
      data.output_text ||
      data.output
        ?.flatMap((item) => item.content || [])
        .map((content) => content.text)
        .filter(Boolean)
        .join("\n\n") ||
      "";

    return sendJson(res, 200, { guidance });
  } catch (error) {
    return sendJson(res, 500, {
      error: error.message || "AI advisor failed.",
    });
  }
};
