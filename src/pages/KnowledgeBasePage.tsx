import React, { useState } from 'react';
import { useRagDocuments } from '../hooks/useRagDocuments';
import { DocumentUpload } from '../components/rag/DocumentUpload';
import { DocumentPreviewModal } from '../components/rag/DocumentPreviewModal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { SideNav } from '../components/dashboard/SideNav';
import { File, Trash2, RefreshCw, Eye, Search, AlertCircle } from 'lucide-react';
import { toast } from '../components/ui/Toast';

export const KnowledgeBasePage = () => {
  const {
    documents,
    isLoading,
    error,
    refetch,
    upload,
    delete: deleteDocument,
    reEmbed,
    isUploading,
    isDeleting,
    isReEmbedding,
    useDocument,
  } = useRagDocuments();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  // Get selected document details
  const { data: selectedDocument, isLoading: isLoadingDocument } = useDocument(selectedDocumentId);

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
    return new Date(dateString).toLocaleDateString('de-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleUpload = async (file: File, title?: string) => {
    try {
      await upload({ file, title });
      toast.success('Document uploaded successfully');
      setShowUpload(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload document');
      throw err;
    }
  };

  const handleDelete = async (documentId: string, title: string) => {
    if (!globalThis.confirm(`Are you sure you want to delete "${title}"? This will also remove all associated chunks from the vector store.`)) {
      return;
    }

    try {
      await deleteDocument(documentId);
      toast.success('Document deleted successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete document');
    }
  };

  const handleReEmbed = async (documentId: string) => {
    try {
      await reEmbed(documentId);
      toast.success('Document re-embedded successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to re-embed document');
    }
  };

  const handlePreview = (documentId: string) => {
    setSelectedDocumentId(documentId);
  };

  // Filter documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.original_file_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-background text-white flex">
      {/* Side Navigation */}
      <SideNav />

      {/* Main Content */}
      <div className="flex-1 p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Knowledge Base</h1>
          <p className="text-gray-400">
            Manage your RAG documents. Documents are automatically embedded and used as context for your voice agent.
          </p>
        </div>

        {/* Upload Section */}
        {showUpload && (
          <div className="mb-6 p-6 bg-surface rounded-lg border border-white/10">
            <h2 className="text-xl font-semibold mb-4">Upload Document</h2>
            <DocumentUpload onUpload={handleUpload} isUploading={isUploading} />
            <button
              onClick={() => setShowUpload(false)}
              className="mt-4 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Actions Bar */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-surface border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-surface border border-gray-600 rounded-lg text-white focus:outline-none focus:border-accent"
              title="Filter documents by status"
            >
              <option value="all">All Status</option>
              <option value="embedded">Embedded</option>
              <option value="uploaded">Uploaded</option>
              <option value="error">Error</option>
            </select>
          </div>

          {/* Upload Button */}
          {!showUpload && (
            <button
              onClick={() => setShowUpload(true)}
              className="px-4 py-2 bg-accent text-black rounded-lg font-medium hover:bg-accent/80 flex items-center gap-2"
            >
              <File size={20} />
              <span>Upload Document</span>
            </button>
          )}
        </div>

        {/* Documents Table */}
        {(() => {
          if (isLoading) {
            return (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
              </div>
            );
          }
          if (error) {
            // Parse error message for better user feedback
            let errorMessage = error.message || 'Unknown error';
            let errorTitle = 'Error loading documents';
            
            // Check for specific error types
            if (errorMessage.includes('locationId') || errorMessage.includes('location_id')) {
              errorTitle = 'Location ID Error';
              errorMessage = 'Unable to resolve your location. Please ensure you are properly authenticated and try again.';
            } else if (errorMessage.includes('table') || errorMessage.includes('migration')) {
              errorTitle = 'Database Error';
              errorMessage = 'The knowledge base database may not be set up correctly. Please contact support.';
            } else if (errorMessage.includes('permission') || errorMessage.includes('RLS')) {
              errorTitle = 'Permission Error';
              errorMessage = 'You do not have permission to access the knowledge base. Please contact your administrator.';
            } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
              errorTitle = 'Connection Error';
              errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
            }
            
            return (
              <div className="p-6 bg-red-500/20 border border-red-500/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-red-400 font-medium mb-1">{errorTitle}</p>
                    <p className="text-red-300 text-sm mb-3">{errorMessage}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => refetch()}
                        className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                      >
                        Retry
                      </button>
                      {errorMessage.includes('locationId') && (
                        <button
                          onClick={() => window.location.reload()}
                          className="px-4 py-2 bg-gray-500/20 text-gray-300 rounded-lg hover:bg-gray-500/30 transition-colors"
                        >
                          Reload Page
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          }
          if (filteredDocuments.length === 0) {
            const isEmpty = documents.length === 0;
            return (
              <div className="p-12 text-center bg-surface rounded-lg border border-white/10">
                <File size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="text-gray-400 mb-2">
                  {isEmpty ? 'No documents yet' : 'No documents match your filters'}
                </p>
                {isEmpty && (
                  <button
                    onClick={() => setShowUpload(true)}
                    className="mt-4 px-4 py-2 bg-accent text-black rounded-lg font-medium hover:bg-accent/80"
                  >
                    Upload Your First Document
                  </button>
                )}
              </div>
            );
          }
          return (
          <div className="bg-surface rounded-lg border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface/50 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Chunks
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Updated
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredDocuments.map((doc) => (
                    <tr key={doc.id} className="hover:bg-surface/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <File size={16} className="text-gray-400" />
                          <span className="text-white font-medium">{doc.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-gray-300 capitalize">{doc.source}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-gray-300 text-sm">
                          {doc.mime_type || doc.original_file_name?.split('.').pop()?.toUpperCase() || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                            doc.status
                          )}`}
                        >
                          {getStatusText(doc.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-gray-300">{doc.chunk_count}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-gray-400 text-sm">{formatDate(doc.updated_at)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handlePreview(doc.id)}
                            className="p-2 text-gray-400 hover:text-white transition-colors"
                            title="Preview"
                          >
                            <Eye size={18} />
                          </button>
                          {doc.status !== 'error' && (
                            <button
                              onClick={() => handleReEmbed(doc.id)}
                              disabled={isReEmbedding}
                              className="p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Re-embed"
                            >
                              <RefreshCw size={18} className={isReEmbedding ? 'animate-spin' : ''} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(doc.id, doc.title)}
                            disabled={isDeleting}
                            className="p-2 text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          );
        })()}

        {/* Preview Modal */}
        <DocumentPreviewModal
          isOpen={!!selectedDocumentId}
          onClose={() => {
            setSelectedDocumentId(null);
          }}
          document={selectedDocument || null}
          isLoading={isLoadingDocument}
        />
      </div>
    </div>
  );
};
