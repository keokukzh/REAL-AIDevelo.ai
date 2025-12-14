import React, { useCallback, useState } from 'react';
import { Upload, File, X } from 'lucide-react';
import { LoadingSpinner } from '../LoadingSpinner';

interface DocumentUploadProps {
  onUpload: (file: File, title?: string) => Promise<void>;
  isUploading?: boolean;
  maxSizeMB?: number;
  acceptedTypes?: string[];
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onUpload,
  isUploading = false,
  maxSizeMB = 10,
  acceptedTypes = ['.txt', '.md', '.pdf'],
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File size exceeds ${maxSizeMB}MB limit`;
    }

    // Check file type
    const fileName = file.name.toLowerCase();
    const isValidType = acceptedTypes.some((ext) => fileName.endsWith(ext.toLowerCase()));
    if (!isValidType) {
      return `File type not allowed. Allowed types: ${acceptedTypes.join(', ')}`;
    }

    return null;
  };

  const handleFileSelect = useCallback((file: File) => {
    setError(null);
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSelectedFile(file);
    // Set default title from filename without extension
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
    setTitle(nameWithoutExt);
  }, [maxSizeMB, acceptedTypes]);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    setError(null);
    try {
      await onUpload(selectedFile, title || undefined);
      // Reset form
      setSelectedFile(null);
      setTitle('');
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload document');
    }
  }, [selectedFile, title, onUpload]);

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setTitle('');
    setError(null);
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }, []);

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      {!selectedFile && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          role="button"
          tabIndex={0}
          aria-label="Drop zone for document upload"
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-accent bg-accent/10'
              : 'border-gray-600 hover:border-gray-500 bg-surface/50'
          }`}
        >
          <Upload size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-gray-300 mb-2">
            Drag & drop a document here, or{' '}
            <label htmlFor="file-input" className="text-accent cursor-pointer hover:underline">
              browse
            </label>
          </p>
          <p className="text-sm text-gray-500">
            Supported: {acceptedTypes.join(', ')} (max {maxSizeMB}MB)
          </p>
          <input
            id="file-input"
            type="file"
            accept={acceptedTypes.join(',')}
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>
      )}

      {/* Selected File Preview */}
      {selectedFile && (
        <div className="border border-gray-600 rounded-lg p-4 bg-surface/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <File size={24} className="text-gray-400" />
              <div>
                <p className="text-white font-medium">{selectedFile.name}</p>
                <p className="text-sm text-gray-400">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={handleRemoveFile}
              disabled={isUploading}
              className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              title="Remove file"
              aria-label="Remove file"
            >
              <X size={20} />
            </button>
          </div>

          {/* Title Input */}
          <div className="mt-4">
            <label htmlFor="title-input" className="block text-sm text-gray-400 mb-2">
              Document Title (optional)
            </label>
            <input
              id="title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={selectedFile.name.replace(/\.[^/.]+$/, '')}
              disabled={isUploading}
              className="w-full px-4 py-2 bg-background border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="mt-4 w-full px-4 py-2 bg-accent text-black rounded-lg font-medium hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload size={20} />
                <span>Upload Document</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
