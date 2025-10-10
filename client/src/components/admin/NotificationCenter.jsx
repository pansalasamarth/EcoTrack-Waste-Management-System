import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  X, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Trash2, 
  Filter,
  Search,
  Settings
} from 'lucide-react';

const NotificationCenter = ({ notifications, onClearNotification, onClearAll }) => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = filter === 'all' || 
      (filter === 'critical' && notification.alertType === 'FULLY FILLED') ||
      (filter === 'warning' && notification.alertType === 'PARTIALLY FILLED');
    
    const matchesSearch = searchTerm === '' || 
      notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.ward.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const getNotificationIcon = (alertType) => {
    switch (alertType) {
      case 'FULLY FILLED':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'PARTIALLY FILLED':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  const getNotificationColor = (alertType) => {
    switch (alertType) {
      case 'FULLY FILLED':
        return 'border-red-500 bg-red-50';
      case 'PARTIALLY FILLED':
        return 'border-yellow-500 bg-yellow-50';
      default:
        return 'border-blue-500 bg-blue-50';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-6 h-6" />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {notifications.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50"
          >
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                <div className="flex items-center space-x-2">
                  {notifications.length > 0 && (
                    <button
                      onClick={onClearAll}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Clear All
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Search and Filter */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search notifications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    All ({notifications.length})
                  </button>
                  <button
                    onClick={() => setFilter('critical')}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      filter === 'critical' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Critical ({notifications.filter(n => n.alertType === 'FULLY FILLED').length})
                  </button>
                  <button
                    onClick={() => setFilter('warning')}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      filter === 'warning' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Warning ({notifications.filter(n => n.alertType === 'PARTIALLY FILLED').length})
                  </button>
                </div>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No notifications found</p>
                </div>
              ) : (
                <div className="p-2">
                  {filteredNotifications.map((notification, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className={`p-3 mb-2 rounded-lg border-l-4 ${getNotificationColor(notification.alertType)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          {getNotificationIcon(notification.alertType)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 line-clamp-2">
                              {notification.message}
                            </p>
                            <div className="mt-1 flex items-center space-x-2 text-xs text-gray-600">
                              <span>{notification.ward}, Zone {notification.zone}</span>
                              <span>•</span>
                              <span>{new Date(notification.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <div className="mt-2 flex items-center space-x-2">
                              <div className="flex-1 h-1.5 bg-gray-200 rounded-full">
                                <div 
                                  className={`h-1.5 rounded-full ${
                                    notification.realTimeCapacity >= 85 ? 'bg-red-500' : 'bg-yellow-500'
                                  }`}
                                  style={{ width: `${notification.realTimeCapacity}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium text-gray-600">
                                {notification.realTimeCapacity}%
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => onClearNotification(index)}
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {filteredNotifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>{filteredNotifications.length} notification(s)</span>
                  <button
                    onClick={onClearAll}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Mark all as read
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;
