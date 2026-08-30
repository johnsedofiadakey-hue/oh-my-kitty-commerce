# Cloud Run deploy — bypasses Firebase App Hosting's Next.js buildpack,
# which only supports Next.js 12-15 and fails on this project's Next 16.
# Built via `gcloud run deploy --source .`, which runs this Dockerfile
# through Cloud Build directly (no framework-detection buildpack involved).

FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* values are inlined into the client bundle at build time, so
# they must be present as build args here — these are public Firebase web
# config values (safe to commit; not secrets), matching apphosting.yaml.
ARG NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyATqFdRUcQQ80vhG7qgF22bCH6eHlXNEXY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ohmyk1tty.firebaseapp.com
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID=ohmyk1tty
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ohmyk1tty.firebasestorage.app
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=570285616938
ARG NEXT_PUBLIC_FIREBASE_APP_ID=1:570285616938:web:a9a1781c4c08814b61f853
ARG NEXT_PUBLIC_SITE_URL=https://ohmykittygh.com
ARG NEXT_PUBLIC_SITE_NAME="Oh My Kitty"
ARG NEXT_PUBLIC_USE_FIREBASE_EMULATORS=false
# Empty until pulled from Google Search Console / Bing Webmaster Tools —
# the layout omits the verification meta tag entirely while these are unset.
ARG NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION="xIVp48knuGbSkvYtDejhJ39WH_rZKm0H9U-J1cgKtC8"
ARG NEXT_PUBLIC_BING_SITE_VERIFICATION=""
ARG APP_ENV=production
ENV NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY \
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN \
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID \
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET \
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID \
    NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_SITE_NAME=$NEXT_PUBLIC_SITE_NAME \
    NEXT_PUBLIC_USE_FIREBASE_EMULATORS=$NEXT_PUBLIC_USE_FIREBASE_EMULATORS \
    NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=$NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION \
    NEXT_PUBLIC_BING_SITE_VERIFICATION=$NEXT_PUBLIC_BING_SITE_VERIFICATION \
    APP_ENV=$APP_ENV \
    NODE_ENV=production

RUN npm run build

FROM node:22-slim AS runner
WORKDIR /app
# These are inlined into the client bundle at build time above, but some
# server-side code (e.g. the Paystack callback URL builder) also reads them
# from process.env at request time — so the runtime container needs them
# set too, not just the build stage. APP_ENV in particular gates secure-
# cookie flags, Admin SDK init error handling, and disables POS's local-dev
# fake-actor fallback.
ENV NODE_ENV=production \
    APP_ENV=production \
    NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyATqFdRUcQQ80vhG7qgF22bCH6eHlXNEXY \
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ohmyk1tty.firebaseapp.com \
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=ohmyk1tty \
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ohmyk1tty.firebasestorage.app \
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=570285616938 \
    NEXT_PUBLIC_FIREBASE_APP_ID=1:570285616938:web:a9a1781c4c08814b61f853 \
    NEXT_PUBLIC_SITE_URL=https://ohmykittygh.com \
    NEXT_PUBLIC_SITE_NAME="Oh My Kitty" \
    NEXT_PUBLIC_USE_FIREBASE_EMULATORS=false
RUN groupadd --system nodejs && useradd --system --gid nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 8080
ENV PORT=8080 \
    HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
