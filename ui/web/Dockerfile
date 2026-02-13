FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# NEXT_PUBLIC_ vars must be available at build time for Next.js to inline them
ENV NEXT_PUBLIC_SOCKET_URL=http://localhost:5000

RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
