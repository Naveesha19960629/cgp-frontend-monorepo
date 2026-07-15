import { vacancyTemplateService } from '@/views/vacancies/services/vacancy-template.service';

const { mockPost } = vi.hoisted(() => ({
  mockPost: vi.fn(),
}));

vi.mock('@cgp/data-access', () => ({
  httpClient: {
    post: mockPost,
  },
}));

describe('vacancyTemplateService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('saveVacancyAsTemplate', () => {
    it('calls POST endpoint with the payload and returns response data', async () => {
      const responseData = {
        requestId: 'req-1',
        success: true,
        message: 'Vacancy has been successfully saved as a template.',
        data: 'template-1',
      };
      mockPost.mockResolvedValue({ data: responseData });

      const result = await vacancyTemplateService.saveVacancyAsTemplate({
        vacancyId: 'vacancy-1',
        templateName: 'Template 4',
      });

      expect(mockPost).toHaveBeenCalledWith('/vacancies/vacancy-1/templates', {
        templateName: 'Template 4',
      });
      expect(result).toBe(responseData);
    });
  });
});
