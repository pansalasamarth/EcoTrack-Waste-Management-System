import React from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Clock, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Trash2,
  Calendar,
  User
} from 'lucide-react';

const ReportCard = ({ report, onView, onEdit, showActions = true }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-lg">{getIssueTypeIcon(report.status)}</span>
              <h3 className="text-lg font-semibold text-gray-900">
                Report #{report._id?.slice(-6) || 'N/A'}
              </h3>
            </div>
            
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <MapPin className="w-4 h-4 mr-1" />
              <span>
                {report.bin?.ward || 'Unknown Ward'}, Zone {report.bin?.zone || 'N/A'}
              </span>
            </div>
            
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="w-4 h-4 mr-1" />
              <span>{formatDate(report.createdAt)}</span>
            </div>
          </div>
          
          <div className="flex flex-col space-y-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getIssueTypeColor(report.status)}`}>
              {report.status?.replace('_', ' ')}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.admin_status)}`}>
              {getStatusIcon(report.admin_status)}
              <span className="ml-1">{report.admin_status}</span>
            </span>
          </div>
        </div>

        {/* Description */}
        {report.description && (
          <div className="mb-4">
            <p className="text-gray-700 text-sm line-clamp-2">
              {report.description}
            </p>
          </div>
        )}

        {/* Bin Details */}
        {report.bin && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Bin ID:</span>
                <span className="ml-2 font-medium">{report.bin._id?.slice(-6) || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-600">Category:</span>
                <span className="ml-2 font-medium">{report.bin.category || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-600">Type:</span>
                <span className="ml-2 font-medium">{report.bin.binType || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-600">Capacity:</span>
                <span className="ml-2 font-medium">
                  {report.bin.realTimeCapacity || 0}% / {report.bin.totalCapacity || 100}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Progress Timeline */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Progress Timeline</h4>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full ${report.admin_status === 'pending' ? 'bg-yellow-500' : 'bg-green-500'}`} />
              <span className="ml-2 text-xs text-gray-600">Reported</span>
            </div>
            <div className="flex-1 h-px bg-gray-200" />
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full ${report.admin_status === 'approved' ? 'bg-green-500' : report.admin_status === 'rejected' ? 'bg-red-500' : 'bg-gray-300'}`} />
              <span className="ml-2 text-xs text-gray-600">Reviewed</span>
            </div>
            <div className="flex-1 h-px bg-gray-200" />
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full ${report.wc_status === 'done' ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="ml-2 text-xs text-gray-600">Resolved</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-4">
              {report.attachment && (
                <div className="flex items-center text-sm text-gray-600">
                  <Trash2 className="w-4 h-4 mr-1" />
                  <span>Photo attached</span>
                </div>
              )}
              {report.urgency && (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  report.urgency === 'high' ? 'bg-red-100 text-red-800' :
                  report.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {report.urgency} priority
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {onView && (
                <button
                  onClick={() => onView(report)}
                  className="flex items-center px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </button>
              )}
              {onEdit && report.admin_status === 'pending' && (
                <button
                  onClick={() => onEdit(report)}
                  className="flex items-center px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                >
                  Edit
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ReportCard;
