import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { StructuredData } from './StructuredData';

interface SEOProps {
  title?: string;
  description?: string;
  name?: string;
  type?: string;
  structuredDataType?: 'landing' | 'pricing' | 'faq' | 'default';
}

export const SEO: React.FC<SEOProps> = ({ 
  title = "AI Telefonassistent für Schweizer KMU | 24/7 Terminbuchung | aidevelo.ai", 
  description = "KI-Telefonanruf-Agent für Zahnärzte, Restaurants, Friseure. Automatisieren Sie Anrufe in Schweizerdeutsch. Kostenlose Demo. CHF 290/Monat.",
  name = "AIDevelo.ai",
  type = "website",
  structuredDataType = 'landing'
}) => {
  const location = useLocation();
  const baseUrl = 'https://aidevelo.ai';
  const canonicalUrl = `${baseUrl}${location.pathname}`;

  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{title}</title>
      <meta name='description' content={description} />
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content="https://aidevelo.ai/og-image.png" />
      <meta property="og:site_name" content="AIDevelo.ai" />
      <meta property="og:locale" content="de_CH" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content="https://aidevelo.ai/og-image.png" />
      
      {/* Swiss Specific */}
      <meta name="geo.region" content="CH" />
      <meta name="geo.placename" content="Zürich" />
      
      {/* Structured Data */}
      <StructuredData type={structuredDataType} />
    </Helmet>
  );
};
