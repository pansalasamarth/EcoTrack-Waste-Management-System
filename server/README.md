# EcoTrack - Backend Server

This is the Node.js backend server for the EcoTrack Waste Management System.

## Features

- **RESTful API**: Complete API for waste management operations
- **Real-time Updates**: Socket.io integration for live notifications
- **Authentication**: JWT-based user authentication
- **File Upload**: Multer integration for image uploads
- **Database Integration**: MongoDB with Mongoose ODM

## Tech Stack

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **Socket.io** - Real-time communication
- **JWT** - JSON Web Tokens for authentication
- **Multer** - File upload handling
- **bcryptjs** - Password hashing

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the server directory:
```env
MONGO_URI=mongodb://localhost:27017/waste-management
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
PORT=8800
NODE_ENV=development
```

3. Start the server:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will be available at `http://localhost:8800`

## API Endpoints

### Authentication
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login

### Waste Bins
- `GET /api/wastebin/wastebins` - Get all waste bins
- `GET /api/wastebin/wastebins-filtered` - Get filtered waste bins
- `POST /api/wastebin/create-wastebin` - Create new waste bin (Admin)
- `PUT /api/wastebin/update-wastebin/:id` - Update waste bin (Admin)
- `DELETE /api/wastebin/delete-wastebin/:id` - Delete waste bin (Admin)

### User Reports
- `GET /api/userreport/reports` - Get all reports
- `POST /api/userreport/create-report` - Create new report
- `PUT /api/userreport/admin-update-report/:id` - Update report status (Admin)
- `PUT /api/userreport/wc-update-report/:id` - Update report status (Waste Collector)

## Project Structure

```
server/
├── config/             # Configuration files
├── controllers/        # Route controllers
├── middleware/         # Custom middleware
├── models/            # Database models
├── routes/            # API routes
├── socket/            # Socket.io configuration
└── index.js          # Server entry point
```

## Database Models

- **User**: User accounts and authentication
- **WasteBin**: Waste bin information and status
- **UserReport**: User-submitted reports with images
