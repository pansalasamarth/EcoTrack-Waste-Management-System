import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/connectDB.js";
import userRoutes from "./routes/userRoute.js"
import wasteBinRoutes from "./routes/wasteBinRoute.js";
import userReportRoutes from "./routes/userReportRoute.js"
import adminRoutes from "./routes/adminRoute.js"
import settingsRoutes from "./routes/settingsRoute.js"
import { Server } from 'socket.io'; //socket
import http from 'http'; //socket

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());
const port = process.env.PORT || 8800;
const server = http.createServer(app); //socket
const io = new Server(server, { 
	cors:{
			origin: "http://localhost:5173", // Your frontend URL
			methods: ["GET", "POST"],
	} 

}) //socket

app.get("/", (req, res) => {
	res.send("EcoTrack Waste Management System API");
});

app.use("/api/users", userRoutes);
app.use("/api/wastebin",wasteBinRoutes);
app.use("/api/userreport",userReportRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/settings", settingsRoutes);
app.use("/userReportImages", express.static("public/userReportImages"));


connectDB();

// Socket.IO setup
io.on("connection", (socket) => {
	console.log("A user connected:", socket.id);
  
	// Handle user authentication
	socket.on("authenticate", (userId) => {
		socket.userId = userId;
		socket.join(`user_${userId}`);
		console.log(`User ${userId} authenticated and joined room`);
	});

	// Handle report status updates
	socket.on("reportStatusUpdate", (data) => {
		// Broadcast to all connected clients
		io.emit("reportUpdate", data);
		console.log("Report status update broadcasted:", data);
	});

	// Handle notifications
	socket.on("sendNotification", (notification) => {
		// Send to specific user if userId is provided
		if (notification.userId) {
			io.to(`user_${notification.userId}`).emit("notification", notification);
		} else {
			// Broadcast to all users
			io.emit("notification", notification);
		}
		console.log("Notification sent:", notification);
	});

	socket.on("disconnect", () => {
		console.log("User disconnected:", socket.id);
	});
});

// Export io for controllers
export  { app, server, io };

server.listen(port, () => {
	console.log(`Server running on port ${port}`);
});