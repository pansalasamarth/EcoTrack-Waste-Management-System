import mongoose from 'mongoose';
import UserReport from '../models/userReportModel.js';
import WasteBin from '../models/wasteBinModel.js';
import User from '../models/userModel.js';

const optimizeDatabase = async () => {
  try {
    console.log('Starting database optimization...');

    // Create indexes for UserReport collection
    await UserReport.collection.createIndex({ user_id: 1 });
    await UserReport.collection.createIndex({ admin_status: 1 });
    await UserReport.collection.createIndex({ wc_status: 1 });
    await UserReport.collection.createIndex({ bin: 1 });
    await UserReport.collection.createIndex({ createdAt: -1 });
    await UserReport.collection.createIndex({ user_id: 1, admin_status: 1 });
    await UserReport.collection.createIndex({ user_id: 1, createdAt: -1 });

    // Create indexes for WasteBin collection
    await WasteBin.collection.createIndex({ status: 1 });
    await WasteBin.collection.createIndex({ ward: 1 });
    await WasteBin.collection.createIndex({ zone: 1 });
    await WasteBin.collection.createIndex({ category: 1 });
    await WasteBin.collection.createIndex({ binType: 1 });
    await WasteBin.collection.createIndex({ sensorEnabled: 1 });
    await WasteBin.collection.createIndex({ realTimeCapacity: -1 });
    await WasteBin.collection.createIndex({ location: '2dsphere' }); // For geospatial queries

    // Create indexes for User collection
    await User.collection.createIndex({ phoneNo: 1 });
    await User.collection.createIndex({ email: 1 });
    await User.collection.createIndex({ isAdmin: 1 });
    await User.collection.createIndex({ isWasteCollector: 1 });
    await User.collection.createIndex({ blacklisted: 1 });

    console.log('Database optimization completed successfully!');
    console.log('Indexes created for:');
    console.log('- UserReport: user_id, admin_status, wc_status, bin, createdAt');
    console.log('- WasteBin: status, ward, zone, category, binType, sensorEnabled, realTimeCapacity, location');
    console.log('- User: phoneNo, email, isAdmin, isWasteCollector, blacklisted');

  } catch (error) {
    console.error('Error optimizing database:', error);
  }
};

export default optimizeDatabase;
