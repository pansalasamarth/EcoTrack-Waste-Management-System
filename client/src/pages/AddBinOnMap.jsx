import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';

// Fix for default markers in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icon for new bin placement
const newBinIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Component to handle map clicks
function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onLocationSelect([lng, lat]); // GeoJSON format: [longitude, latitude]
    },
  });
  return null;
}

const AddBinOnMap = () => {
  const navigate = useNavigate();
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [formData, setFormData] = useState({
    totalCapacity: 100,
    realTimeCapacity: 0,
    approxTimeToFill: 8,
    lastEmptiedAt: new Date().toISOString().split('T')[0],
    binType: 'public',
    category: 'dry',
    status: 'empty',
    sensorEnabled: true,
    ward: '',
    zone: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Default center on Ahmedabad
  const defaultCenter = [23.0225, 72.5714];

  const handleLocationSelect = (coordinates) => {
    setSelectedLocation(coordinates);
    setShowForm(true);
    setMessage('');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value) : value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLocation) {
      setMessage('❌ Please select a location on the map first');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage('❌ Please login as admin first');
        setLoading(false);
        return;
      }

      const binData = {
        ...formData,
        location: {
          type: 'Point',
          coordinates: selectedLocation
        }
      };

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/wastebin/create-wastebin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(binData)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✅ Waste bin created successfully!');
        // Reset form and location
        setSelectedLocation(null);
        setShowForm(false);
        setFormData({
          totalCapacity: 100,
          realTimeCapacity: 0,
          approxTimeToFill: 8,
          lastEmptiedAt: new Date().toISOString().split('T')[0],
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

  const handleCancel = () => {
    setSelectedLocation(null);
    setShowForm(false);
    setMessage('');
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-green-600 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Add Waste Bin on Map</h1>
            <p className="text-green-100">Click anywhere on the map to place a new waste bin</p>
          </div>
          <button
            onClick={() => navigate('/adminDashboard')}
            className="bg-white text-green-600 px-4 py-2 rounded-lg hover:bg-green-50 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`p-4 ${
          message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Map */}
        <div className="flex-1 relative">
          <MapContainer
            center={defaultCenter}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            <MapClickHandler onLocationSelect={handleLocationSelect} />
            
            {selectedLocation && (
              <Marker
                position={[selectedLocation[1], selectedLocation[0]]}
                icon={newBinIcon}
              >
                <Popup>
                  <div className="text-center">
                    <h3 className="font-bold text-red-600">New Bin Location</h3>
                    <p className="text-sm">
                      Lat: {selectedLocation[1].toFixed(6)}<br/>
                      Lng: {selectedLocation[0].toFixed(6)}
                    </p>
                    <p className="text-xs text-gray-600 mt-2">
                      Fill out the form to create this bin
                    </p>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>

          {/* Instructions Overlay */}
          <div className="absolute top-4 left-4 bg-white bg-opacity-90 p-4 rounded-lg shadow-lg max-w-sm">
            <h3 className="font-bold text-gray-800 mb-2">📍 How to Add a Bin:</h3>
            <ol className="text-sm text-gray-600 space-y-1">
              <li>1. Click anywhere on the map</li>
              <li>2. Fill out the bin details</li>
              <li>3. Click "Create Bin"</li>
            </ol>
          </div>
        </div>

        {/* Form Sidebar */}
        {showForm && (
          <div className="w-96 bg-white shadow-lg overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Bin Details</h2>
                <button
                  onClick={handleCancel}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Location Info */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-2">📍 Selected Location</h3>
                  <p className="text-sm text-gray-600">
                    Latitude: {selectedLocation[1].toFixed(6)}<br/>
                    Longitude: {selectedLocation[0].toFixed(6)}
                  </p>
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Capacity (L)
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Capacity (L)
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
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time to Fill (hrs)
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Emptied
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

                {/* Location Details */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ward
                  </label>
                  <input
                    type="text"
                    name="ward"
                    value={formData.ward}
                    onChange={handleInputChange}
                    placeholder="e.g., Gota, Jaspur"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zone
                  </label>
                  <input
                    type="text"
                    name="zone"
                    value={formData.zone}
                    onChange={handleInputChange}
                    placeholder="e.g., South Zone, North Zone"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                {/* Bin Properties */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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

                {/* Submit Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Creating...' : 'Create Bin'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddBinOnMap;
