import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import VersionHistorySidebar from '@/views/vacancies/components/version-history-sidebar';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${Object.values(options).join(',')}` : key,
  }),
}));

const CREATED_BY = 'sahanlmsl@gmail.com';

const versions = [
  {
    versionNumber: 'V1.0',
    updatedAt: '2026-01-01T10:00:00.000',
    updatedBy: 'SYSTEM',
    profilePicture: null,
    changes: { user: [], system: [] },
  },
  {
    versionNumber: 'V2.0',
    updatedAt: '2026-07-07T21:40:43.804959',
    updatedBy: 'ruvin@oxoholdings.group',
    profilePicture: null,
    changes: { user: [], system: [] },
  },
];

const renderSidebar = (props?: {
  selectedVersionNumber?: string;
  onSelectVersion?: () => void;
}) =>
  render(
    <VersionHistorySidebar
      versions={versions}
      selectedVersionNumber={props?.selectedVersionNumber ?? 'V2.0'}
      onSelectVersion={props?.onSelectVersion ?? vi.fn()}
      createdBy={CREATED_BY}
    />
  );

describe('VersionHistorySidebar', () => {
  it('renders versions sorted newest-first, regardless of input order', () => {
    renderSidebar();

    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveAccessibleName(/versionLabel:2\b/);
    expect(buttons[1]).toHaveAccessibleName(/versionLabel:1\b/);
  });

  it('shows the bare version number as the row heading, per Figma', () => {
    renderSidebar();

    // The visible label is just the number; "Version N" lives in the
    // accessible name so screen readers still get the full phrasing. The
    // API's own "V{n}.0" string (CR-14) is parsed back down to that bare
    // ordinal for this one display spot.
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('shows an uppercase updated date on each row', () => {
    renderSidebar();

    expect(screen.getByText('JUL 7, 2026')).toBeInTheDocument();
    expect(screen.getByText('JAN 1, 2026')).toBeInTheDocument();
  });

  it('marks only the selected version as pressed', () => {
    renderSidebar({ selectedVersionNumber: 'V1.0' });

    expect(
      screen.getByRole('button', { name: /versionLabel:1\b/ })
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByRole('button', { name: /versionLabel:2\b/ })
    ).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onSelectVersion with the clicked version number', async () => {
    const user = userEvent.setup();
    const onSelectVersion = vi.fn();
    renderSidebar({ onSelectVersion });

    await user.click(screen.getByRole('button', { name: /versionLabel:1\b/ }));

    expect(onSelectVersion).toHaveBeenCalledWith('V1.0');
  });

  it("shows each version's updater beside a small avatar", () => {
    renderSidebar();

    expect(screen.getByText('ruvin@oxoholdings.group')).toBeInTheDocument();
  });

  it('falls back to createdBy for a version recorded as updated by SYSTEM', () => {
    // Version 1 is written by the Draft/Schedule flow with
    // updatedBy: "SYSTEM", but a recruiter performed it — the vacancy's
    // createdBy is the real actor, so the row must not read "System".
    const { container } = renderSidebar();

    expect(screen.getByText(CREATED_BY)).toBeInTheDocument();
    expect(
      screen.queryByText('versionHistory.systemLabel')
    ).not.toBeInTheDocument();
    expect(container.querySelector('.lucide-monitor')).not.toBeInTheDocument();
  });

  it('still shows "System" when there is no human creator to fall back to', () => {
    const { container } = render(
      <VersionHistorySidebar
        versions={versions}
        selectedVersionNumber="V2.0"
        onSelectVersion={vi.fn()}
        createdBy="SYSTEM"
      />
    );

    expect(screen.getByText('versionHistory.systemLabel')).toBeInTheDocument();
    expect(container.querySelector('.lucide-monitor')).toBeInTheDocument();
  });
});
