# Multi-stage Docker build for Twenty MCP Server
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files and source code first
COPY package*.json ./
COPY tsconfig*.json ./
COPY src/ ./src/

# Install ALL dependencies (including devDependencies needed for build)
# Use --ignore-scripts to prevent prepare script from running during install
RUN npm ci --ignore-scripts --silent

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS runtime

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install only production dependencies, skip scripts to avoid prepare hook
RUN npm ci --only=production --ignore-scripts --silent && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "process.exit(0)" || exit 1

# Start the application
CMD ["npm", "start"]
