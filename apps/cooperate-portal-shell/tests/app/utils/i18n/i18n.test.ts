import i18n, { initI18n } from '@/app/utils/i18n';

/**
 * These tests run against the real i18n instance (no react-i18next mock), so a
 * key that is missing from the locale bundle surfaces as the key itself rather
 * than a translated string.
 */
describe('shell i18n', () => {
  beforeAll(async () => {
    await initI18n();
  });

  it('initializes with the en bundle', () => {
    expect(i18n.isInitialized).toBe(true);
  });

  describe('landscapeBlocker', () => {
    // Keys consumed by the shared <LandscapeBlocker /> from @cgp/ui-kit.
    const keys = [
      'landscapeBlocker.title',
      'landscapeBlocker.description',
      'landscapeBlocker.iconAlt',
    ];

    it.each(keys)('resolves %s to a translated string', key => {
      const translated = i18n.t(key);

      expect(translated).not.toBe(key);
      expect(translated.trim().length).toBeGreaterThan(0);
    });

    it('renders the expected copy', () => {
      expect(i18n.t('landscapeBlocker.title')).toBe(
        'Please Rotate your Device'
      );
      expect(i18n.t('landscapeBlocker.description')).toBe(
        'This application is designed to work in portrait mode only. Rotate your device to continue using the application smoothly'
      );
    });
  });
});
