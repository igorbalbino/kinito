import React, { useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';

export interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string[];
  canonicalUrl?: string;
  category?: string;
  jsonLdSchema?: Record<string, unknown>;
  prerenderRoutes?: string[];
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  keywords = ['kinito', 'corridas', 'mobilidade'],
  canonicalUrl,
  category = 'Kinito',
  jsonLdSchema,
  prerenderRoutes = ['/', '/para-empresas', '/login', '/register'],
}) => {
  const language = useAppStore((s) => s.language);

  useEffect(() => {
    document.documentElement.lang = language === 'pt' ? 'pt-BR' : language;

    const fullTitle = `${title} | Kinito`;
    document.title = fullTitle;

    const updateMeta = (nameAttr: string, attrValue: string, contentValue: string) => {
      let element = document.querySelector(`meta[${nameAttr}="${attrValue}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(nameAttr, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', contentValue);
    };

    updateMeta('name', 'description', description);
    updateMeta('name', 'keywords', keywords.join(', '));
    updateMeta('name', 'author', 'Kinito');
    updateMeta('name', 'robots', 'index, follow');
    updateMeta('name', 'category', category);

    updateMeta('property', 'og:title', fullTitle);
    updateMeta('property', 'og:description', description);
    updateMeta('property', 'og:type', 'website');
    updateMeta('property', 'og:site_name', 'Kinito');
    updateMeta('property', 'og:image', '/kinito.webp');
    updateMeta('property', 'og:locale', language === 'pt' ? 'pt_BR' : language);

    if (canonicalUrl) {
      const href = canonicalUrl.startsWith('http')
        ? canonicalUrl
        : `${window.location.origin}${canonicalUrl.startsWith('/') ? canonicalUrl : `/${canonicalUrl}`}`;
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
      }
      link.href = href;
      updateMeta('property', 'og:url', href);
    }

    prerenderRoutes.forEach((route) => {
      if (!document.querySelector(`link[rel="prefetch"][href="${route}"]`)) {
        const linkPrefetch = document.createElement('link');
        linkPrefetch.rel = 'prefetch';
        linkPrefetch.href = route;
        document.head.appendChild(linkPrefetch);
      }
    });

    const scriptId = 'aeo-jsonld-schema';
    let scriptTag = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = scriptId;
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: title,
      description,
      isPartOf: {
        '@type': 'WebSite',
        name: 'Kinito',
        url: window.location.origin,
      },
      ...jsonLdSchema,
    };

    scriptTag.textContent = JSON.stringify(schema);
  }, [title, description, keywords, canonicalUrl, category, jsonLdSchema, prerenderRoutes, language]);

  return null;
};
