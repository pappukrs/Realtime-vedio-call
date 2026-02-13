FROM node:20-alpine

WORKDIR /app

# Build common package
COPY common/package*.json ./common/
COPY common/ ./common/
RUN cd common && npm install --legacy-peer-deps && npm run build

# Build signaling-service
COPY signaling-service/package*.json ./signaling-service/
RUN cd signaling-service && npm install --legacy-peer-deps
COPY signaling-service/ ./signaling-service/
RUN cd signaling-service && npm run build

WORKDIR /app/signaling-service
EXPOSE 5000
CMD ["npm", "start"]
