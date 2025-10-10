import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Activity,
  Calendar,
  Download,
  Filter
} from 'lucide-react';

const AnalyticsDashboard = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [statsData, setStatsData] = useState(null);
  const [mlForecast, setMlForecast] = useState([]);
  const [mlAnomalies, setMlAnomalies] = useState([]);
  const [mlPriority, setMlPriority] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedPeriod]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8800';
      const mlUrl = import.meta.env.VITE_ML_URL || 'http://localhost:5000';
      const [analyticsRes, statsRes] = await Promise.all([
        fetch(`${backendUrl}/api/admin/dashboard/analytics?period=${selectedPeriod}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${backendUrl}/api/admin/dashboard/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);
      const [analyticsJson, statsJson] = await Promise.all([
        analyticsRes.json(),
        statsRes.json()
      ]);
      setAnalyticsData(analyticsJson);
      setStatsData(statsJson);

      // Fetch ML insights (best-effort, independent)
      try {
        const r = await fetch(`${mlUrl}/ml/forecast`);
        const j = await r.json();
        setMlForecast(Array.isArray(j?.bins) ? j.bins : []);
      } catch (_) { setMlForecast([]); }

      try {
        const r = await fetch(`${mlUrl}/ml/anomalies`);
        const j = await r.json();
        setMlAnomalies(Array.isArray(j?.bins) ? j.bins : []);
      } catch (_) { setMlAnomalies([]); }

      try {
        const r = await fetch(`${mlUrl}/ml/priority`);
        const j = await r.json();
        setMlPriority(Array.isArray(j?.bins) ? j.bins : []);
      } catch (_) { setMlPriority([]); }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, change, icon: Icon, color, trend }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${color}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {change && (
            <div className="flex items-center mt-2">
              {trend === 'up' ? (
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {change}
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${color.replace('border-l-', 'bg-').replace('-500', '-100')}`}>
          <Icon className={`w-6 h-6 ${color.replace('border-l-', 'text-').replace('-500', '-600')}`} />
        </div>
      </div>
    </motion.div>
  );

  const SimpleBarChart = ({ data, title, color = 'bg-blue-500' }) => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {Array.isArray(data) && data.length > 0 ? (
          data.map((item, index, arr) => {
            const value = typeof item.count === 'number' ? item.count : (item.reportCount || 0);
            const maxVal = Math.max(...arr.map(d => (typeof d.count === 'number' ? d.count : (d.reportCount || 0))));
            return (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 w-24 truncate">{item._id}</span>
                <div className="flex-1 mx-4">
                  <div className="w-full h-4 bg-gray-200 rounded-full">
                    <div 
                      className={`h-4 ${color} rounded-full transition-all duration-500`}
                      style={{ 
                        width: `${maxVal > 0 ? Math.min((value / maxVal) * 100, 100) : 0}%` 
                      }}
                    />
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-900 w-16 text-right">{value}</span>
              </div>
            );
          })
        ) : (
          <div className="text-sm text-gray-500">No data available</div>
        )}
      </div>
    </div>
  );

  const LineChart = ({ data, title, color = 'blue' }) => {
    if (!data || data.length === 0) return null;
    
    const maxValue = Math.max(...data.map(d => d.count));
    const minValue = Math.min(...data.map(d => d.count));
    const range = maxValue - minValue || 1;

    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="h-64 flex items-end justify-between space-x-1">
          {data.map((item, index) => {
            const height = ((item.count - minValue) / range) * 100;
            return (
              <div key={index} className="flex flex-col items-center flex-1">
                <div 
                  className={`w-full bg-${color}-500 rounded-t transition-all duration-500 hover:bg-${color}-600`}
                  style={{ height: `${height}%` }}
                  title={`${item._id.day}/${item._id.month}/${item._id.year}: ${item.count}`}
                />
                <span className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-left">
                  {item._id.day}/{item._id.month}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600">Insights and trends for your waste management system</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Summary Stats (from stats overview) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={statsData?.overview?.totalUsers || 0}
          icon={Activity}
          color="border-l-green-500"
        />
        <StatCard
          title="Total Reports"
          value={statsData?.overview?.totalReports || 0}
          icon={BarChart3}
          color="border-l-blue-500"
        />
        <StatCard
          title="Waste Bins"
          value={statsData?.overview?.totalBins || 0}
          icon={PieChart}
          color="border-l-purple-500"
          subtitle={`${statsData?.overview?.filledBins || 0} filled`}
        />
        <StatCard
          title="Pending Reports"
          value={statsData?.overview?.pendingReports || 0}
          icon={TrendingUp}
          color="border-l-orange-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LineChart
          data={analyticsData?.reportsOverTime}
          title="Reports Over Time"
          color="blue"
        />
        <LineChart
          data={analyticsData?.usersOverTime}
          title="User Registrations"
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SimpleBarChart
          data={analyticsData?.topWardsByReports}
          title="Top Wards by Reports"
          color="bg-blue-500"
        />
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ward Capacity Overview</h3>
          <div className="space-y-4">
            {analyticsData?.capacityTrends?.map((ward, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900">{ward._id}</span>
                  <span className="text-sm text-gray-600">{ward.avgCapacity.toFixed(1)}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full">
                  <div 
                    className={`h-2 rounded-full ${
                      ward.avgCapacity >= 80 ? 'bg-red-500' :
                      ward.avgCapacity >= 60 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${ward.avgCapacity}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{ward.binCount} bins</span>
                  <span>Max: {ward.maxCapacity.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ML Insights */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Soon-to-Fill (Forecast)</h3>
          <div className="space-y-3">
            {(mlForecast || []).slice(0, 8).map((b, i) => (
              <div key={i} className="flex items-center justify-between border-b last:border-b-0 py-2">
                <div>
                  <div className="font-medium text-gray-900">{b.ward || 'Ward'} • Zone {b.zone || '-'}</div>
                  <div className="text-xs text-gray-500">{b.category} • {b.predictedFullDateTime}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{typeof b.hoursUntilFull === 'number' ? b.hoursUntilFull.toFixed(1) : b.hoursUntilFull}h</div>
                  <div className="text-xs text-gray-500">{b.realTimeCapacity}%</div>
                </div>
              </div>
            ))}
            {(!mlForecast || mlForecast.length === 0) && (
              <div className="text-sm text-gray-500">No forecast data</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Anomalies (Z-score)</h3>
          <div className="space-y-3">
            {(mlAnomalies || []).slice(0, 8).map((b, i) => (
              <div key={i} className="flex items-center justify-between border-b last:border-b-0 py-2">
                <div>
                  <div className="font-medium text-gray-900">{b.ward || 'Ward'} • Zone {b.zone || '-'}</div>
                  <div className="text-xs text-gray-500">{b.category}</div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-semibold ${Math.abs(b.z || 0) >= 2 ? 'text-red-600' : 'text-yellow-600'}`}>z={typeof b.z === 'number' ? b.z.toFixed(2) : b.z}</div>
                  <div className="text-xs text-gray-500">{b.realTimeCapacity}%</div>
                </div>
              </div>
            ))}
            {(!mlAnomalies || mlAnomalies.length === 0) && (
              <div className="text-sm text-gray-500">No anomalies detected</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Priority Pickup (Score)</h3>
          <div className="space-y-3">
            {(mlPriority || []).slice(0, 8).map((b, i) => (
              <div key={i} className="flex items-center justify-between border-b last:border-b-0 py-2">
                <div>
                  <div className="font-medium text-gray-900">{b.ward || 'Ward'} • Zone {b.zone || '-'}</div>
                  <div className="text-xs text-gray-500">{b.category}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{typeof b.priorityScore === 'number' ? b.priorityScore.toFixed(2) : b.priorityScore}</div>
                  <div className="text-xs text-gray-500">{b.realTimeCapacity}% • {typeof b.hoursUntilFull === 'number' ? b.hoursUntilFull.toFixed(1) : b.hoursUntilFull}h</div>
                </div>
              </div>
            ))}
            {(!mlPriority || mlPriority.length === 0) && (
              <div className="text-sm text-gray-500">No priority ranking available</div>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Analytics */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Peak Report Times</h4>
            <div className="space-y-2">
              {analyticsData?.reportsOverTime?.slice(0, 3).map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {item._id.day}/{item._id.month}
                  </span>
                  <span className="font-medium">{item.count} reports</span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">User Growth</h4>
            <div className="space-y-2">
              {analyticsData?.usersOverTime?.slice(0, 3).map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {item._id.day}/{item._id.month}
                  </span>
                  <span className="font-medium">{item.count} users</span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Capacity Alerts</h4>
            <div className="space-y-2">
              {analyticsData?.capacityTrends?.filter(ward => ward.avgCapacity >= 80).map((ward, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-600">{ward._id}</span>
                  <span className="font-medium text-red-600">{ward.avgCapacity.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
