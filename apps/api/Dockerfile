# ==========================================
# Production Dockerfile for Oderinde Stephen Client Portal API
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package manifests for workspace
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN npm ci

# Copy Prisma schema and generate client
COPY apps/api/prisma ./apps/api/prisma/
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma

# Copy API source and build
COPY apps/api ./apps/api
RUN npm run build --workspace=@os-portal/api

# ==========================================
# Runner stage
# ==========================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy node_modules and built dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/scripts ./apps/api/scripts

EXPOSE 3000

CMD ["node", "apps/api/dist/main.js"]
