import { useTemplateSaveToastHandlers } from '@/views/vacancies/hooks/use-template-save-toast-handlers';

const navigate = vi.fn();
const mockSuccessToast = vi.fn();
const mockErrorToast = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
}));

vi.mock('@cgp/ui-kit/components/custom-toast', () => ({
  SuccessToast: (...args: unknown[]) => mockSuccessToast(...args) as unknown,
  ErrorToast: (...args: unknown[]) => mockErrorToast(...args) as unknown,
}));

describe('useTemplateSaveToastHandlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('onSuccess', () => {
    it('shows a success toast scoped to the given namespace and navigates to the templates list', () => {
      const { onSuccess } = useTemplateSaveToastHandlers('createTemplate');

      onSuccess();

      expect(mockSuccessToast).toHaveBeenCalledWith({
        title: 'createTemplate.notifications.success.title',
        description: 'createTemplate.notifications.success.message',
      });
      expect(navigate).toHaveBeenCalledWith('/dashboard/ats/templates');
    });

    it('scopes the toast copy to the editTemplate namespace when configured', () => {
      const { onSuccess } = useTemplateSaveToastHandlers('editTemplate');

      onSuccess();

      expect(mockSuccessToast).toHaveBeenCalledWith({
        title: 'editTemplate.notifications.success.title',
        description: 'editTemplate.notifications.success.message',
      });
    });
  });

  describe('onError', () => {
    it('shows an error toast scoped to the given namespace without navigating', () => {
      const { onError } = useTemplateSaveToastHandlers('createTemplate');

      onError();

      expect(mockErrorToast).toHaveBeenCalledWith({
        title: 'createTemplate.notifications.error.title',
        description: 'createTemplate.notifications.error.message',
      });
      expect(navigate).not.toHaveBeenCalled();
    });
  });
});
