import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';
import { apiRequest, ApiRequestError } from '../../services/api';
import { CheckCircle2, AlertCircle, Paperclip, X, Upload, Loader2, Calendar, Terminal, Zap } from 'lucide-react';

interface WebdesignContactFormProps {
  onSuccess?: () => void;
}

interface SelectedFile {
  file: File;
  id: string;
}

export const WebdesignContactForm: React.FC<WebdesignContactFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    requestType: 'new' as 'new' | 'redesign',
    currentWebsiteUrl: '',
    message: '',
  });
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [logs, setLogs] = useState<string[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles: SelectedFile[] = files.map(file => ({
      file,
      id: `${Date.now()}-${Math.random()}`,
    }));
    
    // Simulate upload progress
    newFiles.forEach(({ id }) => {
      setUploadProgress(prev => ({ ...prev, [id]: 0 }));
      let progress = 0;
      const interval = setInterval(() => {
        progress += 5;
        setUploadProgress(prev => ({ ...prev, [id]: progress }));
        if (progress >= 100) clearInterval(interval);
      }, 50);
    });
    
    setSelectedFiles(prev => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (id: string) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== id));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const addLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-3), `> ${msg}`]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) { setError('System Error: Identity Required'); return; }
    if (!formData.email.trim() || !formData.email.includes('@')) { setError('System Error: Invalid Communication Channel'); return; }
    
    setLoading(true);
    setError(null);
    setLogs([]);

    try {
      addLog('Initializing secure uplink...');
      await new Promise(r => setTimeout(r, 600));
      
      addLog('Packaging project schematics...');
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => formDataToSend.append(key, value));
      selectedFiles.forEach(f => formDataToSend.append('files', f.file));
      await new Promise(r => setTimeout(r, 400));

      addLog('Transmitting data to Digital Genesis core...');
      await apiRequest('/webdesign/contact', {
        method: 'POST',
        data: formDataToSend,
      });

      addLog('Transmission successful. Response verified.');
      await new Promise(r => setTimeout(r, 600));

      setSuccess(true);
      setSelectedFiles([]);
      if (onSuccess) setTimeout(() => onSuccess(), 2000);
    } catch (err) {
      addLog('CRITICAL ERROR: Connection reset.');
      setError('Transmission Failed: Connection Reset');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-4xl mx-auto bg-slate-950/90 border border-emerald-500/30 rounded-3xl p-12 text-center relative overflow-hidden"
      >
         <div className="absolute inset-0 bg-emerald-500/5" />
         <motion.div 
           initial={{ scale: 0 }} 
           animate={{ scale: 1 }} 
           className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30"
         >
           <CheckCircle2 className="w-12 h-12 text-emerald-500" />
         </motion.div>
         <h3 className="text-3xl font-bold font-display text-white mb-4">Transmission Received</h3>
         <p className="text-gray-400 text-lg">
           Ihr Projekt-Briefing wurde erfolgreich übermittelt. <br/>
           Unser Team initialisiert die Analyse. Response Time: &lt; 24h.
         </p>
      </motion.div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto relative group">
      {/* Decorative Glows */}
      <div className="absolute -inset-1 bg-gradient-to-r from-swiss-red/20 via-blue-500/20 to-swiss-red/20 rounded-3xl blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
      
      <div className="relative bg-slate-950/90 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
        {/* Terminal Header */}
        <div className="h-10 bg-white/5 border-b border-white/10 flex items-center px-4 justify-between">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
          </div>
          <div className="text-xs text-gray-500 font-mono flex items-center gap-2">
            <Terminal size={12} />
            PROJECT_INIT_SEQUENCE.exe
          </div>
          <div className="w-16" /> {/* Spacer */}
        </div>

        <div className="p-8 md:p-12">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                 <div>
                    <label className="text-xs font-mono text-swiss-red uppercase tracking-wider mb-2 flex items-center gap-2">
                       <span className="w-1.5 h-1.5 bg-swiss-red rounded-full animate-pulse" />
                       Identification
                    </label>
                    <div className="space-y-4">
                       <InputGroup 
                          label="Full Name" 
                          value={formData.name} 
                          onChange={v => setFormData({...formData, name: v})} 
                          placeholder="Max Mustermann"
                          isActive={activeField === 'name'}
                          onFocus={() => setActiveField('name')}
                       />
                       <InputGroup 
                          label="System ID (Email)" 
                          value={formData.email} 
                          onChange={v => setFormData({...formData, email: v})} 
                          placeholder="max@company.com"
                          isActive={activeField === 'email'}
                          onFocus={() => setActiveField('email')}
                       />
                        <InputGroup 
                          label="Phone Uplink (Optional)" 
                          value={formData.phone} 
                          onChange={v => setFormData({...formData, phone: v})} 
                          placeholder="+41 79 123 45 67"
                          isActive={activeField === 'phone'}
                          onFocus={() => setActiveField('phone')}
                       />
                    </div>
                 </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                  <div>
                    <label className="text-xs font-mono text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                       <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                       Project Parameters
                    </label>
                    <div className="p-1 bg-white/5 rounded-lg flex gap-1 mb-4">
                       <button
                          type="button"
                          onClick={() => setFormData({...formData, requestType: 'new'})}
                          className={`flex-1 py-2 text-xs font-mono uppercase tracking-wide rounded transition-all ${formData.requestType === 'new' ? 'bg-blue-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                       >
                          New_Construction
                       </button>
                       <button
                          type="button"
                          onClick={() => setFormData({...formData, requestType: 'redesign'})}
                          className={`flex-1 py-2 text-xs font-mono uppercase tracking-wide rounded transition-all ${formData.requestType === 'redesign' ? 'bg-blue-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                       >
                          System_Upgrade
                       </button>
                    </div>

                     <div className="relative">
                        <textarea
                           value={formData.message}
                           onChange={e => setFormData({...formData, message: e.target.value})}
                           onFocus={() => setActiveField('message')}
                           onBlur={() => setActiveField(null)}
                           className="w-full h-32 bg-slate-900/50 border border-white/10 rounded-lg p-4 font-mono text-sm text-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
                           placeholder="Describe mission objectives..."
                        />
                        <div className="absolute bottom-2 right-2 text-[10px] text-gray-600 font-mono">
                           {formData.message.length} CHARS
                        </div>
                     </div>
                  </div>
              </div>
            </div>

            {/* Footer / Actions */}
            <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                
                {/* File Upload Trigger */}
                <div className="flex-1 w-full md:w-auto">
                   <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileSelect}
                      aria-label="Upload files"
                      title="Upload files"
                   />
                   <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 text-xs font-mono text-gray-400 hover:text-white transition-colors group/upload"
                   >
                      <div className="p-2 bg-white/5 rounded-lg group-hover/upload:bg-white/10 transition-colors">
                         <Paperclip size={16} />
                      </div>
                      <span className="uppercase tracking-wider">Attach_Schematics</span>
                      {selectedFiles.length > 0 && (
                         <span className="text-swiss-red">[{selectedFiles.length} FILES]</span>
                      )}
                   </button>
                </div>

                {/* Submit Button & Logs */}
                <div className="flex flex-col gap-4 w-full md:w-auto min-w-[240px]">
                   <AnimatePresence>
                      {logs.length > 0 && (
                         <motion.div 
                           initial={{ opacity: 0, y: 10 }}
                           animate={{ opacity: 1, y: 0 }}
                           exit={{ opacity: 0 }}
                           className="bg-slate-900/80 border border-white/5 rounded-lg p-3 space-y-1"
                         >
                            {logs.map((log, i) => (
                               <div key={i} className="text-[10px] font-mono text-emerald-500/80 animate-pulse">
                                  {log}
                               </div>
                            ))}
                         </motion.div>
                      )}
                   </AnimatePresence>

                   <Button
                      type="submit"
                      variant="primary"
                      disabled={loading}
                      className="w-full bg-swiss-red hover:bg-red-700 border-none relative overflow-hidden group/submit h-12"
                   >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover/submit:translate-x-[100%] transition-transform duration-1000" />
                      <span className="flex items-center gap-2 font-mono uppercase tracking-widest text-sm">
                         {loading ? (
                            <>
                              <Loader2 size={16} className="animate-spin" />
                              Processing...
                            </>
                         ) : (
                            <>
                              <Zap size={16} className={loading ? "" : "fill-current"} />
                              Initialize_Project
                            </>
                         )}
                      </span>
                   </Button>
                </div>
            </div>
            
            <AnimatePresence>
              {error && (
                 <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-red-500 text-xs font-mono uppercase bg-red-500/10 p-2 rounded text-center border border-red-500/20"
                 >
                    !! {error} !!
                 </motion.div>
              )}
            </AnimatePresence>

          </form>
        </div>
        
        {/* Decorative Grid Overlay */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none" />
      </div>
    </div>
  );
};

// Helper Component for Inputs
const InputGroup: React.FC<{
   label: string;
   value: string;
   onChange: (val: string) => void;
   placeholder: string;
   isActive: boolean;
   onFocus: () => void;
}> = ({ label, value, onChange, placeholder, isActive, onFocus }) => (
   <div className="relative group">
      <div className={`absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-0 transition-all duration-300 bg-swiss-red ${isActive ? 'h-full opacity-100' : 'h-0 opacity-0'}`} />
      <input
         type="text"
         value={value}
         onChange={e => onChange(e.target.value)}
         onFocus={onFocus}
         onBlur={() => {}} // handled by parent state logic mostly
         className={`w-full bg-slate-900/50 border rounded-lg px-4 py-3 text-sm text-white font-mono placeholder:text-gray-600 transition-all outline-none ${isActive ? 'border-swiss-red/50 shadow-[0_0_15px_rgba(218,41,28,0.1)]' : 'border-white/10 hover:border-white/20'}`}
         placeholder={placeholder}
         title={label}
         aria-label={label}
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-mono uppercase tracking-wider bg-slate-900/80 px-1">
         {label}
      </div>
   </div>
);


