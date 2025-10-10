import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Save, 
  Bell, 
  Shield, 
  Database, 
  Mail, 
  Smartphone,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { toast } from 'react-toastify';

const AdminSettings = () => {
  const [settings, setSettings] = useState({
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

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('notifications');

  useEffect(() => {
    // Load settings from API
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8800/api/admin/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8800/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        toast.success('Settings saved successfully');
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const TabButton = ({ id, label, icon: Icon, isActive, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all ${
        isActive 
          ? 'bg-blue-500 text-white shadow-lg' 
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <Icon className="w-4 h-4 mr-2" />
      {label}
    </button>
  );

  const SettingItem = ({ label, description, children }) => (
    <div className="flex items-center justify-between py-4 border-b border-gray-200 last:border-b-0">
      <div className="flex-1">
        <h4 className="text-sm font-medium text-gray-900">{label}</h4>
        {description && (
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        )}
      </div>
      <div className="ml-4">
        {children}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
          <p className="text-gray-600">Configure system preferences and notifications</p>
        </div>
        <button
          onClick={saveSettings}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-2">
        <TabButton
          id="notifications"
          label="Notifications"
          icon={Bell}
          isActive={activeTab === 'notifications'}
          onClick={setActiveTab}
        />
        <TabButton
          id="system"
          label="System"
          icon={Database}
          isActive={activeTab === 'system'}
          onClick={setActiveTab}
        />
        <TabButton
          id="thresholds"
          label="Thresholds"
          icon={AlertTriangle}
          isActive={activeTab === 'thresholds'}
          onClick={setActiveTab}
        />
        <TabButton
          id="security"
          label="Security"
          icon={Shield}
          isActive={activeTab === 'security'}
          onClick={setActiveTab}
        />
      </div>

      {/* Settings Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white rounded-xl shadow-lg p-6"
      >
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>
            
            <SettingItem
              label="Email Alerts"
              description="Receive notifications via email"
            >
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.emailAlerts}
                  onChange={(e) => updateSetting('notifications', 'emailAlerts', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </SettingItem>

            <SettingItem
              label="SMS Alerts"
              description="Receive notifications via SMS"
            >
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.smsAlerts}
                  onChange={(e) => updateSetting('notifications', 'smsAlerts', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </SettingItem>

            <SettingItem
              label="Push Notifications"
              description="Receive browser push notifications"
            >
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.pushNotifications}
                  onChange={(e) => updateSetting('notifications', 'pushNotifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </SettingItem>

            <SettingItem
              label="Critical Alerts"
              description="Notifications for bins at critical capacity"
            >
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.criticalAlerts}
                  onChange={(e) => updateSetting('notifications', 'criticalAlerts', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </SettingItem>

            <SettingItem
              label="Warning Alerts"
              description="Notifications for bins at warning capacity"
            >
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.warningAlerts}
                  onChange={(e) => updateSetting('notifications', 'warningAlerts', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </SettingItem>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Configuration</h3>
            
            <SettingItem
              label="Auto-approval"
              description="Automatically approve reports from trusted users"
            >
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.system.autoApproval}
                  onChange={(e) => updateSetting('system', 'autoApproval', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </SettingItem>

            <SettingItem
              label="Max Reports Per User"
              description="Maximum number of reports a user can submit per day"
            >
              <input
                type="number"
                min="1"
                max="50"
                value={settings.system.maxReportsPerUser}
                onChange={(e) => updateSetting('system', 'maxReportsPerUser', parseInt(e.target.value))}
                className="w-20 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </SettingItem>

            <SettingItem
              label="Report Expiry Days"
              description="Number of days before reports are automatically archived"
            >
              <input
                type="number"
                min="1"
                max="365"
                value={settings.system.reportExpiryDays}
                onChange={(e) => updateSetting('system', 'reportExpiryDays', parseInt(e.target.value))}
                className="w-20 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </SettingItem>

            <SettingItem
              label="Maintenance Mode"
              description="Put the system in maintenance mode"
            >
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.system.maintenanceMode}
                  onChange={(e) => updateSetting('system', 'maintenanceMode', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </SettingItem>
          </div>
        )}

        {activeTab === 'thresholds' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Capacity Thresholds</h3>
            
            <SettingItem
              label="Critical Capacity"
              description="Percentage at which bins are considered critically full"
            >
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="70"
                  max="100"
                  value={settings.thresholds.criticalCapacity}
                  onChange={(e) => updateSetting('thresholds', 'criticalCapacity', parseInt(e.target.value))}
                  className="w-24"
                />
                <span className="text-sm font-medium w-12">{settings.thresholds.criticalCapacity}%</span>
              </div>
            </SettingItem>

            <SettingItem
              label="Warning Capacity"
              description="Percentage at which bins trigger warning alerts"
            >
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="30"
                  max="80"
                  value={settings.thresholds.warningCapacity}
                  onChange={(e) => updateSetting('thresholds', 'warningCapacity', parseInt(e.target.value))}
                  className="w-24"
                />
                <span className="text-sm font-medium w-12">{settings.thresholds.warningCapacity}%</span>
              </div>
            </SettingItem>

            <SettingItem
              label="Low Capacity"
              description="Percentage below which bins are considered empty"
            >
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={settings.thresholds.lowCapacity}
                  onChange={(e) => updateSetting('thresholds', 'lowCapacity', parseInt(e.target.value))}
                  className="w-24"
                />
                <span className="text-sm font-medium w-12">{settings.thresholds.lowCapacity}%</span>
              </div>
            </SettingItem>

            <SettingItem
              label="Auto Collection Threshold"
              description="Percentage at which automatic collection is triggered"
            >
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="80"
                  max="100"
                  value={settings.thresholds.autoCollectionThreshold}
                  onChange={(e) => updateSetting('thresholds', 'autoCollectionThreshold', parseInt(e.target.value))}
                  className="w-24"
                />
                <span className="text-sm font-medium w-12">{settings.thresholds.autoCollectionThreshold}%</span>
              </div>
            </SettingItem>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h3>
            
            <SettingItem
              label="Two-Factor Authentication"
              description="Require 2FA for admin accounts"
            >
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.security.requireTwoFactor}
                  onChange={(e) => updateSetting('security', 'requireTwoFactor', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </SettingItem>

            <SettingItem
              label="Session Timeout"
              description="Minutes before session expires"
            >
              <input
                type="number"
                min="15"
                max="480"
                value={settings.security.sessionTimeout}
                onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
                className="w-20 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </SettingItem>

            <SettingItem
              label="Max Login Attempts"
              description="Maximum failed login attempts before lockout"
            >
              <input
                type="number"
                min="3"
                max="10"
                value={settings.security.maxLoginAttempts}
                onChange={(e) => updateSetting('security', 'maxLoginAttempts', parseInt(e.target.value))}
                className="w-20 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </SettingItem>

            <SettingItem
              label="Password Expiry"
              description="Days before password expires"
            >
              <input
                type="number"
                min="30"
                max="365"
                value={settings.security.passwordExpiry}
                onChange={(e) => updateSetting('security', 'passwordExpiry', parseInt(e.target.value))}
                className="w-20 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </SettingItem>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AdminSettings;
