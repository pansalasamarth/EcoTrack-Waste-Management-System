import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  MapPin, 
  Clock, 
  User, 
  Trash2, 
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Eye,
  MessageSquare
} from 'lucide-react';

const ReportDetailsModal = ({ isOpen, onClose, report }) => {
  if (!isOpen || !report) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5" />;
      case 'rejected':
        return <XCircle className="w-5 h-5" />;
      case 'pending':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getIssueTypeColor = (status) => {
    switch (status) {
      case 'full':
        return 'bg-red-100 text-red-800';
      case 'partially_filled':
        return 'bg-yellow-100 text-yellow-800';
      case 'damaged':
        return 'bg-orange-100 text-orange-800';
      case 'needs_maintenance':
        return 'bg-blue-100 text-blue-800';
      case 'overflowing':
        return 'bg-red-200 text-red-900';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getIssueTypeIcon = (status) => {
    switch (status) {
      case 'full':
        return '🔴';
      case 'partially_filled':
        return '🟡';
      case 'damaged':
        return '⚠️';
      case 'needs_maintenance':
        return '🔧';
      case 'overflowing':
        return '💥';
      default:
        return '🗑️';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownloadImage = () => {
    if (report.attachment) {
      const link = document.createElement('a');
      link.href = report.attachment;
      link.download = `report-${report._id}-image.jpg`;
      link.click();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={onClose}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full"
            >
              {/* Header */}
              <div className="bg-white px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getIssueTypeIcon(report.status)}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Report #{report._id?.slice(-6) || 'N/A'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Submitted on {formatDate(report.createdAt)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="bg-white px-6 py-6 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Report Details */}
                  <div className="space-y-6">
                    {/* Status Cards */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className={`p-4 rounded-lg border-2 ${getStatusColor(report.admin_status)}`}>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(report.admin_status)}
                          <span className="font-medium">Admin Status</span>
                        </div>
                        <p className="text-sm mt-1 capitalize">{report.admin_status}</p>
                      </div>
                      
                      <div className={`p-4 rounded-lg border-2 ${getStatusColor(report.wc_status)}`}>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(report.wc_status)}
                          <span className="font-medium">Collector Status</span>
                        </div>
                        <p className="text-sm mt-1 capitalize">{report.wc_status}</p>
                      </div>
                    </div>

                    {/* Issue Details */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Issue Details</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Type:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getIssueTypeColor(report.status)}`}>
                            {report.status?.replace('_', ' ')}
                          </span>
                        </div>
                        {report.urgency && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Urgency:</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              report.urgency === 'high' ? 'bg-red-100 text-red-800' :
                              report.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {report.urgency}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Location Details */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        Location Details
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Ward:</span>
                          <span className="font-medium">{report.bin?.ward || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Zone:</span>
                          <span className="font-medium">{report.bin?.zone || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Bin ID:</span>
                          <span className="font-medium">{report.bin?._id?.slice(-6) || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Category:</span>
                          <span className="font-medium">{report.bin?.category || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Type:</span>
                          <span className="font-medium">{report.bin?.binType || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {report.description && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Description
                        </h4>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {report.description}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right Column - Image and Timeline */}
                  <div className="space-y-6">
                    {/* Image */}
                    {report.attachment && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900 flex items-center">
                            <Eye className="w-4 h-4 mr-2" />
                            Attached Image
                          </h4>
                          <button
                            onClick={handleDownloadImage}
                            className="flex items-center px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </button>
                        </div>
                        <div className="relative">
                          <img
                            src={report.attachment}
                            alt="Report attachment"
                            className="w-full h-48 object-cover rounded-lg"
                          />
                        </div>
                      </div>
                    )}

                    {/* Progress Timeline */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-4">Progress Timeline</h4>
                      <div className="space-y-4">
                        {/* Step 1: Report Submitted */}
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                              <CheckCircle className="w-5 h-5 text-white" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">Report Submitted</p>
                            <p className="text-xs text-gray-600">{formatDate(report.createdAt)}</p>
                          </div>
                        </div>

                        {/* Step 2: Admin Review */}
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              report.admin_status === 'pending' ? 'bg-yellow-500' :
                              report.admin_status === 'approved' ? 'bg-green-500' :
                              'bg-red-500'
                            }`}>
                              {getStatusIcon(report.admin_status)}
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">Admin Review</p>
                            <p className="text-xs text-gray-600 capitalize">
                              Status: {report.admin_status}
                              {report.admin_status !== 'pending' && report.updatedAt && 
                                ` • ${formatDate(report.updatedAt)}`
                              }
                            </p>
                          </div>
                        </div>

                        {/* Step 3: Collector Action */}
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              report.wc_status === 'done' ? 'bg-green-500' :
                              report.wc_status === 'pending' ? 'bg-yellow-500' :
                              'bg-gray-300'
                            }`}>
                              {getStatusIcon(report.wc_status)}
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">Collector Action</p>
                            <p className="text-xs text-gray-600 capitalize">
                              Status: {report.wc_status}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Additional Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Reported by:</span>
                          <span className="font-medium">{report.user_id?.name || 'Unknown User'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">User ID:</span>
                          <span className="font-medium">{report.user_id?._id?.slice(-6) || 'N/A'}</span>
                        </div>
                        {report.location && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Location:</span>
                            <span className="font-medium text-xs">
                              {report.location.latitude?.toFixed(4)}, {report.location.longitude?.toFixed(4)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Report ID: {report._id}
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Close
                    </button>
                    {report.admin_status === 'pending' && (
                      <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                        Edit Report
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ReportDetailsModal;
