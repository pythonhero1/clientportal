# ==========================================
# Production Dockerfile for Oderinde Stephen Client Portal Web SPA
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy workspace package manifests
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN npm ci

# Copy web source and build
COPY apps/web ./apps/web
RUN npm run build --workspace=@os-portal/web

# ==========================================
# Static Nginx web server
# ==========================================
FROM nginx:alpine AS runner

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
