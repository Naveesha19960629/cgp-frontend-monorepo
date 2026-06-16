/**
 * ATS Module i18n
 *
 * i18next and react-i18next are declared as shared singletons in the
 * federation config (vite.config.ts). This means `import i18n from 'i18next'`
 * inside this remote resolves to the SAME instance the shell initialized —
 * effectively the same as importing the shell's exposed ./shell/i18n module.
 *
 * Two modes:
 *  - Embedded (shell-powered): shell has already called init(); we only need
 *    to register the 'ats' namespace into the shared instance.
 *  - Standalone: we call init() ourselves with the 'ats' namespace.
 */
import { initReactI18next } from 'react-i18next';

import atsEn from '@/app/utils/i18n/locales/en/ats.json';

import i18n from 'i18next';

const ATS_NAMESPACE = 'ats';

/**
 * Register ATS translations into the shared i18n instance.
 * Safe to call multiple times — always overwrites existing keys
 * to prevent stale strings in shell-powered HMR sessions.
 * Called at module-load time from the router so translations are ready
 * before any ATS component tries to use useTranslation('ats').
 *
 * Guard: i18next must be initialized before resource bundles can be added.
 * In standalone mode this call happens at module-load time (before initAtsI18n),
 * so we bail out — initAtsI18n() includes the translations in its init() call.
 * In shell-powered mode the shell has already called initI18n(), so this runs fine.
 */
function addAtsTranslations(): void {
  if (!i18n.isInitialized) return;

  if (!i18n.hasResourceBundle('en', ATS_NAMESPACE)) {
    i18n.addResourceBundle('en', ATS_NAMESPACE, atsEn);
  }

  // Also merge atsEn into 'translation' bundle so shared ui-kit components can resolve keys.
  i18n.addResourceBundle('en', 'translation', atsEn, true, true);
}

/**
 * Full i18n initialization for standalone mode (no shell present).
 * If i18n is already initialized (e.g. shared instance from shell),
 * falls back to just adding the ATS namespace bundle.
 */
async function initAtsI18n(): Promise<void> {
  if (i18n.isInitialized) {
    addAtsTranslations();
    return;
  }

  try {
    await i18n.use(initReactI18next).init({
      resources: {
        en: {
          [ATS_NAMESPACE]: atsEn,
          translation: atsEn,
        },
      },
      ns: [ATS_NAMESPACE, 'translation'],
      defaultNS: ATS_NAMESPACE,
      lng: (import.meta.env.VITE_LANG as string) || 'en',
      fallbackLng: (import.meta.env.VITE_FALLBACK_LANG as string) || 'en',
      interpolation: {
        escapeValue: false,
      },
    });
  } catch (err) {
    console.error('[ats-module] i18n initialization failed:', err);
  }
}

export { ATS_NAMESPACE, addAtsTranslations, initAtsI18n };

export default i18n;
