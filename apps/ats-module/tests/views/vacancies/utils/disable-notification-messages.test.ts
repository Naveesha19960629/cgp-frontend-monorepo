import atsEn from '@/app/utils/i18n/locales/en/ats.json';

type Json = { [key: string]: Json | string };

/** Collects every `notifications.disable` block in the locale file by path. */
function collectDisableNotifications(
  node: Json,
  path: string[] = []
): { path: string; title: string; message: string }[] {
  const found: { path: string; title: string; message: string }[] = [];

  for (const [key, value] of Object.entries(node)) {
    if (typeof value === 'string') continue;

    if (
      key === 'disable' &&
      path.at(-1) === 'notifications' &&
      typeof value.title === 'string' &&
      typeof value.message === 'string'
    ) {
      found.push({
        path: [...path, key].join('.'),
        title: value.title,
        message: value.message,
      });
    } else {
      found.push(...collectDisableNotifications(value, [...path, key]));
    }
  }

  return found;
}

describe('section disabled notification wording (DQCGP-4532, CR-22)', () => {
  const notifications = collectDisableNotifications(atsEn);

  it('finds the disable notification of every section that defines one', () => {
    expect(notifications.map(n => n.path)).toEqual(
      expect.arrayContaining([
        'common.notifications.disable',
        'preferredPublications.notifications.disable',
        'preferredSports.notifications.disable',
        'preferredVolunteering.notifications.disable',
      ])
    );
  });

  it.each(notifications)(
    '$path uses the "Successfully Disabled" title and the standard message',
    ({ title, message }) => {
      expect(title).toBe('Successfully Disabled');
      expect(message).toMatch(/^.+ section has been successfully disabled\.$/);
    }
  );

  it('keeps the shared message parameterised by section name', () => {
    expect(atsEn.common.notifications.disable.message).toBe(
      '{{sectionName}} section has been successfully disabled.'
    );
  });

  it.each([
    ['Preferred Publications', atsEn.preferredPublications],
    ['Preferred Sports', atsEn.preferredSports],
    ['Preferred Volunteering', atsEn.preferredVolunteering],
  ])('names the section in the %s notification', (sectionName, section) => {
    expect(section.notifications.disable.message).toBe(
      `${sectionName} section has been successfully disabled.`
    );
  });

  it('names the sections disabled via step navigation as the ticket expects', () => {
    expect(atsEn.licenseCertificates.disabledSectionName).toBe(
      'Preferred Licenses and Certificates'
    );
    expect(atsEn.preferredIndustries.title).toBe('Preferred Industries');
  });
});
