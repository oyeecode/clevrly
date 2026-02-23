# Clevrly — Static Site + WhatsApp Bot Starter

This repo contains:

- **Static website**: `index.html`, `styles.css`, `script.js`, plus your assets in `websitedetails/`
- **WhatsApp chatbot (backend starter)**: `whatsapp-bot/` (deploy separately; static hosting can’t run WhatsApp webhooks)

---

## 1) Host the static website on GoDaddy (static hosting)

### Files to upload

Upload **everything in this folder**:

- `index.html`
- `styles.css`
- `script.js`
- `websitedetails/` (images + logo)

### GoDaddy notes

- Make sure `index.html` is in the **web root** (the folder GoDaddy serves as the site root).
- After upload, visit your domain and hard refresh.

---

## 2) Customize your details (important)

### Update WhatsApp + contact info

Edit `script.js`:

- `CONFIG.whatsappPhoneE164`: set your number (example: `+919876543210`)
- `CONFIG.contactEmailTo`: your email

Edit `index.html`:

- Email/phone in the Contact section

### Replace placeholder “results”

In `index.html`, update the “Work that moves the needle” cards to your real case studies.

---

## 3) Contact form options (static-friendly)

Right now the contact form uses `mailto:` (opens the visitor’s email client). If you want submissions to land in an inbox without relying on the user’s email app, use one of these:

- **Formspree**
- **Netlify Forms** (requires hosting on Netlify)
- **Cloudflare Pages + Workers**

If you tell me which one you prefer, I’ll wire it up.

---

## 4) WhatsApp chatbot (how it works)

WhatsApp chatbots need a **public webhook URL** (HTTPS). A pure static site can’t receive webhooks, so the bot lives in:

`whatsapp-bot/`

You deploy it to a small backend host (examples):

- Render
- Railway
- Fly.io
- Cloudflare Workers (different code shape)
- Vercel Functions (works)

---

## 5) Quick start — WhatsApp bot via Twilio (easiest)

1. Create a Twilio account and enable the WhatsApp Sandbox (or a WhatsApp-enabled number).
2. Deploy the `whatsapp-bot/` folder.
3. Set your Twilio webhook to:

`POST https://YOUR_DEPLOYED_DOMAIN/webhook/twilio`

4. Configure env vars (see `.env.example` in `whatsapp-bot/`).

---

## 6) Local run (bot)

```bash
cd whatsapp-bot
npm install
cp .env.example .env
npm run dev
```

Then use a tunneling tool (like `ngrok`) to expose your local port and set the Twilio webhook to that URL.

