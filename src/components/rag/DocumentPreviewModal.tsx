import React from 'react';
import { Modal } from '../ui/Modal';
import { File, AlertCircle } from 'lucide-react';
import { RagDocument } from '../../hooks/useRagDocuments';
import { LoadingSpinner } from '../LoadingSpinner';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: RagDocument | null;
  isLoading?: boolean;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  document,
  isLoading = false,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'embedded':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'uploaded':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'error':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'embedded':
        return 'Embedded';
      case 'uploaded':
        return 'Uploaded';
      case 'error':
        return 'Error';
      case 'queued':
        return 'Queued';
      case 'processing':
        return 'Processing';
      case 'ready':
        return 'Ready';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('de-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Show excerpt of raw_text (first 5000 chars)
  const getTextExcerpt = (text: string | null | undefined, maxLength: number = 5000) => {
    if (!text) return 'No text content available';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '\n\n... (truncated)';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Document Preview" size="xl">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : !document ? (
        <div className="text-center py-12 text-gray-400">No document selected</div>
      ) : (
        <div className="space-y-6">
          {/* Document Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400">Title</label>
              <p className="text-white font-medium mt-1">{document.title}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Status</label>
              <div className="mt-1">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                    document.status
                  )}`}
                >
                  {getStatusText(document.status)}
                </span>
              </div>
            </div>
            {document.original_file_name && (
              <div>
                <label className="text-sm text-gray-400">File Name</label>
                <p className="text-white mt-1 flex items-center gap-2">
                  <File size={16} className="text-gray-400" />
                  {document.original_file_name}
                </p>
              </div>
            )}
            {document.mime_type && (
              <div>
                <label className="text-sm text-gray-400">MIME Type</label>
                <p className="text-white mt-1">{document.mime_type}</p>
              </div>
            )}
            <div>
              <label className="text-sm text-gray-400">Source</label>
              <p className="text-white mt-1 capitalize">{document.source}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Chunk Count</label>
              <p className="text-white mt-1">{document.chunk_count}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Created</label>
              <p className="text-white mt-1">{formatDate(document.created_at)}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Updated</label>
              <p className="text-white mt-1">{formatDate(document.updated_at)}</p>
            </div>
          </div>

          {/* Error Message */}
          {document.status === 'error' && document.error && (
            <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-400 font-medium mb-1">Error</p>
                  <p className="text-red-300 text-sm">{document.error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Raw Text Preview */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Content Preview</label>
            <div className="bg-background border border-gray-600 rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                {getTextExcerpt(document.raw_text)}
              </pre>
            </div>
            {document.raw_text && document.raw_text.length > 5000 && (
              <p className="text-xs text-gray-500 mt-2">
                Showing first 5,000 characters of {document.raw_text.length.toLocaleString()} total characters
              </p>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};
