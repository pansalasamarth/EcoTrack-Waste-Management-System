import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { 
  MapPin, 
  FileText, 
  User, 
  Settings,
  BarChart3,
  Trophy,
  Leaf,
  Clock,
  TrendingUp,
  Bell,
  Search,
  Filter,
  Eye,
  Edit,
  Trash,
  CheckCircle,
  LogOut,
  XCircle,
  Activity,
  Award,
  Target,
  Zap
} from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useContext } from 'react';
import { AuthContext } from '../context/authContext';
import { lazy, Suspense } from 'react';
const Map = lazy(() => import('./map/Map'));
import UserReportForm from './userReportForm';
import UserProfile from '../components/user/UserProfile';
import UserSettings from '../components/user/UserSettings';
import ReportCard from '../components/user/ReportCard';
import ReportDetailsModal from '../components/user/ReportDetailsModal';

const UserDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [userStats, setUserStats] = useState({
    totalReports: 0,
    approvedReports: 0,
    pendingReports: 0,
    rejectedReports: 0,
    co2Saved: 0,
    wasteDiverted: 0,
    energySaved: 0,
    treesEquivalent: 0,
    uniqueLocations: 0,
    consecutiveDays: 0,
    achievementsUnlocked: 0
  });
  const [userReports, setUserReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [connected, setConnected] = useState(false);
  const [showReportDetails, setShowReportDetails] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const { currUser } = useContext(AuthContext);

  // Socket.IO connection for real-time notifications
  useEffect(() => {
    const socket = io('http://localhost:8800', {
      transports: ['websocket', 'polling']
    });
    
    socket.on('connect', () => {
      setConnected(true);
      console.log('Connected to notification server');
      
      // Authenticate with user ID if available
      if (currUser?.userId) {
        socket.emit('authenticate', currUser.userId);
      }
    });
    
    socket.on('disconnect', () => {
      setConnected(false);
      console.log('Disconnected from notification server');
    });

    socket.on('notification', (alert) => {
      setNotifications(prev => [alert, ...prev]);
      
      toast.info(alert.message, {
        position: "top-right",
        autoClose: 5000,
      });
    });

    socket.on('reportUpdate', (data) => {
      // Handle report status updates
      setUserReports(prev => 
        prev.map(report => 
          report._id === data.reportId 
            ? { ...report, ...data.updates }
            : report
        )
      );
      
      toast.success('Report status updated!', {
        position: "top-right",
        autoClose: 3000,
      });
    });

    return () => socket.disconnect();
  }, [currUser?.userId]);

  // Fetch user dashboard data
  useEffect(() => {
    if (currUser?.userId) {
      fetchUserData();
    } else {
      // If no user, stop loading after a short delay
      const timer = setTimeout(() => {
        setLoading(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currUser?.userId]);

  // Add timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('Dashboard loading timeout - stopping loading state');
        setLoading(false);
        toast.warning('Dashboard took too long to load. Some data may be missing.');
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [loading]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const userId = currUser?.userId;
      
      console.log('Fetching user data for userId:', userId);
      console.log('Backend URL:', import.meta.env.VITE_BACKEND_URL);
      
      // Fallback URL if environment variable is not set
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8800';
      console.log('Using backend URL:', backendUrl);
      
      if (!userId) {
        console.error('User ID not available');
        setLoading(false);
        return;
      }
      
      if (!token) {
        console.error('No token available');
        toast.error('Please log in to access dashboard');
        setLoading(false);
        return;
      }
      
      // Fetch stats first (faster)
      console.log('Fetching dashboard stats...');
      const statsRes = await fetch(`${backendUrl}/api/userreport/dashboard-stats/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('Stats response status:', statsRes.status);
      if (statsRes.ok) {
        const stats = await statsRes.json();
        console.log('Stats loaded:', stats);
        setUserStats(stats);
      } else {
        console.error('Failed to fetch stats:', statsRes.status, await statsRes.text());
      }
      
      // Fetch only recent reports (limit to 5 for initial load)
      console.log('Fetching user reports...');
      const reportsRes = await fetch(`${backendUrl}/api/userreport/user-reports/${userId}?limit=5`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('Reports response status:', reportsRes.status);
      if (reportsRes.ok) {
        const reportsData = await reportsRes.json();
        console.log('Reports loaded:', reportsData);
        setUserReports(reportsData.reports || []);
      } else {
        console.error('Failed to fetch reports:', reportsRes.status, await reportsRes.text());
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  // Fetch more reports when needed
  const fetchMoreReports = async (page = 1) => {
    try {
      const token = localStorage.getItem('token');
      const userId = currUser?.userId;
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8800';
      
      const reportsRes = await fetch(`${backendUrl}/api/userreport/user-reports/${userId}?page=${page}&limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (reportsRes.ok) {
        const reportsData = await reportsRes.json();
        if (page === 1) {
          setUserReports(reportsData.reports || []);
        } else {
          setUserReports(prev => [...prev, ...(reportsData.reports || [])]);
        }
        return reportsData.pagination;
      }
    } catch (error) {
      console.error('Error fetching more reports:', error);
    }
  };

  const handleClearNotification = (index) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    window.location.href = '/';
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
          ? 'bg-green-500 text-white shadow-lg' 
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <Icon className="w-5 h-5 mr-2" />
      {label}
    </motion.button>
  );

  const AchievementCard = ({ title, description, icon: Icon, unlocked, progress }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`p-4 rounded-lg border-2 ${
        unlocked 
          ? 'border-green-500 bg-green-50' 
          : 'border-gray-200 bg-gray-50'
      }`}
    >
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-full ${
          unlocked ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
        }`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className={`font-semibold ${unlocked ? 'text-green-800' : 'text-gray-600'}`}>
            {title}
          </h4>
          <p className="text-sm text-gray-600">{description}</p>
          {!unlocked && progress && (
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{progress}% complete</p>
            </div>
          )}
        </div>
        {unlocked && <Trophy className="w-5 h-5 text-yellow-500" />}
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600">Loading dashboard...</p>
          <button 
            onClick={() => {
              console.log('Force stopping loading...');
              setLoading(false);
            }}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Stop Loading (Debug)
          </button>
        </div>
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
              <h1 className="text-2xl font-bold text-gray-900">User Dashboard</h1>
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
              <div className="relative">
                <button className="p-2 text-gray-600 hover:text-gray-900 relative">
                  <Bell className="w-6 h-6" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </button>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                title="Logout"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
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
            id="map"
            label="Map"
            icon={MapPin}
            isActive={activeTab === 'map'}
            onClick={setActiveTab}
          />
          <TabButton
            id="reports"
            label="My Reports"
            icon={FileText}
            isActive={activeTab === 'reports'}
            onClick={setActiveTab}
          />
          <TabButton
            id="achievements"
            label="Achievements"
            icon={Trophy}
            isActive={activeTab === 'achievements'}
            onClick={setActiveTab}
          />
          <TabButton
            id="profile"
            label="Profile"
            icon={User}
            isActive={activeTab === 'profile'}
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
                  title="Total Reports"
                  value={userStats?.totalReports || 0}
                  icon={FileText}
                  color="border-l-blue-500"
                  subtitle="Reports submitted"
                />
                <StatCard
                  title="Points Earned"
                  value={currUser?.points || 0}
                  icon={Award}
                  color="border-l-yellow-500"
                  subtitle="Environmental points"
                />
                <StatCard
                  title="CO2 Saved"
                  value={`${userStats?.co2Saved || 0}kg`}
                  icon={Leaf}
                  color="border-l-green-500"
                  subtitle="Carbon footprint reduced"
                />
                <StatCard
                  title="Achievements"
                  value={userStats?.achievementsUnlocked || 0}
                  icon={Trophy}
                  color="border-l-purple-500"
                  subtitle="Badges earned"
                />
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Reports</h3>
                  <div className="space-y-3">
                    {userReports.slice(0, 5).map((report, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">Report #{report._id.slice(-6)}</p>
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Environmental Impact</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Waste Diverted</span>
                      <span className="font-semibold">{userStats?.wasteDiverted || 0}kg</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Energy Saved</span>
                      <span className="font-semibold">{userStats?.energySaved || 0}kWh</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Trees Equivalent</span>
                      <span className="font-semibold">{userStats?.treesEquivalent || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notifications */}
              {notifications.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Notifications</h3>
                  <div className="space-y-3">
                    {notifications.slice(0, 5).map((alert, index) => (
                      <div key={index} className="p-4 rounded-lg border-l-4 border-green-500 bg-green-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{alert.message}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(alert.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <button
                            onClick={() => handleClearNotification(index)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'map' && (
            <motion.div
              key="map"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-[calc(100vh-200px)] rounded-xl overflow-hidden shadow-lg"
            >
              <Suspense fallback={
                <div className="h-full flex items-center justify-center bg-gray-100">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading map...</p>
                  </div>
                </div>
              }>
                <Map />
              </Suspense>
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
                  <h3 className="text-lg font-semibold text-gray-900">My Reports</h3>
                  <button 
                    onClick={() => setActiveTab('map')}
                    className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    New Report
                  </button>
                </div>

                <div className="space-y-4">
                  {userReports.length > 0 ? (
                    userReports.map((report) => (
                      <ReportCard
                        key={report._id}
                        report={report}
                        onView={(report) => {
                          setSelectedReport(report);
                          setShowReportDetails(true);
                        }}
                        onEdit={(report) => {
                          // Handle edit functionality
                          console.log('Edit report:', report);
                        }}
                      />
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">📝</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Yet</h3>
                      <p className="text-gray-600 mb-4">You haven't submitted any reports yet.</p>
                      <button 
                        onClick={() => setActiveTab('map')}
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Submit Your First Report
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'achievements' && (
            <motion.div
              key="achievements"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Achievements & Badges</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <AchievementCard
                    title="First Report"
                    description="Submit your first waste report"
                    icon={FileText}
                    unlocked={userStats?.totalReports > 0}
                    progress={userStats?.totalReports > 0 ? 100 : 0}
                  />
                  <AchievementCard
                    title="Eco Warrior"
                    description="Submit 10 reports"
                    icon={Leaf}
                    unlocked={userStats?.totalReports >= 10}
                    progress={Math.min((userStats?.totalReports || 0) * 10, 100)}
                  />
                  <AchievementCard
                    title="Point Collector"
                    description="Earn 100 points"
                    icon={Award}
                    unlocked={(currUser?.points || 0) >= 100}
                    progress={Math.min((currUser?.points || 0), 100)}
                  />
                  <AchievementCard
                    title="Consistent Reporter"
                    description="Submit reports for 7 consecutive days"
                    icon={Target}
                    unlocked={userStats?.consecutiveDays >= 7}
                    progress={Math.min((userStats?.consecutiveDays || 0) * 14.3, 100)}
                  />
                  <AchievementCard
                    title="Environmental Hero"
                    description="Save 50kg of CO2"
                    icon={Zap}
                    unlocked={(userStats?.co2Saved || 0) >= 50}
                    progress={Math.min((userStats?.co2Saved || 0) * 2, 100)}
                  />
                  <AchievementCard
                    title="Community Helper"
                    description="Help 5 different locations"
                    icon={MapPin}
                    unlocked={userStats?.uniqueLocations >= 5}
                    progress={Math.min((userStats?.uniqueLocations || 0) * 20, 100)}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <UserProfile />
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <UserSettings />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Report Details Modal */}
      <ReportDetailsModal
        isOpen={showReportDetails}
        onClose={() => setShowReportDetails(false)}
        report={selectedReport}
      />
    </div>
  );
};

export default UserDashboard;
