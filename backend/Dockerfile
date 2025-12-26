# Development Dockerfile - Simple and clean
FROM node:20-alpine

WORKDIR /app

# Install dependencies first (for better caching)
COPY package*.json ./
RUN npm install

# Copy entrypoint script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Copy rest of the code
COPY . .

# Expose the port
EXPOSE 3003

# Use entrypoint script with sh to avoid permission issues
ENTRYPOINT ["sh", "docker-entrypoint.sh"]
