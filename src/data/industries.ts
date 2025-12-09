export interface Industry {
  id: string;
  label: string;
  value: string;
}

export const industries: Industry[] = [
  { id: 'barber', label: 'Barber & Beauty', value: 'Barber & Beauty' },
  { id: 'medical', label: 'Praxis & Medizin', value: 'Praxis & Medizin' },
  { id: 'auto', label: 'Garage & Kfz', value: 'Garage & Kfz' },
  { id: 'realestate', label: 'Immobilien', value: 'Immobilien' },
  { id: 'handwerk', label: 'Handwerk / Sanitär', value: 'Handwerk / Sanitär' },
  { id: 'health', label: 'Ärzte / Gesundheit', value: 'Ärzte / Gesundheit' },
  { id: 'service', label: 'Dienstleistung', value: 'Dienstleistung' },
];

export const getIndustryById = (id: string): Industry | undefined => {
  return industries.find(ind => ind.id === id);
};

export const getIndustryByValue = (value: string): Industry | undefined => {
  return industries.find(ind => ind.value === value);
};
