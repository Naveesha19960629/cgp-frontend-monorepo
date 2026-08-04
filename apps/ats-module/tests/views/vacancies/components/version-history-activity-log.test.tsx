import { render, screen } from '@testing-library/react';

import VersionHistoryActivityLog from '@/views/vacancies/components/version-history-activity-log';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${Object.values(options).join(',')}` : key,
  }),
}));

const CREATED_BY = 'sahanlmsl@gmail.com';

describe('VersionHistoryActivityLog', () => {
  it('shows the "No Activity Available" empty state when the version has no changes', () => {
    render(
      <VersionHistoryActivityLog
        createdBy={CREATED_BY}
        version={{
          versionNumber: 1,
          updatedAt: '2026-07-07T20:08:00.032322',
          updatedBy: 'SYSTEM',
          profilePicture: null,
          changes: { user: [], system: [] },
        }}
      />
    );

    expect(
      screen.getByText('versionHistory.activityLog.emptyState.title')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('versionHistory.activityLog.heading')
    ).not.toBeInTheDocument();
  });

  it('shows the empty state when no version is selected at all', () => {
    render(
      <VersionHistoryActivityLog version={undefined} createdBy={CREATED_BY} />
    );

    expect(
      screen.getByText('versionHistory.activityLog.emptyState.title')
    ).toBeInTheDocument();
  });

  it('renders the heading and every user + system change for the selected version', () => {
    render(
      <VersionHistoryActivityLog
        createdBy={CREATED_BY}
        version={{
          versionNumber: 2,
          updatedAt: '2026-07-07T21:40:43.804959',
          updatedBy: 'ruvin@oxoholdings.group',
          profilePicture: null,
          changes: {
            user: [
              {
                changeType: 'FIELD_VALUE_UPDATED',
                sectionName: 'Secondary Education',
                fieldName: 'Grade',
                oldValue: ['AAA'],
                newValue: ['XXX'],
              },
            ],
            system: [
              {
                changeType: 'STATUS_CHANGED',
                sectionName: 'Vacancy',
                fieldName: 'Status',
                oldValue: ['LIVE'],
                newValue: ['ONHOLD'],
              },
            ],
          },
        }}
      />
    );

    expect(
      screen.getByText('versionHistory.activityLog.heading')
    ).toBeInTheDocument();
    expect(screen.getByText('AAA')).toBeInTheDocument();
    expect(screen.getByText('XXX')).toBeInTheDocument();
    expect(
      screen.getByText('vacancies.table.filter.statusOptions.live')
    ).toBeInTheDocument();
  });

  it('attributes user changes to the actor and system changes to "System" within one version', () => {
    // The regression this guards: version 1 is recorded with
    // updatedBy: "SYSTEM" (the Draft/Schedule flow wrote it), which used to
    // make EVERY entry — including the recruiter's own edits under
    // changes.user — render as a system change.
    render(
      <VersionHistoryActivityLog
        createdBy={CREATED_BY}
        version={{
          versionNumber: 1,
          updatedAt: '2026-07-07T20:08:00.032322',
          updatedBy: 'SYSTEM',
          profilePicture: null,
          changes: {
            user: [
              {
                changeType: 'VACANCY_CREATED',
                sectionName: 'Vacancy',
                fieldName: 'Title',
                oldValue: null,
                newValue: ['Vice President'],
              },
            ],
            system: [
              {
                changeType: 'STATUS_CHANGED',
                sectionName: 'Vacancy',
                fieldName: 'Status',
                oldValue: ['ONHOLD'],
                newValue: ['LIVE'],
              },
            ],
          },
        }}
      />
    );

    // The user change is attributed to the vacancy's creator...
    expect(screen.getByText(CREATED_BY)).toBeInTheDocument();
    // ...and exactly one entry (the automatic status transition) is "System".
    expect(screen.getAllByText('versionHistory.systemLabel')).toHaveLength(1);
  });

  it('attributes a status change to "System" even when the API files it under changes.user', () => {
    // A vacancy going Live/On Hold is always the system's own doing, never a
    // field the recruiter typed — but the API reports STATUS_CHANGED under
    // changes.user on versions where a person also made edits, which would
    // otherwise label the transition with that person's email.
    render(
      <VersionHistoryActivityLog
        createdBy={CREATED_BY}
        version={{
          versionNumber: 2,
          updatedAt: '2026-07-07T20:55:43.071146',
          updatedBy: 'ruvin@oxoholdings.group',
          profilePicture: null,
          changes: {
            user: [
              {
                changeType: 'STATUS_CHANGED',
                sectionName: 'Vacancy',
                fieldName: 'Status',
                oldValue: ['LIVE'],
                newValue: ['ONHOLD'],
              },
              {
                changeType: 'FIELD_VALUE_UPDATED',
                sectionName: 'Secondary Education',
                fieldName: 'Grade',
                oldValue: ['AAA'],
                newValue: ['XXX'],
              },
            ],
            system: [],
          },
        }}
      />
    );

    // The status transition reads as "System"...
    expect(screen.getByText('versionHistory.systemLabel')).toBeInTheDocument();
    // ...while the genuine field edit on the same version keeps the person.
    expect(screen.getByText('ruvin@oxoholdings.group')).toBeInTheDocument();
  });
});
