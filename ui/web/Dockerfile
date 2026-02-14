FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# 👇 accept build arguments
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SOCKET_URL

# 👇 expose them to Next.js build
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL

RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
