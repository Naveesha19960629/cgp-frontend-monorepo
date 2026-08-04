import { render, screen } from '@testing-library/react';

import VersionHistoryChangeEntry from '@/views/vacancies/components/version-history-change-entry';
import type {
  VacancyVersionHistoryChange,
  VersionHistoryEntry,
} from '@/views/vacancies/types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${Object.values(options).join(',')}` : key,
  }),
}));

const UPDATED_AT = '2026-07-07T20:08:00.032322';

const userEntry = (
  change: VacancyVersionHistoryChange
): VersionHistoryEntry => ({
  change,
  attribution: 'sahanlmsl@gmail.com',
  isSystem: false,
  updatedAt: UPDATED_AT,
  profilePicture: null,
});

const systemEntry = (
  change: VacancyVersionHistoryChange
): VersionHistoryEntry => ({
  change,
  attribution: 'SYSTEM',
  isSystem: true,
  updatedAt: UPDATED_AT,
  profilePicture: null,
});

describe('VersionHistoryChangeEntry', () => {
  it('renders "System" and a monitor icon for a system change', () => {
    const { container } = render(
      <VersionHistoryChangeEntry
        entry={systemEntry({
          changeType: 'STATUS_CHANGED',
          sectionName: 'Vacancy',
          fieldName: 'Status',
          oldValue: ['ONHOLD'],
          newValue: ['LIVE'],
        })}
      />
    );

    expect(
      screen.getByText('versionHistory.systemLabel', { exact: false })
    ).toBeInTheDocument();
    expect(container.querySelector('.lucide-monitor')).toBeInTheDocument();
  });

  it('renders the actor and their initial for a user change, not "System"', () => {
    const { container } = render(
      <VersionHistoryChangeEntry
        entry={userEntry({
          changeType: 'VACANCY_CREATED',
          sectionName: 'Vacancy',
          fieldName: 'Title',
          oldValue: null,
          newValue: ['Vice President'],
        })}
      />
    );

    expect(screen.getByText('sahanlmsl@gmail.com')).toBeInTheDocument();
    expect(screen.getByText('S')).toBeInTheDocument();
    expect(container.querySelector('.lucide-monitor')).not.toBeInTheDocument();
    expect(
      screen.queryByText('versionHistory.systemLabel')
    ).not.toBeInTheDocument();
  });

  it('renders a VACANCY_CREATED Status entry as a compact pill, not a full-width bar', () => {
    // Regression test: the pill sits inside a `flex flex-col` card body,
    // which defaults to `align-items: stretch` — without an explicit
    // `self-start`, the pill stretched to the card's full width instead of
    // hugging its own text (reported from a live render).
    render(
      <VersionHistoryChangeEntry
        entry={userEntry({
          changeType: 'VACANCY_CREATED',
          sectionName: 'Vacancy',
          fieldName: 'Status',
          oldValue: null,
          newValue: ['UNPUBLISHED'],
        })}
      />
    );

    expect(
      screen.getByText('vacancies.table.filter.statusOptions.unpublished')
    ).toHaveClass('self-start');
  });

  it('renders both status pills for a STATUS_CHANGED entry', () => {
    render(
      <VersionHistoryChangeEntry
        entry={systemEntry({
          changeType: 'STATUS_CHANGED',
          sectionName: 'Vacancy',
          fieldName: 'Status',
          oldValue: ['LIVE'],
          newValue: ['ONHOLD'],
        })}
      />
    );

    expect(
      screen.getByText('versionHistory.changeTypes.statusUpdated')
    ).toBeInTheDocument();
    expect(
      screen.getByText('vacancies.table.filter.statusOptions.live')
    ).toBeInTheDocument();
    expect(
      screen.getByText('vacancies.table.filter.statusOptions.onHold')
    ).toBeInTheDocument();
  });

  it('renders a vacancy title change as its own sentence, not a section header', () => {
    render(
      <VersionHistoryChangeEntry
        entry={userEntry({
          changeType: 'FIELD_VALUE_UPDATED',
          sectionName: 'Vacancy',
          fieldName: 'Title',
          oldValue: ['Senior Software Engineer'],
          newValue: ['Lead Software Engineer'],
        })}
      />
    );

    expect(
      screen.getByText('versionHistory.changeTypes.titleChanged')
    ).toBeInTheDocument();
    expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('Lead Software Engineer')).toBeInTheDocument();
    expect(
      screen.queryByText(/versionHistory\.sectionNameLabel/)
    ).not.toBeInTheDocument();
  });

  it('renders a schedule-date change as its own sentence', () => {
    render(
      <VersionHistoryChangeEntry
        entry={userEntry({
          changeType: 'FIELD_VALUE_UPDATED',
          sectionName: 'Vacancy',
          fieldName: 'Schedule Date',
          oldValue: ['2026-07-07T20:07:10'],
          newValue: ['2026-07-08T20:07:10'],
        })}
      />
    );

    expect(
      screen.getByText('versionHistory.changeTypes.scheduleDateChanged')
    ).toBeInTheDocument();
  });

  it('renders plain multi-select values as chips, not bordered boxes', () => {
    const { container } = render(
      <VersionHistoryChangeEntry
        entry={userEntry({
          changeType: 'FIELD_VALUE_UPDATED',
          sectionName: 'Causes',
          fieldName: 'Causes',
          oldValue: null,
          newValue: ['Animal Welfare', 'Arts and Culture'],
        })}
      />
    );

    expect(screen.getByText('Animal Welfare')).toBeInTheDocument();
    expect(screen.getByText('Arts and Culture')).toBeInTheDocument();
    // Chips carry the slate fill; the box grid would carry a green border.
    expect(container.querySelector('.bg-\\[\\#f1f5f9\\]')).toBeInTheDocument();
    expect(
      container.querySelector('.border-\\[\\#059669\\]')
    ).not.toBeInTheDocument();
  });

  it('renders object-shaped values as a bordered box grid with subtitles', () => {
    const { container } = render(
      <VersionHistoryChangeEntry
        entry={userEntry({
          changeType: 'FIELD_VALUE_ADDED',
          sectionName: 'Secondary Education',
          fieldName: 'School',
          oldValue: null,
          newValue: [
            { school: 'Royal College', schoolLocation: 'Colombo' },
            { school: 'Kingswood College', schoolLocation: 'Kandy' },
          ],
        })}
      />
    );

    expect(screen.getByText('Royal College')).toBeInTheDocument();
    expect(screen.getByText('Colombo')).toBeInTheDocument();
    expect(
      container.querySelector('.border-\\[\\#059669\\]')
    ).toBeInTheDocument();
    // "Section Name - X │ Added New 2 Schools" — the verb is coloured
    // separately from the detail, and the field name is pluralized.
    expect(
      screen.getByText('versionHistory.changeTypes.verbs.added')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /versionHistory\.changeTypes\.details\.addedItems:2,Schools/
      )
    ).toBeInTheDocument();
  });

  it('shows removed values against the removed accent, sourced from oldValue', () => {
    const { container } = render(
      <VersionHistoryChangeEntry
        entry={userEntry({
          changeType: 'FIELD_VALUE_REMOVED',
          sectionName: 'Secondary Education',
          fieldName: 'School',
          oldValue: [
            { school: 'Royal College', schoolLocation: 'Colombo' },
            { school: 'Kingswood College', schoolLocation: 'Kandy' },
          ],
          newValue: null,
        })}
      />
    );

    expect(screen.getByText('Royal College')).toBeInTheDocument();
    expect(
      container.querySelector('.border-\\[\\#be123c\\]')
    ).toBeInTheDocument();
  });

  it('renders a generic scalar diff as a before/after box pair, not an inline strike-through row', () => {
    const { container } = render(
      <VersionHistoryChangeEntry
        entry={userEntry({
          changeType: 'FIELD_VALUE_UPDATED',
          sectionName: 'Secondary Education',
          fieldName: 'Grade',
          oldValue: ['AAA'],
          newValue: ['XXX'],
        })}
      />
    );

    expect(screen.getByText('AAA')).toBeInTheDocument();
    expect(screen.getByText('AAA')).not.toHaveClass('line-through');
    expect(screen.getByText('XXX')).toBeInTheDocument();
    expect(
      screen.getByText('versionHistory.changeTypes.previousValue:Grade')
    ).toBeInTheDocument();
    expect(
      screen.getByText('versionHistory.changeTypes.updatedValue:Grade')
    ).toBeInTheDocument();
    // The "before" box is neutral-bordered; the "after" box carries the
    // green/updated accent — neither is the InlineDiffRow's shared line.
    expect(
      container.querySelector('.border-\\[\\#d4d4d4\\]')
    ).toBeInTheDocument();
    expect(
      container.querySelector('.border-\\[\\#059669\\]')
    ).toBeInTheDocument();
  });
});
