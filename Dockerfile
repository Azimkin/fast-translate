FROM oven/bun:1

WORKDIR /app

# Skip environment validation during build
ENV SKIP_ENV_VALIDATION=true
ENV OLLAMA_API_ENDPOINT=http://localhost:11434
ENV NODE_ENV=production

# Copy package files first for better caching
COPY package.json ./

# Install all dependencies (needed for build)
RUN bun install

# Copy source code
COPY . .

# Build the application
RUN bun run build

# Remove dev dependencies to reduce image size
RUN rm -rf node_modules && bun install --production

# Expose port
EXPOSE 4321

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD bun -e "fetch('http://localhost:4321/api/health').then(r => { if (!r.ok) process.exit(1); }).catch(() => process.exit(1))"

# Start the application
CMD ["bun", "run", "dist/server/entry.mjs"]
