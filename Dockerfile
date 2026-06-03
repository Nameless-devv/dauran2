FROM node:20-alpine AS builder

RUN npm install -g pnpm@9
WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY apps/desktop/package.json ./apps/desktop/package.json

RUN ELECTRON_SKIP_BINARY_DOWNLOAD=1 pnpm install --frozen-lockfile

COPY apps/backend ./apps/backend

RUN pnpm --filter backend build

FROM node:20-alpine

RUN npm install -g pnpm@9
WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY apps/desktop/package.json ./apps/desktop/package.json

RUN ELECTRON_SKIP_BINARY_DOWNLOAD=1 pnpm install --frozen-lockfile --prod --filter backend

COPY --from=builder /app/apps/backend/dist ./apps/backend/dist

EXPOSE 3000
CMD ["node", "apps/backend/dist/main"]
