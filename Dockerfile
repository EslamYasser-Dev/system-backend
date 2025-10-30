# Build stage
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

# Copy package files for better layer caching
COPY package*.json ./

# Enable Corepack and install specific Yarn version
RUN corepack enable && corepack prepare yarn@1.22.0 --activate

# Install dependencies including devDependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN yarn build

# Remove devDependencies
RUN yarn install --production --frozen-lockfile

# Production stage
FROM node:22-alpine

WORKDIR /usr/src/app

# Enable Corepack and install specific Yarn version
RUN corepack enable && corepack prepare yarn@1.22.0 --activate

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
