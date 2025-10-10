import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, Circle } from "react-leaflet";
import L from "leaflet";
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, 
  Navigation, 
  Search, 
  Filter, 
  Plus, 
  Minus, 
  RotateCcw,
  AlertCircle,
  CheckCircle,
  Clock,
  Trash2,
  Eye,
  Route
} from "lucide-react";

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom bin status icons
const createBinIcon = (status, isHighlighted = false) => {
  const size = isHighlighted ? [35, 50] : [25, 41];
  const colors = {
    recycled: '#10B981', // green
    empty: '#10B981', // green
    partially_filled: '#F59E0B', // yellow
    filled: '#EF4444', // red
    damaged: '#6B7280', // gray
  };
  
  return L.divIcon({
    className: 'custom-bin-marker',
    html: `
      <div style="
        background-color: ${colors[status] || '#6B7280'};
        width: ${size[0]}px;
        height: ${size[1]}px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      ">
        <div style="
          transform: rotate(45deg);
          color: white;
          font-size: ${isHighlighted ? '16px' : '12px'};
          font-weight: bold;
        ">🗑️</div>
      </div>
    `,
    iconSize: size,
    iconAnchor: [size[0] / 2, size[1]],
    popupAnchor: [0, -size[1]]
  });
};

// User location icon
const userIcon = L.divIcon({
  className: 'custom-user-marker',
  html: `
    <div style="
      background-color: #3B82F6;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      animation: pulse 2s infinite;
    ">
      <div style="
        color: white;
        font-size: 14px;
      ">📍</div>
    </div>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15]
});

// Map Controls Component
const MapControls = ({ onLocationClick, onFilterClick, onSearchClick, userPosition }) => {
  const map = useMap();

  const handleZoomIn = () => {
    map.zoomIn();
  };

  const handleZoomOut = () => {
    map.zoomOut();
  };

  const handleResetView = () => {
    if (userPosition) {
      map.flyTo(userPosition, 16);
    } else {
      map.flyTo([23.0225, 72.5714], 13); // Default to Ahmedabad
    }
  };

  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col space-y-2">
      {/* Location Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onLocationClick}
        className="bg-white shadow-lg rounded-lg p-3 hover:bg-gray-50 transition-colors"
        title="Enable Location"
      >
        <Navigation className="w-5 h-5 text-green-600" />
      </motion.button>

      {/* Search Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onSearchClick}
        className="bg-white shadow-lg rounded-lg p-3 hover:bg-gray-50 transition-colors"
        title="Search Bins"
      >
        <Search className="w-5 h-5 text-blue-600" />
      </motion.button>

      {/* Filter Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onFilterClick}
        className="bg-white shadow-lg rounded-lg p-3 hover:bg-gray-50 transition-colors"
        title="Filter Bins"
      >
        <Filter className="w-5 h-5 text-purple-600" />
      </motion.button>

      {/* Zoom Controls */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleZoomIn}
          className="w-full p-3 hover:bg-gray-50 transition-colors border-b border-gray-200"
          title="Zoom In"
        >
          <Plus className="w-5 h-5 text-gray-600" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleZoomOut}
          className="w-full p-3 hover:bg-gray-50 transition-colors"
          title="Zoom Out"
        >
          <Minus className="w-5 h-5 text-gray-600" />
        </motion.button>
      </div>

      {/* Reset View Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleResetView}
        className="bg-white shadow-lg rounded-lg p-3 hover:bg-gray-50 transition-colors"
        title="Reset View"
      >
        <RotateCcw className="w-5 h-5 text-gray-600" />
      </motion.button>
    </div>
  );
};

// User Location Component
function UserLocation({ onPositionChange }) {
  const [position, setPosition] = useState(null);
  const [tracking, setTracking] = useState(false);
  const [error, setError] = useState(null);
  const map = useMap();
  const watchIdRef = useRef(null);

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser");
      return;
    }

    setTracking(true);
    setError(null);
    
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newPos = [pos.coords.latitude, pos.coords.longitude];
        setPosition(newPos);
        onPositionChange(newPos);
        map.flyTo(newPos, 16);
      },
      (err) => {
        console.error("Error getting location:", err);
        setTracking(false);
        if (err.code === 1) {
          setError("Location access denied. Please enable location permissions.");
        } else if (err.code === 2) {
          setError("Location unavailable. Please check your connection.");
        } else {
          setError("Location error occurred. Please try again.");
        }
      },
      { 
        enableHighAccuracy: true, 
        maximumAge: 10000, 
        timeout: 15000 
      }
    );
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return (
    <>
      {position && (
        <Marker position={position} icon={userIcon}>
          <Popup>
            <div className="p-2">
              <h3 className="font-semibold text-blue-600 mb-2">📍 Your Location</h3>
              <p className="text-sm text-gray-600">
                Lat: {position[0].toFixed(6)}<br />
                Lng: {position[1].toFixed(6)}
              </p>
            </div>
          </Popup>
        </Marker>
      )}
    </>
  );
}

// Enhanced Bin Markers Component
function DustbinMarkers({ userPosition, onRouteChange, setNearbyBins, highlightBin, filters }) {
  const [dustbins, setDustbins] = useState([]);
  const [loading, setLoading] = useState(true);
  const map = useMap();

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Earth radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
  };

  // Fetch wastebin data from the backend with pagination
  useEffect(() => {
    const fetchDustbins = async () => {
      try {
        setLoading(true);
        // Load only first 100 bins initially for better performance
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8800';
        const response = await fetch(`${backendUrl}/api/wastebin/wastebins?limit=100&page=1`);
        const data = await response.json();

        const processedDustbins = data.bins?.map(bin => ({
          id: bin._id,
          location: {
            latitude: Array.isArray(bin.location?.coordinates) ? bin.location.coordinates[1] : null,
            longitude: Array.isArray(bin.location?.coordinates) ? bin.location.coordinates[0] : null,
          },
          status: bin.status,
          lastEmptiedAt: bin.lastEmptiedAt,
          realTimeCapacity: bin.realTimeCapacity || 0,
          totalCapacity: bin.totalCapacity || 100,
          category: bin.category,
          ward: bin.ward,
          zone: bin.zone,
          binType: bin.binType
        })).filter(b => b.location.latitude !== null && b.location.longitude !== null) || [];

        setDustbins(processedDustbins);
      } catch (error) {
        console.error("Error fetching dustbins:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDustbins();
  }, []);

  // Filter nearby bins based on user position and filters
  useEffect(() => {
    if (userPosition) {
      let filteredBins = dustbins;

      // Apply status filter
      if (filters.status && filters.status !== 'all') {
        filteredBins = filteredBins.filter(bin => bin.status === filters.status);
      }

      // Apply category filter
      if (filters.category && filters.category !== 'all') {
        filteredBins = filteredBins.filter(bin => bin.category === filters.category);
      }

      const nearby = filteredBins
        .map(bin => ({
          ...bin,
          distance: calculateDistance(
            userPosition[0], userPosition[1],
            bin.location.latitude, bin.location.longitude
          ),
        }))
        .filter(bin => bin.distance <= 5000) // Filter bins within 5km
        .sort((a, b) => a.distance - b.distance);

      setNearbyBins(nearby);
    }
  }, [userPosition, dustbins, filters, setNearbyBins]);

  const getRoute = async (binLocation) => {
    if (!userPosition) {
      alert("Please enable location tracking first");
      return;
    }

    try {
      const apiUrl = `https://router.project-osrm.org/route/v1/driving/${userPosition[1]},${userPosition[0]};${binLocation.longitude},${binLocation.latitude}?overview=full&geometries=geojson`;
      const response = await axios.get(apiUrl);

      if (response.data && response.data.routes && response.data.routes.length > 0) {
        const routeCoordinates = response.data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
        onRouteChange(routeCoordinates);

        const bounds = L.latLngBounds([userPosition, [binLocation.latitude, binLocation.longitude]]);
        map.fitBounds(bounds, { padding: [50, 50] });
      } else {
        throw new Error("No routes found.");
      }
    } catch (error) {
      console.error("Error fetching route:", error);
      alert("Failed to fetch route. Please try again.");
    }
  };

  useEffect(() => {
    if (highlightBin && highlightBin.location) {
      map.flyTo([highlightBin.location.latitude, highlightBin.location.longitude], 18);
      getRoute(highlightBin.location);
    }
  }, [highlightBin]);

  if (loading) {
    return null;
  }

  return (
    <>
      {dustbins.map(bin => {
        const isHighlighted = highlightBin && highlightBin.id === bin.id;
        const icon = createBinIcon(bin.status, isHighlighted);

        return (
          <Marker
            key={bin.id}
            position={[bin.location.latitude, bin.location.longitude]}
            icon={icon}
            eventHandlers={{
              click: () => getRoute(bin.location),
            }}
          >
            <Popup>
              <div className="p-3 min-w-[250px]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">Bin #{bin.id.slice(-6)}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    bin.status === 'recycled' || bin.status === 'empty' ? 'bg-green-100 text-green-800' :
                    bin.status === 'partially_filled' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {bin.status.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 text-gray-500 mr-2" />
                    <span>{bin.ward}, Zone {bin.zone}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Trash2 className="w-4 h-4 text-gray-500 mr-2" />
                    <span>{bin.category} • {bin.binType}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 text-gray-500 mr-2" />
                    <span>Last emptied: {new Date(bin.lastEmptiedAt).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Capacity</span>
                      <span>{bin.realTimeCapacity}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          bin.realTimeCapacity >= 85 ? 'bg-red-500' :
                          bin.realTimeCapacity >= 50 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${bin.realTimeCapacity}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    getRoute(bin.location);
                  }}
                  className="mt-3 w-full flex items-center justify-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                >
                  <Route className="w-4 h-4 mr-2" />
                  Get Route
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {userPosition && (
        <Circle
          center={userPosition}
          radius={300}
          pathOptions={{ 
            color: '#3B82F6', 
            fillColor: '#3B82F633', 
            weight: 2,
            opacity: 0.6,
            fillOpacity: 0.2
          }}
        />
      )}
    </>
  );
}

// Enhanced Nearby Bins Panel
const NearbyBinsPanel = ({ nearbyBins, getRoute, isOpen, onToggle }) => {
  const distancePhrases = [
    "Just a hop, skip, and jump away!",
    "Not too far, just a little more to go!",
    "It's almost within your reach!",
    "You're so close, keep going!",
    "The bin is calling your name!",
    "Bin's waiting for you, just a few steps away!",
    "Only a few meters stand between you and the bin!"
  ];

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onToggle}
        className="fixed top-20 left-4 z-[1000] bg-white shadow-lg rounded-lg p-3 hover:bg-gray-50 transition-colors"
        title="Toggle Nearby Bins"
      >
        <Eye className="w-5 h-5 text-green-600" />
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-20 left-0 h-[calc(100vh-5rem)] w-80 bg-white shadow-xl z-[999] border-r border-gray-200"
          >
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <span className="mr-2 text-xl">♻️</span> Nearby Bins
                  <span className="ml-2 text-sm bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    {nearbyBins.length}
                  </span>
                </h3>
                <button
                  onClick={onToggle}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="overflow-y-auto h-[calc(100%-4rem)] p-4">
              {nearbyBins.length > 0 ? (
                nearbyBins
                  .filter(bin => ['recycled', 'empty', 'partially_filled'].includes(bin.status))
                  .map(bin => (
                    <motion.div
                      key={bin.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => getRoute(bin)}
                      className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg mb-4 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer border border-green-200"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800 text-sm">
                            {distancePhrases[Math.floor(Math.random() * distancePhrases.length)]}
                          </h4>
                          <p className="text-xs text-gray-600 mt-1">
                            {Math.round(bin.distance / 1000)} km away
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          bin.status === 'recycled' || bin.status === 'empty' ? 'bg-green-200 text-green-800' :
                          bin.status === 'partially_filled' ? 'bg-yellow-200 text-yellow-800' :
                          'bg-red-200 text-red-800'
                        }`}>
                          {bin.status.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div className="text-xs text-gray-600 mb-3">
                        <div className="flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {bin.ward}, Zone {bin.zone}
                        </div>
                        <div className="flex items-center mt-1">
                          <Trash2 className="w-3 h-3 mr-1" />
                          {bin.category} • {bin.binType}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-xs text-gray-600">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(bin.lastEmptiedAt).toLocaleDateString()}
                        </div>
                        <button className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-md transition-colors">
                          Show Route
                        </button>
                      </div>
                    </motion.div>
                  ))
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🗺️</div>
                  <p className="text-gray-600">No nearby bins found</p>
                  <p className="text-sm text-gray-500 mt-2">Enable location to see nearby bins</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Main Map Component
function Map() {
  const defaultPosition = [23.0225, 72.5714]; // Ahmedabad, Gujarat coordinates
  const [userPosition, setUserPosition] = useState(null);
  const [route, setRoute] = useState([]);
  const [nearbyBins, setNearbyBins] = useState([]);
  const [highlightBin, setHighlightBin] = useState(null);
  const [showNearbyPanel, setShowNearbyPanel] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all'
  });
  const navigate = useNavigate();

  const handleRouteChange = (routeCoordinates) => {
    setRoute(routeCoordinates);
  };

  const handleLocationClick = () => {
    if (!userPosition) {
      // Trigger location request
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const newPos = [position.coords.latitude, position.coords.longitude];
            setUserPosition(newPos);
          },
          (error) => {
            console.error("Error getting location:", error);
            alert("Unable to get your location. Please check your browser permissions.");
          }
        );
      }
    }
  };

  const handleShowBin = (bin) => {
    setHighlightBin(bin);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Backspace') {
        setRoute([]);
        setHighlightBin(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="relative h-full w-full">
      <MapContainer 
        center={defaultPosition} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        <UserLocation onPositionChange={setUserPosition} />
        
        <DustbinMarkers
          userPosition={userPosition}
          onRouteChange={handleRouteChange}
          setNearbyBins={setNearbyBins}
          highlightBin={highlightBin}
          filters={filters}
        />

        {route.length > 0 && (
          <Polyline
            positions={route}
            color="#10B981"
            weight={4}
            opacity={0.8}
          />
        )}

        <MapControls 
          onLocationClick={handleLocationClick}
          onFilterClick={() => setShowFilters(!showFilters)}
          onSearchClick={() => setShowNearbyPanel(!showNearbyPanel)}
          userPosition={userPosition}
        />
      </MapContainer>

      {/* Nearby Bins Panel */}
      <NearbyBinsPanel
        nearbyBins={nearbyBins}
        getRoute={handleShowBin}
        isOpen={showNearbyPanel}
        onToggle={() => setShowNearbyPanel(!showNearbyPanel)}
      />

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-20 right-20 z-[1000] bg-white rounded-lg shadow-lg p-4 w-64"
          >
            <h3 className="font-semibold text-gray-900 mb-3">Filter Bins</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="empty">Empty</option>
                  <option value="partially_filled">Partially Filled</option>
                  <option value="filled">Filled</option>
                  <option value="recycled">Recycled</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">All Categories</option>
                  <option value="organic">Organic</option>
                  <option value="recyclable">Recyclable</option>
                  <option value="hazardous">Hazardous</option>
                  <option value="general">General</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate("/userReportForm")}
        className="fixed bottom-6 right-6 z-[1000] bg-green-600 hover:bg-green-700 text-white p-4 rounded-full shadow-lg transition-colors"
        title="Report Bin Issue"
      >
        <AlertCircle className="w-6 h-6" />
      </motion.button>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 px-3 py-2 rounded-lg shadow-md text-sm text-gray-600 z-[999]">
        Press <b>ESC</b> to clear route
      </div>
    </div>
  );
}

export default Map;