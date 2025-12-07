import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  name?: string;
  type?: string;
}

export const SEO: React.FC<SEOProps> = ({ 
  title = "AI Telefonassistent für Schweizer KMU | 24/7 Terminbuchung | aidevelo.ai", 
  description = "KI-Telefonanruf-Agent für Zahnärzte, Restaurants, Friseure. Automatisieren Sie Anrufe in Schweizerdeutsch. Kostenlose Demo. CHF 290/Monat.",
  name = "AIDevelo.ai",
  type = "website"
}) => {
  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{title}</title>
      <meta name='description' content={description} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content="https://aidevelo.ai/og-image.png" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      
      {/* Swiss Specific */}
      <meta name="geo.region" content="CH" />
      <meta name="geo.placename" content="Zürich" />
    </Helmet>
  );
};
