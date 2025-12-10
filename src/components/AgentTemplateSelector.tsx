import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X, Check, Globe, Building, Target } from 'lucide-react';
import { agentTemplates, AgentTemplate, availableLanguages, availableUseCases, filterTemplates } from '../data/agentTemplates';
import { industries } from '../data/industries';
import { Button } from './ui/Button';

interface AgentTemplateSelectorProps {
  onSelectTemplate: (template: AgentTemplate) => void;
  onClose?: () => void;
}

export const AgentTemplateSelector: React.FC<AgentTemplateSelectorProps> = ({
  onSelectTemplate,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [selectedUseCase, setSelectedUseCase] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<AgentTemplate | null>(null);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    let templates = agentTemplates;

    // Apply filters
    if (selectedLanguage || selectedIndustry || selectedUseCase) {
      templates = filterTemplates({
        language: selectedLanguage || undefined,
        industry: selectedIndustry || undefined,
        useCase: selectedUseCase || undefined,
      });
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      templates = templates.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.industry.toLowerCase().includes(query) ||
          t.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    return templates;
  }, [searchQuery, selectedLanguage, selectedIndustry, selectedUseCase]);

  const clearFilters = () => {
    setSelectedLanguage(null);
    setSelectedIndustry(null);
    setSelectedUseCase(null);
    setSearchQuery('');
  };

  const hasActiveFilters = selectedLanguage || selectedIndustry || selectedUseCase || searchQuery.trim();

  return (
    <div className="min-h-screen bg-background text-white p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold font-display mb-2">Agent-Template auswählen</h1>
            <p className="text-gray-400">Wählen Sie ein vorkonfiguriertes Template für Ihren Voice-Agent</p>
          </div>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              <X size={20} />
            </Button>
          )}
        </div>

        {/* Search & Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Templates durchsuchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:border-accent focus:outline-none"
            />
          </div>
          <Button
            variant={showFilters ? 'primary' : 'outline'}
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter size={18} />
            Filter
            {hasActiveFilters && (
              <span className="bg-accent text-black rounded-full px-2 py-0.5 text-xs font-bold">
                {[selectedLanguage, selectedIndustry, selectedUseCase].filter(Boolean).length}
              </span>
            )}
          </Button>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters} className="flex items-center gap-2">
              <X size={18} />
              Zurücksetzen
            </Button>
          )}
        </div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-surface border border-white/10 rounded-lg p-4 mb-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Language Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <Globe size={16} />
                    Sprache
                  </label>
                  <select
                    value={selectedLanguage || ''}
                    onChange={(e) => setSelectedLanguage(e.target.value || null)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-accent focus:outline-none"
                  >
                    <option value="">Alle Sprachen</option>
                    {availableLanguages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Industry Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <Building size={16} />
                    Branche
                  </label>
                  <select
                    value={selectedIndustry || ''}
                    onChange={(e) => setSelectedIndustry(e.target.value || null)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-accent focus:outline-none"
                  >
                    <option value="">Alle Branchen</option>
                    {industries.map((ind) => (
                      <option key={ind.id} value={ind.value}>
                        {ind.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Use Case Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <Target size={16} />
                    Use Case
                  </label>
                  <select
                    value={selectedUseCase || ''}
                    onChange={(e) => setSelectedUseCase(e.target.value || null)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-accent focus:outline-none"
                  >
                    <option value="">Alle Use Cases</option>
                    {availableUseCases.map((uc) => (
                      <option key={uc} value={uc}>
                        {uc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Template Grid */}
      <div className="max-w-7xl mx-auto">
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-12 bg-surface rounded-lg border border-white/10">
            <p className="text-gray-400 mb-4">Keine Templates gefunden</p>
            <Button variant="outline" onClick={clearFilters}>
              Filter zurücksetzen
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                className="bg-surface rounded-xl border border-white/10 overflow-hidden hover:border-accent/50 transition-colors cursor-pointer group"
                onClick={() => setPreviewTemplate(template)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-4xl">{template.icon}</div>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-accent/20 text-accent rounded text-xs font-medium">
                        {template.language}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{template.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{template.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-2 py-1 bg-white/5 rounded text-xs">{template.industry}</span>
                    {template.useCase.slice(0, 2).map((uc) => (
                      <span key={uc} className="px-2 py-1 bg-white/5 rounded text-xs">
                        {uc}
                      </span>
                    ))}
                  </div>
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTemplate(template);
                    }}
                  >
                    Template verwenden
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewTemplate && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setPreviewTemplate(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-surface rounded-2xl border border-white/10 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-4xl">{previewTemplate.icon}</span>
                    <div>
                      <h2 className="text-2xl font-bold">{previewTemplate.name}</h2>
                      <p className="text-gray-400">{previewTemplate.description}</p>
                    </div>
                  </div>
                </div>
                <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
                  <X size={20} />
                </Button>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Sprache</h3>
                  <p className="text-white">{previewTemplate.language}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Branche</h3>
                  <p className="text-white">{previewTemplate.industry}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Use Cases</h3>
                  <div className="flex flex-wrap gap-2">
                    {previewTemplate.useCase.map((uc) => (
                      <span key={uc} className="px-2 py-1 bg-accent/20 text-accent rounded text-sm">
                        {uc}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">System Prompt</h3>
                  <div className="bg-black/20 rounded-lg p-4 border border-white/5">
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{previewTemplate.systemPrompt}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Standard-Einstellungen</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-accent" />
                      <span className="text-sm">Öffnungszeiten: {previewTemplate.defaultSettings.openingHours}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-accent" />
                      <span className="text-sm">
                        Aufzeichnung: {previewTemplate.defaultSettings.recordingConsent ? 'Aktiviert' : 'Deaktiviert'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-accent" />
                      <span className="text-sm">Ziele: {previewTemplate.defaultSettings.goals.join(', ')}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setPreviewTemplate(null)} className="flex-1">
                  Abbrechen
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    onSelectTemplate(previewTemplate);
                    setPreviewTemplate(null);
                  }}
                  className="flex-1"
                >
                  Template verwenden
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};


