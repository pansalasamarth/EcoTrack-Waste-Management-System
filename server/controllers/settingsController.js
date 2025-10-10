import Settings from "../models/settingsModel.js";

// Get system settings
export const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    
    // If no settings exist, create default settings
    if (!settings) {
      settings = new Settings({
        notifications: {
          emailAlerts: true,
          smsAlerts: false,
          pushNotifications: true,
          criticalAlerts: true,
          warningAlerts: true,
          reportAlerts: true
        },
        system: {
          autoApproval: false,
          maxReportsPerUser: 10,
          reportExpiryDays: 30,
          maintenanceMode: false,
          dataRetentionDays: 365
        },
        thresholds: {
          criticalCapacity: 85,
          warningCapacity: 50,
          lowCapacity: 25,
          autoCollectionThreshold: 90
        },
        security: {
          requireTwoFactor: false,
          sessionTimeout: 60,
          maxLoginAttempts: 5,
          passwordExpiry: 90
        }
      });
      await settings.save();
    }

    res.status(200).json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ msg: "Failed to fetch settings", error: error.message });
  }
};

// Update system settings
export const updateSettings = async (req, res) => {
  try {
    const updates = req.body;
    
    let settings = await Settings.findOne();
    
    if (!settings) {
      // Create new settings if none exist
      settings = new Settings(updates);
    } else {
      // Update existing settings
      Object.keys(updates).forEach(key => {
        if (settings[key] && typeof settings[key] === 'object') {
          settings[key] = { ...settings[key], ...updates[key] };
        } else {
          settings[key] = updates[key];
        }
      });
    }

    await settings.save();
    res.status(200).json({ msg: "Settings updated successfully", settings });
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({ msg: "Failed to update settings", error: error.message });
  }
};

// Reset settings to default
export const resetSettings = async (req, res) => {
  try {
    const defaultSettings = {
      notifications: {
        emailAlerts: true,
        smsAlerts: false,
        pushNotifications: true,
        criticalAlerts: true,
        warningAlerts: true,
        reportAlerts: true
      },
      system: {
        autoApproval: false,
        maxReportsPerUser: 10,
        reportExpiryDays: 30,
        maintenanceMode: false,
        dataRetentionDays: 365
      },
      thresholds: {
        criticalCapacity: 85,
        warningCapacity: 50,
        lowCapacity: 25,
        autoCollectionThreshold: 90
      },
      security: {
        requireTwoFactor: false,
        sessionTimeout: 60,
        maxLoginAttempts: 5,
        passwordExpiry: 90
      }
    };

    await Settings.findOneAndUpdate({}, defaultSettings, { upsert: true, new: true });
    
    res.status(200).json({ msg: "Settings reset to default successfully", settings: defaultSettings });
  } catch (error) {
    console.error("Error resetting settings:", error);
    res.status(500).json({ msg: "Failed to reset settings", error: error.message });
  }
};
