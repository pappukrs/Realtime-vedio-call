# 🎯 Interview Preparation Guide: Distributed Video Calling Platform

This guide is designed to help you ace your interview by providing a deep dive into the architecture, technical decisions, and common questions related to this project.

---

## 🚀 1. Project Pitch (The "Tell Me About This Project" Answer)
"I built a **production-grade, distributed real-time video calling platform** designed for high scalability and low latency. It uses a **Microservices Architecture** with a specialized **SFU (Selective Forwarding Unit)** called Mediasoup to handle media streams. The system stands out because it replaces traditional JSON-over-HTTP internal communication with **gRPC**, reducing negotiation latency from ~50ms to <5ms. It also features a full observability stack (Consul, Prometheus, Grafana) and a custom structured logging system for real-time debugging."

---

## 🏗️ 2. Architecture Deep Dive

### High-Level Components
1.  **Nginx Gateway**: The entry point. Handles SSL termination and routes traffic to the UI or the API Gateway.
2.  **Next.js UI**: A premium, dark-themed frontend using **Tailwind CSS** and **Zustand**. It integrates with the Mediasoup client-side library.
3.  **API Gateway**: Acts as the single entry point for all backend services, handling routing and proxying WebSocket traffic.
4.  **Signaling Service**: The "brain." It manages room states, participant lists (stored in **Redis**), and persists room data in **PostgreSQL**. It orchestrates the WebRTC flow via gRPC.
5.  **Media Service (SFU)**: The "engine." Built with **Mediasoup**, it manages Workers, Routers, and Transports to route raw UDP media packets between participants with minimal overhead.

### Why Microservices?
-   **Scalability**: We can scale the Media Service (CPU intensive) independently from the Signaling Service (I/O intensive).
-   **Fault Tolerance**: If the Signaling service crashes, existing media streams on the SFU can (theoretically) continue briefly, or vice-versa.
-   **Separation of Concerns**: Signaling handles *logic*, Media handles *packets*.

---

## ⚡ 3. Technical Highlights

### Internal Communication: Why gRPC?
| Feature | REST / JSON | gRPC / Protobuf |
| :--- | :--- | :--- |
| **Latency** | High (50ms+) | Ultra-Low (<5ms) |
| **Payload Size** | Bulky Text | Compact Binary |
| **Type Safety** | Loose / Manual | Strict / Proto-generated |
| **Protocol** | HTTP/1.1 | HTTP/2 (Multiplexed) |

**Result**: Scaling the system to hundreds of concurrent rooms becomes feasible because the "handshake" between Signaling and Media is near-instant.

### Mediasoup SFU vs. MCU vs. P2P
-   **P2P (Mesh)**: Every user sends video to every other user. **Problem**: Bandwidth explodes ($N \times (N-1)$). Max ~4 users.
-   **MCU (Multipoint Control Unit)**: Server mixes all videos into one stream. **Problem**: Massive CPU cost for the server.
-   **SFU (Selective Forwarding Unit) [Our Choice]**: Server receives one stream from each user and forwards it to others. **Benefit**: Low CPU (no mixing), manageable bandwidth, supports 100+ participants.

---

## 🔄 4. The Workflow (Step-by-Step)

### Joining a Call
1.  **Client** joins via Socket.io to the **Signaling Service**.
2.  **Signaling Service** checks **Postgres** for room existence.
3.  **Signaling Service** makes a **gRPC** call (`GetRouterRtpCapabilities`) to the **Media Service**.
4.  **Media Service** responds with supported codecs/caps.
5.  **Signaling** sends these back to the **Client**.

### Publishing Video (Producer Flow)
1.  **Client** requests a Transport from **Signaling**.
2.  **Signaling** calls **gRPC** (`CreateWebRtcTransport`) on **Media Service**.
3.  **Media Service** creates a Mediasoup Transport and returns IP/Port/ICE credentials.
4.  **Client** establishes a direct **UDP (WebRTC)** connection to the **Media Service**.
5.  **Client** starts "Producing" media. **Signaling** notifies the rest of the room.

---

## 📊 5. Tech Stack Summary
| Category | Technology |
| :--- | :--- |
| **Frontend** | Next.js 14, Tailwind CSS, Zustand, Socket.io-client |
| **Backend** | Node.js, TypeScript |
| **Real-time Media** | Mediasoup (SFU) |
| **Internal RPC** | gRPC (Protocol Buffers) |
| **Signaling** | Socket.io |
| **Persistence** | PostgreSQL, Prisma ORM |
| **State/Caching** | Redis |
| **Observability** | Consul, Prometheus, Grafana |
| **Deployment** | Docker, Docker Compose |

---

## ❓ 6. Common Interview Questions & Answers

### Q1: How do you handle service discovery in this project?
"We use **Consul**. Every service registers itself on startup. The API Gateway and Signaling services can look up the healthy instances of the Media service dynamically, ensuring high availability."

### Q2: What is "Signaling" in WebRTC?
"WebRTC provides the P2P or client-to-server media path, but it doesn't specify *how* to find the other party. Signaling is the out-of-band mechanism (in our case, Socket.io) used to exchange SDP (Session Description Protocol) and ICE Candidates."

### Q3: How do you handle a scenario where a user has a restrictive firewall?
"Currently, we rely on ICE. For production, we would add **STUN/TURN** servers (like Coturn). TURN relays the media via TCP/UDP if a direct UDP connection is blocked by a firewall."

### Q4: Explain the difference between a Producer and a Consumer in your system.
"In Mediasoup, a **Producer** represents a media stream being *sent* by a client to the SFU (e.g., your camera). A **Consumer** represents a stream being *received* by a client *from* the SFU (e.g., someone else's camera)."

### Q5: How do you ensure the system is observable?
"We have a three-tier approach:
1.  **Metrics**: Prometheus scrapes `/metrics` endpoints from all services.
2.  **Dashboards**: Grafana visualizes load, connections, and SFU health.
3.  **Logging**: A custom `BackendLogger` writes JSON logs to a shared volume, which a dedicated Log Server displays via a browser UI."

### Q6: If the Media Service reaches 100% CPU, how does your architecture handle it?
"This is where the SFU worker-per-core model helps. Mediasoup runs on multiple workers. For scaling further, we could use a load balancer in front of multiple Media Service instances, with **Consul** tracking which instance has the most capacity."

### Q7: Why did you use Redis?
"Redis is used for ultra-fast, ephemeral room state. It stores which users are in which room and their current browser session IDs, allowing for quick lookups during signaling events without hitting the main database every second."

---

## 💡 Pro-Tips for the Interview
-   **Mention Latency**: Always talk about performance metrics. Using gRPC shows you care about the "milliseconds that matter."
-   **Docker Knowledge**: Be ready to explain your `docker-compose.yml` and how namespaced networking allows services to talk via `http://media-service:6000`.
-   **Mediasoup Specifics**: If they ask about Mediasoup, mention that it's a Node.js wrapper around a high-performance C++ core.
