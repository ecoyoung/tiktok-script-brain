# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: Production
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone Next.js server (includes lib/, run.js, report.js, core/, inputs/, knowledge/)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Create data directory for persistent storage
RUN mkdir -p /app/data/products \
    /app/data/outputs \
    /app/data/archives/high_performers/packages \
    /app/data/archives/high_performers/metadata \
    /app/data/reports \
    /app/data/.next_tmp && \
    chown -R nextjs:nodejs /app/data

# Replace data directories with symlinks to persistent volume
RUN rm -rf /app/products /app/outputs /app/archives /app/reports /app/.next_tmp && \
    ln -s /app/data/products /app/products && \
    ln -s /app/data/outputs /app/outputs && \
    ln -s /app/data/archives /app/archives && \
    ln -s /app/data/reports /app/reports && \
    ln -s /app/data/.next_tmp /app/.next_tmp && \
    chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
