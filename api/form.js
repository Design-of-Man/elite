// Vercel serverless function — patient form intake (medical records request,
// injection consent, new patient intake). Sends via Resend when RESEND_API_KEY
// is set in the Vercel project's environment variables; when it is not, the
// submission is visibly refused with a 503 and nothing from the body is
// logged. (An earlier revision of this comment described logging submissions
// to the runtime logs as a fallback — the code does not do that, and must
// not: these payloads carry PHI.)
//
// NOTE ON PHI: these forms collect protected health information (allergies,
// medical history, insurance IDs). Email is not a HIPAA-compliant transport
// on its own — pair RESEND_API_KEY with a Business Associate Agreement from
// the email provider, or route submissions to a HIPAA-compliant intake/EHR
// system instead, before relying on this in production.

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// Per-IP brake, matching the one on the chat endpoint. This route is public,
// unauthenticated and turns a POST into mail in the practice's inbox, so
// without it a single client can flood that inbox. Vercel may run several
// instances, so this is best-effort against casual abuse, not a guarantee.
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;
const hits = new Map();

function rateLimited(req) {
  const fwd = req.headers["x-forwarded-for"];
  const ip = (Array.isArray(fwd) ? fwd[0] : String(fwd || "")).split(",")[0].trim() || "unknown";
  const now = Date.now();
  for (const [key, stamps] of hits) {
    const live = stamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    if (live.length) hits.set(key, live);
    else hits.delete(key);
  }
  const recent = hits.get(ip) || [];
  if (recent.length >= RATE_LIMIT_MAX) return true;
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

// Bounds on what one submission may carry. Without these the handler walks
// every key of an arbitrary JSON body straight into an email, so the size of
// that email is whatever the sender chose.
const MAX_FIELDS = 80;
const MAX_KEY_LEN = 100;
const MAX_VALUE_LEN = 5000;

const FORM_LABELS = {
  records_request: "Medical records request",
  injection_consent: "Injection consent form",
  new_patient_intake: "New patient intake form",
};

const THANK_YOU = {
  records_request: "/thank-you/?form=records-request",
  injection_consent: "/thank-you/?form=injection-consent",
  new_patient_intake: "/thank-you/?form=intake",
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).send("Method not allowed");
  }

  if (rateLimited(req)) {
    res.setHeader("Retry-After", "60");
    return res.status(429).send("Too many submissions. Please wait a moment, or call 561-202-8886.");
  }

  const body = req.body || {};
  const formType = String(body.form_type || "");
  const label = FORM_LABELS[formType];

  if (!label) {
    return res.status(400).send("Unknown form type.");
  }

  const rows = Object.entries(body)
    .filter(([key]) => key !== "form_type")
    .slice(0, MAX_FIELDS)
    .map(([key, value]) => {
      key = key.slice(0, MAX_KEY_LEN);
      const raw = Array.isArray(value) ? value.join(", ") : String(value ?? "");
      const v = raw.slice(0, MAX_VALUE_LEN);
      return `<tr><td style="padding:4px 10px 4px 0;color:#5f5648;white-space:nowrap;vertical-align:top">${escapeHtml(key)}</td><td style="padding:4px 0">${escapeHtml(v).replace(/\n/g, "<br>")}</td></tr>`;
    })
    .join("");

  const html = `<h2>New submission — ${escapeHtml(label)}</h2><table>${rows}</table>`;

  const apiKey = process.env.RESEND_API_KEY;
  const notifyTo = process.env.LEAD_NOTIFY_EMAIL || "info@elitesportsmed.org";
  const replyTo = String(body.email || body.Email || "") || undefined;

  // These forms carry PHI, so a submission is either delivered or visibly
  // refused — never silently accepted. Nothing from the body is ever logged.
  if (!apiKey) {
    console.error(`Form delivery unconfigured (set RESEND_API_KEY); refused a ${label} submission.`);
    return res.status(503).send(unavailablePage(label));
  }

  let delivered = false;
  try {
    const resend = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        from: "Elite Sports Medicine Website <website@elitesportsmed.org>",
        to: [notifyTo],
        ...(replyTo ? { reply_to: replyTo } : {}),
        subject: `New submission — ${label}`,
        html,
      }),
    });
    delivered = resend.ok;
    if (!resend.ok) {
      console.error(`Resend rejected a ${label} submission: HTTP ${resend.status}`);
    }
  } catch (err) {
    console.error(`Resend delivery failed for a ${label} submission:`, err?.message || err);
  }

  if (!delivered) {
    return res.status(503).send(unavailablePage(label));
  }

  res.writeHead(302, { Location: THANK_YOU[formType] || "/thank-you/" });
  res.end();
}

function unavailablePage(label) {
  return `<!doctype html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>We couldn't submit your form | ELITE Sports Medicine</title>
<link rel="stylesheet" href="/assets/css/v2.css"></head>
<body><main id="main"><section class="section"><div class="container container--reading">
<h1>We couldn't submit your form</h1>
<p>Your ${escapeHtml(label.toLowerCase())} was <strong>not</strong> received — please don't assume we have it. Our online form delivery is temporarily unavailable.</p>
<p>Call us at <a href="tel:+15612028886">561-202-8886</a> and our team will take your information directly, or bring the completed form to your appointment.</p>
<p><a class="btn btn--gold" href="/">Back to Home</a></p>
</div></section></main></body></html>`;
}
