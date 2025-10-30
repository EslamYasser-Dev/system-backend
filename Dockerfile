# Build stage
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files for better layer caching
COPY package.json pnpm-lock.yaml* ./

# Install dependencies including devDependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Remove devDependencies
RUN pnpm prune --prod

# Production stage
FROM node:20-alpine

WORKDIR /usr/src/app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy package files
COPY --from=builder /usr/src/app/package.json ./
COPY --from=builder /usr/src/app/pnpm-lock.yaml* ./
COPY --from=builder /usr/src/app/node_modules ./node_modules

# Copy built files from builder
COPY --from=builder /usr/src/app/dist ./dist

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Set non-root user
USER appuser

# Expose the port the app runs on
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').request('http://localhost:3000/api/health', console.log).on('error', process.exit(1)).end()"

# Command to run the application using node instead of pnpm for better signal handling
CMD ["node", "dist/main.js"]
