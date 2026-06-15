# syntax=docker/dockerfile:1

# ---------- etapa 1: build (compila TypeScript) ----------
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
# tsc compila TODO src/ -> dist/ (incluye dist/scripts/*.js para los seeds)

# ---------- etapa 2: runtime (lo que corre en el servidor) ----------
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Solo dependencias de producción => imagen liviana
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copiamos el JavaScript ya compilado de la etapa 1
COPY --from=build /app/dist ./dist

# Carpetas para el volumen de uploads y los logs de winston
RUN mkdir -p /app/uploads /app/logs

EXPOSE 5000
CMD ["node", "dist/server.js"]
