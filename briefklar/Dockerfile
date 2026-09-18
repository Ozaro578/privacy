# syntax=docker/dockerfile:1
# Briefklar – ein Image für API + Web-App (die API liefert das Vite-Build aus).

# ---- Build-Stage -----------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app

# Nur Manifeste kopieren → Dependency-Layer wird gecacht
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci

# Quellen kopieren und alle Workspaces bauen (shared → api → web)
COPY packages ./packages
COPY apps ./apps
RUN npm run build

# Dev-Abhängigkeiten aus node_modules entfernen
RUN npm prune --omit=dev

# ---- Runtime-Stage ---------------------------------------------------------
FROM node:22-alpine AS runtime
ENV NODE_ENV=production \
    PORT=8787 \
    STATIC_DIR=/app/apps/web/dist \
    TRUST_PROXY=true
WORKDIR /app

COPY --from=build --chown=node:node /app/package.json /app/package-lock.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=build --chown=node:node /app/packages/shared/dist ./packages/shared/dist
COPY --from=build --chown=node:node /app/apps/api/package.json ./apps/api/package.json
COPY --from=build --chown=node:node /app/apps/api/dist ./apps/api/dist
COPY --from=build --chown=node:node /app/apps/web/dist ./apps/web/dist

USER node
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/health" || exit 1

CMD ["node", "apps/api/dist/server.js"]
