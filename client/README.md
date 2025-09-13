# EcoTrack - Frontend Client

This is the React frontend client for the EcoTrack Waste Management System.

## Features

- **User Dashboard**: Interactive map showing waste bin locations and status
- **Report System**: Users can report overflowing bins with photos
- **Admin Panel**: Manage reports and monitor system status
- **Waste Collector Interface**: Optimized routes for waste collection
- **Real-time Notifications**: Socket.io integration for live updates

## Tech Stack

- **React 19** - Modern React with latest features
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Leaflet** - Interactive maps
- **Socket.io Client** - Real-time communication
- **React Router** - Client-side routing
- **Framer Motion** - Smooth animations

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the client directory:
```env
VITE_BACKEND_URL=http://localhost:8800
VITE_NODE_ENV=development
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Page components
│   ├── Admin/          # Admin-specific pages
│   └── map/            # Map-related components
├── context/            # React context providers
└── main.jsx           # Application entry point
```

## Key Components

- **Map.jsx**: Main interactive map with waste bin markers
- **login.jsx**: Authentication interface
- **adminDashboard.jsx**: Admin control panel
- **CollectorMap.jsx**: Waste collector route optimization
- **userReportForm.jsx**: Bin reporting interface
