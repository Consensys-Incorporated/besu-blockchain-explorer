# syntax=docker/dockerfile:1

# Official Node.js LTS binaries, copied onto Ubuntu below.
FROM node:24-trixie-slim AS node

# Runtime base: just the node binary. The upgrade picks up Ubuntu security fixes
# released since the base image was built.
FROM ubuntu:26.04 AS base
RUN apt-get update \
  && apt-get upgrade -y \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY --from=node /usr/local/bin/node /usr/local/bin/node
WORKDIR /app

# npm is only needed to build, so it stays out of the runtime image.
FROM base AS build
COPY --from=node /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -s ../lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
  && ln -s ../lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx

FROM build AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM build AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# BE_BASEPATH from .env.production is baked into the build.
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production \
  NEXT_TELEMETRY_DISABLED=1 \
  HOSTNAME=0.0.0.0 \
  PORT=25000
# The standalone output contains the server and only the node_modules it needs.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/next-logger.config.js /app/.env.production ./
USER ubuntu
EXPOSE 25000
CMD ["node", "server.js"]
