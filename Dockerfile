FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build
RUN npm run build

# Install lightweight static server
RUN npm install -g serve

# Cloud Run expects port 8080
ENV PORT=8080
EXPOSE 8080

# Serve the 'dist' folder
CMD ["serve", "-s", "dist", "-l", "8080"]
