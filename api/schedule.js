// Vercel serverless function — appointment request intake.
// Sends via Resend when RESEND_API_KEY is set in the Vercel project's
// environment variables; when it is not, or when delivery fails, the
// submission is visibly refused with a 503 and nothing from the body is
// logged. A request is either delivered or the patient is told to call —
// it is never silently accepted, and the requester's contact details never
// go to the runtime logs.

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

  if (!apiKey) {
    console.error("Appointment request delivery unconfigured (set RESEND_API_KEY); refused a request.");
    return res.status(503).send(unavailablePage());
  }

  let delivered = false;
  try {
    const resend = await fetch("https://api.resend.com/emails", {
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
    delivered = resend.ok;
    if (!resend.ok) {
      console.error(`Resend rejected an appointment request: HTTP ${resend.status}`);
    }
  } catch (err) {
    console.error("Resend delivery failed for an appointment request:", err?.message || err);
  }

  if (!delivered) {
    return res.status(503).send(unavailablePage());
  }

  res.writeHead(302, { Location: "/thank-you/" });
  res.end();
}

function unavailablePage() {
  return `<!doctype html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>We couldn't send your request | ELITE Sports Medicine</title>
<link rel="stylesheet" href="/assets/css/v2.css"></head>
<body><main id="main"><section class="section"><div class="container container--reading">
<h1>We couldn't send your request</h1>
<p>Your appointment request was <strong>not</strong> received — please don't assume we have it. Our online request delivery is temporarily unavailable.</p>
<p>Call us at <a href="tel:+15612028886">561-202-8886</a> and our team will book you directly.</p>
<p><a class="btn btn--gold" href="/">Back to Home</a></p>
</div></section></main></body></html>`;
}
