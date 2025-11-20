# Pathfinders Mobile App

A React Native mobile application for footpath navigation and condition reporting, designed to help pedestrians navigate safely while crowdsourcing footpath quality data.

## 📱 Overview

The Pathfinders mobile app is built with React Native and Expo Router, providing citizens with an intelligent navigation system that considers footpath conditions. Users can report issues, upload photos, and navigate through safer routes based on real-time footpath data.

## ✨ Features

### 🗺️ Navigation & Mapping
- **Smart Route Planning**: AI-powered navigation that considers footpath quality scores
- **Real-time Location Tracking**: GPS-based positioning with compass integration
- **Interactive Map Interface**: Dark mode support with custom map styling
- **Route Visualization**: Visual representation of safe vs. problematic paths
- **Location Snapping**: Automatically snaps user location to nearest footpath

### 📸 Image Upload & Reporting
- **Camera Integration**: Capture photos of footpath conditions directly in-app
- **Gallery Access**: Upload existing photos from device gallery
- **AI-Powered Rating**: Automatic footpath quality assessment using ML models
- **User Ratings**: Manual rating system (1-10 scale) for user validation
- **Metadata Collection**: Automatic capture of GPS coordinates and heading
- **Animated UI**: Beautiful animations and feedback for enhanced UX

### 🏠 Home Screen
- **Interactive Map**: View all footpaths with color-coded quality indicators
- **Search Functionality**: Find destinations with autocomplete
- **Destination Management**: Save and manage favorite locations
- **Visual Markers**: Pin locations and view footpath ratings
- **Compass Integration**: Real-time heading display
- **Route Calculation**: Calculate and display optimal paths

### 🧭 Navigate Screen
- **Turn-by-Turn Navigation**: Step-by-step route guidance
- **Distance Tracking**: Real-time distance to next waypoint and destination
- **Voice-Ready Interface**: Designed for future voice guidance integration
- **Path Following**: Visual path rendering on map
- **Location Updates**: Continuous location tracking during navigation

### 👤 Profile Management
- **User Authentication**: Secure login/signup via Supabase
- **Session Management**: Persistent authentication state
- **Account Settings**: User profile and preferences

## 🏗️ Technical Architecture

### Tech Stack
- **Framework**: React Native with Expo
- **Navigation**: Expo Router (file-based routing)
- **UI Components**: React Native core components
- **Maps**: React Native Maps (supports both Google Maps & Apple Maps)
- **State Management**: React Hooks (useState, useEffect, useCallback)
- **Authentication**: Supabase Auth
- **Backend**: Supabase (PostgreSQL database)
- **Image Handling**: Expo Image Picker
- **Sensors**: Expo Location & Magnetometer
- **Animations**: React Native Reanimated

### Project Structure

```
app/
├── _layout.tsx                 # Root layout with navigation stack
├── index.tsx                   # Entry point with auth routing
├── (auth)/                     # Authentication routes
│   ├── _layout.tsx            # Auth stack layout
│   ├── signin.tsx             # Sign in screen
│   └── signup.tsx             # Sign up screen
└── (tabs)/                     # Main app tabs
    ├── _layout.tsx            # Tab navigation layout
    ├── index.tsx              # Home/Map screen
    ├── navigate.tsx           # Navigation screen
    ├── upload.tsx             # Image upload & rating screen
    └── profile.tsx            # User profile screen
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (macOS) or Android Studio (for emulator)
- Physical device with Expo Go app (recommended for testing sensors)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd 116_Smart-Footpath-Connectivity-System/app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the app root directory:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   EXPO_PUBLIC_BACKEND_URL=your_backend_server_url
   ```

4. **Configure Supabase**
   
   Update the Supabase configuration in `lib/supabase.ts` (create if doesn't exist):
   ```typescript
   import { createClient } from '@supabase/supabase-js'
   
   const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
   const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
   
   export const supabase = createClient(supabaseUrl, supabaseAnonKey)
   ```

5. **Update Backend URL**
   
   In `app/(tabs)/navigate.tsx`, update the Flask server URL:
   ```typescript
   const FLASK_SERVER_URL = "http://YOUR_SERVER_IP:5000";
   ```

### Running the App

#### Development Mode

```bash
# Start Expo development server
npx expo start

# Run on iOS simulator (macOS only)
npx expo start --ios

# Run on Android emulator
npx expo start --android

# Run on physical device
# Scan QR code with Expo Go app
```

#### Production Build

```bash
# iOS
eas build --platform ios

# Android
eas build --platform android
```

## 📊 Database Schema

The app interacts with the following Supabase tables:

### `location-footpath`
- `id`: UUID (Primary Key)
- `latitude`: Float
- `longitude`: Float
- `score`: Integer (0-100, quality score)
- `rating`: Integer (1-10, user rating)
- `image_url`: Text
- `heading`: Float (compass direction)
- `created_at`: Timestamp

### `authorities` (for issue reporting)
- `id`: UUID (Primary Key)
- `location`: Point (Geometry)
- `description`: Text
- `priority`: Enum (high, medium, low)
- `status`: Enum (Open, In Progress, Closed)
- `created_at`: Timestamp

## 🎨 UI/UX Features


### Animations
- Smooth page transitions with Expo Router
- Button press animations using React Native Reanimated
- Fade-in effects for content loading
- Spring animations for interactive elements

### Responsive Design
- Adapts to different screen sizes
- Safe area handling for notched devices
- Keyboard-aware layouts
- Platform-specific optimizations (iOS/Android)

## 🔧 Configuration

### Map Providers

The app supports multiple map providers:
- **iOS**: Apple Maps (default)
- **Android**: Google Maps (requires API key)

To configure Google Maps on Android:
1. Obtain a Google Maps API key
2. Add to `app.json`:
   ```json
   {
     "android": {
       "config": {
         "googleMaps": {
           "apiKey": "YOUR_GOOGLE_MAPS_API_KEY"
         }
       }
     }
   }
   ```

### Permissions

Required permissions (handled automatically by Expo):
- Location (foreground and background)
- Camera
- Photo Library
- Internet

## 🔌 API Integration

### Backend Endpoints

#### Navigation API
```
POST /route
Body: {
  "start": {"lat": number, "lng": number},
  "end": {"lat": number, "lng": number}
}
Response: {
  "route": [{"lat": number, "lng": number}, ...],
  "distance": number,
  "duration": number
}
```

#### Image Upload
```
POST /upload
Body: FormData with image, location, heading
Response: {
  "score": number,
  "rating": number,
  "id": string
}
```

## 📱 Key Components

### Home Screen (`index.tsx`)
- Interactive map with footpath overlay
- Search and destination management
- Compass-based heading display
- Route visualization

### Navigate Screen (`navigate.tsx`)
- Turn-by-turn navigation
- Real-time location tracking
- Distance and direction indicators
- Path following with waypoints

### Upload Screen (`upload.tsx`)
- Image capture/selection
- AI-powered quality assessment
- User rating interface
- Location metadata collection

## 🐛 Troubleshooting

### Common Issues

1. **Maps not displaying**
   - Ensure location permissions are granted
   - Check Google Maps API key (Android)
   - Verify internet connection

2. **Camera not working**
   - Check camera permissions
   - Test on physical device (simulators have limitations)

3. **Location inaccurate**
   - Enable high-accuracy GPS mode
   - Test outdoors for better signal
   - Check device location settings

4. **Backend connection failed**
   - Verify backend URL is correct
   - Ensure backend server is running
   - Check network connectivity
   - Use device IP (not localhost) for physical devices

## 🔐 Security

- Authentication handled via Supabase Auth
- Row-level security policies on database
- Secure storage of credentials
- HTTPS for all API communications

## 🚢 Deployment

### App Store (iOS)
1. Configure app signing in Xcode
2. Build using EAS: `eas build --platform ios`
3. Submit to App Store Connect
4. Complete App Store review process

### Google Play (Android)
1. Generate signing key
2. Build using EAS: `eas build --platform android`
3. Upload to Google Play Console
4. Complete Play Store review process

## 📄 License

This project is part of the Smart Footpath Connectivity System capstone project.

## 👥 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Contact the development team
- Check documentation in the `docs/` folder

## 🔄 Updates & Roadmap

### Current Version: 1.0.0

