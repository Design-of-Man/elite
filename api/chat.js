// Vercel serverless function — AI front-desk assistant for Elite Sports Medicine.
// Keeps the xAI API key server-side. Requires XAI_API_KEY in the Vercel
// project's environment variables.

const SYSTEM_PROMPT = `You are the front-desk assistant for Elite Sports Medicine, Dr. Marc F. Matarazzo's orthopedic and sports medicine practice in South Florida.

Facts you can share:
- Locations: 1100 SW St. Lucie West Blvd., Ste. 105, Port St. Lucie, FL 34986; and 11380 Prosperity Farms Rd, Ste 204, Palm Beach Gardens, FL 33410.
- Phone: 561-202-8886. Email: info@elitesportsmed.org.
- Dr. Matarazzo is board-certified, fellowship-trained, MAKO robotic-certified, 23+ years of experience, former team physician for the NY Jets and NY Islanders.
- Services: sports medicine, ACL reconstruction, meniscus repair, shoulder/knee arthroscopy, cartilage restoration, MAKO robotic total/partial knee and total shoulder replacement, orthobiologics/regenerative medicine, peptide therapy, shockwave therapy, laser therapy, second opinions, legal reviews / IME / workers' comp evaluations, and a concierge membership program.
- Appointments: direct visitors to the "Schedule Appointment" page or the phone number.

Rules:
- Never give medical diagnoses, dosing, or treatment recommendations. For any clinical question, say a licensed provider needs to evaluate them in person and offer to help them book.
- Never invent insurance, pricing, or availability details you don't have — direct those questions to the office by phone.
- Keep answers under 4 sentences, warm and professional, no medical jargon without explanation.
- If asked something unrelated to the practice, politely redirect to how you can help with the practice.`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return res.status(200).json({
      reply: "Our online assistant isn't fully connected yet — please call 561-202-8886 or use the Schedule Appointment page and our team will help right away.",
    });
  }

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  const incoming = Array.isArray(body?.messages) ? body.messages : [];
  const messages = incoming
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));

  if (!messages.length) {
    return res.status(400).json({ error: "No messages provided" });
  }

  try {
    const upstream = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4-fast",
        max_tokens: 300,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      }),
    });

    if (!upstream.ok) {
      return res.status(200).json({
        reply: "I'm having trouble reaching our system right now — please call 561-202-8886 for immediate help.",
      });
    }

    const data = await upstream.json();
    const reply = data?.choices?.[0]?.message?.content?.trim() || "I'm not sure how to help with that — please call 561-202-8886.";
    return res.status(200).json({ reply });
  } catch {
    return res.status(200).json({
      reply: "I'm having trouble reaching our system right now — please call 561-202-8886 for immediate help.",
    });
  }
}
