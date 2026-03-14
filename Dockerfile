# Stage 1: Build React frontend from frontend-web
FROM node:20-slim AS frontend-builder

WORKDIR /build

# Copy frontend-web package files
COPY frontend-web/package*.json ./

# Install frontend dependencies
RUN npm install

# Copy frontend source
COPY frontend-web/ ./

# Copy design-system (at project root) to the path Vite alias expects: ../design-system
COPY design-system/ /design-system/

# Build the React app for production (outputs to dist)
RUN npm run build

# Stage 2: Node.js Backend
FROM node:20-slim

WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./backend/

# Install backend dependencies
WORKDIR /app/backend
RUN npm ci --only=production

# Copy backend source code
COPY backend/ ./

# Copy built frontend from Stage 1 to where server.js expects it
# server.js looks for '../frontend-web/dist' relative to itself in /app/backend
# So we copy to /app/frontend-web/dist
COPY --from=frontend-builder /build/dist ../frontend-web/dist

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Run the backend
CMD ["node", "server.js"]
