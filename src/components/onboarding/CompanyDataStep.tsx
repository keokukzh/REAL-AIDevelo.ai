import React from 'react';
import { industries } from '../../data/industries';

interface CompanyDataStepProps {
  formData: any;
  updateFormData: (updates: any) => void;
  selectedTemplate?: any;
}

export const CompanyDataStep: React.FC<CompanyDataStepProps> = ({
  formData,
  updateFormData,
  selectedTemplate,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Firmenname *</label>
        <input
          type="text"
          value={formData.companyName || ''}
          onChange={(e) => updateFormData({ companyName: e.target.value })}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-accent focus:outline-none"
          placeholder="z.B. Müller Sanitär AG"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Stadt</label>
          <input
            type="text"
            value={formData.city || ''}
            onChange={(e) => updateFormData({ city: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-accent focus:outline-none"
            placeholder="z.B. Zürich"
          />
        </div>
        <div>
          <label htmlFor="industry-select" className="block text-sm font-medium mb-2">Branche</label>
          <select
            id="industry-select"
            value={formData.industry || selectedTemplate?.industry || ''}
            onChange={(e) => updateFormData({ industry: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-accent focus:outline-none"
            aria-label="Branche auswählen"
          >
            {industries.map((ind) => (
              <option key={ind.id} value={ind.value}>
                {ind.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">E-Mail *</label>
        <input
          type="email"
          value={formData.email || ''}
          onChange={(e) => updateFormData({ email: e.target.value })}
          autoComplete="email"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-accent focus:outline-none"
          placeholder="info@firma.ch"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Telefon</label>
        <input
          type="tel"
          value={formData.phone || ''}
          onChange={(e) => updateFormData({ phone: e.target.value })}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-accent focus:outline-none"
          placeholder="+41 44 123 45 67"
        />
      </div>
    </div>
  );
};
