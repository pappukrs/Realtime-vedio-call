FROM node:20-alpine

WORKDIR /app

# Build common package
COPY common/package*.json ./common/
COPY common/ ./common/
RUN cd common && npm install --legacy-peer-deps && npm run build

# Build api-gateway
COPY api-gateway/package*.json ./api-gateway/
RUN cd api-gateway && npm install --legacy-peer-deps
COPY api-gateway/ ./api-gateway/
RUN cd api-gateway && npm run build

WORKDIR /app/api-gateway
EXPOSE 4000
CMD ["npm", "start"]
