import "dotenv/config";
import express from "express";
import twilio from "twilio";

const app = express();

// Twilio sends x-www-form-urlencoded by default
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const PORT = Number(process.env.PORT || 3000);
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

const required = (name) => {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
};

const TWILIO_ACCOUNT_SID = required("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = required("TWILIO_AUTH_TOKEN");
const TWILIO_VALIDATE_WEBHOOKS = String(process.env.TWILIO_VALIDATE_WEBHOOKS || "false") === "true";

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

app.get("/healthz", (_req, res) => res.json({ ok: true }));

function buildReply(textInRaw) {
  const textIn = String(textInRaw || "").trim();
  const lower = textIn.toLowerCase();

  if (!textIn) {
    return [
      "Hi! I’m Clevrly’s WhatsApp assistant.",
      "Reply with:",
      "1) Services",
      "2) Pricing",
      "3) Case studies",
      "4) Schedule a call",
    ].join("\n");
  }

  if (/(^|\b)(1|services?|help)(\b|$)/.test(lower)) {
    return [
      "Here’s what we can help with:",
      "- Strategy (offer, positioning, funnel)",
      "- Creative & design (ads, landing pages)",
      "- Performance marketing (Meta/Google, CRO, analytics)",
      "",
      "What are you trying to achieve this quarter?",
    ].join("\n");
  }

  if (/(^|\b)(2|pricing|cost|budget)(\b|$)/.test(lower)) {
    return [
      "Pricing depends on scope (channels + creative + landing pages).",
      "Share:",
      "- Your website",
      "- Monthly ad spend (range)",
      "- Goal (leads/sales/ROAS)",
      "",
      "And I’ll suggest the best package.",
    ].join("\n");
  }

  if (/(^|\b)(3|case|stud(y|ies)|results)(\b|$)/.test(lower)) {
    return [
      "We can share relevant examples once we know your business.",
      "What industry are you in and what’s your average order value (if ecom)?",
    ].join("\n");
  }

  if (/(^|\b)(4|schedule|call|meeting)(\b|$)/.test(lower)) {
    return [
      "Great—tell me:",
      "1) Your name",
      "2) Your timezone",
      "3) 2 preferred time slots",
      "",
      "And we’ll confirm a call.",
    ].join("\n");
  }

  if (/stop|unsubscribe|cancel/i.test(textIn)) {
    return "Understood. Reply START anytime to resume.";
  }

  return [
    "Got it.",
    "Quick questions so we can help:",
    "1) What do you sell?",
    "2) What’s your goal (leads/sales/ROAS)?",
    "3) What’s your monthly budget range?",
  ].join("\n");
}

function validateTwilioWebhook(req) {
  if (!TWILIO_VALIDATE_WEBHOOKS) return true;
  const signature = req.header("x-twilio-signature");
  if (!signature) return false;
  const url = new URL(req.originalUrl, BASE_URL).toString();
  return twilio.validateRequest(TWILIO_AUTH_TOKEN, signature, url, req.body);
}

app.post("/webhook/twilio", async (req, res) => {
  try {
    if (!validateTwilioWebhook(req)) {
      return res.status(403).send("Invalid signature");
    }

    const from = req.body.From; // e.g. "whatsapp:+9198..."
    const to = req.body.To; // your Twilio WhatsApp number
    const body = req.body.Body;

    const replyText = buildReply(body);

    // Respond with TwiML (recommended). Twilio will deliver it.
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message(replyText);
    res.type("text/xml").send(twiml.toString());

    // Optional: log minimal info
    console.log(JSON.stringify({ from, to, body }, null, 2));
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Optional: send outbound messages (for later)
app.post("/send", async (req, res) => {
  try {
    const { to, message } = req.body || {};
    if (!to || !message) return res.status(400).json({ error: "to and message required" });

    const from = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";
    const msg = await client.messages.create({
      from,
      to,
      body: String(message),
    });
    res.json({ sid: msg.sid });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed to send" });
  }
});

app.listen(PORT, () => {
  console.log(`WhatsApp bot listening on ${BASE_URL}`);
});

