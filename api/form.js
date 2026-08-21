// Vercel serverless function — patient form intake (medical records request,
// injection consent, new patient intake). Sends via Resend if RESEND_API_KEY
// is set in the Vercel project's environment variables; otherwise logs to the
// function's runtime logs so nothing is silently lost while email delivery is
// being wired up.
//
// NOTE ON PHI: these forms collect protected health information (allergies,
// medical history, insurance IDs). Email is not a HIPAA-compliant transport
// on its own — pair RESEND_API_KEY with a Business Associate Agreement from
// the email provider, or route submissions to a HIPAA-compliant intake/EHR
// system instead, before relying on this in production.

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

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

  const body = req.body || {};
  const formType = String(body.form_type || "");
  const label = FORM_LABELS[formType];

  if (!label) {
    return res.status(400).send("Unknown form type.");
  }

  const rows = Object.entries(body)
    .filter(([key]) => key !== "form_type")
    .map(([key, value]) => {
      const v = Array.isArray(value) ? value.join(", ") : String(value ?? "");
      return `<tr><td style="padding:4px 10px 4px 0;color:#5f5648;white-space:nowrap;vertical-align:top">${escapeHtml(key)}</td><td style="padding:4px 0">${escapeHtml(v).replace(/\n/g, "<br>")}</td></tr>`;
    })
    .join("");

  const html = `<h2>New submission — ${escapeHtml(label)}</h2><table>${rows}</table>`;

  const apiKey = process.env.RESEND_API_KEY;
  const notifyTo = process.env.LEAD_NOTIFY_EMAIL || "info@elitesportsmed.org";
  const replyTo = String(body.email || body.Email || "") || undefined;

  if (apiKey) {
    try {
      await fetch("https://api.resend.com/emails", {
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
    } catch (err) {
      console.error("Resend delivery failed", err);
    }
  } else {
    console.log(`FORM SUBMISSION (email not yet configured — set RESEND_API_KEY): ${label}`, body);
  }

  res.writeHead(302, { Location: THANK_YOU[formType] || "/thank-you/" });
  res.end();
}
