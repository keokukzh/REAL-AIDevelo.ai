import React from 'react';
import { useLocation } from 'react-router-dom';
import { faqs } from '../data/faq';
import { pricingPlans } from '../data/pricing';

interface StructuredDataProps {
  type?: 'landing' | 'pricing' | 'faq' | 'default';
}

export const StructuredData: React.FC<StructuredDataProps> = ({ type = 'landing' }) => {
  const location = useLocation();
  const baseUrl = 'https://aidevelo.ai';
  const currentUrl = `${baseUrl}${location.pathname}`;

  // Organization Schema
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'AIDevelo.ai',
    url: baseUrl,
    logo: `${baseUrl}/main-logo.png`,
    description: 'Swiss AI Voice Agent Platform für Schweizer KMUs. 24/7 Erreichbarkeit, automatische Terminbuchung und Lead-Qualifizierung.',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'CH',
      addressLocality: 'Zürich',
      addressRegion: 'ZH',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'hello@aidevelo.ai',
      contactType: 'Customer Service',
      areaServed: 'CH',
      availableLanguage: ['de', 'fr', 'it', 'en'],
    },
    sameAs: [
      // Add social media URLs if available
    ],
  };

  // SoftwareApplication Schema (for landing page)
  const softwareApplicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'AIDevelo Voice Agent',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: pricingPlans
      .filter(plan => plan.id !== 'enterprise')
      .map(plan => ({
        '@type': 'Offer',
        name: plan.name,
        price: plan.price === 'Auf Anfrage' ? '0' : plan.price,
        priceCurrency: 'CHF',
        description: plan.description,
        availability: 'https://schema.org/InStock',
      })),
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '50',
      bestRating: '5',
      worstRating: '1',
    },
    description: 'AI Voice Agent für Schweizer KMUs. Nimmt Anrufe an, qualifiziert Leads, bucht Termine automatisch in Google/Outlook Kalender. Versteht Schweizerdeutsch und Hochdeutsch.',
    featureList: [
      '24/7 Erreichbarkeit',
      'Automatische Terminbuchung',
      'Schweizerdeutsch & Hochdeutsch',
      'Kalender-Integration (Google, Outlook)',
      'Lead-Qualifizierung',
      'Voice Cloning',
      'DSGVO/nDSG-konform',
    ],
  };

  // FAQPage Schema
  const faqPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  // BreadcrumbList Schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl,
      },
      ...(location.pathname !== '/' ? [
        {
          '@type': 'ListItem',
          position: 2,
          name: location.pathname.split('/').filter(Boolean).pop()?.replace(/-/g, ' ') || 'Page',
          item: currentUrl,
        },
      ] : []),
    ],
  };

  // Determine which schemas to include
  const schemas: object[] = [organizationSchema, breadcrumbSchema];

  if (type === 'landing' || location.pathname === '/') {
    schemas.push(softwareApplicationSchema);
  }

  if (type === 'faq' || location.pathname === '/' || location.pathname.includes('faq')) {
    schemas.push(faqPageSchema);
  }

  return (
    <>
      {schemas.map((schema, index) => {
        const schemaKey = JSON.stringify(schema).substring(0, 50);
        return (
          <script
            key={`schema-${index}-${schemaKey}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema, null, 2) }}
          />
        );
      })}
    </>
  );
};
