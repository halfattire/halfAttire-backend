# Use Node.js 18 with Alpine Linux
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the environment file
#COPY .env .env

# Copy application code
COPY . .

# Expose the port
EXPOSE 5000

# Default command
CMD ["npm", "start"]