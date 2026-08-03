import React, { useEffect } from 'react';

export interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string[];
  canonicalUrl?: string;
  category?: string;
  jsonLdSchema?: Record<string, any>;
  prerenderRoutes?: string[];
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  keywords = ['gestão de frota', 'despacho de corridas', 'split financeiro', 'stripe connect', 'sistema de transporte'],
  canonicalUrl,
  category = 'SaaS de Transportes e Logística',
  jsonLdSchema,
  prerenderRoutes = ['/', '/login', '/register', '/dashboard'],
}) => {
  useEffect(() => {
    // 1. Update Document Title
    const fullTitle = `${title} | FleetPulse Pro - SaaS de Despacho & Frota`;
    document.title = fullTitle;

    // Helper function to update or create meta tag
    const updateMeta = (nameAttr: string, attrValue: string, contentValue: string) => {
      let element = document.querySelector(`meta[${nameAttr}="${attrValue}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(nameAttr, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', contentValue);
    };

    // 2. Standard Meta Tags
    updateMeta('name', 'description', description);
    updateMeta('name', 'keywords', keywords.join(', '));
    updateMeta('name', 'author', 'FleetPulse Pro - CreatioInc');
    updateMeta('name', 'robots', 'index, follow');
    updateMeta('name', 'category', category);

    // 3. OpenGraph Tags
    updateMeta('property', 'og:title', fullTitle);
    updateMeta('property', 'og:description', description);
    updateMeta('property', 'og:type', 'website');
    updateMeta('property', 'og:site_name', 'FleetPulse Pro SaaS');

    // 4. Prerender & Prefetch Link Tags for Ultra-Fast Instant Route Opening
    if (prerenderRoutes && prerenderRoutes.length > 0) {
      prerenderRoutes.forEach((route) => {
        let linkPrerender = document.querySelector(`link[rel="prerender"][href="${route}"]`);
        if (!linkPrerender) {
          linkPrerender = document.createElement('link');
          linkPrerender.setAttribute('rel', 'prerender');
          linkPrerender.setAttribute('href', route);
          document.head.appendChild(linkPrerender);
        }

        let linkPrefetch = document.querySelector(`link[rel="prefetch"][href="${route}"]`);
        if (!linkPrefetch) {
          linkPrefetch = document.createElement('link');
          linkPrefetch.setAttribute('rel', 'prefetch');
          linkPrefetch.setAttribute('href', route);
          document.head.appendChild(linkPrefetch);
        }
      });
    }

    // 5. AEO (Answer Engine Optimization) Structured Data JSON-LD
    const scriptId = 'aeo-jsonld-schema';
    let scriptTag = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = scriptId;
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }

    const defaultSchema = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      'name': 'FleetPulse Pro',
      'applicationCategory': 'BusinessApplication',
      'operatingSystem': 'Web, iOS, Android',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'BRL',
      },
      'description': description,
      'publisher': {
        '@type': 'Organization',
        'name': 'CreatioInc',
        'url': 'https://creatioinc.com',
      },
      ...jsonLdSchema,
    };

    scriptTag.textContent = JSON.stringify(defaultSchema, null, 2);

    return () => {
      // Cleanup on unmount if necessary
    };
  }, [title, description, keywords, canonicalUrl, category, jsonLdSchema, prerenderRoutes]);

  return null;
};

