# Real-Time Multi-Party Video Calling System

A professional-grade, microservices-based video conferencing platform built with **Next.js**, **Mediasoup (SFU)**, and **Socket.io**. This project demonstrates a scalable architecture for handling high-quality, low-latency media streams with production-grade observability.

---

## Architecture Overview

The system is built on a distributed microservices model to ensure scalability and separation of concerns.

### 1. High-Level System Architecture (gRPC Powered)
This diagram shows how external traffic is routed through the Nginx gateway and how internal services communicate via **gRPC**.

```mermaid
graph TD
    User((User/Browser))
    Nginx[Nginx Gateway :80]
    UI[Next.js UI :3000]
    Gateway[API Gateway :4000]
    Signaling[Signaling Service :5000]
    Media[Media Service SFU :6000]
    DB[(PostgreSQL)]
    Redis[(Redis Cache)]
    Consul[Consul Service Discovery]
    Prom[Prometheus/Grafana]

    User -->|HTTP/WS| Nginx
    Nginx -->|/| UI
    Nginx -->|/api| Gateway
    Gateway -->|Forward| Signaling
    Gateway -->|Forward| Media
    
    Signaling <-->|SQL| DB
    Signaling <-->|State| Redis
    Signaling <-->|gRPC :50051| Media
    
    Signaling & Media & Gateway -->|Register| Consul
    Prom -->|Scrape| Signaling & Media & Gateway
```

### 2. Internal Communication: REST vs gRPC
| Feature | Direct REST (Old) | gRPC (Current) |
|---------------|---------------|-----------|
| **Signaling ↔ Media** | HTTP POST (20-50ms) | gRPC (2-5ms) |
| **Serialization** | JSON (Slow/Bulky) | Protobuf (Fast/Compact) |
| **Type Safety** | Runtime only | Compile-time (Proto) |

### 3. Service Communication & Call Flow
```mermaid
sequenceDiagram
    participant C as Client (Browser)
    participant S as Signaling Service
    participant M as Media Service (SFU)
    participant DB as PostgreSQL

    C->>S: Join Room (Socket.io)
    S->>DB: Check/Create Room
    S->>M: gRPC: GetRouterCapabilities
    M-->>S: rtpCapabilities
    S-->>C: Room Joined + Capabilities

    Note over C,M: WebRTC Transport Negotiation
    C->>S: Create WebRtcTransport
    S->>M: gRPC: CreateTransport
    M-->>S: params
    S-->>C: params
    
    C->>M: DTLS/ICE Connection (UDP: 40000-40100)
    C->>S: Produce Media
    S->>M: gRPC: Produce
    M-->>S: producerId
    S-->>C: producerId
    S->>C: Notify other peers (newProducer)
```

---

## 🛠️ Advanced Features

### Observability Stack
The project includes a full monitoring and discovery suite:
- **Consul**: Automated service discovery and health checks.
- **Prometheus**: Real-time metrics collection from all microservices.
- **Grafana**: Pre-configured dashboards for monitoring system health and traffic.

### Ephemeral Logging System
- **Structured Logging**: A custom `BackendLogger` in the `common` library provides JSON-structured logs with timestamps and session tracking.
- **Named Volumes**: Logs are stored in a Docker Named Volume (`backend_logs`) that is automatically cleaned up with `docker compose down -v`.
- **Log Viewer**: Access all backend logs in real-time via the browser at:  
  **[http://localhost:9000](http://localhost:9000)**

###  Premium UI Overhaul
- **Modern Aesthetics**: Dark-themed UI with advanced glassmorphism and smooth animations.
- **Custom Design System**: Refined typography, standardized icon sets (`w-6 h-6`), and polished interaction states.
- **Real-time Chat**: Fully integrated dark-themed chat with private messaging support.

---

##  Development Progress

### **Completed Foundations (Phase 1 & 2)**
- [x] **gRPC Migration**: Internal service communication for low-latency negotiation.
- [x] **Microservices**: Separation of API Gateway, Signaling, and Media services.
- [x] **SFU Stability**: Fine-tuned Mediasoup worker configuration for multi-core scaling.
- [x] **Observability**: Consul, Prometheus, and Grafana integration.
- [x] **Structured Logging**: Centralized logging with browser-based access.
- [x] **Premium UI**: Complete overhaul of the frontend user experience.

### **Scaling to Millions (Phase 3)**
- [ ] **Multi-Instance Scale**: Distribute Mediasoup workers across multiple nodes.
- [ ] **Redis Pub/Sub**: Sync signaling states across different regions.
- [ ] **STUN/TURN Cluster**: Global bypass for restrictive firewalls.
- [ ] **JWT Auth**: Production-ready security for all endpoints.

---

## 📄 License
MIT
