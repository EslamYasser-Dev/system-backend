# Build stage
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

# Enable Corepack and install Yarn
RUN corepack enable && corepack prepare yarn@1.22.22 --activate

# Copy package files and install dependencies
COPY package*.json .yarnrc.yml ./
RUN yarn install --frozen-lockfile

# Copy source and build
COPY . .
RUN yarn build

# Production stage
FROM node:22-alpine

WORKDIR /usr/src/app

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy only necessary files from builder
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Set non-root user and permissions
USER appuser

# Expose port and run the app
EXPOSE 3000
CMD ["node", "dist/main.js"]
