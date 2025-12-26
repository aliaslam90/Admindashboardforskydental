# Use Node 20 Debian-based for development
FROM node:20-bullseye

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the source code
COPY . .

# Expose dev server port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]
