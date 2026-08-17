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

  it('renders a FIELD_VALUE_UPDATED with newValue: null as a removal, not a meaningless "Updated ... to" line', () => {
    // Real response shape: a version 6 "Position/Role Held" entry cleared
    // its value via FIELD_VALUE_UPDATED with newValue: null (oldValue still
    // holding "Role A"), instead of FIELD_VALUE_REMOVED.
    const { container } = render(
      <VersionHistoryChangeEntry
        entry={userEntry({
          changeType: 'FIELD_VALUE_UPDATED',
          sectionName: 'Sports',
          fieldName: 'Position/Role Held',
          oldValue: ['Role A'],
          newValue: null,
        })}
      />
    );

    expect(screen.getByText('Role A')).toBeInTheDocument();
    expect(screen.getByText('Role A')).toHaveClass('text-[#be123c]');
    expect(
      screen.getByText('versionHistory.changeTypes.verbs.removed')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('versionHistory.changeTypes.verbs.updated')
    ).not.toBeInTheDocument();
    expect(
      container.querySelector('.text-\\[\\#047857\\]')
    ).not.toBeInTheDocument();
  });

  it('renders SECTION_ENABLED as a toggle switch checked "on", using the real API value shape', () => {
    // Real API response shape: {"changeType":"SECTION_ENABLED","sectionName":
    // "Language","fieldName":"Section Status","oldValue":["false"],
    // "newValue":["true"]} — fieldName is always "Section Status" and carries
    // no display value; only sectionName + newValue's boolean flag do.
    const { container } = render(
      <VersionHistoryChangeEntry
        entry={userEntry({
          changeType: 'SECTION_ENABLED',
          sectionName: 'Language',
          fieldName: 'Section Status',
          oldValue: ['false'],
          newValue: ['true'],
        })}
      />
    );

    // Both `sectionEnabled` and `sectionEnabledDescription` render (the mock
    // t() returns the raw key), and one key is a text-prefix of the other —
    // asserting on the header <p>'s own textContent (identified by its
    // distinctive `wrap-break-word` class, since the attribution name <p>
    // above it also happens to be `font-bold`) avoids getByText's substring
    // ambiguity between the two.
    expect(container.querySelector('p.wrap-break-word')).toHaveTextContent(
      'versionHistory.changeTypes.sectionEnabled - Language'
    );
    expect(
      screen.getByText('versionHistory.changeTypes.sectionEnabledDescription')
    ).toBeInTheDocument();
    expect(
      container.querySelector('button[aria-checked="true"]')
    ).toBeInTheDocument();
  });

  it('renders SECTION_ENABLED as a toggle switch checked "off" when newValue is "false"', () => {
    const { container } = render(
      <VersionHistoryChangeEntry
        entry={userEntry({
          changeType: 'SECTION_ENABLED',
          sectionName: 'Language',
          fieldName: 'Section Status',
          oldValue: ['true'],
          newValue: ['false'],
        })}
      />
    );

    expect(container.querySelector('p.wrap-break-word')).toHaveTextContent(
      'versionHistory.changeTypes.sectionDisabled - Language'
    );
    expect(
      screen.getByText('versionHistory.changeTypes.sectionDisabledDescription')
    ).toBeInTheDocument();
    expect(
      container.querySelector('button[aria-checked="false"]')
    ).toBeInTheDocument();
  });

  it('renders the grouped Vacancy Created card with "Scheduled for publishing" when a schedule date is present (Figma node 4229:230488)', () => {
    const entry: VersionHistoryEntry = {
      ...userEntry({
        changeType: 'VACANCY_CREATED',
        sectionName: 'Vacancy',
        fieldName: 'Title',
        oldValue: null,
        newValue: ['Senior Java Developer'],
      }),
      attribution: 'Sabrina Dorsey',
      vacancyCreationSummary: {
        title: 'Senior Java Developer',
        status: 'UNPUBLISHED',
        scheduleDate: '2026-10-13T05:00:00',
        expirationDate: null,
      },
    };
    render(<VersionHistoryChangeEntry entry={entry} />);

    expect(
      screen.getByText('versionHistory.changeTypes.vacancyCreated')
    ).toBeInTheDocument();
    expect(
      screen.getByText('- versionHistory.changeTypes.scheduledForPublishing')
    ).toBeInTheDocument();
    expect(screen.getByText('Senior Java Developer')).toBeInTheDocument();
    expect(
      screen.getByText('versionHistory.changeTypes.createdBy')
    ).toBeInTheDocument();
    // "Sabrina Dorsey" appears twice: the entry's own attribution row, and
    // the card's own "Created By" line — both are expected (Figma shows both).
    expect(screen.getAllByText('Sabrina Dorsey')).toHaveLength(2);
    expect(
      screen.getByText(
        /versionHistory\.changeTypes\.willGoLiveOn:13th Oct 2026/
      )
    ).toBeInTheDocument();
    // Not the fallback per-field rendering.
    expect(
      screen.queryByText('versionHistory.changeTypes.verbs.created')
    ).not.toBeInTheDocument();
  });

  it('renders the grouped Vacancy Created card with "Saved as {status}" when there is no schedule date (Figma node 4229:230451)', () => {
    const entry: VersionHistoryEntry = {
      ...userEntry({
        changeType: 'VACANCY_CREATED',
        sectionName: 'Vacancy',
        fieldName: 'Title',
        oldValue: null,
        newValue: ['Senior Java Developer'],
      }),
      attribution: 'Sabrina Dorsey',
      vacancyCreationSummary: {
        title: 'Senior Java Developer',
        status: 'DRAFT',
        scheduleDate: null,
        expirationDate: null,
      },
    };
    render(<VersionHistoryChangeEntry entry={entry} />);

    expect(
      screen.getByText('- versionHistory.changeTypes.savedAs')
    ).toBeInTheDocument();
    expect(
      screen.getByText('vacancies.table.filter.statusOptions.draft')
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/versionHistory\.changeTypes\.willGoLiveOn/)
    ).not.toBeInTheDocument();
  });

  it('falls back to the plain per-field CreatedChange when no vacancyCreationSummary is present', () => {
    render(
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

    expect(
      screen.getByText('versionHistory.changeTypes.verbs.created')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('versionHistory.changeTypes.vacancyCreated')
    ).not.toBeInTheDocument();
  });

  it('renders "Data Taken From Candidate" as a checked checkbox, using the real API value shape', () => {
    // Real API response shape: {"changeType":"FIELD_VALUE_UPDATED",
    // "sectionName":"Sports","fieldName":"Data Taken From Candidate",
    // "oldValue":["false"],"newValue":["true"]} — a plain FIELD_VALUE_UPDATED,
    // not its own changeType the way SECTION_ENABLED is.
    const { container } = render(
      <VersionHistoryChangeEntry
        entry={userEntry({
          changeType: 'FIELD_VALUE_UPDATED',
          sectionName: 'Sports',
          fieldName: 'Data Taken From Candidate',
          oldValue: ['false'],
          newValue: ['true'],
        })}
      />
    );

    expect(container.querySelector('p.wrap-break-word')).toHaveTextContent(
      'versionHistory.changeTypes.dataTakenFromCandidateEnabled - Sports'
    );
    expect(
      screen.getByText(
        'versionHistory.changeTypes.dataTakenFromCandidateEnabledDescription'
      )
    ).toBeInTheDocument();
    expect(container.querySelector('.bg-\\[\\#075056\\]')).toBeInTheDocument();
    expect(container.querySelector('.lucide-check')).toBeInTheDocument();
  });

  it('renders "Data Taken From Candidate" as an unchecked checkbox when newValue is "false"', () => {
    const { container } = render(
      <VersionHistoryChangeEntry
        entry={userEntry({
          changeType: 'FIELD_VALUE_UPDATED',
          sectionName: 'Sports',
          fieldName: 'Data Taken From Candidate',
          oldValue: ['true'],
          newValue: ['false'],
        })}
      />
    );

    expect(container.querySelector('p.wrap-break-word')).toHaveTextContent(
      'versionHistory.changeTypes.dataTakenFromCandidateDisabled - Sports'
    );
    expect(
      container.querySelector('.bg-\\[\\#075056\\]')
    ).not.toBeInTheDocument();
    expect(container.querySelector('.lucide-check')).not.toBeInTheDocument();
  });
});
