import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AddWasteBin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    totalCapacity: 100,
    realTimeCapacity: 0,
    approxTimeToFill: 8,
    lastEmptiedAt: new Date().toISOString().split('T')[0],
    location: {
      type: 'Point',
      coordinates: [72.5714, 23.0225] // Default to Ahmedabad center
    },
    binType: 'public',
    category: 'dry',
    status: 'empty',
    sensorEnabled: true,
    ward: '',
    zone: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'longitude' || name === 'latitude') {
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          coordinates: name === 'longitude' 
            ? [parseFloat(value), prev.location.coordinates[1]]
            : [prev.location.coordinates[0], parseFloat(value)]
        }
      }));
    } else if (name === 'sensorEnabled') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? parseInt(value) : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage('Please login as admin first');
        setLoading(false);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/wastebin/create-wastebin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✅ Waste bin created successfully!');
        // Reset form
        setFormData({
          totalCapacity: 100,
          realTimeCapacity: 0,
          approxTimeToFill: 8,
          lastEmptiedAt: new Date().toISOString().split('T')[0],
          location: {
            type: 'Point',
            coordinates: [72.5714, 23.0225]
          },
          binType: 'public',
          category: 'dry',
          status: 'empty',
          sensorEnabled: true,
          ward: '',
          zone: ''
        });
      } else {
        setMessage(`❌ Error: ${data.msg || data.message || 'Failed to create waste bin'}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-green-600 mb-2">Add New Waste Bin</h1>
          <p className="text-gray-600">Create a new waste bin in the system</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Capacity (Liters)
              </label>
              <input
                type="number"
                name="totalCapacity"
                value={formData.totalCapacity}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Capacity (Liters)
              </label>
              <input
                type="number"
                name="realTimeCapacity"
                value={formData.realTimeCapacity}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Approx Time to Fill (Hours)
              </label>
              <input
                type="number"
                name="approxTimeToFill"
                value={formData.approxTimeToFill}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Emptied Date
              </label>
              <input
                type="date"
                name="lastEmptiedAt"
                value={formData.lastEmptiedAt}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
          </div>

          {/* Location Information */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Location Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  name="longitude"
                  value={formData.location.coordinates[0]}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  name="latitude"
                  value={formData.location.coordinates[1]}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ward
                </label>
                <input
                  type="text"
                  name="ward"
                  value={formData.ward}
                  onChange={handleInputChange}
                  placeholder="e.g., Jaspur, Tragad"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zone
                </label>
                <input
                  type="text"
                  name="zone"
                  value={formData.zone}
                  onChange={handleInputChange}
                  placeholder="e.g., North Zone, South Zone"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Bin Properties */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Bin Properties</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bin Type
                </label>
                <select
                  name="binType"
                  value={formData.binType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="public">Public</option>
                  <option value="residential">Residential</option>
                  <option value="industrial">Industrial</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="dry">Dry Waste</option>
                  <option value="wet">Wet Waste</option>
                  <option value="plastic">Plastic</option>
                  <option value="e-waste">E-Waste</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="empty">Empty</option>
                  <option value="partially_filled">Partially Filled</option>
                  <option value="filled">Filled</option>
                  <option value="recycled">Recycled</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="sensorEnabled"
                  checked={formData.sensorEnabled}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Sensor Enabled
                </label>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="border-t pt-6 flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Waste Bin'}
            </button>
            
            <button
              type="button"
              onClick={() => navigate('/adminDashboard')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddWasteBin;
