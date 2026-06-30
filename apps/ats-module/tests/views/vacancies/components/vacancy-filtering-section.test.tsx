import { act, fireEvent, render, screen } from '@testing-library/react';

import VacancyFilteringSection from '@/views/vacancies/components/vacancy-filtering-section';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// Mock the leaf component so the barrel re-exports the stub,
// keeping the test focused on VacancyFilteringSection's own behaviour.
vi.mock('@/views/vacancies/components/data-table-faceted-filter', () => ({
  default: ({
    title,
    onSelectionChange,
  }: {
    title: string;
    onSelectionChange: (values: string[]) => void;
  }) => (
    <button
      data-testid={`filter-${title}`}
      onClick={() => onSelectionChange(['opt1'])}
    >
      {title}
    </button>
  ),
}));

const { mockFilterOptions } = vi.hoisted(() => ({
  mockFilterOptions: vi.fn(),
}));

vi.mock('@/views/vacancies/hooks', () => ({
  useVacancyFilterOptionsQuery: (...args: unknown[]) =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    mockFilterOptions(...args),
}));

const defaultProps = {
  search: '',
  onSearchChange: vi.fn(),
  careerPathFilter: '',
  onCareerPathChange: vi.fn(),
  disciplineFilter: '',
  onDisciplineChange: vi.fn(),
  statusFilter: '',
  onStatusChange: vi.fn(),
};

describe('VacancyFilteringSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFilterOptions.mockReturnValue({ data: undefined, isLoading: false });
  });

  afterEach(() => vi.useRealTimers());

  it('renders career path, discipline and status filter triggers', () => {
    render(<VacancyFilteringSection {...defaultProps} />);
    expect(
      screen.getByText('vacancies.table.filter.careerPath')
    ).toBeInTheDocument();
    expect(
      screen.getByText('vacancies.table.filter.discipline')
    ).toBeInTheDocument();
    expect(
      screen.getByText('vacancies.table.filter.status')
    ).toBeInTheDocument();
  });

  it('renders the search input with the correct placeholder', () => {
    render(<VacancyFilteringSection {...defaultProps} />);
    expect(
      screen.getByPlaceholderText('vacancies.table.filter.searchPlaceholder')
    ).toBeInTheDocument();
  });

  it('reflects the search prop value in the input', () => {
    render(<VacancyFilteringSection {...defaultProps} search="hello" />);
    expect(
      screen.getByPlaceholderText('vacancies.table.filter.searchPlaceholder')
    ).toHaveValue('hello');
  });

  it('debounces onSearchChange when the user types', () => {
    vi.useFakeTimers();
    const onSearchChange = vi.fn();
    render(
      <VacancyFilteringSection
        {...defaultProps}
        onSearchChange={onSearchChange}
      />
    );
    const input = screen.getByPlaceholderText(
      'vacancies.table.filter.searchPlaceholder'
    );

    fireEvent.change(input, { target: { value: 'react' } });

    expect(onSearchChange).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(onSearchChange).toHaveBeenCalledWith('react');
  });

  it('calls onSearchChange immediately on blur', () => {
    const onSearchChange = vi.fn();
    render(
      <VacancyFilteringSection
        {...defaultProps}
        onSearchChange={onSearchChange}
      />
    );
    const input = screen.getByPlaceholderText(
      'vacancies.table.filter.searchPlaceholder'
    );

    fireEvent.change(input, { target: { value: 'fast' } });
    fireEvent.blur(input);

    expect(onSearchChange).toHaveBeenCalledWith('fast');
  });

  it('calls onCareerPathChange when the career path filter emits a selection', () => {
    const onCareerPathChange = vi.fn();
    render(
      <VacancyFilteringSection
        {...defaultProps}
        onCareerPathChange={onCareerPathChange}
      />
    );
    fireEvent.click(
      screen.getByTestId('filter-vacancies.table.filter.careerPath')
    );
    expect(onCareerPathChange).toHaveBeenCalledWith('opt1');
  });

  it('calls onDisciplineChange when the discipline filter emits a selection', () => {
    const onDisciplineChange = vi.fn();
    render(
      <VacancyFilteringSection
        {...defaultProps}
        onDisciplineChange={onDisciplineChange}
      />
    );
    fireEvent.click(
      screen.getByTestId('filter-vacancies.table.filter.discipline')
    );
    expect(onDisciplineChange).toHaveBeenCalledWith('opt1');
  });

  it('calls onStatusChange when the status filter emits a selection', () => {
    const onStatusChange = vi.fn();
    render(
      <VacancyFilteringSection
        {...defaultProps}
        onStatusChange={onStatusChange}
      />
    );
    fireEvent.click(screen.getByTestId('filter-vacancies.table.filter.status'));
    expect(onStatusChange).toHaveBeenCalledWith('opt1');
  });
});
