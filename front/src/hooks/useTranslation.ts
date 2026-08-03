import { useAppStore } from '../store/useAppStore';
import { translations, LanguageOptions, LanguageOption, Language } from '../i18n/translations';

export function useTranslation() {
  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);

  const t = translations[language] || translations.pt;

  return {
    t,
    language,
    setLanguage,
    options: LanguageOptions,
  };
}
