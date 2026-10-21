# Production Deployment & Operations Runbook

**Project:** Oderinde Stephen Client Portal  
**Target Date:** Target Release 2026-10-21  
**Architecture:** Single VPS / Managed Node + Static SPA + Managed PostgreSQL + S3 Object Storage  

---

## 1. Reverse Proxy Configuration

The portal requires reverse proxy routing for the frontend SPA (`apps/web`), the backend API (`apps/api`), and real-time Socket.IO WebSocket upgrades (`/socket.io/`).

### 1.1 Nginx Configuration Template (`/etc/nginx/sites-available/clientportal.conf`)

```nginx
# Upstream definition for NestJS API server
upstream portal_api {
    server 127.0.0.1:3000;
    keepalive 32;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name portal.oderindestephen.com api-portal.oderindestephen.com;
    return 301 https://$host$request_uri;
}

# 1. Frontend Web SPA
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name portal.oderindestephen.com;

    ssl_certificate /etc/letsencrypt/live/portal.oderindestephen.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/portal.oderindestephen.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # HSTS & Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    root /var/www/client-portal/apps/web/dist;
    index index.html;

    # Static assets caching
    location ~* \.(?:css|js|jpg|jpeg|gif|png|ico|cur|gz|svg|svgz|mp4|ogg|ogv|webm|htc|woff2|woff)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# 2. Backend API & Real-time WebSockets
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api-portal.oderindestephen.com;

    ssl_certificate /etc/letsencrypt/live/api-portal.oderindestephen.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api-portal.oderindestephen.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    client_max_body_size 500M; # Max deliverable/attachment upload limit per D-7

    # Socket.IO Real-Time WebSockets Upgrade
    location /socket.io/ {
        proxy_pass http://portal_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # Standard REST Endpoints
    location / {
        proxy_pass http://portal_api;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

---

## 2. Environment Variables Checklist

### 2.1 Backend API (`apps/api/.env`)
- `PORT`: `3000`
- `NODE_ENV`: `production`
- `DATABASE_URL`: Managed PostgreSQL connection string with SSL mode (`postgresql://...sslmode=require`)
- `CLERK_SECRET_KEY`: Production Clerk server secret key
- `CLERK_PUBLISHABLE_KEY`: Production Clerk publishable key
- `S3_ENDPOINT`: S3-compatible object storage endpoint
- `S3_REGION`: Storage region
- `S3_BUCKET`: Private uploads bucket name
- `S3_ACCESS_KEY_ID`: Storage access key
- `S3_SECRET_ACCESS_KEY`: Storage secret access key
- `VAPID_PUBLIC_KEY`: Browser Web Push public key
- `VAPID_PRIVATE_KEY`: Web Push private key
- `VAPID_SUBJECT`: Mailto or contact URL (`mailto:stephen@example.com`)
- `CALCOM_WEBHOOK_SECRET`: HMAC signature verification key for Cal.com webhook events

### 2.2 Frontend SPA (`apps/web/.env.production`)
- `VITE_CLERK_PUBLISHABLE_KEY`: Production Clerk publishable key
- `VITE_API_URL`: `https://api-portal.oderindestephen.com`
- `VITE_WS_URL`: `https://api-portal.oderindestephen.com`
- `VITE_CALCOM_USERNAME`: Cal.com booking slug
- `VITE_VAPID_PUBLIC_KEY`: Browser Web Push public key

---

## 3. Initial Owner Bootstrap Procedure

In accordance with Section 3.1 of `AGENTS.md`, initial Owner assignment is executed strictly via a controlled server-side command with verified identity, **never** via public sign-up or client input.

```bash
# On the production server:
npm run bootstrap:owner --workspace @os-portal/api -- --email="stephen@example.com" --name="Oderinde Stephen"
```

The script verifies:
1. The user exists in Clerk with verified identity and MFA enabled.
2. The user's role is set to `Owner` with `isOwner: true` in the local PostgreSQL database.
3. No other users can promote themselves or bypass role boundaries.

---

## 4. Rollback and Forward-Fix Procedures

### 4.1 Frontend Rollback
The frontend build is completely static. Rollback simply changes the symlink or redeploys the prior build artifact:
```bash
ln -sfn /var/www/client-portal/releases/build-previous /var/www/client-portal/apps/web/dist
sudo systemctl reload nginx
```

### 4.2 Backend Rollback
```bash
# Revert to previous PM2 / systemd container
pm2 revert os-portal-api
# Or via systemd
sudo systemctl restart os-portal-api-previous
```

### 4.3 Database Migration Rollback
Prisma migrations are forward-compatible. If an emergency rollback of a migration is necessary:
```bash
npm run db:migrate:resolve -- --rolled-back <migration_name> --schema=apps/api/prisma/schema.prisma
```
