# Fast Translate - Dockerfile
# Multi-stage build for production deployment

# ============================================
# Stage 1: Dependencies
# ============================================
FROM oven/bun:1 AS deps

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile --production=false

# ============================================
# Stage 2: Build
# ============================================
FROM oven/bun:1 AS build

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./

# Copy source code
COPY . .

# Build the application
RUN bun run build

# ============================================
# Stage 3: Production
# ============================================
FROM oven/bun:1-slim AS production

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy package files
COPY package.json ./

# Install only production dependencies
RUN bun install --frozen-lockfile --production

# Copy built application from build stage
COPY --from=build /app/dist ./dist

# Create non-root user for security
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --ingroup appgroup appuser

# Change ownership of app files
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose the port (Astro + Node adapter defaults to 4321, but we use PORT env)
EXPOSE 4321

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD bun -e "fetch('http://localhost:4321/api/health').then(r => { if (!r.ok) process.exit(1); }).catch(() => process.exit(1))"

# Start the application
# The Node standalone adapter creates an entry.mjs file in dist/server/
CMD ["bun", "run", "dist/server/entry.mjs"]
