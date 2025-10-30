# Build stage
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

# Copy package files for better layer caching
COPY package*.json ./

# Install dependencies including devDependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Remove devDependencies
RUN npm prune --production

# Production stage
FROM node:22-alpine

WORKDIR /usr/src/app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy package files and node_modules
COPY --from=builder /usr/src/app/package*.json ./
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


# Command to run the application using node instead of pnpm for better signal handling
CMD ["node", "dist/main.js"]
