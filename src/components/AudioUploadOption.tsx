import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileAudio, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { Button } from './ui/Button';

interface AudioUploadOptionProps {
  onUploadComplete: (audioBlob: Blob) => void;
  onCancel: () => void;
}

export const AudioUploadOption: React.FC<AudioUploadOptionProps> = ({ onUploadComplete, onCancel }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedFormats = ['.mp3', '.wav', '.m4a', '.ogg', '.webm'];
  const maxFileSize = 50 * 1024 * 1024; // 50MB
  const minDuration = 30; // seconds (minimum for voice cloning)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploadedFile(null);

    // Validate file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedFormats.includes(fileExtension)) {
      setError(`Ungültiges Dateiformat. Unterstützt: ${acceptedFormats.join(', ')}`);
      return;
    }

    // Validate file size
    if (file.size > maxFileSize) {
      setError(`Datei zu groß. Maximum: ${(maxFileSize / 1024 / 1024).toFixed(0)}MB`);
      return;
    }

    setUploading(true);
    setUploadedFile(file);

    try {
      // Validate audio duration
      const audio = new Audio(URL.createObjectURL(file));
      await new Promise((resolve, reject) => {
        audio.onloadedmetadata = () => {
          if (audio.duration < minDuration) {
            reject(new Error(`Audio zu kurz. Minimum: ${minDuration} Sekunden für Voice Cloning.`));
          } else {
            resolve(null);
          }
        };
        audio.onerror = () => reject(new Error('Fehler beim Laden der Audio-Datei'));
      });

      // Convert file to blob
      const blob = await file.arrayBuffer().then(buffer => new Blob([buffer], { type: file.type }));
      
      setUploading(false);
      onUploadComplete(blob);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Fehler beim Verarbeiten der Audio-Datei';
      setError(errorMessage);
      setUploading(false);
      setUploadedFile(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl"
    >
      <div className="bg-surface/50 border border-white/10 rounded-2xl p-8">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold mb-2">Audio-Datei hochladen</h3>
          <p className="text-gray-400 text-sm">
            Laden Sie eine bestehende Audio-Aufnahme hoch (mindestens {minDuration} Sekunden)
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          aria-label="Audio-Datei hochladen"
          title="Audio-Datei auswählen"
        />

        {!uploadedFile ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-white/20 rounded-xl p-12 text-center cursor-pointer hover:border-accent/50 transition-colors"
          >
            <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-300 font-medium mb-2">Klicken Sie hier oder ziehen Sie eine Datei hierher</p>
            <p className="text-sm text-gray-500">
              Unterstützte Formate: {acceptedFormats.join(', ')} • Max. {(maxFileSize / 1024 / 1024).toFixed(0)}MB
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/10">
              <FileAudio className="text-accent" size={24} />
              <div className="flex-1">
                <p className="font-medium">{uploadedFile.name}</p>
                <p className="text-sm text-gray-400">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              {uploading ? (
                <div className="text-accent">Wird verarbeitet...</div>
              ) : (
                <CheckCircle2 className="text-green-500" size={24} />
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400">
            <AlertCircle size={20} />
            <span className="flex-1">{error}</span>
            <button
              onClick={() => {
                setError(null);
                setUploadedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="text-red-400 hover:text-red-300"
              aria-label="Fehler schließen"
              title="Fehler schließen"
            >
              <X size={20} />
            </button>
          </div>
        )}

        <div className="flex gap-4 mt-6">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            disabled={uploading}
          >
            Abbrechen
          </Button>
          {uploadedFile && !uploading && (
            <Button
              variant="primary"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1"
            >
              Andere Datei wählen
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

