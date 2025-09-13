# EcoTrack Setup Guide

This guide will help you set up the EcoTrack Waste Management System on your local machine.

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- Python 3.8+ (for ML server)

## Quick Setup

### 1. Clone and Install Dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install

# Install Python dependencies
cd ../python-server
pip install -r requirements.txt
```

### 2. Environment Configuration

Create the following environment files:

**server/.env:**
```env
MONGO_URI=mongodb://localhost:27017/waste-management
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
PORT=8800
NODE_ENV=development
```

**client/.env:**
```env
VITE_BACKEND_URL=http://localhost:8800
VITE_NODE_ENV=development
```

### 3. Database Setup

1. Start MongoDB service
2. The application will automatically create the database and collections on first run

### 4. Running the Application

**Terminal 1 - Backend Server:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend Client:**
```bash
cd client
npm run dev
```

**Terminal 3 - Python ML Server:**
```bash
cd python-server
python server.py
```

### 5. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8800
- **ML Server**: http://localhost:5000

## Default Test Accounts

The system comes with sample data in `data/users.json` and `data/waste_bin_data.json`.

### Sample User Accounts:
- **Phone**: 9876543210, **Password**: pass123 (Regular User)
- **Phone**: 9123456789, **Password**: pass123 (Regular User)

### Admin Account:
Create an admin account by registering with `isAdmin: true` in the registration process.

## Features Overview

### User Features:
- Interactive map with waste bin locations
- Report overflowing bins with photos
- View nearby bins and get directions
- Track report status

### Admin Features:
- Approve/reject user reports
- Monitor system status
- View ML-based scheduling predictions
- Real-time notifications

### Waste Collector Features:
- Optimized collection routes
- Mark bins as collected
- Real-time route updates

## Troubleshooting

### Common Issues:

1. **MongoDB Connection Error**: Ensure MongoDB is running on port 27017
2. **Port Already in Use**: Change ports in .env files if needed
3. **CORS Issues**: Check that frontend URL matches backend CORS settings
4. **Socket.io Connection**: Ensure both client and server are running

### Development Tips:

- Use browser dev tools to monitor API calls
- Check server console for error logs
- Use MongoDB Compass to inspect database
- Test ML predictions at http://localhost:5000/schedule

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production` in environment files
2. Use a production MongoDB instance
3. Set up proper JWT secrets
4. Configure CORS for production domains
5. Use a reverse proxy (nginx) for serving static files

## Support

For issues and questions, check the individual README files in each directory:
- `server/README.md` - Backend documentation
- `client/README.md` - Frontend documentation
- `README.md` - Main project overview
