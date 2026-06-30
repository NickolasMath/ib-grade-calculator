export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed." });
  }

  try {
    const body = request.body || {};
    const message = String(body.message || "").trim();
    const email = String(body.email || "").trim();
    const type = String(body.type || "General suggestion").trim();
    const page = String(body.page || "").trim();
    const submittedAt = String(body.submittedAt || new Date().toISOString()).trim();

    if (message.length < 8) {
      return response.status(400).json({ error: "Feedback message is too short." });
    }

    const feedback = {
      type,
      message,
      email: email || "Not provided",
      page,
      submittedAt,
      userAgent: request.headers["user-agent"] || "Unknown",
    };

    console.info("IB Grade Calculator feedback", feedback);

    if (process.env.FEEDBACK_WEBHOOK_URL) {
      await fetch(process.env.FEEDBACK_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(feedback),
      });
    }

    return response.status(200).json({ ok: true });
  } catch (error) {
    console.error("Feedback submission failed", error);
    return response.status(500).json({ error: "Feedback submission failed." });
  }
}
