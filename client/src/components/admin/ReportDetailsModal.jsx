import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, XCircle, Clock, MapPin, User, Calendar, FileText, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-toastify';

const ReportDetailsModal = ({ isOpen, onClose, report, onUpdateStatus }) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !report) return null;

  const handleStatusUpdate = async (status) => {
    setLoading(true);
    try {
      await onUpdateStatus(report._id, status);
      toast.success(`Report ${status} successfully`);
      onClose();
    } catch (error) {
      toast.error(`Failed to ${status} report`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getReportStatusColor = (status) => {
    switch (status) {
      case 'full': return 'bg-red-100 text-red-800';
      case 'partially filled': return 'bg-yellow-100 text-yellow-800';
      case 'damaged': return 'bg-orange-100 text-orange-800';
      case 'needs maintenance': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Report Details</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Report Status */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Report Status</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getReportStatusColor(report.status)}`}>
                    {report.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Admin Status</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(report.admin_status)}`}>
                    {report.admin_status}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">WC Status</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    report.wc_status === 'done' ? 'bg-green-100 text-green-800' :
                    report.wc_status === 'recycled' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {report.wc_status}
                  </span>
                </div>
              </div>
              
              {report.admin_status === 'pending' && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleStatusUpdate('approved')}
                    disabled={loading}
                    className="flex items-center px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleStatusUpdate('rejected')}
                    disabled={loading}
                    className="flex items-center px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Reject
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  User Information
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Name</p>
                    <p className="text-gray-900">{report.user_id?.name || 'Unknown User'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Email</p>
                    <p className="text-gray-900">{report.user_id?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Phone</p>
                    <p className="text-gray-900">{report.user_id?.phoneNo || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Location Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Location Information
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Ward</p>
                    <p className="text-gray-900">{report.bin?.ward || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Zone</p>
                    <p className="text-gray-900">{report.bin?.zone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Bin Status</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      report.bin?.status === 'filled' ? 'bg-red-100 text-red-800' :
                      report.bin?.status === 'partially_filled' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {report.bin?.status || 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Report Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Report Details
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-600">Description</p>
                  <p className="text-gray-900">{report.description || 'No description provided'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Submitted Date</p>
                  <p className="text-gray-900 flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    {new Date(report.createdAt).toLocaleString()}
                  </p>
                </div>
                {report.updatedAt && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Last Updated</p>
                    <p className="text-gray-900 flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      {new Date(report.updatedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Attachment */}
            {report.attachment && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <ImageIcon className="w-5 h-5 mr-2" />
                  Attachment
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <div className="text-center">
                      <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Image attached</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {report.attachment.contentType}
                      </p>
                      <button className="mt-2 text-blue-600 hover:text-blue-800 text-sm">
                        View Image
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action History */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Action History</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Report submitted</p>
                      <p className="text-xs text-gray-600">{new Date(report.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  {report.admin_status !== 'pending' && (
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        report.admin_status === 'approved' ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Report {report.admin_status} by admin
                        </p>
                        <p className="text-xs text-gray-600">
                          {new Date(report.updatedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {report.wc_status === 'done' && (
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Waste collected</p>
                        <p className="text-xs text-gray-600">
                          {new Date(report.updatedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReportDetailsModal;
