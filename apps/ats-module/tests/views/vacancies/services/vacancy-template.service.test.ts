import { vacancyTemplateService } from '@/views/vacancies/services/vacancy-template.service';

const { mockGet, mockPost, mockDelete } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock('@cgp/data-access', () => ({
  httpClient: {
    post: mockPost,
    get: mockGet,
    delete: mockDelete,
  },
}));

describe('vacancyTemplateService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  it('sends a DELETE request to /vacancy-templates/:id', async () => {
    const mockResponse = {
      data: {
        requestId: 'req-123',
        success: true,
        message: 'Template deleted successfully',
        data: 'template-1',
      },
    };
    mockDelete.mockResolvedValue(mockResponse);

    const result = await vacancyTemplateService.deleteTemplate('template-1');

    expect(mockDelete).toHaveBeenCalledWith('/vacancy-templates/template-1');
    expect(result).toEqual(mockResponse.data);
  });

  it('throws when the HTTP request fails', async () => {
    mockDelete.mockRejectedValue(new Error('Network error'));

    await expect(
      vacancyTemplateService.deleteTemplate('template-1')
    ).rejects.toThrow('Network error');
  });
});
