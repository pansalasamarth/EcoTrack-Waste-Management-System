import React, { useState, useContext, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, 
  Camera, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  Search,
  Upload,
  Trash2,
  Eye,
  Send,
  ArrowLeft,
  LogOut,
  Info,
  Star
} from "lucide-react";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthContext } from "../context/authContext";
import { useNavigate } from "react-router-dom";

const UserReportForm = () => {
  const { currUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [bins, setBins] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBin, setSelectedBin] = useState(null);
  const [showBinSearch, setShowBinSearch] = useState(false);
  
  const [formData, setFormData] = useState({
    bin: "",
    user_id: currUser?.userId || "",
    status: "full",
    attachment: null,
    description: "",
    location: {
      latitude: null,
      longitude: null
    },
    urgency: "medium"
  });

  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);

  // Fetch available bins
  useEffect(() => {
    fetchBins();
  }, []);

  const fetchBins = async () => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8800';
      console.log('Fetching bins from:', `${backendUrl}/api/wastebin/wastebins`);
      const response = await fetch(`${backendUrl}/api/wastebin/wastebins`);
      const data = await response.json();
      console.log('Bins response:', data);
      // Handle both old format (array) and new format (object with bins property)
      const binsArray = Array.isArray(data) ? data : (data.bins || []);
      console.log('Processed bins array:', binsArray);
      setBins(binsArray);
    } catch (error) {
      console.error("Error fetching bins:", error);
      setBins([]); // Set empty array on error
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors({ ...errors, attachment: "Please select an image file" });
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, attachment: "File size must be less than 5MB" });
        return;
      }

      setFormData({ ...formData, attachment: file });
      setErrors({ ...errors, attachment: "" });
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleBinSelect = (bin) => {
    setSelectedBin(bin);
    setFormData({ ...formData, bin: bin._id });
    setSearchTerm(bin.ward + ", Zone " + bin.zone);
    setShowBinSearch(false);
    setErrors({ ...errors, bin: "" });
  };

  const handleLocationClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            location: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            }
          });
          toast.success("Location captured successfully!");
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error("Unable to get your location. Please check permissions.");
        }
      );
    } else {
      toast.error("Geolocation is not supported by this browser.");
    }
  };

  const validateForm = () => {
    const newErrors = {};

    console.log("Validating form with data:", formData);

    if (!formData.bin) {
      newErrors.bin = "Please select a bin";
      console.log("Validation error: No bin selected");
    }
    
    if (!formData.status) {
      newErrors.status = "Please select a status";
      console.log("Validation error: No status selected");
    }
    
    if (!formData.attachment) {
      newErrors.attachment = "Please upload an image";
      console.log("Validation error: No attachment uploaded");
    }
    
    if (!formData.description.trim()) {
      newErrors.description = "Please provide a description";
      console.log("Validation error: No description provided");
    } else if (formData.description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters";
      console.log("Validation error: Description too short");
    }

    console.log("Validation errors:", newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getStepErrors = (step) => {
    switch (step) {
      case 1:
        return errors.bin ? [errors.bin] : [];
      case 2:
        return [errors.status, errors.attachment, errors.description].filter(Boolean);
      case 3:
        return []; // Review step has no new errors
      default:
        return [];
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      const errorMessages = Object.values(errors).filter(msg => msg);
      if (errorMessages.length > 0) {
        toast.error(`Please fix the following errors: ${errorMessages.join(', ')}`);
      } else {
        toast.error("Please fix the errors before submitting");
      }
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("token");

    if (!token) {
      toast.error("Please log in to submit a report");
      setLoading(false);
      return;
    }

    if (!currUser?.userId) {
      toast.error("User information not available. Please log in again.");
      setLoading(false);
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("bin", formData.bin);
    formDataToSend.append("user_id", currUser?.userId || "");
    formDataToSend.append("status", formData.status);
    formDataToSend.append("description", formData.description);
    formDataToSend.append("attachment", formData.attachment);
    formDataToSend.append("urgency", formData.urgency);
    
    if (formData.location.latitude && formData.location.longitude) {
      formDataToSend.append("location", JSON.stringify(formData.location));
    }

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8800';
      console.log('Submitting report to:', `${backendUrl}/api/userreport/create-report`);
      console.log('Form data being sent:', {
        bin: formData.bin,
        user_id: currUser?.userId,
        status: formData.status,
        description: formData.description,
        attachment: formData.attachment ? 'File uploaded' : 'No file',
        urgency: formData.urgency
      });

      const response = await fetch(
        `${backendUrl}/api/userreport/create-report`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataToSend,
        }
      );

      console.log('Response status:', response.status);
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error response:', errorData);
        throw new Error(errorData.error || errorData.message || "Failed to submit the report");
      }

      const data = await response.json();
      console.log("Report submitted successfully:", data);

      toast.success("Report submitted successfully! 🎉");

      // Reset form
      setFormData({
        bin: "",
        user_id: currUser?.userId || "",
        status: "full",
        attachment: null,
        description: "",
        location: { latitude: null, longitude: null },
        urgency: "medium"
      });
      setSelectedBin(null);
      setSearchTerm("");
      setImagePreview(null);
      setCurrentStep(1);
      
      // Navigate back to dashboard after a delay
      setTimeout(() => {
        navigate("/userDashboard");
      }, 2000);

    } catch (err) {
      console.error("Error submitting the report:", err);
      toast.error(err.message || "Failed to submit the report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filteredBins = (bins || []).filter(bin =>
    bin.ward?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bin.zone?.toString().includes(searchTerm) ||
    bin._id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusOptions = [
    { value: "full", label: "Full", icon: "🔴", color: "text-red-600" },
    { value: "partially filled", label: "Partially Filled", icon: "🟡", color: "text-yellow-600" },
    { value: "damaged", label: "Damaged", icon: "⚠️", color: "text-orange-600" },
    { value: "needs maintenance", label: "Needs Maintenance", icon: "🔧", color: "text-blue-600" },
    { value: "overflowing", label: "Overflowing", icon: "💥", color: "text-red-800" }
  ];

  const urgencyOptions = [
    { value: "low", label: "Low", color: "bg-green-100 text-green-800" },
    { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-800" },
    { value: "high", label: "High", color: "bg-red-100 text-red-800" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <ToastContainer position="top-right" />
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <button
                onClick={() => navigate("/userDashboard")}
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Report Bin Issue</h1>
                <p className="text-gray-600">Help keep our city clean by reporting bin issues</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="text-sm text-gray-500">
                  Step {currentStep} of 3
                </div>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(currentStep / 3) * 100}%` }}
                  />
                </div>
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.form
          onSubmit={handleSubmit}
          className="space-y-8"
        >
          {/* Step 1: Bin Selection */}
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-xl shadow-lg p-6"
              >
                <div className="flex items-center mb-6">
                  <div className="p-2 bg-green-100 rounded-lg mr-3">
                    <MapPin className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Select Bin Location</h2>
                    <p className="text-gray-600">Choose the bin you want to report</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search for Bin
          </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setShowBinSearch(true);
                        }}
                        onFocus={() => setShowBinSearch(true)}
                        placeholder="Search by ward, zone, or bin ID..."
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    {errors.bin && <p className="text-red-500 text-sm mt-1">{errors.bin}</p>}
                  </div>

                  {/* Bin Search Results */}
                  {showBinSearch && searchTerm && (
                    <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                      {filteredBins.length > 0 ? (
                        filteredBins.slice(0, 10).map((bin) => (
                          <div
                            key={bin._id}
                            onClick={() => handleBinSelect(bin)}
                            className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900">{bin.ward}, Zone {bin.zone}</p>
                                <p className="text-sm text-gray-600">ID: {bin._id.slice(-6)} • {bin.category}</p>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                bin.status === 'empty' ? 'bg-green-100 text-green-800' :
                                bin.status === 'partially_filled' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {bin.status.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-500">
                          No bins found matching your search
                        </div>
                      )}
                    </div>
                  )}

                  {/* Selected Bin Display */}
                  {selectedBin && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 bg-green-50 border border-green-200 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-green-800">Selected Bin</h3>
                          <p className="text-green-700">{selectedBin.ward}, Zone {selectedBin.zone}</p>
                          <p className="text-sm text-green-600">ID: {selectedBin._id.slice(-6)} • {selectedBin.category}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBin(null);
                            setFormData({ ...formData, bin: "" });
                            setSearchTerm("");
                          }}
                          className="text-green-600 hover:text-green-800"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    disabled={!selectedBin}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Next Step
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step 2: Issue Details */}
          <AnimatePresence mode="wait">
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-xl shadow-lg p-6"
              >
                <div className="flex items-center mb-6">
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    <AlertTriangle className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Report Details</h2>
                    <p className="text-gray-600">Describe the issue and upload evidence</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Status Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Issue Type
          </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {statusOptions.map((option) => (
                        <label
                          key={option.value}
                          className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            formData.status === option.value
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
            name="status"
                            value={option.value}
                            checked={formData.status === option.value}
            onChange={handleChange}
                            className="sr-only"
                          />
                          <span className="text-2xl mr-3">{option.icon}</span>
                          <span className={`font-medium ${option.color}`}>{option.label}</span>
                          {formData.status === option.value && (
                            <CheckCircle className="w-5 h-5 text-green-600 ml-auto" />
                          )}
                        </label>
                      ))}
                    </div>
                    {errors.status && <p className="text-red-500 text-sm mt-1">{errors.status}</p>}
                  </div>

                  {/* Urgency Level */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Urgency Level
                    </label>
                    <div className="flex space-x-3">
                      {urgencyOptions.map((option) => (
                        <label
                          key={option.value}
                          className={`relative flex items-center px-4 py-2 rounded-lg cursor-pointer transition-all ${
                            formData.urgency === option.value
                              ? option.color + ' border-2 border-current'
                              : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                        >
                          <input
                            type="radio"
                            name="urgency"
                            value={option.value}
                            checked={formData.urgency === option.value}
                            onChange={handleChange}
                            className="sr-only"
                          />
                          <span className="font-medium">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Photo
          </label>
                    <div className="space-y-4">
                      <div className="relative">
            <input
              type="file"
              name="attachment"
              onChange={handleFileChange}
                          accept="image/*"
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
                          className="flex items-center justify-center w-full p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-500 transition-colors"
                        >
                          <div className="text-center">
                            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">
                              Click to upload or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                          </div>
            </label>
                      </div>
                      
                      {imagePreview && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="relative"
                        >
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-48 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setImagePreview(null);
                              setFormData({ ...formData, attachment: null });
                            }}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </motion.div>
                      )}
                    </div>
                    {errors.attachment && <p className="text-red-500 text-sm mt-1">{errors.attachment}</p>}
          </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
                      placeholder="Please provide detailed information about the issue..."
                      rows={4}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    />
                    <div className="flex justify-between items-center mt-1">
                      {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
                      <p className="text-xs text-gray-500 ml-auto">
                        {formData.description.length}/500 characters
                      </p>
                    </div>
                  </div>

                  {/* Location Capture */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Location (Optional)
                    </label>
                    <button
                      type="button"
                      onClick={handleLocationClick}
                      className="flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      Capture My Location
                    </button>
                    {formData.location.latitude && (
                      <p className="text-sm text-green-600 mt-2">
                        ✓ Location captured: {formData.location.latitude.toFixed(6)}, {formData.location.longitude.toFixed(6)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-between mt-6">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Next Step
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step 3: Review & Submit */}
          <AnimatePresence mode="wait">
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-xl shadow-lg p-6"
              >
                <div className="flex items-center mb-6">
                  <div className="p-2 bg-purple-100 rounded-lg mr-3">
                    <FileText className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Review & Submit</h2>
                    <p className="text-gray-600">Please review your report before submitting</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Report Summary */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Report Summary</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Bin Location</p>
                        <p className="font-medium">{selectedBin?.ward}, Zone {selectedBin?.zone}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">Issue Type</p>
                        <p className="font-medium">
                          {statusOptions.find(opt => opt.value === formData.status)?.icon} 
                          {statusOptions.find(opt => opt.value === formData.status)?.label}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">Urgency</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          urgencyOptions.find(opt => opt.value === formData.urgency)?.color
                        }`}>
                          {formData.urgency.charAt(0).toUpperCase() + formData.urgency.slice(1)}
                        </span>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">Photo</p>
                        <p className="font-medium">{formData.attachment ? "✓ Uploaded" : "✗ Not provided"}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <p className="text-sm text-gray-600">Description</p>
                      <p className="font-medium">{formData.description}</p>
                    </div>
                  </div>

                  {/* Terms and Conditions */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <Info className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900">Important Information</h4>
                        <ul className="text-sm text-blue-800 mt-2 space-y-1">
                          <li>• Your report will be reviewed by our team within 24 hours</li>
                          <li>• You'll receive updates on the status of your report</li>
                          <li>• False reports may result in account restrictions</li>
                          <li>• Your location data is used only for service improvement</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between mt-6">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Previous
                  </button>
                  <button
            type="submit"
                    disabled={loading}
                    className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Report
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.form>
      </div>
    </div>
  );
};

export default UserReportForm;