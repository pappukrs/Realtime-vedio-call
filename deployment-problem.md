
I’ll create a **clean production-grade README** you can directly copy into your repo.

---

# 🚀 Real-Time Video Calling System — Production Deployment Guide (GCP + Docker + Nginx + Mediasoup)

This document explains the **complete deployment journey**, issues faced, and solutions while deploying a microservices-based WebRTC video calling system on **Google Cloud VM** using **Docker Compose**, **Nginx reverse proxy**, and **SSL**.

This also serves as a troubleshooting guide and system design reference.

---

# 🧠 Deployment Architecture

## Infrastructure

* Google Cloud VM (Ubuntu)
* Docker + Docker Compose
* Microservices architecture
* Nginx reverse proxy
* Mediasoup SFU
* PostgreSQL + Redis
* Prometheus + Grafana monitoring
* Domain + SSL (Let's Encrypt)

---

# ⚡ Complete Deployment Journey (Issues + Solutions)

---

# 1️⃣ Docker Compose Not Working on GCP VM

## ❌ Problem

```
docker compose up -d --build
unknown flag
```

OR

```
docker-compose error: No module named distutils
```

### Root Cause

* Old Docker installation
* Python-based docker-compose incompatible with Ubuntu 24
* Missing docker compose plugin

---

## ✅ Solution

Install latest Docker + Compose plugin:

```bash
sudo apt remove docker-compose -y

sudo install -m 0755 -d /etc/apt/keyrings

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
sudo tee /etc/apt/keyrings/docker.asc > /dev/null

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
| sudo tee /etc/apt/sources.list.d/docker.list

sudo apt update

sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin -y
```

Then:

```bash
sudo systemctl start docker
docker compose up -d
```

---

# 2️⃣ Docker Daemon Not Running

## ❌ Problem

```
Cannot connect to Docker daemon
```

## ✅ Solution

```bash
sudo systemctl start docker
sudo systemctl enable docker
```

---

# 3️⃣ Frontend Calling Localhost in Production

## ❌ Problem

```
POST http://localhost:4000/api/rooms → connection refused
```

### Root Cause

Next.js frontend still used local URL.

---

## ✅ Solution

Use environment variables:

```yaml
NEXT_PUBLIC_API_URL=/api
```

Use nginx reverse proxy instead of direct port access.

---

# 4️⃣ Next.js Environment Variables Not Updating

## ❌ Problem

Frontend still using old values after change.

### Root Cause

Next.js reads `NEXT_PUBLIC_*` at **build time**, not runtime.

---

## ✅ Solution

Use build args in Dockerfile:

```dockerfile
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
```

Docker compose:

```yaml
build:
  args:
    NEXT_PUBLIC_API_URL=/api
```

Then rebuild:

```bash
docker compose build ui --no-cache
```

---

# 5️⃣ API Gateway Working but `/api` Not Working

## ❌ Problem

```
Cannot GET /api
```

### Root Cause

Nginx routing mismatch.

---

## ✅ Solution

Correct nginx routing:

```nginx
location /api {
    proxy_pass http://api-gateway:4000;
}
```

---

# 6️⃣ Mediasoup UDP Ports Not Accessible

## ❌ Problem

WebRTC connection failed.

### Root Cause

GCP firewall blocked UDP.

---

## ✅ Solution

Create firewall rule:

```
UDP: 40000–40100
Source: 0.0.0.0/0
```

---

# 7️⃣ Mediasoup External IP Issue

## ❌ Problem

Peers could not connect.

### Root Cause

Mediasoup announcing localhost.

---

## ✅ Solution

```yaml
MEDIASOUP_ANNOUNCED_IP=<VM_PUBLIC_IP>
MEDIASOUP_LISTEN_IP=0.0.0.0
```

---

# 8️⃣ Monitoring Services Not Accessible

## ❌ Problem

Prometheus / Grafana not opening.

### Root Cause

Ports not exposed or firewall blocked.

---

## ✅ Solution

Expose ports:

```
3001 → Grafana
9090 → Prometheus
9000 → Logs
```

Enable GCP firewall rules.

---

# 9️⃣ Mixed Content Error (HTTP vs HTTPS)

## ❌ Problem

```
Mixed Content: HTTPS page calling HTTP API
```

### Root Cause

Frontend called:

```
http://IP:4000
```

while site used HTTPS.

---

## ✅ Solution

Use reverse proxy:

```
NEXT_PUBLIC_API_URL=/api
```

Never call IP directly.

---

# 🔟 Socket.IO Not Connecting

## ❌ Problem

WebSocket connection failed.

---

## ✅ Solution

Use secure WebSocket:

```
NEXT_PUBLIC_SOCKET_URL=wss://domain.com
```

Nginx config:

```nginx
location /socket.io {
    proxy_pass http://signaling-service:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

---

# 1️⃣1️⃣ Browser Camera Error (`getUserMedia`)

## ❌ Problem

```
getUserMedia undefined
```

### Root Cause

Browser requires HTTPS for camera access.

---

## ✅ Solution

Enable SSL using Let's Encrypt.

---

# 1️⃣2️⃣ SSL Setup with Let's Encrypt

## Steps

```bash
sudo apt install certbot
sudo certbot certonly --standalone -d meet.domain.com
```

Mount certificates in nginx:

```yaml
- /etc/letsencrypt/live/domain/fullchain.pem:/etc/ssl/certs/fullchain.pem
- /etc/letsencrypt/live/domain/privkey.pem:/etc/ssl/certs/privkey.pem
```

---

# 1️⃣3️⃣ Domain → GCP VM Mapping

## Steps

Add DNS record:

```
Type: A
Name: meet
Value: VM_PUBLIC_IP
```

---

# 1️⃣4️⃣ Next.js TypeScript Build Error

## ❌ Problem

```
string | undefined not assignable to string
```

---

## ✅ Solution

```ts
const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL ?? "";
```

---

# 1️⃣5️⃣ Production Architecture Fix

## Final Production Flow

```
Browser
   ↓
HTTPS domain
   ↓
Nginx reverse proxy
   ↓
API / Socket / UI services
   ↓
Mediasoup SFU
```

---

# 🧠 System Design Learnings

* Reverse proxy pattern
* Microservices deployment
* Build vs runtime environment variables
* WebRTC networking
* Secure WebSockets
* Firewall configuration
* SSL termination
* Container orchestration
* Production architecture design

---

# 🎯 Final Production Stack

* Next.js frontend
* Node microservices
* Mediasoup SFU
* PostgreSQL + Redis
* Docker Compose orchestration
* Nginx gateway
* HTTPS domain
* GCP infrastructure
* Monitoring stack

---

# ⭐ Key Interview Talking Points

* Deploying microservices on cloud VM
* Handling WebRTC networking issues
* Reverse proxy architecture
* Environment variable injection strategies
* Secure communication (HTTPS + WSS)
* Debugging distributed systems
* Production container architecture

---

# 🚀 Final Result

Fully working production video conferencing system with:

* Real-time video calling
* Microservices architecture
* Monitoring stack
* Domain + SSL
* Scalable infrastructure

---


