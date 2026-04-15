# ── Build stage ──────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Install ALL deps (including devDependencies needed for tsc)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source and compile
COPY . .
RUN pnpm run build

# ── Production stage ─────────────────────────────────────────
FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Install production deps only
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# Copy compiled output from builder
COPY --from=builder /app/build ./build

EXPOSE 8000

CMD ["node", "build/main.js"]
