import { useAppStore } from '../store/useAppStore';
import { translations, LanguageOptions } from '../i18n/translations';
import { landingExtras } from '../i18n/landingExtras';

export function useTranslation() {
  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);

  const base = translations[language] || translations.pt;
  const extras = landingExtras[language] || landingExtras.pt;
  const t = {
    ...base,
    seo: extras.seo,
    landingClient: extras.landingClient,
    landingEmpresa: extras.landingEmpresa,
  };

  return {
    t,
    language,
    setLanguage,
    options: LanguageOptions,
  };
}
