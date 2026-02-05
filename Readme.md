# 🎥 Real-Time Video Calling Platform

> **WhatsApp-style video calling system** built for scale, performance, and reliability.

[![WebRTC](https://img.shields.io/badge/WebRTC-Enabled-blue)](https://webrtc.org/)
[![Node.js](https://img.shields.io/badge/Node.js-v20-green)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🎯 Project Vision

Build a **production-ready, scalable video calling platform** that supports:

- **1-to-1 video calls** with crystal-clear quality
- **Group video calls** (up to 12 participants)
- **Global scale** supporting millions of concurrent users
- **Low latency** real-time communication worldwide
- **Enterprise-grade** reliability and security

**Think:** WhatsApp Video Calling meets Google Meet's infrastructure.

---

## 🏗️ System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│  Next.js Web App + Mobile (React Native - Future)              │
│  WebRTC APIs | mediasoup-client | Socket.IO Client             │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTPS/WSS
┌─────────────────────────────────────────────────────────────────┐
│                      LOAD BALANCING LAYER                       │
│           AWS ALB + Route53 (Geo-based Routing)                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      SIGNALING LAYER                            │
│  Node.js + Express + Socket.IO (Stateless)                     │
│  Handles: Room creation, ICE candidates, SDP exchange          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      MEDIA LAYER (SFU)                          │
│  mediasoup Servers (CPU-optimized EC2 instances)               │
│  Routes audio/video streams between participants               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      STATE MANAGEMENT                           │
│  Redis Cluster: Active rooms, participants, presence           │
│  PostgreSQL: User metadata, call logs, analytics               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      CONNECTIVITY LAYER                         │
│  TURN/STUN Servers (coturn) - NAT Traversal                   │
└─────────────────────────────────────────────────────────────────┘
```

### Architecture Principles

✅ **Media never touches application servers** - Direct peer-to-SFU connection  
✅ **Signaling servers are stateless** - Infinite horizontal scaling  
✅ **Rooms are region-locked** - Minimize cross-region latency  
✅ **No media stored in database** - PostgreSQL only for metadata  
✅ **SFU architecture for groups** - Users upload once, receive N streams  

---

## 🛠️ Technology Stack

### Frontend
```
- Next.js 14 (App Router)
- TypeScript
- WebRTC APIs (getUserMedia, RTCPeerConnection)
- mediasoup-client (SFU client)
- Socket.IO Client (signaling)
- Tailwind CSS + shadcn/ui
- Zustand (state management)
```

### Backend
```
- Node.js 20 LTS
- Express.js
- Socket.IO (WebSocket signaling)
- mediasoup (SFU media server)
- Redis Cluster (real-time state)
- PostgreSQL 15 (persistent data)
- JWT (authentication)
```

### DevOps & Infrastructure
```
- Docker & Docker Compose
- Kubernetes (AWS EKS)
- AWS EC2 (compute)
- AWS RDS (PostgreSQL)
- AWS ElastiCache (Redis)
- AWS ALB (load balancing)
- Route53 (DNS + geo-routing)
- coturn (TURN/STUN servers)
- Prometheus + Grafana (monitoring)
```

---

## 🚀 Core Features

### 📞 Video Calling Capabilities

| Feature | Status | Description |
|---------|--------|-------------|
| 1-to-1 Video Call | ✅ | Direct peer-to-peer video calls |
| Group Video Call | ✅ | Up to 12 participants (optimal) |
| Audio-Only Mode | ✅ | Fallback for low bandwidth |
| Camera Toggle | ✅ | Enable/disable video during call |
| Microphone Toggle | ✅ | Mute/unmute audio |
| Screen Sharing | 🔄 | Phase 2 |
| Call Recording | 🔄 | Phase 2 |

### ⚡ Performance Features

- **Adaptive Bitrate** - Automatically adjusts quality based on network
- **Simulcast** - Multiple quality streams for different network conditions
- **Audio Processing** - Echo cancellation, noise suppression
- **Low Latency** - <100ms in same region, <300ms globally
- **Efficient Bandwidth** - SFU ensures users upload only once

### 🔐 Security & Privacy

- **End-to-End Encryption** - DTLS-SRTP for media streams
- **Secure Signaling** - WSS (WebSocket Secure)
- **JWT Authentication** - Stateless, secure user sessions
- **Room Access Control** - Invite-only or public rooms
- **TURN over TLS** - Encrypted relay servers

### 🌍 Scalability Features

- **Multi-Region Deployment** - US-East, US-West, EU, Asia
- **Geo-Routing** - Users connect to nearest region
- **Horizontal Scaling** - Add servers without downtime
- **Auto-Scaling** - Kubernetes HPA based on CPU/memory
- **Connection Pooling** - Optimized database connections

---

## 📊 System Flow

### 1️⃣ User Initiates Call

```
User clicks "Start Call"
    ↓
Frontend generates unique room ID
    ↓
POST /api/rooms/create → Backend
    ↓
Backend stores room in Redis
    ↓
Returns room ID + WebSocket URL
```

### 2️⃣ WebRTC Negotiation

```
User connects to Socket.IO server
    ↓
Client requests SFU capabilities
    ↓
SFU returns RTP capabilities
    ↓
Client creates WebRTC Transport
    ↓
Exchanges ICE candidates via signaling
    ↓
DTLS handshake establishes secure connection
```

### 3️⃣ Media Streaming (Group Call)

```
Participant A produces video/audio
    ↓
Streams sent to SFU (mediasoup)
    ↓
SFU creates consumers for participants B, C, D
    ↓
Each participant receives streams from SFU
    ↓
Participant uploads 1 stream, receives N streams
```

### 4️⃣ Real-Time Synchronization

```
User joins/leaves room
    ↓
Event published to Redis Pub/Sub
    ↓
All connected signaling servers receive event
    ↓
Socket.IO broadcasts to room participants
    ↓
UI updates in real-time
```

---

## 📁 Project Structure

```
video-calling-platform/
│
├── apps/
│   ├── web/                      # Next.js frontend
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   ├── room/
│   │   │   │   └── [roomId]/
│   │   │   │       └── page.tsx  # Video call room
│   │   │   ├── api/
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── VideoGrid.tsx
│   │   │   ├── Controls.tsx
│   │   │   └── ParticipantTile.tsx
│   │   ├── hooks/
│   │   │   ├── useWebRTC.ts
│   │   │   ├── useMediasoup.ts
│   │   │   └── useSocket.ts
│   │   ├── lib/
│   │   │   ├── webrtc.ts
│   │   │   └── socket.ts
│   │   └── package.json
│   │
│   └── server/                   # Node.js backend
│       ├── src/
│       │   ├── api/
│       │   │   ├── routes/
│       │   │   │   ├── rooms.ts
│       │   │   │   └── users.ts
│       │   │   └── middleware/
│       │   ├── socket/
│       │   │   ├── handlers/
│       │   │   │   ├── room.handler.ts
│       │   │   │   ├── webrtc.handler.ts
│       │   │   │   └── media.handler.ts
│       │   │   └── socket.service.ts
│       │   ├── mediasoup/
│       │   │   ├── worker.ts
│       │   │   ├── router.ts
│       │   │   ├── transport.ts
│       │   │   └── producer.ts
│       │   ├── redis/
│       │   │   ├── client.ts
│       │   │   ├── pubsub.ts
│       │   │   └── room.repository.ts
│       │   ├── database/
│       │   │   ├── models/
│       │   │   ├── migrations/
│       │   │   └── pool.ts
│       │   ├── services/
│       │   │   ├── auth.service.ts
│       │   │   ├── room.service.ts
│       │   │   └── media.service.ts
│       │   ├── utils/
│       │   │   ├── logger.ts
│       │   │   └── config.ts
│       │   └── server.ts
│       ├── Dockerfile
│       └── package.json
│
├── packages/
│   ├── shared/                   # Shared types & utilities
│   │   ├── types/
│   │   │   ├── room.ts
│   │   │   ├── user.ts
│   │   │   └── webrtc.ts
│   │   └── constants/
│   │
│   └── config/                   # Shared configs
│       ├── eslint/
│       └── typescript/
│
├── infrastructure/
│   ├── docker/
│   │   ├── docker-compose.yml
│   │   └── nginx.conf
│   ├── kubernetes/
│   │   ├── namespaces/
│   │   ├── deployments/
│   │   │   ├── signaling.yaml
│   │   │   ├── sfu.yaml
│   │   │   └── redis.yaml
│   │   ├── services/
│   │   └── ingress/
│   ├── terraform/
│   │   ├── modules/
│   │   │   ├── vpc/
│   │   │   ├── eks/
│   │   │   └── rds/
│   │   └── main.tf
│   └── monitoring/
│       ├── prometheus.yml
│       └── grafana-dashboards/
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── DEPLOYMENT.md
│   ├── SCALING.md
│   └── diagrams/
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── cd.yml
│
├── README.md
├── package.json
└── turbo.json                    # Turborepo configuration
```

---

## 🗄️ Database Schema

### PostgreSQL Tables

```sql
-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Rooms Table
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255),
    created_by UUID REFERENCES users(id),
    region VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    max_participants INT DEFAULT 12,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Call Logs Table
CREATE TABLE call_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES rooms(id),
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP,
    duration_seconds INT,
    participant_count INT,
    region VARCHAR(50)
);

-- Participants Table
CREATE TABLE participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_log_id UUID REFERENCES call_logs(id),
    user_id UUID REFERENCES users(id),
    joined_at TIMESTAMP DEFAULT NOW(),
    left_at TIMESTAMP,
    audio_enabled BOOLEAN DEFAULT TRUE,
    video_enabled BOOLEAN DEFAULT TRUE
);

-- Indexes
CREATE INDEX idx_rooms_active ON rooms(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_call_logs_room ON call_logs(room_id);
CREATE INDEX idx_participants_call ON participants(call_log_id);
```

### Redis Data Structures

```
Active Rooms:
  Key: room:{roomId}
  Type: HASH
  Fields: {
    region: "us-east-1",
    sfuId: "sfu-01",
    participantCount: 3,
    createdAt: 1234567890
  }

Room Participants:
  Key: room:{roomId}:participants
  Type: SET
  Members: [userId1, userId2, userId3]

User Presence:
  Key: user:{userId}
  Type: HASH
  Fields: {
    socketId: "abc123",
    roomId: "room-xyz",
    status: "in-call"
  }

SFU Load Tracking:
  Key: sfu:{sfuId}:load
  Type: STRING
  Value: 45 (number of active participants)
```

---

## 🚀 Deployment Architecture

### Development Environment

```bash
# Docker Compose - All services locally
docker-compose up

Services:
- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- Redis: localhost:6379
- PostgreSQL: localhost:5432
- TURN Server: localhost:3478
```

### Production Environment (AWS)

```
Region: Multi-region (Primary: us-east-1)

Compute:
- EKS Cluster (Kubernetes)
  - Signaling Pods: 5 replicas (t3.medium)
  - SFU Pods: 3 replicas (c5.2xlarge - CPU optimized)
  - Auto-scaling: 3-20 pods based on load

Database:
- RDS PostgreSQL 15 (Multi-AZ)
  - Instance: db.r6g.large
  - Storage: 100GB SSD (auto-scaling)

Cache:
- ElastiCache Redis Cluster
  - 3 shards, 2 replicas each
  - Instance: cache.r6g.large

Load Balancing:
- Application Load Balancer (ALB)
- Route53 with geo-routing
- CloudFront (static assets)

Storage:
- S3 (recordings - future)
- EBS (persistent volumes)

Networking:
- VPC with public/private subnets
- NAT Gateways
- Security Groups
- NACLs
```

---

## 📈 Scaling Strategy

### Target: 1 Million Concurrent Users

| Component | Scaling Method | Capacity per Unit | Units Needed |
|-----------|----------------|-------------------|--------------|
| **Frontend** | CDN + Edge | Unlimited | N/A |
| **Signaling** | Horizontal (Stateless) | 10K connections | 100 pods |
| **SFU** | Horizontal | 100 participants | 10,000 pods |
| **Redis** | Cluster Mode | 250K ops/sec | 4 shards |
| **PostgreSQL** | Read Replicas | 10K queries/sec | 1 primary + 3 replicas |
| **TURN Servers** | Regional Pools | 1K users | 1,000 servers |

### Auto-Scaling Triggers

```yaml
Signaling Pods:
  CPU: > 70% → Scale up
  Memory: > 80% → Scale up
  Connections: > 8K → Scale up

SFU Pods:
  CPU: > 85% → Scale up (CPU-intensive)
  Active Rooms: > 50 → Scale up
  Bandwidth: > 800Mbps → Scale up

Redis:
  Memory: > 75% → Add shard
  Ops/sec: > 200K → Add shard
```

---

## 🔧 Configuration

### Environment Variables

```bash
# Backend (.env)
NODE_ENV=production
PORT=4000

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/videocall
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# mediasoup
MEDIASOUP_LISTEN_IP=0.0.0.0
MEDIASOUP_ANNOUNCED_IP=your-public-ip
MEDIASOUP_MIN_PORT=40000
MEDIASOUP_MAX_PORT=49999

# TURN/STUN
TURN_SERVER_URL=turn:turn.example.com:3478
TURN_USERNAME=user
TURN_PASSWORD=pass
STUN_SERVER_URL=stun:stun.example.com:3478

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx

# Monitoring
GRAFANA_URL=http://grafana.example.com
PROMETHEUS_URL=http://prometheus.example.com
```

---

## 🧪 Testing Strategy

### Unit Tests
- Service layer logic
- WebRTC helper functions
- Redis operations

### Integration Tests
- API endpoints
- Socket.IO events
- Database operations

### E2E Tests (Playwright)
- Join video call
- Enable/disable camera
- Mute/unmute microphone
- Leave call

### Load Tests (k6)
- 1,000 concurrent connections
- Room creation throughput
- SFU streaming capacity

```bash
# Run tests
npm run test              # Unit tests
npm run test:integration  # Integration tests
npm run test:e2e         # End-to-end tests
npm run test:load        # Load tests
```

---

## 📊 Monitoring & Observability

### Metrics (Prometheus)

```
- webrtc_active_connections
- sfu_cpu_usage
- sfu_bandwidth_mbps
- room_participant_count
- signaling_latency_ms
- redis_operations_per_sec
- database_query_time_ms
```

### Logs (ELK Stack)

```
- Structured JSON logging
- Request/response logs
- Error tracking
- Audit logs (join/leave events)
```

### Alerts

```
- SFU CPU > 90% for 5 minutes
- Signaling pod restarts > 3 in 10 minutes
- Redis memory > 85%
- Database connection pool exhausted
- Failed WebRTC connections > 5% of total
```

### Dashboards (Grafana)

- Real-time active calls
- Bandwidth usage per region
- Success rate of WebRTC connections
- Average call duration
- Infrastructure health

---

## 🔒 Security Considerations

### Network Security
- All traffic over HTTPS/WSS
- TURN servers with authentication
- Rate limiting on API endpoints
- DDoS protection (AWS Shield)

### Application Security
- Input validation & sanitization
- SQL injection prevention (parameterized queries)
- XSS protection (Content Security Policy)
- CORS configured properly

### Media Security
- DTLS-SRTP encryption (WebRTC default)
- Secure room ID generation (UUID v4)
- Token-based room access
- IP whitelisting for admin APIs

### Data Privacy
- No media recording without consent
- Minimal metadata collection
- GDPR compliant data handling
- Data retention policies

---

## 🚧 Known Limitations & Future Work

### Current Limitations
- Max 12 participants per room (optimal quality)
- No mobile app (web-only)
- No call recording feature
- No screen sharing (yet)

### Phase 2 Features
- [ ] Screen sharing support
- [ ] Call recording with S3 storage
- [ ] Active speaker detection
- [ ] Virtual backgrounds
- [ ] Noise cancellation (Krisp.ai)
- [ ] Mobile apps (React Native)
- [ ] Chat during calls
- [ ] Waiting room feature
- [ ] Admin dashboard

### Performance Optimizations
- [ ] Simulcast implementation
- [ ] VP9 codec support
- [ ] Bandwidth estimation improvements
- [ ] Reconnection logic enhancements

---

## 📚 Documentation

- [Architecture Deep Dive](docs/ARCHITECTURE.md)
- [API Reference](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Scaling Guide](docs/SCALING.md)
- [Contributing Guidelines](CONTRIBUTING.md)

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

```bash
# Setup development environment
git clone https://github.com/yourusername/video-calling-platform.git
cd video-calling-platform
npm install
docker-compose up -d
npm run dev
```

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file.

---

## 🙏 Acknowledgments

- **mediasoup** - Cutting-edge WebRTC SFU
- **Socket.IO** - Real-time bidirectional communication
- **Next.js Team** - Amazing React framework
- **WebRTC Community** - Open standards for real-time communication

---

## 📞 Support

- **Documentation**: [docs.example.com](https://docs.example.com)
- **Issues**: [GitHub Issues](https://github.com/yourusername/video-calling-platform/issues)
- **Email**: support@example.com
- **Discord**: [Join our community](https://discord.gg/example)

---

## 🎯 Success Criteria

This platform is considered production-ready when:

✅ 99.9% uptime SLA  
✅ <100ms latency within region  
✅ Supports 10,000+ concurrent calls  
✅ <2% WebRTC connection failure rate  
✅ Handles region failover automatically  
✅ Complete monitoring & alerting  
✅ Comprehensive documentation  
✅ E2E tests with >80% coverage  

---

**Built with ❤️ for real-time communication at scale.**

---

## 🚀 Quick Start

```bash
# Clone repository
git clone <repo-url>
cd video-calling-platform

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Start development servers
npm run dev

# Access application
# Frontend: http://localhost:3000
# Backend: http://localhost:4000
```

**Ready to scale to millions of users.** 🌍