import UserReport from "../models/userReportModel.js";
import User from "../models/userModel.js";
import WasteBin from "../models/wasteBinModel.js";
import mongoose from "mongoose";
import { io } from "../index.js";

export const createReport = async (req, res) => {
    try {
      const { bin, user_id, status, description, urgency, location } = req.body;
      const file = req.file;
  
      // Validate required fields
      if (!file) {
        return res.status(400).json({ error: "Attachment is required" });
      }
      
      if (!bin) {
        return res.status(400).json({ error: "Bin ID is required" });
      }
      
      if (!user_id) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }
      
      if (!description || description.trim().length < 10) {
        return res.status(400).json({ error: "Description must be at least 10 characters long" });
      }

      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(bin)) {
        return res.status(400).json({ error: "Invalid bin ID format" });
      }
      
      if (!mongoose.Types.ObjectId.isValid(user_id)) {
        return res.status(400).json({ error: "Invalid user ID format" });
      }

      // Check if bin exists
      const binExists = await WasteBin.findById(bin);
      if (!binExists) {
        return res.status(404).json({ error: "Bin not found" });
      }

      // Check if user exists
      const userExists = await User.findById(user_id);
      if (!userExists) {
        return res.status(404).json({ error: "User not found" });
      }

      // Validate status enum
      const validStatuses = ["full", "damaged", "needs maintenance", "partially filled", "overflowing"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status value" });
      }

      // Validate urgency if provided
      if (urgency && !["low", "medium", "high"].includes(urgency)) {
        return res.status(400).json({ error: "Invalid urgency value" });
      }

      // Parse location if provided
      let parsedLocation = null;
      if (location) {
        try {
          parsedLocation = JSON.parse(location);
          if (!parsedLocation.latitude || !parsedLocation.longitude) {
            return res.status(400).json({ error: "Invalid location format" });
          }
        } catch (err) {
          return res.status(400).json({ error: "Invalid location JSON format" });
        }
      }

      // Validate file type
      if (!file.mimetype.startsWith('image/')) {
        return res.status(400).json({ error: "Only image files are allowed" });
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        return res.status(400).json({ error: "File size must be less than 5MB" });
      }

      const newReport = new UserReport({
        bin,
        user_id,
        status,
        description: description.trim(),
        urgency: urgency || "medium",
        location: parsedLocation,
        attachment: {
          data: file.buffer,
          contentType: file.mimetype,
        },
      });
  
      await newReport.save();
      
      // Populate the saved report for response
      const populatedReport = await UserReport.findById(newReport._id)
        .populate('user_id', 'name email')
        .populate('bin', 'ward zone category binType');
      
      // Emit socket notification for new report
      if (io) {
        io.emit('notification', {
          type: 'new_report',
          message: `New report submitted for ${populatedReport.bin?.ward}`,
          userId: user_id,
          reportId: newReport._id,
          timestamp: new Date()
        });
      }
      
      res.status(201).json({ 
        message: "Report created successfully", 
        report: populatedReport 
      });
    } catch (err) {
      console.error("Error in create-report:", err);
      
      // Handle specific mongoose validation errors
      if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({ 
          error: "Validation failed", 
          details: errors 
        });
      }
      
      // Handle duplicate key errors
      if (err.code === 11000) {
        return res.status(400).json({ 
          error: "Duplicate entry", 
          details: "A report with this data already exists" 
        });
      }
      
      res.status(500).json({ 
        error: "Server error while submitting report",
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  };
  

export const getAllReports = async (req, res) => {
    try {
        const userReports = await UserReport.find({
            status: { $in: ["full", "partially filled", "damaged", "needs maintenance"] },
        })
        .populate('user_id', 'name email location')
        .populate('bin', 'ward binType wc_status location');
    console.log(userReports);

        res.status(200).json(userReports);
    } catch (err) {
        res.status(500).json({ msg: "Failed to fetch user reports", err: err.message });
    }
};
export const changeAllReports = async (req, res) => {
    try {
        const { wc_status } = req.body;

        // Validate the request body
        if (!wc_status) {
            return res.status(400).json({ msg: "wc_status is required in the request body" });
        }

        // Update all reports with the specified wc_status
        const result = await UserReport.updateMany(
            { wc_status: "pending" }, // Filter: Match reports with wc_status "recycled"
            { status: "recycled", wc_status: "recycled" } // Update: Set both fields
        );

        // Check if any reports were updated
        if (result.matchedCount === 0) {
            return res.status(404).json({ msg: "No reports matched the filter criteria" });
        }

        console.log("Reports updated:", result);

        res.status(200).json({ msg: "Reports updated successfully", result });
    } catch (err) {
        console.error("Error updating reports:", err);
        res.status(500).json({ msg: "Failed to update reports", err: err.message });
    }
};
export const getReportById = async (req, res) => {
    try {
        const { id } = req.params;
        const userReport = await UserReport.findById(id)
        .populate('user_id', 'name')  
        .populate('bin', 'location'); 
        if (!userReport) {
            return res.status(404).json({ msg: "User report not found" });
        }
        res.status(200).json(userReport);
    } catch (err) {
        res.status(500).json({ msg: "Failed to fetch user report", err: err.message });
    }
};

export const updateReportAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { admin_status } = req.body;

        if (!["pending", "approved", "rejected"].includes(admin_status)) {
            return res.status(400).json({ msg: "Invalid admin_status value" });
        }
        //find by id and update the reports
        const userReport = await UserReport.findByIdAndUpdate(id, { admin_status }, { new: true });
        if (!userReport) {
            return res.status(404).json({ msg: "User report not found" });
        }
        //get the user who made report
        const user = await User.findById(userReport.user_id);
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }
        //checks for report validation
        if (admin_status === "rejected") {
            
            if (user.points > 0) {
                user.points -= 1;
            }
            if (user.points === 0) {
                user.blacklisted = true;
            }
        } else if (admin_status === "approved") {
            user.points += 1;
            user.blacklisted = false; 
        }
        await user.save();
        
        // Emit socket notification for report status update
        if (io) {
          io.emit('reportUpdate', {
            reportId: id,
            updates: { admin_status },
            userId: userReport.user_id,
            message: `Report ${admin_status} by admin`
          });
          
          // Send notification to specific user
          io.to(`user_${userReport.user_id}`).emit('notification', {
            type: 'report_status_update',
            message: `Your report has been ${admin_status}`,
            userId: userReport.user_id,
            reportId: id,
            timestamp: new Date()
          });
        }
        
        res.status(200).json({ msg: "User report updated", userReport, user });
    } catch (err) {
        res.status(500).json({ msg: "Failed to update user report", err: err.message });
    }
};

export const updateReportWC = async (req, res) => {
    try {
        const { id } = req.params;

        if (req.body.wc_status && !["pending", "done"].includes(req.body.wc_status)) {
            return res.status(400).json({ msg: "Invalid wc_status value" });
        }
        const userReport = await UserReport.findByIdAndUpdate(id, req.body, { new: true });

        if (!userReport) {
            return res.status(404).json({ msg: "User report not found" });
        }
        
        // Emit socket notification for waste collector update
        if (io) {
          io.emit('reportUpdate', {
            reportId: id,
            updates: req.body,
            userId: userReport.user_id,
            message: `Report updated by waste collector`
          });
        }
        
        res.status(200).json({ msg: "User report updated", userReport });
    } catch (err) {
        res.status(500).json({ msg: "Failed to update user report", err: err.message });
    }
};

export const getUserReports = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        
        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: "Invalid user ID format" });
        }

        const skip = (page - 1) * limit;

        const [userReports, total] = await Promise.all([
            UserReport.find({ user_id: userId })
                .populate('user_id', 'name email')
                .populate('bin', 'ward zone category binType realTimeCapacity totalCapacity status')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            UserReport.countDocuments({ user_id: userId })
        ]);

        res.status(200).json({ 
            reports: userReports,
            count: userReports.length,
            total,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            }
        });
    } catch (err) {
        console.error("Error fetching user reports:", err);
        res.status(500).json({ 
            error: "Failed to fetch user reports", 
            details: err.message 
        });
    }
};

export const getDashboardStats = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: "Invalid user ID format" });
        }

        // Use aggregation pipeline for better performance
        const stats = await UserReport.aggregate([
            { $match: { user_id: new mongoose.Types.ObjectId(userId) } },
            {
                $group: {
                    _id: null,
                    totalReports: { $sum: 1 },
                    approvedReports: { 
                        $sum: { $cond: [{ $eq: ["$admin_status", "approved"] }, 1, 0] }
                    },
                    pendingReports: { 
                        $sum: { $cond: [{ $eq: ["$admin_status", "pending"] }, 1, 0] }
                    },
                    rejectedReports: { 
                        $sum: { $cond: [{ $eq: ["$admin_status", "rejected"] }, 1, 0] }
                    },
                    uniqueBins: { $addToSet: "$bin" }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalReports: 1,
                    approvedReports: 1,
                    pendingReports: 1,
                    rejectedReports: 1,
                    uniqueLocations: { $size: "$uniqueBins" }
                }
            }
        ]);

        const result = stats[0] || {
            totalReports: 0,
            approvedReports: 0,
            pendingReports: 0,
            rejectedReports: 0,
            uniqueLocations: 0
        };

        // Calculate environmental impact (example calculations)
        const co2Saved = result.approvedReports * 0.5; // 0.5kg CO2 per approved report
        const wasteDiverted = result.approvedReports * 2.5; // 2.5kg waste diverted per approved report
        const energySaved = result.approvedReports * 0.8; // 0.8kWh energy saved per approved report
        const treesEquivalent = Math.floor(co2Saved / 22); // 22kg CO2 = 1 tree
        
        // Calculate consecutive days (simplified)
        const consecutiveDays = 0; // This would require more complex logic
        
        // Calculate achievements
        const achievementsUnlocked = Math.floor(result.totalReports / 5) + (result.approvedReports >= 10 ? 1 : 0);

        const finalStats = {
            ...result,
            co2Saved: Math.round(co2Saved * 10) / 10,
            wasteDiverted: Math.round(wasteDiverted * 10) / 10,
            energySaved: Math.round(energySaved * 10) / 10,
            treesEquivalent,
            consecutiveDays,
            achievementsUnlocked
        };

        res.status(200).json(finalStats);
    } catch (err) {
        console.error("Error fetching dashboard stats:", err);
        res.status(500).json({ 
            error: "Failed to fetch dashboard stats", 
            details: err.message 
        });
    }
};

export const deleteReport = async (req, res) => {
    console.log("Received DELETE request"); // Debug log
    try {
        const deletedReports = await UserReport.deleteMany({ wc_status: "recycled" });

        if (deletedReports.deletedCount === 0) {
            console.log("No reports found to delete"); // Debug log
            return res.status(200).json({ msg: "No reports found to delete" });
        }

        res.status(200).json({ msg: "Reports deleted successfully", deletedCount: deletedReports.deletedCount });
    } catch (err) {
        console.error("Error deleting reports:", err);
        res.status(500).json({ msg: "Failed to delete reports", err: err.message });
    }
};

