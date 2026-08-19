// Vercel serverless function — appointment request intake.
// Sends via Resend if RESEND_API_KEY is set in the Vercel project's
// environment variables; otherwise logs to the function's runtime logs so
// nothing is silently lost while email delivery is being wired up.

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).send("Method not allowed");
  }

  const body = req.body || {};
  const firstName = String(body.first_name || "").slice(0, 100);
  const lastName = String(body.last_name || "").slice(0, 100);
  const phone = String(body.phone || "").slice(0, 40);
  const email = String(body.email || "").slice(0, 200);
  const location = String(body.location || "").slice(0, 100);
  const message = String(body.message || "").slice(0, 2000);

  if (!firstName || !lastName || !phone || !email) {
    return res.status(400).send("Missing required fields.");
  }

  const apiKey = process.env.RESEND_API_KEY;
  const notifyTo = process.env.LEAD_NOTIFY_EMAIL || "info@elitesportsmed.org";

  const html = `
    <h2>New appointment request</h2>
    <p><strong>Name:</strong> ${escapeHtml(firstName)} ${escapeHtml(lastName)}</p>
    <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Preferred location:</strong> ${escapeHtml(location)}</p>
    <p><strong>Message:</strong><br>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
  `;

  if (apiKey) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          from: "Elite Sports Medicine Website <website@elitesportsmed.org>",
          to: [notifyTo],
          reply_to: email,
          subject: `New appointment request — ${firstName} ${lastName}`,
          html,
        }),
      });
    } catch (err) {
      console.error("Resend delivery failed", err);
    }
  } else {
    console.log("LEAD (email not yet configured — set RESEND_API_KEY):", { firstName, lastName, phone, email, location, message });
  }

  res.writeHead(302, { Location: "/thank-you/" });
  res.end();
}
