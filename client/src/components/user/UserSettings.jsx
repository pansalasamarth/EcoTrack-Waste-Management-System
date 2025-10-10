import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  MapPin, 
  Shield, 
  Moon, 
  Sun, 
  Volume2, 
  VolumeX,
  Eye,
  EyeOff,
  Save,
  RotateCcw
} from 'lucide-react';

const UserSettings = () => {
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      sms: false,
      binUpdates: true,
      achievements: true,
      weeklyReport: true
    },
    privacy: {
      locationTracking: true,
      profileVisibility: 'public',
      dataSharing: false,
      analytics: true
    },
    appearance: {
      theme: 'light',
      language: 'en',
      fontSize: 'medium'
    },
    security: {
      twoFactor: false,
      sessionTimeout: 30,
      loginAlerts: true
    }
  });

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleNotificationChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value
      }
    }));
  };

  const handlePrivacyChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: value
      }
    }));
  };

  const handleAppearanceChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      appearance: {
        ...prev.appearance,
        [key]: value
      }
    }));
  };

  const handleSecurityChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      security: {
        ...prev.security,
        [key]: value
      }
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    // Handle password change logic here
    console.log('Password change requested');
    setShowPasswordForm(false);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleSaveSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8800/api/users/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        // Show success message
        console.log('Settings saved successfully');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const ToggleSwitch = ({ enabled, onChange, label, description }) => (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1">
        <h4 className="font-medium text-gray-900">{label}</h4>
        {description && <p className="text-sm text-gray-600">{description}</p>}
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={enabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
      </label>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Notifications Settings */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            Notifications
          </h3>
        </div>
        
        <div className="space-y-1">
          <ToggleSwitch
            enabled={settings.notifications.email}
            onChange={(value) => handleNotificationChange('email', value)}
            label="Email Notifications"
            description="Receive notifications via email"
          />
          <ToggleSwitch
            enabled={settings.notifications.push}
            onChange={(value) => handleNotificationChange('push', value)}
            label="Push Notifications"
            description="Receive push notifications in browser"
          />
          <ToggleSwitch
            enabled={settings.notifications.sms}
            onChange={(value) => handleNotificationChange('sms', value)}
            label="SMS Notifications"
            description="Receive notifications via SMS"
          />
          <ToggleSwitch
            enabled={settings.notifications.binUpdates}
            onChange={(value) => handleNotificationChange('binUpdates', value)}
            label="Bin Status Updates"
            description="Get notified when bin status changes"
          />
          <ToggleSwitch
            enabled={settings.notifications.achievements}
            onChange={(value) => handleNotificationChange('achievements', value)}
            label="Achievement Notifications"
            description="Get notified when you earn achievements"
          />
          <ToggleSwitch
            enabled={settings.notifications.weeklyReport}
            onChange={(value) => handleNotificationChange('weeklyReport', value)}
            label="Weekly Reports"
            description="Receive weekly environmental impact reports"
          />
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Privacy & Security
          </h3>
        </div>
        
        <div className="space-y-1">
          <ToggleSwitch
            enabled={settings.privacy.locationTracking}
            onChange={(value) => handlePrivacyChange('locationTracking', value)}
            label="Location Tracking"
            description="Allow location tracking for better bin recommendations"
          />
          <ToggleSwitch
            enabled={settings.privacy.dataSharing}
            onChange={(value) => handlePrivacyChange('dataSharing', value)}
            label="Data Sharing"
            description="Share anonymous data to improve the service"
          />
          <ToggleSwitch
            enabled={settings.privacy.analytics}
            onChange={(value) => handlePrivacyChange('analytics', value)}
            label="Analytics"
            description="Help us improve by sharing usage analytics"
          />
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Profile Visibility
          </label>
          <select
            value={settings.privacy.profileVisibility}
            onChange={(e) => handlePrivacyChange('profileVisibility', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="public">Public</option>
            <option value="friends">Friends Only</option>
            <option value="private">Private</option>
          </select>
        </div>

        <div className="mt-6">
          <button
            onClick={() => setShowPasswordForm(true)}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Shield className="w-4 h-4 mr-2" />
            Change Password
          </button>
        </div>
      </div>

      {/* Appearance Settings */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Sun className="w-5 h-5 mr-2" />
            Appearance
          </h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Theme
            </label>
            <div className="flex space-x-4">
              <button
                onClick={() => handleAppearanceChange('theme', 'light')}
                className={`flex items-center px-4 py-2 rounded-lg border-2 ${
                  settings.appearance.theme === 'light' 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200'
                }`}
              >
                <Sun className="w-4 h-4 mr-2" />
                Light
              </button>
              <button
                onClick={() => handleAppearanceChange('theme', 'dark')}
                className={`flex items-center px-4 py-2 rounded-lg border-2 ${
                  settings.appearance.theme === 'dark' 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200'
                }`}
              >
                <Moon className="w-4 h-4 mr-2" />
                Dark
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Language
            </label>
            <select
              value={settings.appearance.language}
              onChange={(e) => handleAppearanceChange('language', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="gu">Gujarati</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Font Size
            </label>
            <select
              value={settings.appearance.fontSize}
              onChange={(e) => handleAppearanceChange('fontSize', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
        </div>
      </div>

      {/* Save Settings Button */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={() => window.location.reload()}
          className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </button>
        <button
          onClick={handleSaveSettings}
          className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Settings
        </button>
      </div>

      {/* Password Change Modal */}
      {showPasswordForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordForm(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSettings;
