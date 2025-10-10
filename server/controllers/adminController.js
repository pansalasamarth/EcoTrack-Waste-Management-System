import User from "../models/userModel.js";
import UserReport from "../models/userReportModel.js";
import WasteBin from "../models/wasteBinModel.js";
import bcrypt from "bcryptjs";

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalBins,
      totalReports,
      pendingReports,
      filledBins,
      partiallyFilledBins,
      recentReports,
      recentUsers
    ] = await Promise.all([
      User.countDocuments(),
      WasteBin.countDocuments(),
      UserReport.countDocuments(),
      UserReport.countDocuments({ admin_status: "pending" }),
      WasteBin.countDocuments({ status: "filled" }),
      WasteBin.countDocuments({ status: "partially_filled" }),
      UserReport.find()
        .populate('user_id', 'name email')
        .populate('bin', 'ward zone')
        .sort({ createdAt: -1 })
        .limit(5),
      User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name email phoneNo isAdmin isWasteCollector points blacklisted createdAt')
    ]);

    // Calculate bin status distribution
    const binStatusStats = await WasteBin.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    // Calculate reports by status
    const reportStatusStats = await UserReport.aggregate([
      {
        $group: {
          _id: "$admin_status",
          count: { $sum: 1 }
        }
      }
    ]);

    // Calculate capacity distribution
    const capacityStats = await WasteBin.aggregate([
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $lt: ["$realTimeCapacity", 25] }, then: "0-25%" },
                { case: { $lt: ["$realTimeCapacity", 50] }, then: "25-50%" },
                { case: { $lt: ["$realTimeCapacity", 75] }, then: "50-75%" },
                { case: { $lt: ["$realTimeCapacity", 100] }, then: "75-100%" }
              ],
              default: "100%"
            }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    // Calculate ward-wise statistics
    const wardStats = await WasteBin.aggregate([
      {
        $group: {
          _id: "$ward",
          totalBins: { $sum: 1 },
          filledBins: {
            $sum: { $cond: [{ $eq: ["$status", "filled"] }, 1, 0] }
          },
          avgCapacity: { $avg: "$realTimeCapacity" }
        }
      },
      { $sort: { totalBins: -1 } }
    ]);

    res.status(200).json({
      overview: {
        totalUsers,
        totalBins,
        totalReports,
        pendingReports,
        filledBins,
        partiallyFilledBins
      },
      recentActivity: {
        recentReports,
        recentUsers
      },
      statistics: {
        binStatusStats,
        reportStatusStats,
        capacityStats,
        wardStats
      }
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ msg: "Failed to fetch dashboard statistics", error: error.message });
  }
};

// Get all users with pagination and filtering
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", role = "", status = "" } = req.query;
    const skip = (page - 1) * limit;

    // Build filter object
    let filter = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phoneNo: { $regex: search, $options: "i" } }
      ];
    }

    if (role === "admin") {
      filter.isAdmin = true;
    } else if (role === "collector") {
      filter.isWasteCollector = true;
    } else if (role === "user") {
      filter.isAdmin = false;
      filter.isWasteCollector = false;
    }

    if (status === "blacklisted") {
      filter.blacklisted = true;
    } else if (status === "active") {
      filter.blacklisted = false;
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter)
    ]);

    res.status(200).json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ msg: "Failed to fetch users", error: error.message });
  }
};

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password');
    
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Get user's reports
    const userReports = await UserReport.find({ user_id: id })
      .populate('bin', 'ward zone location')
      .sort({ createdAt: -1 });

    res.status(200).json({ user, reports: userReports });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ msg: "Failed to fetch user", error: error.message });
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phoneNo, isAdmin, isWasteCollector, points, blacklisted, ward, zone } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phoneNo !== undefined) updateData.phoneNo = phoneNo;
    if (isAdmin !== undefined) updateData.isAdmin = isAdmin;
    if (isWasteCollector !== undefined) updateData.isWasteCollector = isWasteCollector;
    if (points !== undefined) updateData.points = points;
    if (blacklisted !== undefined) updateData.blacklisted = blacklisted;
    if (ward !== undefined) updateData.ward = ward;
    if (zone !== undefined) updateData.zone = zone;

    const user = await User.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
    
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.status(200).json({ msg: "User updated successfully", user });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ msg: "Failed to update user", error: error.message });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Delete user's reports first
    await UserReport.deleteMany({ user_id: id });
    
    // Delete user
    await User.findByIdAndDelete(id);

    res.status(200).json({ msg: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ msg: "Failed to delete user", error: error.message });
  }
};

// Get all reports with advanced filtering
export const getAllReportsAdmin = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status = "", 
      admin_status = "", 
      wc_status = "",
      ward = "",
      zone = "",
      dateFrom = "",
      dateTo = ""
    } = req.query;
    
    const skip = (page - 1) * limit;

    // Build filter object
    let filter = {};
    
    if (status) filter.status = status;
    if (admin_status) filter.admin_status = admin_status;
    if (wc_status) filter.wc_status = wc_status;
    
    // Date range filter
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    const [reports, total] = await Promise.all([
      UserReport.find(filter)
        .populate('user_id', 'name email phoneNo')
        .populate('bin', 'ward zone location status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      UserReport.countDocuments(filter)
    ]);

    // Filter by ward/zone if specified
    let filteredReports = reports;
    if (ward || zone) {
      filteredReports = reports.filter(report => {
        if (ward && report.bin && report.bin.ward !== ward) return false;
        if (zone && report.bin && report.bin.zone !== zone) return false;
        return true;
      });
    }

    res.status(200).json({
      reports: filteredReports,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalReports: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ msg: "Failed to fetch reports", error: error.message });
  }
};

// Get all waste bins with filtering
export const getAllBinsAdmin = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status = "", 
      ward = "", 
      zone = "",
      category = "",
      binType = "",
      sensorEnabled = ""
    } = req.query;
    
    const skip = (page - 1) * limit;

    // Build filter object
    let filter = {};
    
    if (status) filter.status = status;
    if (ward) filter.ward = ward;
    if (zone) filter.zone = zone;
    if (category) filter.category = category;
    if (binType) filter.binType = binType;
    if (sensorEnabled !== "") filter.sensorEnabled = sensorEnabled === "true";

    const [bins, total] = await Promise.all([
      WasteBin.find(filter)
        .sort({ realTimeCapacity: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      WasteBin.countDocuments(filter)
    ]);

    res.status(200).json({
      bins,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalBins: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error("Error fetching bins:", error);
    res.status(500).json({ msg: "Failed to fetch bins", error: error.message });
  }
};

// Bulk update reports
export const bulkUpdateReports = async (req, res) => {
  try {
    const { reportIds, updates } = req.body;
    
    if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
      return res.status(400).json({ msg: "Report IDs array is required" });
    }

    const result = await UserReport.updateMany(
      { _id: { $in: reportIds } },
      { $set: updates }
    );

    res.status(200).json({ 
      msg: "Reports updated successfully", 
      modifiedCount: result.modifiedCount 
    });
  } catch (error) {
    console.error("Error bulk updating reports:", error);
    res.status(500).json({ msg: "Failed to bulk update reports", error: error.message });
  }
};

// Get analytics data
export const getAnalytics = async (req, res) => {
  try {
    const { period = "7d" } = req.query; // 7d, 30d, 90d, 1y
    
    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case "7d":
        dateFilter = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
        break;
      case "30d":
        dateFilter = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
        break;
      case "90d":
        dateFilter = { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) };
        break;
      case "1y":
        dateFilter = { $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) };
        break;
    }

    // Reports over time
    const reportsOverTime = await UserReport.aggregate([
      { $match: { createdAt: dateFilter } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
    ]);

    // User registrations over time
    const usersOverTime = await User.aggregate([
      { $match: { createdAt: dateFilter } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
    ]);

    // Top wards by reports
    const topWardsByReports = await UserReport.aggregate([
      { $match: { createdAt: dateFilter } },
      { $lookup: { from: "wastebins", localField: "bin", foreignField: "_id", as: "binData" } },
      { $unwind: "$binData" },
      {
        $group: {
          _id: "$binData.ward",
          reportCount: { $sum: 1 }
        }
      },
      { $sort: { reportCount: -1 } },
      { $limit: 10 }
    ]);

    // Bin capacity trends
    const capacityTrends = await WasteBin.aggregate([
      {
        $group: {
          _id: "$ward",
          avgCapacity: { $avg: "$realTimeCapacity" },
          maxCapacity: { $max: "$realTimeCapacity" },
          minCapacity: { $min: "$realTimeCapacity" },
          binCount: { $sum: 1 }
        }
      },
      { $sort: { avgCapacity: -1 } }
    ]);

    res.status(200).json({
      reportsOverTime,
      usersOverTime,
      topWardsByReports,
      capacityTrends
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ msg: "Failed to fetch analytics", error: error.message });
  }
};
