import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Trash2, 
  FileText, 
  AlertTriangle, 
  TrendingUp, 
  MapPin, 
  Settings,
  Bell,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import UserManagementModal from '../components/admin/UserManagementModal';
import ReportDetailsModal from '../components/admin/ReportDetailsModal';
import AnalyticsDashboard from '../components/admin/AnalyticsDashboard';
import NotificationCenter from '../components/admin/NotificationCenter';
import AdminSettings from '../components/admin/AdminSettings';
import { io as socketIO } from 'socket.io-client';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardStats, setDashboardStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [connected, setConnected] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Socket.IO connection for real-time notifications
  useEffect(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8800';
    const socket = socketIO(backendUrl, { transports: ['websocket'] });

    const handleConnect = () => {
      setConnected(true);
      console.log('Connected to Socket.IO server');
      // Optionally authenticate user room if available
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user?.userId) {
            socket.emit('authenticate', user.userId);
          }
        }
      } catch {}
    };

    const handleDisconnect = () => {
      setConnected(false);
      console.log('Disconnected from Socket.IO server');
    };

    const handleBinAlert = (alert) => {
      setNotifications(prev => [alert, ...prev]);
      if (alert.alertType === 'FULLY FILLED') {
        toast.error(alert.message, { position: 'top-right', autoClose: 10000 });
      } else {
        toast.warning(alert.message, { position: 'top-right', autoClose: 8000 });
      }
    };

    const handleNotification = (notification) => {
      setNotifications(prev => [notification, ...prev]);
      toast.info(notification.message || 'New notification', { position: 'top-right', autoClose: 6000 });
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('binAlert', handleBinAlert);
    socket.on('notification', handleNotification);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('binAlert', handleBinAlert);
      socket.off('notification', handleNotification);
      socket.close();
    };
  }, []);

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const [statsRes, usersRes, reportsRes, binsRes] = await Promise.all([
        fetch('http://localhost:8800/api/admin/dashboard/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:8800/api/admin/users?limit=10', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:8800/api/admin/reports?limit=10', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:8800/api/admin/bins?limit=10', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const [stats, usersData, reportsData, binsData] = await Promise.all([
        statsRes.json(),
        usersRes.json(),
        reportsRes.json(),
        binsRes.json()
      ]);

      setDashboardStats(stats);
      setUsers(usersData.users || []);
      setReports(reportsData.reports || []);
      setBins(binsData.bins || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (action, selectedItems) => {
    try {
      const token = localStorage.getItem('token');
      
      if (action === 'approve') {
        await fetch('http://localhost:8800/api/admin/reports/bulk-update', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            reportIds: selectedItems,
            updates: { admin_status: 'approved' }
          })
        });
        toast.success('Reports approved successfully');
      } else if (action === 'reject') {
        await fetch('http://localhost:8800/api/admin/reports/bulk-update', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            reportIds: selectedItems,
            updates: { admin_status: 'rejected' }
          })
        });
        toast.success('Reports rejected successfully');
      }
      
      fetchDashboardData();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast.error('Failed to perform bulk action');
    }
  };

  const handleUserSave = async (userId, userData) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:8800/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to update user');
    }
    
    fetchDashboardData();
  };

  const handleUserDelete = async (userId) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:8800/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete user');
    }
    
    fetchDashboardData();
  };

  const handleReportStatusUpdate = async (reportId, status) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:8800/api/userreport/admin-update-report/${reportId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ admin_status: status })
    });
    
    if (!response.ok) {
      throw new Error('Failed to update report status');
    }
    
    fetchDashboardData();
  };

  const handleClearNotification = (index) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  const StatCard = ({ title, value, icon: Icon, color, trend, subtitle }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${color}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full ${color.replace('border-l-', 'bg-').replace('-500', '-100')}`}>
          <Icon className={`w-6 h-6 ${color.replace('border-l-', 'text-').replace('-500', '-600')}`} />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center">
          <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
          <span className="text-sm text-green-600">{trend}</span>
        </div>
      )}
    </motion.div>
  );

  const TabButton = ({ id, label, icon: Icon, isActive, onClick }) => (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(id)}
      className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all ${
        isActive 
          ? 'bg-blue-500 text-white shadow-lg' 
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <Icon className="w-5 h-5 mr-2" />
      {label}
    </motion.button>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer />
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">EcoTrack Waste Management System</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`flex items-center px-3 py-1 rounded-full text-sm ${
                connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  connected ? 'bg-green-500' : 'bg-red-500'
                }`} />
                {connected ? 'Connected' : 'Disconnected'}
              </div>
              <NotificationCenter
                notifications={notifications}
                onClearNotification={handleClearNotification}
                onClearAll={handleClearAllNotifications}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-2 mb-8">
          <TabButton
            id="overview"
            label="Overview"
            icon={BarChart3}
            isActive={activeTab === 'overview'}
            onClick={setActiveTab}
          />
          <TabButton
            id="users"
            label="Users"
            icon={Users}
            isActive={activeTab === 'users'}
            onClick={setActiveTab}
          />
          <TabButton
            id="reports"
            label="Reports"
            icon={FileText}
            isActive={activeTab === 'reports'}
            onClick={setActiveTab}
          />
          <TabButton
            id="bins"
            label="Waste Bins"
            icon={Trash2}
            isActive={activeTab === 'bins'}
            onClick={setActiveTab}
          />
          <TabButton
            id="analytics"
            label="Analytics"
            icon={PieChart}
            isActive={activeTab === 'analytics'}
            onClick={setActiveTab}
          />
          <TabButton
            id="settings"
            label="Settings"
            icon={Settings}
            isActive={activeTab === 'settings'}
            onClick={setActiveTab}
          />
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Total Users"
                  value={dashboardStats?.overview?.totalUsers || 0}
                  icon={Users}
                  color="border-l-blue-500"
                  subtitle="Registered users"
                />
                <StatCard
                  title="Waste Bins"
                  value={dashboardStats?.overview?.totalBins || 0}
                  icon={Trash2}
                  color="border-l-green-500"
                  subtitle={`${dashboardStats?.overview?.filledBins || 0} filled`}
                />
                <StatCard
                  title="Total Reports"
                  value={dashboardStats?.overview?.totalReports || 0}
                  icon={FileText}
                  color="border-l-yellow-500"
                  subtitle={`${dashboardStats?.overview?.pendingReports || 0} pending`}
                />
                <StatCard
                  title="Alerts"
                  value={notifications.length}
                  icon={AlertTriangle}
                  color="border-l-red-500"
                  subtitle="Active notifications"
                />
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Reports</h3>
                  <div className="space-y-3">
                    {dashboardStats?.recentActivity?.recentReports?.map((report, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{report.user_id?.name || 'Unknown User'}</p>
                          <p className="text-sm text-gray-600">{report.bin?.ward}, Zone {report.bin?.zone}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          report.admin_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          report.admin_status === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {report.admin_status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Users</h3>
                  <div className="space-y-3">
                    {dashboardStats?.recentActivity?.recentUsers?.map((user, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {user.isAdmin && <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">Admin</span>}
                          {user.isWasteCollector && <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Collector</span>}
                          {user.blacklisted && <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Blacklisted</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Notifications */}
              {notifications.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Notifications</h3>
                  <div className="space-y-3">
                    {notifications.slice(0, 5).map((alert, index) => (
                      <div key={index} className={`p-4 rounded-lg border-l-4 ${
                        alert.alertType === "FULLY FILLED" ? 'border-red-500 bg-red-50' : 'border-yellow-500 bg-yellow-50'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{alert.message}</p>
                            <p className="text-sm text-gray-600">
                              {alert.ward}, Zone {alert.zone} • {new Date(alert.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">{alert.realTimeCapacity}%</p>
                            <div className="w-16 h-2 bg-gray-200 rounded-full mt-1">
                              <div 
                                className={`h-2 rounded-full ${
                                  alert.realTimeCapacity >= 85 ? 'bg-red-500' : 'bg-yellow-500'
                                }`}
                                style={{ width: `${alert.realTimeCapacity}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <button 
                      onClick={() => {
                        setSelectedUser(null);
                        setShowUserModal(true);
                      }}
                      className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Add User
                    </button>
                    <button className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Name</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Email</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Phone</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Role</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Points</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900">{user.name}</div>
                          </td>
                          <td className="py-3 px-4 text-gray-600">{user.email}</td>
                          <td className="py-3 px-4 text-gray-600">{user.phoneNo}</td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-1">
                              {user.isAdmin && <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">Admin</span>}
                              {user.isWasteCollector && <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Collector</span>}
                              {!user.isAdmin && !user.isWasteCollector && <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">User</span>}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600">{user.points}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              user.blacklisted ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {user.blacklisted ? 'Blacklisted' : 'Active'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowUserModal(true);
                                }}
                                className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowUserModal(true);
                                }}
                                className="p-1 text-green-600 hover:bg-green-100 rounded"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'reports' && (
            <motion.div
              key="reports"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Report Management</h3>
                  <div className="flex items-center space-x-4">
                    <button 
                      onClick={() => handleBulkAction('approve', [])}
                      className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve Selected
                    </button>
                    <button 
                      onClick={() => handleBulkAction('reject', [])}
                      className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject Selected
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-900">User</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Location</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Admin Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">WC Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map((report) => (
                        <tr key={report._id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900">{report.user_id?.name || 'Unknown'}</div>
                            <div className="text-sm text-gray-600">{report.user_id?.email}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-gray-900">{report.bin?.ward}</div>
                            <div className="text-sm text-gray-600">Zone {report.bin?.zone}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              report.status === 'full' ? 'bg-red-100 text-red-800' :
                              report.status === 'partially filled' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {report.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              report.admin_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              report.admin_status === 'approved' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {report.admin_status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              report.wc_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              report.wc_status === 'done' ? 'bg-green-100 text-green-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {report.wc_status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {new Date(report.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => {
                                  setSelectedReport(report);
                                  setShowReportModal(true);
                                }}
                                className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleReportStatusUpdate(report._id, 'approved')}
                                className="p-1 text-green-600 hover:bg-green-100 rounded"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleReportStatusUpdate(report._id, 'rejected')}
                                className="p-1 text-red-600 hover:bg-red-100 rounded"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'bins' && (
            <motion.div
              key="bins"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Waste Bin Management</h3>
                  <div className="flex items-center space-x-4">
                    <button className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Add Bin
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Location</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Type</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Category</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Capacity</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Sensor</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bins.map((bin) => (
                        <tr key={bin._id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900">{bin.ward}</div>
                            <div className="text-sm text-gray-600">Zone {bin.zone}</div>
                          </td>
                          <td className="py-3 px-4 text-gray-600">{bin.binType}</td>
                          <td className="py-3 px-4 text-gray-600">{bin.category}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <div className="w-16 h-2 bg-gray-200 rounded-full mr-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    bin.realTimeCapacity >= 85 ? 'bg-red-500' :
                                    bin.realTimeCapacity >= 50 ? 'bg-yellow-500' :
                                    'bg-green-500'
                                  }`}
                                  style={{ width: `${bin.realTimeCapacity}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium">{bin.realTimeCapacity}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              bin.status === 'filled' ? 'bg-red-100 text-red-800' :
                              bin.status === 'partially_filled' ? 'bg-yellow-100 text-yellow-800' :
                              bin.status === 'empty' ? 'bg-green-100 text-green-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {bin.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              bin.sensorEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {bin.sensorEnabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <button className="p-1 text-blue-600 hover:bg-blue-100 rounded">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button className="p-1 text-green-600 hover:bg-green-100 rounded">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button className="p-1 text-red-600 hover:bg-red-100 rounded">
                                <Trash className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <AnalyticsDashboard />
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <AdminSettings />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <UserManagementModal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        user={selectedUser}
        onSave={handleUserSave}
        onDelete={handleUserDelete}
      />

      <ReportDetailsModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        report={selectedReport}
        onUpdateStatus={handleReportStatusUpdate}
      />
    </div>
  );
};

export default AdminDashboard;