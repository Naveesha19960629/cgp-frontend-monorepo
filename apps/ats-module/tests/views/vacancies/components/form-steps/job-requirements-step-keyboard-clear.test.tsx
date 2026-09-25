import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import JobRequirementsStep from '@/views/vacancies/components/form-steps/job-requirements-step';

// DQCGP-4310 — Backspace/Delete on Job Requirements (ATS NFR-024) with the
// real form, Combobox, Select and multi-select. job-requirements-step.test.tsx
// mocks all of them, so it can't see whether a clear reaches the form,
// whether the list still ticks the old option, or whether a required error
// shows before Next is pressed.

const page = <T,>(content: T[]) => ({
  data: { data: { items: { content } } },
  isLoading: false,
});

const DISCIPLINES = [
  { id: 'it', label: 'Information Technology (IT)', source: 'MASTER' },
  { id: 'other', label: 'Other', source: 'MASTER' },
];
const CAREER_PATHS = [
  { id: 'se', label: 'Software Engineering', source: 'MASTER' },
  { id: 'qa', label: 'Quality Assurance', source: 'MASTER' },
];
const LEVELS = [
  { id: 'entry', label: 'Entry Level' },
  { id: 'mid', label: 'Mid Level' },
];

const mockUseVacancyForm = vi.hoisted(() => vi.fn());
const mockSetFormValid = vi.hoisted(() => vi.fn());
const emptyPage = vi.hoisted(() => () => ({
  data: { data: { items: { content: [] } } },
  isLoading: false,
}));
const mutation = vi.hoisted(() => () => ({ mutateAsync: vi.fn() }));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('@/components/message-box', () => ({
  default: () => null,
}));

vi.mock('@/views/vacancies/context/vacancy-form-context', () => ({
  useTemplateFieldVisible: () => () => true,
  useVacancyForm: mockUseVacancyForm,
}));

vi.mock('@/views/vacancies/hooks', async importOriginal => {
  const actual =
    await importOriginal<typeof import('@/views/vacancies/hooks')>();
  return {
    ...actual,
    useDisciplinesQuery: () => page(DISCIPLINES),
    useCareerPathsQuery: () => page(CAREER_PATHS),
    useJobLevelsQuery: () => ({ data: { data: LEVELS }, isLoading: false }),
    useRolesQuery: emptyPage,
    useJobTitlesQuery: emptyPage,
    useEmploymentTypesQuery: emptyPage,
    useWorkSchedulesQuery: emptyPage,
    useEngagementModelsQuery: emptyPage,
    useAddDisciplineMutation: mutation,
    useAddCareerPathMutation: mutation,
    useAddRoleMutation: mutation,
    useAddJobTitleMutation: mutation,
  };
});

function renderStep() {
  mockUseVacancyForm.mockReturnValue({
    form: {
      status: 'draft',
      applicantCount: 0,
      jobRequirements: [
        {
          isEnabled: true,
          dataTakenFromCandidate: false,
          discipline: [DISCIPLINES[0]],
          careerPath: [CAREER_PATHS[0]],
          level: [{ ...LEVELS[0], source: 'MASTER' }],
          role: [
            { id: 'android', label: 'Android Developer', source: 'MASTER' },
          ],
          jobTitle: [
            { id: 'mobile', label: 'Mobile Developer', source: 'MASTER' },
          ],
          employmentType: [],
          workSchedule: [],
          engagementModel: [],
          description: '',
        },
      ],
    },
    onCancel: vi.fn(),
    stepDraftSaveRef: { current: null },
    setIsJobRequirementsFormValid: mockSetFormValid,
  });
  render(
    <JobRequirementsStep onNext={vi.fn()} onBack={vi.fn()} onSubmit={vi.fn()} />
  );
}

const setup = () => userEvent.setup({ pointerEventsCheck: 0 });
/** Radix also renders a hidden native <select>, so find the trigger button. */
const levelTrigger = () => {
  const trigger = screen
    .getAllByRole('combobox')
    .find(el => el.tagName === 'BUTTON' && el.textContent === 'Entry Level');
  if (!trigger) throw new Error('level trigger not found');
  return trigger;
};
/** No required message may show before Next is pressed (NFR-024). */
const expectNoRequiredErrors = () => {
  expect(
    screen.queryByText(/^jobRequirements\.errors\.required\./)
  ).not.toBeInTheDocument();
};
/** No row in the open list carries the selected tick. */
const expectNothingTicked = () => {
  for (const option of screen.getAllByRole('option')) {
    expect(option.querySelector('svg')).toBeNull();
  }
};

describe('JobRequirementsStep — Backspace / Delete clears', () => {
  it.each(['{Backspace}', '{Delete}'])(
    'clears the required Level with %s on the focused field',
    async key => {
      const user = setup();
      renderStep();
      const trigger = levelTrigger();

      trigger.focus();
      await user.keyboard(key);

      expect(trigger).toHaveTextContent('jobRequirements.levelPlaceholder');
      expect(trigger).toHaveAttribute('data-placeholder');
      expectNoRequiredErrors();
    }
  );

  it('lists only real levels, with no placeholder option', async () => {
    const user = setup();
    renderStep();

    await user.click(levelTrigger());

    expect(
      screen.getAllByRole('option').map(option => option.textContent)
    ).toEqual(['Entry Level', 'Mid Level']);
  });

  it('clears the Level from the open list and closes it', async () => {
    const user = setup();
    renderStep();
    const trigger = levelTrigger();

    await user.click(trigger);
    await user.keyboard('{Delete}');

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(trigger).toHaveTextContent('jobRequirements.levelPlaceholder');
    expect(trigger).toHaveFocus();
  });

  it('clears the Discipline, un-ticks it and clears the Career Path that depended on it', async () => {
    const user = setup();
    renderStep();
    const discipline = screen.getByDisplayValue('Information Technology (IT)');

    await user.click(discipline);
    await user.keyboard('{Delete}');

    expect(discipline).toHaveValue('');
    expectNothingTicked();
    expectNoRequiredErrors();
    expect(
      screen.queryByDisplayValue('Software Engineering')
    ).not.toBeInTheDocument();

    // Closing and reopening still shows no selection.
    await user.keyboard('{Escape}');
    expect(discipline).toHaveValue('');
    await user.click(discipline);
    expectNothingTicked();
  });

  it('clears the Career Path and un-ticks it, keeping the Discipline', async () => {
    const user = setup();
    renderStep();
    const careerPath = screen.getByDisplayValue('Software Engineering');

    await user.click(careerPath);
    await user.keyboard('{Delete}');

    expect(careerPath).toHaveValue('');
    expectNothingTicked();
    expectNoRequiredErrors();
    expect(
      screen.getByDisplayValue('Information Technology (IT)')
    ).toBeInTheDocument();
  });

  it('erases the Discipline one character at a time with Backspace', async () => {
    const user = setup();
    renderStep();
    const discipline = screen.getByDisplayValue('Information Technology (IT)');

    await user.click(discipline);
    await user.keyboard('{Backspace}');

    expect(discipline).toHaveValue('Information Technology (IT');
    expect(
      screen.getByDisplayValue('Software Engineering')
    ).toBeInTheDocument();
  });

  it('removes the last Role chip with Backspace without showing the required error', async () => {
    const user = setup();
    renderStep();
    const role = screen.getByRole('combobox', {
      name: /^jobRequirements\.role/,
    });

    role.focus();
    await user.keyboard('{Backspace}');

    expect(screen.queryByText('Android Developer')).not.toBeInTheDocument();
    expectNoRequiredErrors();
  });

  it('still marks the step invalid after a quiet clear, so navigation stays locked', async () => {
    const user = setup();
    renderStep();
    await waitFor(() =>
      expect(mockSetFormValid).toHaveBeenLastCalledWith(true)
    );

    await user.click(screen.getByDisplayValue('Information Technology (IT)'));
    await user.keyboard('{Delete}');

    await waitFor(() =>
      expect(mockSetFormValid).toHaveBeenLastCalledWith(false)
    );
    expectNoRequiredErrors();
  });
});
