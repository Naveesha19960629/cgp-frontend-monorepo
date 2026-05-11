import { initReactI18next } from 'react-i18next';

import enLang from '@/app/utils/i18n/locales/en/en.json';

import i18n from 'i18next';

export async function initI18n() {
  try {
    await i18n.use(initReactI18next).init({
      resources: {
        en: {
          translation: enLang,
        },
      },
      lng: (import.meta.env.VITE_LANG as string) || 'en',
      fallbackLng: (import.meta.env.VITE_FALLBACK_LANG as string) || 'en',
      interpolation: {
        escapeValue: false,
      },
    });
  } catch (err) {
    console.error('i18n initialization failed:', err);
  }
}

export default i18n;
