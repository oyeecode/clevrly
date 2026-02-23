# WhatsApp Bot (Twilio webhook)

This is a small Express server that:

- Receives WhatsApp messages from **Twilio** at `POST /webhook/twilio`
- Responds with **TwiML** (so Twilio delivers the reply)

---

## 1) Setup

```bash
npm install
cp .env.example .env
```

Fill in `.env`:

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `BASE_URL` (important if you enable webhook validation)

---

## 2) Run locally

```bash
npm run dev
```

Expose your local server with a tunnel (like `ngrok`) and set Twilio’s webhook to:

`POST https://YOUR_PUBLIC_URL/webhook/twilio`

---

## 3) Deploy

Deploy this folder to any Node host (Render/Railway/Fly/Vercel, etc). After deployment:

- Set env vars on the host
- Set Twilio’s webhook to:
  - `POST https://YOUR_DEPLOYED_DOMAIN/webhook/twilio`

---

## 4) Customize replies

Edit `src/server.js` → `buildReply()` to match your flows:

- Collect lead details
- Provide packages
- Route to a human for closing

