import React, { useState } from 'react';
import { Download, Trash2, Eye, AlertTriangle, Loader, CheckCircle } from 'lucide-react';
import { apiRequest } from '../../services/api';

interface PrivacyControlsProps {
  userId: string;
  userEmail: string;
}

export function PrivacyControls({ userId, userEmail }: PrivacyControlsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[] | null>(null);
  const [showAuditLogs, setShowAuditLogs] = useState(false);

  const handleExportData = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await apiRequest('POST', '/privacy/export-data', {
        userId,
        email: userEmail,
      });

      // Create download link
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `user-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccess('Your data has been exported and downloaded.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to export data';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteData = async () => {
    if (!deleteConfirmed) {
      setError('Please confirm deletion by checking the box');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      await apiRequest('POST', '/privacy/delete-data', {
        userId,
        email: userEmail,
        confirmDeletion: true,
      });

      setSuccess('Your data has been permanently deleted.');
      setShowDeleteConfirm(false);
      setDeleteConfirmed(false);

      // Redirect to home after delay
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete data';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAuditLog = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiRequest('GET', `/privacy/audit-log?userId=${userId}`);
      setAuditLogs(response.data.logs || []);
      setShowAuditLogs(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load audit logs';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Success Display */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-green-900">Success</p>
            <p className="text-sm text-green-700">{success}</p>
          </div>
        </div>
      )}

      {/* Privacy Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Export Data Card */}
        <div className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition">
          <div className="flex items-center gap-3 mb-4">
            <Download className="w-6 h-6 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Export My Data</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Download a copy of all your data in JSON format. (GDPR Article 15)
          </p>
          <button
            onClick={handleExportData}
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export Data
              </>
            )}
          </button>
        </div>

        {/* View Audit Log Card */}
        <div className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition">
          <div className="flex items-center gap-3 mb-4">
            <Eye className="w-6 h-6 text-purple-600" />
            <h3 className="font-semibold text-gray-900">View Audit Log</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            See a complete history of all actions on your account. (GDPR Article 5)
          </p>
          <button
            onClick={handleViewAuditLog}
            disabled={loading}
            className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                View Audit Log
              </>
            )}
          </button>
        </div>

        {/* Delete Data Card */}
        <div className="border border-red-200 rounded-lg p-6 hover:shadow-lg transition bg-red-50">
          <div className="flex items-center gap-3 mb-4">
            <Trash2 className="w-6 h-6 text-red-600" />
            <h3 className="font-semibold text-gray-900">Delete All Data</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Permanently delete your account and all data. (GDPR Article 17)
          </p>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition"
          >
            <Trash2 className="w-4 h-4 inline-block mr-2" />
            Delete Account
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4 text-red-600">
              <AlertTriangle className="w-6 h-6" />
              <h2 className="text-xl font-bold">Delete Account?</h2>
            </div>
            <p className="text-gray-700 mb-4">
              This action is <strong>permanent</strong> and cannot be undone. All your data including:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 mb-6 space-y-1">
              <li>Agent configurations</li>
              <li>Call history</li>
              <li>Knowledge documents</li>
              <li>User profile</li>
            </ul>
            <div className="mb-6 flex items-start gap-3">
              <input
                type="checkbox"
                id="confirm"
                checked={deleteConfirmed}
                onChange={(e) => setDeleteConfirmed(e.target.checked)}
                className="mt-1 w-4 h-4 text-red-600"
              />
              <label htmlFor="confirm" className="text-sm text-gray-700">
                I understand that this action is permanent and will delete all my data
              </label>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmed(false);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteData}
                disabled={!deleteConfirmed || loading}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete All Data'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Logs Modal */}
      {showAuditLogs && auditLogs && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto p-6">
            <h2 className="text-xl font-bold mb-4">Audit Log</h2>
            {auditLogs.length === 0 ? (
              <p className="text-gray-600">No audit logs found.</p>
            ) : (
              <div className="space-y-3">
                {auditLogs.map((log, idx) => (
                  <div key={idx} className="border-b border-gray-200 pb-3 last:border-b-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{log.action}</p>
                        <p className="text-sm text-gray-600">
                          Resource: {log.resourceType} ({log.resourceId})
                        </p>
                        {log.ipAddress && (
                          <p className="text-xs text-gray-500">
                            From: {log.ipAddress} {log.userAgent ? `• ${log.userAgent.substring(0, 40)}...` : ''}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => {
                setShowAuditLogs(false);
                setAuditLogs(null);
              }}
              className="w-full mt-6 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
