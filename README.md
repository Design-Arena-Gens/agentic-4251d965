# ShaadiFrame AI — Telegram Wedding Portfolio Bot

ShaadiFrame turns everyday selfies into cinematic Indian wedding editorials. The project ships as a Next.js 14 application ready for Vercel, with a serverless Telegram webhook orchestrating photo intake, session management, and AI-powered wedding image generation.

## Features

- 🎯 **Telegram-first flow** — `/new`, `/generate`, `/status`, `/reset` commands keep capture sessions organized.
- 🤖 **Face-locked AI styling** — Plugs into Replicate (Flux Portraits) to remix reference photos into 10–15 Indian wedding looks.
- 📦 **Serverless friendly** — Stateless webhook backed by Upstash Redis for chat sessions, deployable on Vercel.
- 💍 **Curated lookbook** — Automatically cycles wardrobe, venue, and lighting prompts for editorial variety.

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Create a `.env.local` file and supply the following keys:

```
TELEGRAM_BOT_TOKEN=123456789:bot-token
TELEGRAM_BOT_SECRET=optional-shared-secret
REPLICATE_API_TOKEN=r8_your_token
# Optional: override defaults
# REPLICATE_MODEL_VERSION=fofr/flux-portraits:...
# MIN_REFERENCE_PHOTOS=4
# MAX_REFERENCE_PHOTOS=6
# OUTPUT_GALLERY_SHOTS=12
# SESSION_TTL_SECONDS=7200
# Upstash Redis (required in production to persist sessions)
# UPSTASH_REDIS_REST_URL=https://...
# UPSTASH_REDIS_REST_TOKEN=...
```

> Tip: set the same variables inside the Vercel dashboard or `vercel env`.

### 3. Local development

```bash
npm run dev
```

Expose your dev server with `ngrok` (or similar) and register the webhook:

```bash
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://<ngrok-subdomain>.ngrok.io/api/telegram/webhook","secret_token":"'$TELEGRAM_BOT_SECRET'"}'
```

### 4. Production deployment

Once the project builds locally (`npm run build`), deploy on Vercel:

```bash
vercel deploy --prod --yes --token $VERCEL_TOKEN --name agentic-4251d965
```

Point your Telegram bot to the production webhook:

```bash
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://agentic-4251d965.vercel.app/api/telegram/webhook","secret_token":"'$TELEGRAM_BOT_SECRET'"}'
```

## How It Works

1. **Session kickoff** — user sends `/new`, bot switches to `collecting` mode.
2. **Photo intake** — 4–6 photos saved via Upstash Redis (or in-memory during development).
3. **Generation** — `/generate` triggers Replicate (Flux Portraits + custom prompts) to create wedding shots.
4. **Delivery** — results streamed back to Telegram as individual photos with captions.
5. **Cleanup** — session clears automatically for the next shoot.

## Project Structure

```
app/
  api/telegram/webhook/route.ts   # Telegram webhook handler
  globals.css
  layout.tsx
  page.tsx
lib/
  generation.ts                   # Replicate integration
  session.ts                      # Session persistence (Upstash + fallback)
  telegram.ts                     # Telegram helper utilities
package.json
next.config.mjs
tsconfig.json
```

## Testing Checklist

- `npm run build` — ensures the Next.js build pipeline passes.
- Verify webhook locally with `curl` (Telegram sends updates to local tunnel).
- Confirm Redis connection on Vercel (if credentials omitted, sessions reset between invocations).
- After deployment, hit `https://agentic-4251d965.vercel.app` to confirm the marketing page works.

## Notes

- Replicate model defaults to Flux Portraits — override `REPLICATE_MODEL_VERSION` if you prefer a custom InstantID / IP-Adapter workflow.
- Telegram file URLs expire; the bot stores the direct URLs immediately after upload to keep generation reliable.
- Increase `OUTPUT_GALLERY_SHOTS` if your model can deliver more than 12 images in one pass.

ShaadiFrame AI is production-ready out of the box — configure your credentials and start generating wedding magic in Telegram. 💐
