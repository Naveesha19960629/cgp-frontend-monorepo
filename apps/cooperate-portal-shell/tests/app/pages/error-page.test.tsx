import ErrorPage from '@/app/pages/error-page';

const mockNavigate = vi.fn();
let mockRouteError: unknown = undefined;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
  useRouteError: () => mockRouteError,
}));

describe('ErrorPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockRouteError = undefined;
  });

  it('renders the notFoundMessage when routerError.status is 404', () => {
    mockRouteError = { status: 404 };

    render(<ErrorPage />);

    expect(screen.getByText('errorPage.notFoundMessage')).toBeInTheDocument();
  });

  it('renders the serverErrorMessage when routerError.status is 500', () => {
    mockRouteError = { status: 500 };

    render(<ErrorPage />);

    expect(
      screen.getByText('errorPage.serverErrorMessage')
    ).toBeInTheDocument();
  });

  it('renders routerError.message when present and status is not 404/500', () => {
    mockRouteError = { message: 'Router blew up' };

    render(<ErrorPage />);

    expect(screen.getByText('Router blew up')).toBeInTheDocument();
  });

  it('falls back to the error prop message when routerError has no message', () => {
    mockRouteError = {};

    render(<ErrorPage error={new Error('Component crashed')} />);

    expect(screen.getByText('Component crashed')).toBeInTheDocument();
  });

  it('renders no error message when neither routerError nor error prop provide one', () => {
    mockRouteError = undefined;

    render(<ErrorPage />);

    expect(screen.queryByText('Component crashed')).not.toBeInTheDocument();
    expect(
      screen.queryByText('errorPage.notFoundMessage')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('errorPage.serverErrorMessage')
    ).not.toBeInTheDocument();
  });

  it('navigates home on go back click when history length is 1 or less', () => {
    const originalLength = window.history.length;
    Object.defineProperty(window.history, 'length', {
      configurable: true,
      value: 1,
    });
    const backSpy = vi.spyOn(window.history, 'back');

    render(<ErrorPage />);
    fireEvent.click(screen.getByText('errorPage.goBackAndFixButton'));

    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    expect(backSpy).not.toHaveBeenCalled();

    Object.defineProperty(window.history, 'length', {
      configurable: true,
      value: originalLength,
    });
    backSpy.mockRestore();
  });

  it('calls window.history.back on go back click when history length is greater than 1', () => {
    const originalLength = window.history.length;
    Object.defineProperty(window.history, 'length', {
      configurable: true,
      value: 2,
    });
    const backSpy = vi.spyOn(window.history, 'back').mockImplementation(
      () => {}
    );

    render(<ErrorPage />);
    fireEvent.click(screen.getByText('errorPage.goBackAndFixButton'));

    expect(backSpy).toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();

    Object.defineProperty(window.history, 'length', {
      configurable: true,
      value: originalLength,
    });
    backSpy.mockRestore();
  });
});
