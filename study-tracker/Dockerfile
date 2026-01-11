# Stage 1: Build React frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /build

# Copy frontend package files
COPY frontend/package*.json ./frontend/

# Install frontend dependencies
WORKDIR /build/frontend
RUN rm -f package-lock.json
RUN npm install

# Copy frontend source
COPY frontend/ ./

# Build the React app (outputs to frontend/dist)
RUN npm run build

# Stage 2: Node.js Backend
FROM node:20-alpine

WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./backend/

# Install backend dependencies
WORKDIR /app/backend
RUN npm ci --only=production

# Copy backend source code
COPY backend/ ./

# Copy built frontend from Stage 1 to where server.js expects it
# server.js looks for '../frontend/dist' relative to itself in /app/backend
# So we copy to /app/frontend/dist
COPY --from=frontend-builder /build/frontend/dist ../frontend/dist

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Run the backend
CMD ["node", "server.js"]
