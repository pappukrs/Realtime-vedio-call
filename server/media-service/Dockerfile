FROM node:20-slim

# Install build dependencies for mediasoup
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    make \
    g++ \
    gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Build common package
COPY common/package*.json ./common/
COPY common/ ./common/
RUN cd common && npm install --legacy-peer-deps && npm run build

# Build media-service
COPY media-service/package*.json ./media-service/
RUN cd media-service && npm install --legacy-peer-deps
COPY media-service/ ./media-service/
RUN cd media-service && npm run build

WORKDIR /app/media-service
EXPOSE 6000
CMD ["npm", "start"]
