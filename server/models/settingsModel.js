import mongoose from "mongoose";
const Schema = mongoose.Schema;

const settingsSchema = new Schema({
  notifications: {
    emailAlerts: {
      type: Boolean,
      default: true
    },
    smsAlerts: {
      type: Boolean,
      default: false
    },
    pushNotifications: {
      type: Boolean,
      default: true
    },
    criticalAlerts: {
      type: Boolean,
      default: true
    },
    warningAlerts: {
      type: Boolean,
      default: true
    },
    reportAlerts: {
      type: Boolean,
      default: true
    }
  },
  system: {
    autoApproval: {
      type: Boolean,
      default: false
    },
    maxReportsPerUser: {
      type: Number,
      default: 10,
      min: 1,
      max: 50
    },
    reportExpiryDays: {
      type: Number,
      default: 30,
      min: 1,
      max: 365
    },
    maintenanceMode: {
      type: Boolean,
      default: false
    },
    dataRetentionDays: {
      type: Number,
      default: 365,
      min: 30,
      max: 1095 // 3 years
    }
  },
  thresholds: {
    criticalCapacity: {
      type: Number,
      default: 85,
      min: 70,
      max: 100
    },
    warningCapacity: {
      type: Number,
      default: 50,
      min: 30,
      max: 80
    },
    lowCapacity: {
      type: Number,
      default: 25,
      min: 0,
      max: 50
    },
    autoCollectionThreshold: {
      type: Number,
      default: 90,
      min: 80,
      max: 100
    }
  },
  security: {
    requireTwoFactor: {
      type: Boolean,
      default: false
    },
    sessionTimeout: {
      type: Number,
      default: 60,
      min: 15,
      max: 480 // 8 hours
    },
    maxLoginAttempts: {
      type: Number,
      default: 5,
      min: 3,
      max: 10
    },
    passwordExpiry: {
      type: Number,
      default: 90,
      min: 30,
      max: 365
    }
  }
}, {
  timestamps: true
});

export default mongoose.model("Settings", settingsSchema);
