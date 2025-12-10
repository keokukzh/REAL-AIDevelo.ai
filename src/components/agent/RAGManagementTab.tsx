import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { 
  Upload, 
  FileText, 
  Trash2, 
  Search, 
  CheckCircle, 
  Clock, 
  XCircle,
  Database,
  Eye,
  Download
} from 'lucide-react';
import { apiRequest, ApiRequestError } from '../../services/api';

interface RAGDocument {
  id: string;
  agentId: string;
  name: string;
  type: 'pdf' | 'txt' | 'docx' | 'md';
  url?: string;
  fileSize?: number;
  uploadedAt: Date | string;
  status: 'processing' | 'ready' | 'error';
  chunks?: RAGChunk[];
  error?: string;
}

interface RAGChunk {
  id: string;
  documentId: string;
  content: string;
  index: number;
  metadata?: Record<string, any>;
}

interface RAGManagementTabProps {
  agentId: string;
}

export const RAGManagementTab: React.FC<RAGManagementTabProps> = ({ agentId }) => {
  const [documents, setDocuments] = useState<RAGDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<RAGDocument | null>(null);
  const [testQuery, setTestQuery] = useState('');
  const [testResults, setTestResults] = useState<any>(null);
  const [vectorStoreStatus, setVectorStoreStatus] = useState<{
    connected: boolean;
    totalChunks: number;
    totalDocuments: number;
  }>({ connected: false, totalChunks: 0, totalDocuments: 0 });

  useEffect(() => {
    fetchDocuments();
    fetchVectorStoreStatus();
  }, [agentId]);

  const fetchDocuments = async () => {
    try {
      const res = await apiRequest<{ data: RAGDocument[] }>(`/agents/${agentId}/rag/documents`);
      setDocuments(res.data);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVectorStoreStatus = async () => {
    try {
      // Mock status - in production, this would come from the backend
      const totalChunks = documents.reduce((sum, doc) => sum + (doc.chunks?.length || 0), 0);
      setVectorStoreStatus({
        connected: true,
        totalChunks,
        totalDocuments: documents.length,
      });
    } catch (error) {
      console.error('Failed to fetch vector store status:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', file.name);

      const res = await apiRequest<{ data: RAGDocument }>(`/agents/${agentId}/rag/documents`, {
        method: 'POST',
        body: formData,
      });

      setDocuments((prev) => [...prev, res.data]);
      // Poll for status updates
      setTimeout(() => fetchDocuments(), 2000);
    } catch (error) {
      const errorMessage = error instanceof ApiRequestError
        ? error.message
        : 'Fehler beim Hochladen des Dokuments.';
      alert(errorMessage);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('Möchten Sie dieses Dokument wirklich löschen?')) return;

    try {
      await apiRequest(`/agents/${agentId}/rag/documents/${docId}`, {
        method: 'DELETE',
      });
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      if (selectedDocument?.id === docId) {
        setSelectedDocument(null);
      }
    } catch (error) {
      const errorMessage = error instanceof ApiRequestError
        ? error.message
        : 'Fehler beim Löschen des Dokuments.';
      alert(errorMessage);
    }
  };

  const handleTestQuery = async () => {
    if (!testQuery.trim()) return;

    try {
      // Mock test query - in production, this would call the RAG service
      setTestResults({
        query: testQuery,
        chunks: [
          {
            id: 'chunk-1',
            content: 'Beispielinhalt aus dem Dokument...',
            score: 0.95,
            document: 'Beispiel-Dokument.pdf',
          },
        ],
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Test query failed:', error);
    }
  };

  const getStatusIcon = (status: RAGDocument['status']) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="text-green-400" size={16} />;
      case 'processing':
        return <Clock className="text-yellow-400 animate-spin" size={16} />;
      case 'error':
        return <XCircle className="text-red-400" size={16} />;
      default:
        return <Clock className="text-gray-400" size={16} />;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Vector Store Status */}
      <div className="bg-surface rounded-xl border border-white/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Database size={20} />
            Vector Store Status
          </h3>
          <div className={`px-3 py-1 rounded-full text-xs font-bold ${
            vectorStoreStatus.connected
              ? 'bg-green-500/20 text-green-400'
              : 'bg-red-500/20 text-red-400'
          }`}>
            {vectorStoreStatus.connected ? 'Verbunden' : 'Nicht verbunden'}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-gray-400 text-sm">Dokumente:</span>
            <p className="text-2xl font-bold">{vectorStoreStatus.totalDocuments}</p>
          </div>
          <div>
            <span className="text-gray-400 text-sm">Chunks:</span>
            <p className="text-2xl font-bold">{vectorStoreStatus.totalChunks}</p>
          </div>
        </div>
      </div>

      {/* Document Upload */}
      <div className="bg-surface rounded-xl border border-white/10 p-6">
        <h3 className="text-lg font-bold mb-4">Dokument hochladen</h3>
        <div className="border-2 border-dashed border-white/10 rounded-lg p-8 text-center">
          <Upload className="mx-auto mb-4 text-gray-400" size={32} />
          <p className="text-gray-400 mb-4">
            Ziehen Sie Dateien hierher oder klicken Sie zum Auswählen
          </p>
          <input
            type="file"
            accept=".pdf,.txt,.docx,.md"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload">
            <Button
              variant="outline"
              as="span"
              disabled={uploading}
              className="cursor-pointer"
            >
              {uploading ? 'Wird hochgeladen...' : 'Datei auswählen'}
            </Button>
          </label>
          <p className="text-xs text-gray-500 mt-2">
            Unterstützte Formate: PDF, TXT, DOCX, MD (max. 10MB)
          </p>
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-surface rounded-xl border border-white/10 p-6">
        <h3 className="text-lg font-bold mb-4">Dokumente ({documents.length})</h3>
        {loading ? (
          <div className="text-center py-8 text-gray-400">Lade Dokumente...</div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            Noch keine Dokumente hochgeladen.
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 hover:border-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <FileText className="text-accent" size={24} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{doc.name}</span>
                      {getStatusIcon(doc.status)}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                      <span>{doc.type.toUpperCase()}</span>
                      <span>{formatFileSize(doc.fileSize)}</span>
                      <span>
                        {new Date(doc.uploadedAt).toLocaleDateString('de-CH')}
                      </span>
                      {doc.chunks && <span>{doc.chunks.length} Chunks</span>}
                    </div>
                    {doc.error && (
                      <p className="text-xs text-red-400 mt-1">{doc.error}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedDocument(doc)}
                    className="p-2"
                  >
                    <Eye size={16} />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDeleteDocument(doc.id)}
                    className="p-2 text-red-400 hover:text-red-300"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Chunk Preview Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface rounded-xl border border-white/10 p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">{selectedDocument.name}</h3>
              <Button variant="outline" onClick={() => setSelectedDocument(null)}>
                <XCircle size={20} />
              </Button>
            </div>
            {selectedDocument.chunks && selectedDocument.chunks.length > 0 ? (
              <div className="space-y-4">
                {selectedDocument.chunks.map((chunk, index) => (
                  <div
                    key={chunk.id}
                    className="bg-white/5 rounded-lg p-4 border border-white/10"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400">Chunk #{chunk.index + 1}</span>
                      {chunk.metadata && (
                        <span className="text-xs text-gray-400">
                          {Object.keys(chunk.metadata).length} Metadaten
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">
                      {chunk.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">
                Noch keine Chunks verfügbar. Das Dokument wird verarbeitet...
              </p>
            )}
          </motion.div>
        </div>
      )}

      {/* Test Query */}
      <div className="bg-surface rounded-xl border border-white/10 p-6">
        <h3 className="text-lg font-bold mb-4">Test Query</h3>
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={testQuery}
              onChange={(e) => setTestQuery(e.target.value)}
              placeholder="Frage eingeben, um RAG zu testen..."
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-accent focus:outline-none"
              onKeyPress={(e) => e.key === 'Enter' && handleTestQuery()}
            />
            <Button variant="primary" onClick={handleTestQuery}>
              <Search size={16} className="mr-2" />
              Suchen
            </Button>
          </div>
          {testResults && (
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="mb-4">
                <span className="text-sm text-gray-400">Query:</span>
                <p className="font-medium">{testResults.query}</p>
              </div>
              <div className="space-y-2">
                <span className="text-sm text-gray-400">Gefundene Chunks:</span>
                {testResults.chunks.map((chunk: any, index: number) => (
                  <div
                    key={index}
                    className="bg-black/20 rounded p-3 border border-white/10"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400">
                        {chunk.document} (Score: {(chunk.score * 100).toFixed(1)}%)
                      </span>
                    </div>
                    <p className="text-sm text-gray-300">{chunk.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

