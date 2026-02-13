# Project Challenges & Solutions: Interview Guide

This document outlines the critical technical challenges faced during the development of the Real-time Video Calling platform and how they were systematically resolved.

---

### 1. Networking & Service Discovery (gRPC)

**Q: "I see you used gRPC for internal service communication. What major connectivity issues did you face in the Docker environment?"**

*   **Problem**: The Signaling Service failed to connect to the Media Service with a `UNAVAILABLE: Name resolution failed` error, despite being in the same Docker network.
*   **Root Cause**: The gRPC client was using an incorrect URL format (`dns:///media-service:50051`). While standard in some environments, Docker's internal DNS resolver works best with simple hostnames.
*   **Solution**: I refactored the connection logic to use the direct service name (`media-service:50051`) and added robust retry logic (logarithmic backoff) to ensure the service waits for the dependency to be fully healthy before attempting to register.

---

### 2. Mediasoup Lifecycle & Worker Stability

**Q: "Mediasoup can be tricky to configure. Did you encounter any worker-level crashes?"**

*   **Problem**: The Media Service crashed on startup with a cryptic `TypeError: wrong settings` error coming from the Mediasoup C++ subprocess.
*   **Root Cause**: The configuration was passing `'info'` as the `logLevel`. Per Mediasoup 3.x documentation, `info` is a valid log *tag* but an invalid log *level* (valid levels are `debug`, `warn`, `error`, `none`).
*   **Solution**: I implemented a two-step fix:
    1.  Corrected the `logLevel` to `warn`.
    2.  Hardcoded known-good configuration values in `config.ts` to prevent environmental overrides from breaking core functionality.
    3.  Enhanced the error catch block to log the exact settings object being passed to the worker for faster debugging.

---

### 3. Observability & Log Management

**Q: "In a microservices architecture, how did you handle log persistence and cleanup between different test runs?"**

*   **Problem**: Using bind-mounts for logs resulted in "dirty" log files persisting after `docker compose down -v`, making it difficult to debug a fresh session.
*   **Solution**: I transitioned from host bind-mounts to **Docker Named Volumes** (`backend_logs`). This allowed the log files to be ephemeral (deleted automatically with the `-v` flag) while still being shared across services.
*   **Innovation**: Since logs were now inside a volume (not directly on the host), I added a lightweight `log-server` (Python-based) to the `docker-compose.yml`, which serves the logs via a web interface at `localhost:9000` for real-time browser debugging.

---

### 4. UI/UX Consistency (React & Tailwind)

**Q: "The application uses a complex UI with multiple overlays. What design challenges did you solve?"**

*   **Problem**: The initial UI felt "unpolished"—specifically, inconsistent font sizes, tiny icons, and a chat component that didn't match the dark, premium feel of a video room.
*   **Solution**:
    1.  **Icon Standardization**: Upscaled all Lucide icons to `w-6 h-6` and added custom hover/active micro-animations.
    2.  **Theme Synchronization**: Redesigned the Chat component from scratch using a dark glassmorphism aesthetic (`bg-[#0a0e1a]/95` with `backdrop-blur`) to match the Video Grid.
    3.  **Visual Feedback**: Implemented "ping" animations for local status and "shimmer" effects for loading states to make the app feel alive and responsive.

---

### 5. Mediasoup Producer/Consumer Management

**Q: "How did you handle the race conditions when a user joins a room and immediately tries to produce media?"**

*   **Problem**: Producers were sometimes created before the Transport was fully "connected" on the server-side, leading to silent failures.
*   **Solution**: I implemented a centralized `useMediasoup` hook that uses a state-machine approach. It ensures that the `Device` is loaded, the `Transport` is created and connected, and *only then* are the `produce()` calls executed. I also added a `queue` or rigorous `useEffect` dependency tracking to handle asynchronous track assignment.

---
