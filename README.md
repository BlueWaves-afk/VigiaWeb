# VIGIA Web Demo

> **Real-time Road Hazard Detection & DePIN Economic Model Simulation**

A comprehensive Next.js web application showcasing VIGIA's decentralized physical infrastructure network (DePIN) for collaborative road hazard detection, featuring edge AI, V2X communication, and a dual-token economic model.

---

## 🎯 Overview

VigiaWeb is a **demonstration platform** that simulates the capabilities of the VIGIA ecosystem — a decentralized network where vehicles and edge devices collaborate to detect, validate, and share road hazards in real-time. The platform showcases:

- **Edge AI Detection**: YOLOv8-based models (Argus-V8X) running locally with ONNX INT8 quantization
- **V2X Communication**: Vehicle-to-everything messaging for hazard propagation
- **Geo-RAG Co-Pilot**: Context-aware AI guidance using geospatial retrieval-augmented generation
- **DePIN Economics**: Dual-token model with VGT (utility token) and Data Credits
- **Consensus Validation**: DBSCAN clustering for hazard deduplication and multi-party verification

---

## 🏗️ Architecture

### Technology Stack

**Frontend Framework**
- [Next.js 16](https://nextjs.org/) (App Router)
- [React 19.2](https://react.dev/)
- [TypeScript 5](https://www.typescriptlang.org/)
- [Tailwind CSS 4](https://tailwindcss.com/)

**Animation & UI**
- [Framer Motion 12](https://www.framer.com/motion/) - Advanced animations and gestures
- [Lucide React](https://lucide.dev/) - Icon library
- [Recharts](https://recharts.org/) / [Chart.js](https://www.chartjs.org/) - Data visualization

**AI & ML**
- [ONNX Runtime Web 1.23](https://onnxruntime.ai/) - Browser-based inference
- Custom YOLOv8 plugin (vigia-argus) for road hazard detection

**Geospatial**
- [MapLibre GL 5](https://maplibre.org/) - Map rendering
- [Leaflet 1.9](https://leafletjs.com/) - Interactive maps
- [H3-js 4](https://h3geo.org/) - Hexagonal hierarchical geospatial indexing
- [Turf.js 7](https://turfjs.org/) - Spatial analysis

**Backend Services**
- [Supabase](https://supabase.com/) - Authentication and database (SSR support)

---

## 🎨 Key Features & Demos

### 1. **Sonic Hero & Interactive Demos**
Landing experience with scroll-driven animations and parallax effects showcasing:
- Real-time detection capabilities
- Edge deployment benefits
- Privacy-first architecture

### 2. **AI Co-Pilot (Geo-RAG)**
Context-aware driving assistant that:
- Receives V2X alerts for road hazards ahead
- Retrieves historical incident data from geospatial clusters
- Generates actionable guidance (speed recommendations, routing suggestions)
- Uses scroll-lock interaction pattern for immersive experience

**Implementation**: `/src/components/SonicDemo.tsx`

### 3. **V2X Simulation**
Real-time vehicle-to-vehicle communication sandbox:
- **Proximity Detection**: Vehicles detect each other within communication radius
- **Hazard Reporting**: First observer reports hazard (no mint)
- **Confirmation Flow**: Subsequent vehicles confirm or contradict
- **Consensus Validation**: ≥2 confirmations + no contradictions → CONFIRMED status
- **Economic Rewards**: VGT minting split (70% publisher, 30% validators) for contributors only
- **DBSCAN Clustering**: Real-time hazard deduplication and spatial clustering
- **Live Charts**: Message frequency and VGT delta tracking per vehicle

**Implementation**: `/src/components/V2XDemo.tsx`

**Key Mechanics**:
```typescript
// Hazard lifecycle
REPORTED → [CONFIRMED | UNCERTAIN] → MINT (if confirmed)

// Minting rules
- No mint on V2X proximity messages
- Mint only when: reporters.size >= 2 AND !contradicted
- Split: Publisher 70%, Validators 30%
- Only "contributor" role can receive VGT
```

### 4. **Benchmark Visualization**
Comprehensive performance comparison across models:
- **Speed**: Latency (p50/p90/p99), throughput (img/s)
- **Footprint**: Memory (RSS), file size, load time
- **Stability**: Variance metrics (p99/p50 ratio, std/mean)

**Models Tested**:
- YOLOv8 (baseline)
- Argus-V8X (VIGIA custom: SimAM + Swin attention)
- UltraFace (lightweight face detection reference)

**Interactive Features**:
- Batch size filtering (1/2/4/8)
- Model filtering (yolo/argus/ultraface)
- Sort by metric (p50 latency, throughput, memory)
- Detailed table with all 12 benchmark configurations

**Implementation**: 
- `/src/components/BenchmarkDemo.tsx` (landing card)
- `/src/app/benchmark/page.tsx` (full viewer)
- `/public/data/bench_results.json` (raw data)

### 5. **Sensor Fusion Network**
Graph-based routing simulation with:
- **Multi-hazard types**: Pothole, debris, construction zones
- **Dynamic routing**: A* pathfinding with hazard-aware costs
- **Perception modes**: Acoustic + accelerometer fusion
- **Road closure management**: Network resilience testing

**Implementation**: `/src/components/sensor-fusion.tsx`

### 6. **DePIN Dashboard**
Simulated contributor wallet showcasing:
- **Supply Side**: Proof-of-Physical-Work (distance driven → hazards validated → VGT minted)
- **DBSCAN Deduplication**: Proximity-based clustering (28px radius)
- **Wallet Tracking**: VGT balance, contributor role, validation stats
- **Burn Mechanics**: VGT → Data Credits conversion (0.1 VGT = 1 credit)

**Implementation**: `/src/app/dashboard/ui.tsx`

### 7. **Documentation Hub**
Technical documentation for vigia-argus plugin:
- **Plugin Architecture**: SimAM (parameter-free attention) + Swin transformer at P5
- **Installation**: CUDA PyTorch + Ultralytics integration
- **Quick Start**: Python API and CLI examples
- **Model Scales**: n/s/m/l/x variants with multipliers
- **Export Pipeline**: ONNX/TFLite/CoreML with INT8 quantization
- **Compatibility Matrix**: Framework versions and opset support

**Implementation**: `/src/app/docs/page.tsx`

### 8. **Map Visualization**
India-wide hazard distribution map:
- H3 hexagonal binning for spatial aggregation
- Real data from `/public/data/bangalore.json`
- Density-based color coding
- Interactive hover states

**Implementation**: `/src/components/MapIndiaSection.tsx`

---

## 🔬 Technical Deep Dives

### Edge AI Pipeline

**Model**: Argus-V8X (custom YOLOv8 variant)
```python
# Architecture enhancements
- SimAM: Parameter-free attention after C2f layers
- Swin Block: Tiny windowed self-attention at P5 (deep stage)
- Export-safe ops: Linear/MatMul/Softmax (ONNX → TFLite compatible)
```

**Quantization**: 
- INT8 PTQ (Post-Training Quantization) with representative dataset
- INT8 QAT (Quantization-Aware Training) for <1.5 mAP loss scenarios
- Target: <120ms p50, <250ms p95 on mid-tier Android (NNAPI/GPU)

**Browser Deployment**:
- TFLite Web API with SIMD/threaded workers (`/public/vendor/tflite/`)
- ONNX Runtime Web with CPU/WebGL backends (`/public/vendor/tfjs/`)
- Model artifact: `/public/models/yolov8-q.tflite`

### Geospatial RAG System

**Retrieval Strategy**:
1. **Proximity Query**: Find hazards within N-meter radius of current position
2. **Historical Aggregation**: Retrieve severity events from last 48h (G-force clusters)
3. **Context Assembly**: Road condition + weather + curve geometry + traffic density
4. **Narrative Generation**: Rule-based guidance templates with parameter interpolation

**Implementation**: Web Workers for non-blocking inference
- RAG Worker: `/src/workers/rag.ts`
- LLM Worker: `/src/workers/llm.ts`

### V2X Consensus Protocol

**State Machine**:
```
SPAWNED (hazard appears on network)
   ↓
REPORTED (first vehicle in range)
   ↓ (subsequent vehicles)
   ├─→ CONFIRM (agrees hazard exists)
   └─→ CONTRADICT (flags false positive)
   ↓
CONFIRMED (≥2 confirms, 0 contradictions) → MINT VGT
   OR
UNCERTAIN (any contradiction) → No mint
```

**Spatial Deduplication** (DBSCAN):
- Epsilon: 42px (proximity threshold)
- MinPts: 2 (minimum cluster size)
- Runs every 400ms on report point cloud
- Purpose: Prevent duplicate minting for same physical hazard

### Economic Model

**VGT Token** (Utility & Governance):
- **Minting**: Hazard validation rewards (2 VGT per confirmed hazard in demo)
- **Distribution**: Publisher 70%, Validators 30% (contributors only)
- **Burning**: Convert to Data Credits (0.1 VGT = 1 credit)
- **Governance**: Future DAO voting on model updates, reward parameters

**Data Credits** (Consumption):
- Pay-per-query for developers using VIGIA API
- Predictable pricing decoupled from VGT volatility
- No minting — only acquired via VGT burn

**Role-Based Access**:
- **Contributors**: Earn VGT via physical work (driving + detection)
- **Developers**: Burn VGT for credits, query network data
- **Validators**: Participate in consensus, earn validation rewards

---

## 📁 Project Structure

```
VigiaWeb/
├── vigia-demo/                    # Main Next.js application
│   ├── src/
│   │   ├── app/                   # Next.js App Router pages
│   │   │   ├── page.tsx          # Landing page (main demo)
│   │   │   ├── layout.tsx        # Root layout
│   │   │   ├── globals.css       # Global styles
│   │   │   ├── favicon.ico       # Favicon
│   │   │   ├── analytics/        # Analytics dashboards
│   │   │   │   ├── realtime/     # Real-time metrics
│   │   │   │   ├── reliability/  # Network reliability stats
│   │   │   │   └── trends/       # Temporal trends
│   │   │   ├── api/              # API routes
│   │   │   │   └── copilot/      # Co-pilot LLM endpoint
│   │   │   ├── api-integrations/ # API integration pages
│   │   │   ├── auth/             # Authentication flows
│   │   │   │   ├── callback/     # OAuth callback
│   │   │   │   ├── cookies/      # Cookie management
│   │   │   │   ├── debug/        # Auth debugging
│   │   │   │   ├── signin/       # Sign in page
│   │   │   │   ├── signup/       # Sign up page
│   │   │   │   └── whoami/       # Current user info
│   │   │   ├── benchmark/        # Full benchmark viewer
│   │   │   ├── burn-buy/         # Token burn/buy interface
│   │   │   ├── dashboard/        # Contributor dashboard
│   │   │   ├── docs/             # Technical documentation
│   │   │   ├── moderation/       # Content moderation (empty)
│   │   │   ├── onboarding/       # User onboarding
│   │   │   ├── orders/           # Order management
│   │   │   ├── pricing/          # Pricing page
│   │   │   ├── sandbox/          # Interactive sandbox demos
│   │   │   ├── settings/         # User settings (empty)
│   │   │   ├── showcase/         # Feature showcase
│   │   │   ├── start/            # Getting started page
│   │   │   └── users/            # User management (empty)
│   │   │
│   │   ├── components/           # React components
│   │   │   ├── AegisDemo.tsx    # Aegis demo component
│   │   │   ├── AIConsoleInline.tsx # Inline AI chat interface
│   │   │   ├── ArgusBrowserDemo.tsx # Argus browser demo
│   │   │   ├── BackgroundFX.tsx # Animated background effects
│   │   │   ├── BenchmarkDemo.tsx # Benchmark card component
│   │   │   ├── CodeDemo.tsx     # Code snippet showcase
│   │   │   ├── CopilotGeoRAG.tsx # Geo-RAG co-pilot demo
│   │   │   ├── DBSCANDemo.tsx   # DBSCAN clustering demo
│   │   │   ├── DeveloperSection.tsx # Developer onboarding
│   │   │   ├── DocsTOC.tsx      # Documentation table of contents
│   │   │   ├── FeatureRows.tsx  # Feature highlights
│   │   │   ├── ForecastDemo.tsx # Predictive forecast demo
│   │   │   ├── Logo.tsx         # Logo component
│   │   │   ├── MapCanvas.tsx    # Map rendering utilities
│   │   │   ├── MapIndiaSection.tsx # India map section
│   │   │   ├── PageShell.tsx    # Page layout wrapper
│   │   │   ├── sensor-fusion.tsx # Sensor fusion simulation
│   │   │   ├── SiteFooter.tsx   # Global footer
│   │   │   ├── SonicDemo.tsx    # Interactive sonic demo
│   │   │   ├── SonicHero.tsx    # Hero section
│   │   │   ├── TopBar.tsx       # Global navigation
│   │   │   ├── V2XDemo.tsx      # V2X communication sandbox
│   │   │   └── VGTShowcase.tsx  # Token economics showcase
│   │   │
│   │   ├── hooks/                # Custom React hooks
│   │   │   └── useProfile.ts    # User profile hook
│   │   │
│   │   ├── lib/                  # Utilities
│   │   │   ├── auth.ts          # Supabase auth helpers
│   │   │   ├── types.ts         # TypeScript definitions
│   │   │   ├── yoloPost.ts      # YOLO inference utilities
│   │   │   └── supabase/        # Supabase client setup
│   │   │       ├── client.ts    # Client-side Supabase
│   │   │       └── server.ts    # Server-side Supabase
│   │   │
│   │   └── workers/              # Web Workers
│   │       ├── llm.ts           # LLM inference worker
│   │       └── rag.ts           # RAG retrieval worker
│   │
│   ├── public/                   # Static assets
│   │   ├── brand/               # Brand assets
│   │   ├── data/                # Data files
│   │   │   ├── bangalore.json   # Real hazard data (India)
│   │   │   └── bench_results.json # Benchmark metrics
│   │   ├── datasets/            # Dataset files
│   │   ├── demo/                # Demo videos
│   │   │   ├── face_blur.mp4    # Face blur demo
│   │   │   └── hazard.mp4       # Hazard detection demo
│   │   ├── images/              # Static images
│   │   │   ├── banner.png       # Banner image
│   │   │   └── road-hero.jpg    # Hero image
│   │   ├── maps/                # Map assets
│   │   ├── models/              # AI models
│   │   │   ├── argus_v8x.onnx   # Argus V8X ONNX model
│   │   │   ├── UltrafaceRFB320Int8.onnx # Ultraface model
│   │   │   └── yolo.onnx        # YOLO ONNX model
│   │   ├── ort/                 # ONNX Runtime files
│   │   ├── textures/            # Texture assets
│   │   ├── file.svg             # SVG icons
│   │   ├── globe.svg
│   │   ├── next.svg
│   │   ├── vercel.svg
│   │   └── window.svg
│   │
│   ├── .env.local               # Environment variables (gitignored)
│   ├── .gitignore               # Git ignore rules
│   ├── eslint.config.mjs        # ESLint configuration
│   ├── middleware.ts            # Next.js middleware
│   ├── next.config.ts           # Next.js configuration
│   ├── next-env.d.ts            # Next.js TypeScript definitions
│   ├── package.json             # Dependencies
│   ├── postcss.config.mjs       # PostCSS configuration
│   ├── README.md                # Project readme
│   └── tsconfig.json            # TypeScript configuration
│
├── package.json                 # Root package.json
└── README.md                    # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20+ (recommended LTS)
- **npm** / **yarn** / **pnpm** / **bun**

### Installation

```bash
# Clone the repository
git clone https://github.com/BlueWaves-afk/VigiaWeb.git
cd VigiaWeb/vigia-demo

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create `.env.local` in `vigia-demo/`:

```bash
# Supabase (if using authentication)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Build for Production

```bash
npm run build
npm start
```

---

## 🎮 Interactive Demos

### V2X Simulation Controls

1. **Start Simulation**: Click "Start" to activate vehicle movement
2. **Speed Control**: Adjust simulation speed (1x - 5x)
3. **Console**: Monitor real-time events (PROX, REPORT, CONFIRM, CONTRADICT, MINT)
4. **Charts**: Track message frequency and VGT earnings per vehicle
5. **Info Panels**: Expand "What is V2X?" for detailed explanations

### Co-Pilot Geo-RAG

1. **Cycle Presets**: Use ‹/› buttons to switch scenarios
2. **Trigger Alert**: Click "Simulate V2X Alert → Co-Pilot"
3. **Scroll Interaction**: Scroll 3× to unlock navigation (scroll lock feature)
4. **Observe**: Watch retrieval + generation flow (hard-coded demo)

### Benchmark Viewer

1. **Navigate**: Click "View Full Benchmark Results" from landing card
2. **Filter**: Select batch size (1/2/4/8) and model (yolo/argus/ultraface)
3. **Sort**: Choose metric (p50 latency, throughput, memory)
4. **Analyze**: Compare metrics across 12 configurations

---

## 🔧 Development

### Key Scripts

```bash
npm run dev       # Start dev server (hot reload)
npm run build     # Production build
npm run start     # Serve production build
npm run lint      # Run ESLint
```

### Technology Decisions

**Why Next.js 16?**
- App Router for nested layouts and streaming SSR
- React Server Components for reduced client bundle
- Built-in API routes for backend logic

**Why Framer Motion?**
- Gesture-based interactions (scroll lock, drag)
- Orchestrated animations (stagger, sequence)
- Layout animations (AnimatePresence)
- View-based triggers (viewport detection)

**Why ONNX Runtime Web?**
- Cross-platform model format (PyTorch → ONNX export)
- Browser-native inference (no backend required)
- Multiple execution providers (CPU, WebGL, WASM)

**Why H3 Geo Indexing?**
- Uniform hexagonal cells (vs. irregular polygons)
- Multi-resolution aggregation (zoom levels)
- Efficient spatial joins and proximity queries

---

## 📊 Data & Models

### Benchmark Data

**Source**: `/public/data/bench_results.json`

**Metrics**:
- `p50_ms`, `p90_ms`, `p99_ms`: Latency percentiles
- `mean_ms`, `std_ms`: Central tendency & variance
- `throughput_img_per_s`: Inference rate
- `proc_peak_rss_bytes`: Peak memory usage
- `file_size_bytes`: Model file size
- `load_time_ms`: Model initialization time

**Test Configuration**:
- Batch sizes: 1, 2, 4, 8
- Runs: 200 per configuration
- Warmup: 20 iterations
- Provider: CPUExecutionProvider (ONNX Runtime)

### Hazard Data

**Source**: `/public/data/bangalore.json`

**Schema**:
```typescript
{
  class: "pothole" | "speed_breaker_unmarked" | "debris" | "stalled_vehicle"
  lat: number
  lng: number
  severity?: number
  last_seen?: string
  weather?: string[]
}
```

**Coverage**: Real incidents from Bangalore, India (sample dataset)

---

## 🎓 Learning Resources

### Concepts Demonstrated

1. **Edge AI Deployment**: Client-side inference with TFLite/ONNX
2. **DePIN Economics**: Dual-token model (utility + credits)
3. **Consensus Mechanisms**: Multi-party validation with contradiction handling
4. **Spatial Computing**: H3 indexing, DBSCAN clustering, geofencing
5. **Real-time Communication**: V2X message propagation simulation
6. **RAG Architecture**: Retrieval-augmented generation for context-aware AI
7. **Quantization**: INT8 model compression for edge devices

### Referenced Standards

- **V2X**: Vehicle-to-Everything communication protocols
- **DBSCAN**: Density-Based Spatial Clustering of Applications with Noise
- **H3**: Uber's Hexagonal Hierarchical Geospatial Indexing System
- **ONNX**: Open Neural Network Exchange format

---

## 🛠️ Troubleshooting

### Common Issues

**Port 3000 already in use**:
```bash
npx kill-port 3000
npm run dev
```

**TypeScript errors**:
```bash
rm -rf .next
npm run build
```

**Worker initialization fails**:
- Ensure Web Workers are served from same origin
- Check browser console for CORS errors
- Verify `/public/vendor/` files exist

**Map not rendering**:
- Check MapLibre GL CSS import in `layout.tsx`
- Verify `bangalore.json` data path
- Enable browser console for GL errors

---

## 🤝 Contributing

This is a **demo application** showcasing VIGIA's capabilities. For production integration:

1. Review `/src/app/docs/page.tsx` for vigia-argus plugin documentation
2. Check `/src/lib/types.ts` for data schemas
3. Reference `/src/components/V2XDemo.tsx` for consensus logic
4. Explore `/src/workers/rag.ts` for RAG implementation patterns

---

## 📄 License

This project is a demonstration and educational resource. For production use of VIGIA components:

- **vigia-argus plugin**: Apache-2.0 / MIT (check plugin repo)
- **Ultralytics YOLOv8**: AGPL-3.0 (with Enterprise license option)
- **Demo code**: © VIGIA (contact for licensing)

---

## 🔗 Links

- **GitHub**: [BlueWaves-afk/VigiaWeb](https://github.com/BlueWaves-afk/VigiaWeb)
- **Documentation**: [/docs](http://localhost:3000/docs)
- **Sandbox**: [/sandbox](http://localhost:3000/sandbox)
- **Benchmark**: [/benchmark](http://localhost:3000/benchmark)

---

## 🙏 Acknowledgments

**Frameworks & Libraries**:
- Next.js team at Vercel
- Framer Motion by Framer
- Ultralytics for YOLOv8
- MapLibre community
- ONNX Runtime team

**Inspiration**:
- Decentralized Physical Infrastructure Networks (DePIN)
- Real-time collaborative mapping (Waze, OpenStreetMap)
- Edge AI research (TinyML, model quantization)

---

**Built with ❤️ by the VIGIA Team**

*Empowering safer roads through decentralized edge intelligence.*
