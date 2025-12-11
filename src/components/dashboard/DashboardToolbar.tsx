import React, { useState } from 'react';
import { Search, Filter, Grid, List, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { Link } from 'react-router-dom';

export interface FilterOptions {
  status: string[];
  industry: string[];
  language: string[];
  plan: string[];
}

interface DashboardToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  filters: {
    status?: string;
    industry?: string;
    language?: string;
  };
  onFilterChange: (key: string, value: string) => void;
  onCreateNew?: () => void;
}

export const DashboardToolbar: React.FC<DashboardToolbarProps> = ({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  filters,
  onFilterChange,
  onCreateNew,
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const statusOptions = [
    { value: '', label: 'Alle Status' },
    { value: 'draft', label: 'Entwurf' },
    { value: 'active', label: 'Aktiv' },
    { value: 'inactive', label: 'Pausiert' },
    { value: 'pending_activation', label: 'Aktivierung läuft' },
  ];

  const industryOptions = [
    { value: '', label: 'Alle Branchen' },
    { value: 'Allgemein', label: 'Allgemein' },
    { value: 'Hairstyling', label: 'Hairstyling' },
    { value: 'Handwerk', label: 'Handwerk' },
    { value: 'Medical', label: 'Medical' },
    { value: 'Retail', label: 'Retail' },
    { value: 'Hospitality', label: 'Hospitality' },
  ];

  const languageOptions = [
    { value: '', label: 'Alle Sprachen' },
    { value: 'de-CH', label: 'Deutsch (CH)' },
    { value: 'fr-CH', label: 'Französisch (CH)' },
    { value: 'it-CH', label: 'Italienisch (CH)' },
    { value: 'en-US', label: 'Englisch' },
  ];

  return (
    <div className="mb-8">
      {/* Main Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        {/* Search Bar */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Agent suchen (Name, Nummer, Branche...)"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-surface border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 bg-surface border border-white/10 rounded-lg p-1">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-2 rounded transition-colors ${
              viewMode === 'grid'
                ? 'bg-accent text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
            title="Grid-Ansicht"
          >
            <Grid size={20} />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-2 rounded transition-colors ${
              viewMode === 'list'
                ? 'bg-accent text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
            title="Listen-Ansicht"
          >
            <List size={20} />
          </button>
        </div>

        {/* Filter Toggle */}
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={showFilters ? 'border-accent' : ''}
        >
          <Filter size={18} />
          Filter
        </Button>

        {/* Create New Agent Button */}
        <Link to="/onboarding">
          <Button variant="primary" onClick={onCreateNew}>
            <Plus size={18} />
            Neuer Agent
          </Button>
        </Link>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-surface border border-white/10 rounded-lg p-6 mb-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Filter size={18} />
            Filter
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <label htmlFor="status-filter" className="block text-sm text-gray-400 mb-2">Status</label>
              <select
                id="status-filter"
                value={filters.status || ''}
                onChange={(e) => onFilterChange('status', e.target.value)}
                aria-label="Status filtern"
                title="Status filtern"
                className="w-full px-4 py-2 bg-dark border border-white/10 rounded-lg text-white focus:outline-none focus:border-accent transition-colors"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Industry Filter */}
            <div>
              <label htmlFor="industry-filter" className="block text-sm text-gray-400 mb-2">Branche</label>
              <select
                id="industry-filter"
                value={filters.industry || ''}
                onChange={(e) => onFilterChange('industry', e.target.value)}
                aria-label="Branche filtern"
                title="Branche filtern"
                className="w-full px-4 py-2 bg-dark border border-white/10 rounded-lg text-white focus:outline-none focus:border-accent transition-colors"
              >
                {industryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Language Filter */}
            <div>
              <label htmlFor="language-filter" className="block text-sm text-gray-400 mb-2">Sprache</label>
              <select
                id="language-filter"
                value={filters.language || ''}
                onChange={(e) => onFilterChange('language', e.target.value)}
                aria-label="Sprache filtern"
                title="Sprache filtern"
                className="w-full px-4 py-2 bg-dark border border-white/10 rounded-lg text-white focus:outline-none focus:border-accent transition-colors"
              >
                {languageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          {(filters.status || filters.industry || filters.language) && (
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  onFilterChange('status', '');
                  onFilterChange('industry', '');
                  onFilterChange('language', '');
                }}
              >
                Filter zurücksetzen
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
