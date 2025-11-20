# 🚶 Smart Footpath Connectivity System

A comprehensive AI-powered footpath monitoring and navigation ecosystem that combines citizen crowdsourcing, municipal management, and intelligent routing to improve pedestrian infrastructure safety and accessibility.

## 🌟 Project Overview

The Smart Footpath Connectivity System is an end-to-end solution designed to address urban footpath infrastructure challenges. It consists of three main components:

1. **Mobile Application** - Citizen-facing app for navigation and reporting
2. **Government Dashboard** - Administrative web portal for issue management
3. **Backend Services** - AI/ML models and routing algorithms

### Key Problems Solved

- 🚧 Lack of real-time footpath condition data
- 🗺️ Inefficient pedestrian navigation avoiding problem areas
- 📊 Poor visibility into infrastructure maintenance needs
- 👥 Limited citizen engagement in urban planning
- 🤖 Manual assessment of footpath quality

## 📁 Repository Structure

```
116_Smart-Footpath-Connectivity-System/
├── app/                          # React Native mobile application
│   ├── (auth)/                   # Authentication screens
│   ├── (tabs)/                   # Main app tabs (Home, Navigate, Upload, Profile)
│   └── README.md                 # Mobile app documentation
│
├── frontend dashboard/           # Government web dashboard
│   └── dashboard/
│       ├── src/
│       │   ├── components/       # React components
│       │   └── services/         # API services
│       └── README.md             # Dashboard documentation
│
├── backend/                      # Navigation server
│   └── depth_navi_server.py      # Depth estimation & routing API
│
├── pathfinders_backend/          # YOLOv12 detection service
│   ├── app.py                    # FastAPI detection server
│   ├── best.pt                   # Trained model weights
│   ├── ultralytics/              # YOLO implementation
│   └── DEPLOYMENT.md             # Cloud deployment guide
│
├── models/                       # ML model training
│   ├── train.py                  # Training scripts
│   └── Mask-RCNN testing and validation.ipynb
│
└── scoring_footpaths/            # Model evaluation tools
    ├── model_rating.py           # Automated scoring
    └── human_rating.py           # Human validation
```

## 🎯 System Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  Mobile App     │────────>│   Backend APIs   │────────>│   Supabase DB   │
│  (React Native) │         │   (FastAPI)      │         │   (PostgreSQL)  │
└─────────────────┘         └──────────────────┘         └─────────────────┘
        │                            │                             │
        │                            │                             │
        v                            v                             v
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  Image Upload   │────────>│  YOLO Detection  │────────>│  Quality Score  │
│  & GPS Data     │         │  Model (YOLOv12) │         │  (0-100)        │
└─────────────────┘         └──────────────────┘         └─────────────────┘
                                     │
                                     v
                            ┌──────────────────┐
                            │  Depth Estimation│
                            │  & Navigation    │
                            └──────────────────┘
                                     │
                                     v
                            ┌──────────────────┐
                            │  Government      │
                            │  Dashboard       │
                            │  (React)         │
                            └──────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** v16+
- **Python** 3.8+
- **Expo CLI** for mobile development
- **Docker** (optional, for containerization)
- **Supabase** account
- **Gemini API** key (for LLM Analysis)

### 1️⃣ Mobile App Setup

```bash
# Navigate to app directory
cd app

# Install dependencies
npm install

# Create environment file
cat > .env << EOF
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
EXPO_PUBLIC_BACKEND_URL=http://your-backend-url:5000
EOF

# Start development server
npx expo start
```

📖 **Detailed documentation**: [app/README.md](./app/README.md)

### 2️⃣ Dashboard Setup

```bash
# Navigate to dashboard directory
cd "frontend dashboard/dashboard"

# Install dependencies
npm install

# Create environment file
cat > .env << EOF
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_key
REACT_APP_OPENAI_API_KEY=your_openai_key
EOF

# Start development server
npm start
```

📖 **Detailed documentation**: [frontend dashboard/dashboard/README.md](./frontend%20dashboard/dashboard/README.md)

### 3️⃣ Backend Services Setup

#### Navigation Server

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export SUPABASE_URL=your_supabase_url
export SUPABASE_KEY=your_supabase_key

# Run server
python depth_navi_server.py
```

#### YOLO Detection Service

```bash
# Navigate to pathfinders backend
cd pathfinders_backend

# Install dependencies
pip install -r requirements.txt

# Run service
uvicorn app:app --host 0.0.0.0 --port 8000
```

📖 **Deployment guide**: [pathfinders_backend/DEPLOYMENT.md](./pathfinders_backend/DEPLOYMENT.md)

## 📱 Mobile Application Features

### For Citizens

- **🗺️ Smart Navigation**: AI-powered routing that avoids problematic footpaths
- **📸 Report Issues**: Upload photos with automatic quality assessment
- **🧭 Real-time Tracking**: GPS and compass-based navigation
- **⭐ Rate Footpaths**: Provide feedback on footpath conditions
- **🎨 Modern UI**: Dark mode support with smooth animations

### Technical Highlights

- React Native with Expo Router
- Real-time location tracking
- Camera & gallery integration
- Offline-ready architecture
- Cross-platform (iOS & Android)

## 🖥️ Government Dashboard Features

### For Municipal Authorities

- **📊 Live Analytics**: Real-time statistics and metrics
- **🎯 Priority Management**: High/Medium/Low issue categorization
- **🔄 Status Tracking**: Open → In Progress → Closed workflow
- **🗺️ Interactive Maps**: Leaflet-based visualization
- **🔔 Notifications**: Priority alerts for critical issues

### Technical Highlights

- React with React Router
- Supabase integration
- Responsive design
- Real-time data updates

## 🤖 AI/ML Components

### YOLOv12 Object Detection

- **Purpose**: Detect footpath defects, obstacles, and hazards
- **Input**: Street-level images from mobile app
- **Output**: Object detections with confidence scores
- **Model**: Custom-trained YOLOv12 on footpath dataset

### Depth Estimation

- **Purpose**: Calculate depth maps for navigation safety
- **Model**: DepthPro transformer model
- **Use Case**: Identify elevation changes, curbs, and obstacles

### Quality Scoring Algorithm

```python
# Score calculation (0-100)
# Lower score = worse condition = higher priority
score = base_score - (defect_count * weight) - (severity_factor)

Priority levels:
- High: score < 30
- Medium: score 30-60
- Low: score > 60
```

## 🗄️ Database Schema

### Supabase Tables

#### `location-footpath`
```sql
- id: UUID (Primary Key)
- latitude: Float
- longitude: Float
- score: Integer (0-100)
- rating: Integer (1-10)
- image_url: Text
- heading: Float
- created_at: Timestamp
```

#### `authorities`
```sql
- id: UUID (Primary Key)
- footpath_id: UUID (Foreign Key)
- description: Text
- status: Enum (Open, In Progress, Closed)
- priority: Enum (high, medium, low)
- assigned_to: Text
- latitude: Float
- longitude: Float
- created_at: Timestamp
- resolved_at: Timestamp
```

## 🔌 API Endpoints

### Navigation API (`depth_navi_server.py`)

```http
POST /route
Content-Type: application/json

{
  "start": {"lat": 12.9716, "lng": 77.5946},
  "end": {"lat": 12.9716, "lng": 77.5956}
}

Response: {
  "route": [{"lat": ..., "lng": ...}, ...],
  "distance": 1234.56,
  "duration": 300
}
```

### Detection API (`pathfinders_backend/app.py`)

```http
POST /detect
Content-Type: multipart/form-data

image: <binary>

Response: {
  "detections": [...],
  "score": 45,
  "timestamp": "2025-11-20T..."
}
```

## 🛠️ Development

### Tech Stack

| Component | Technologies |
|-----------|-------------|
| Mobile App | React Native, Expo, TypeScript |
| Dashboard | React, JavaScript, CSS |
| Backend | Python, FastAPI, Flask |
| Database | Supabase (PostgreSQL) |
| ML Models | YOLOv12, DepthPro, PyTorch |
| Maps | React Native Maps, Leaflet |
| AI | OpenAI GPT-4 |

### Running Tests

```bash
# Mobile app
cd app
npm test

# Dashboard
cd "frontend dashboard/dashboard"
npm test

# Backend
cd backend
pytest
```

### Code Quality

```bash
# Linting
npm run lint          # JavaScript/TypeScript
flake8 .             # Python
pylint *.py          # Python

# Formatting
npm run format       # Prettier
black .              # Python
```

## 🚢 Deployment

### Mobile App

```bash
# iOS
eas build --platform ios

# Android
eas build --platform android

# Submit to stores
eas submit
```

### Dashboard

```bash
# Build for production
npm run build

# Deploy to Vercel
vercel --prod

# Or Netlify
netlify deploy --prod
```

### Backend Services

```bash
# Using Docker
docker build -t pathfinders-backend .
docker run -p 8000:8000 pathfinders-backend

# Or Google Cloud Run (see DEPLOYMENT.md)
gcloud builds submit --config cloudbuild.yaml
```

## 📊 Scoring & Evaluation

The `scoring_footpaths/` directory contains tools for:

- **Model validation**: Compare AI scores vs human ratings
- **Error calculation**: Compute accuracy metrics
- **Dataset filtering**: Select quality training images
- **Performance tracking**: Monitor model improvements

```bash
cd scoring_footpaths

# Run model evaluation
python model_rating.py

# Compare with human ratings
python error_calculation.py
```

## 🔐 Security

- **Authentication**: Supabase Auth with JWT
- **Row Level Security**: Database-level access control
- **API Keys**: Environment variable management
- **HTTPS**: Encrypted communication
- **Input Validation**: Sanitization and validation
- **Rate Limiting**: API abuse prevention

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Coding Standards

- Follow existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation
- Run linters before committing

## 📄 License

This project is part of a university capstone project. All rights reserved.

## 👥 Team

**Project 116 - Smart Footpath Connectivity System**

- Developed as part of capstone project
- Repository: [116_Smart-Footpath-Connectivity-System](https://github.com/jayanth343/116_Smart-Footpath-Connectivity-System)

## 🐛 Known Issues

- [ ] Navigation accuracy in dense urban areas
- [ ] Battery optimization for continuous GPS tracking
- [ ] Offline map caching implementation
- [ ] Real-time synchronization delays

## 🗺️ Roadmap

### Phase 1 (Current)
- ✅ Mobile app with basic navigation
- ✅ Government dashboard with filtering
- ✅ YOLOv12 object detection
- ✅ Basic quality scoring

### Phase 2 (Q1 2026)
- [ ] Voice-guided navigation
- [ ] Offline map support
- [ ] Real-time notifications
- [ ] Advanced analytics dashboard
- [ ] Multi-language support

### Phase 3 (Q2 2026)
- [ ] AR navigation overlay
- [ ] Predictive maintenance AI
- [ ] Integration with city systems
- [ ] Community engagement features
- [ ] Performance optimization

### Phase 4 (Future)
- [ ] Wearable device support
- [ ] Accessibility features (screen reader, audio cues)
- [ ] Crowd-sourced verification
- [ ] Smart city integration
- [ ] Open data API

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/jayanth343/116_Smart-Footpath-Connectivity-System/issues)
- **Documentation**: See individual README files in each directory
- **Email**: Contact project team

## 🙏 Acknowledgments

- OpenStreetMap for mapping data
- Supabase for backend infrastructure
- Ultralytics for YOLO framework
- OpenAI for GPT API
- Expo team for mobile framework

## 📚 Additional Resources

- [Mobile App Documentation](./app/README.md)
- [Dashboard Documentation](./frontend%20dashboard/dashboard/README.md)
- [Backend Deployment Guide](./pathfinders_backend/DEPLOYMENT.md)
- [Model Training Notebooks](./models/)
- [Scoring Tools](./scoring_footpaths/)

---

**Built with ❤️ for safer, more accessible urban footpaths**

*Smart Footpath Connectivity System © 2025*
