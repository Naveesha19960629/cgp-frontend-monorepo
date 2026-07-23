import { vacancyTemplateService } from '@/views/vacancies/services/vacancy-template.service';

const { mockGet, mockPost, mockPut, mockDelete } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockPut: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock('@cgp/data-access', () => ({
  httpClient: {
    post: mockPost,
    get: mockGet,
    put: mockPut,
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

  it('sends a GET request to /vacancy-templates with query params', async () => {
    const mockResponse = {
      data: {
        requestId: 'req-2',
        success: true,
        message: 'Templates fetched successfully',
        data: {
          content: [],
          page: 0,
          size: 10,
          totalElements: 0,
          totalPages: 0,
          last: true,
          empty: true,
        },
      },
    };
    mockGet.mockResolvedValue(mockResponse);

    const params = { page: 0, size: 10, search: 'foo', sortOrder: 'NEWEST' as const };
    const result = await vacancyTemplateService.searchTemplates(params);

    expect(mockGet).toHaveBeenCalledWith('/vacancy-templates', { params });
    expect(result).toEqual(mockResponse.data);
  });

  it('throws when searchTemplates request fails', async () => {
    mockGet.mockRejectedValue(new Error('Network error'));

    await expect(
      vacancyTemplateService.searchTemplates({})
    ).rejects.toThrow('Network error');
  });

  it('sends a GET request to /vacancy-templates/:id', async () => {
    const mockResponse = {
      data: {
        requestId: 'req-3',
        success: true,
        message: 'Template fetched successfully',
        data: {
          templateId: 'template-1',
          templateName: 'Template 1',
          refNumber: 'REF-1',
          requestBody: {
            title: 'Vacancy Title',
            status: 'DRAFT',
            lastActiveStep: 'step-1',
            templateId: 'template-1',
            data: {},
          },
        },
      },
    };
    mockGet.mockResolvedValue(mockResponse);

    const result = await vacancyTemplateService.getTemplateById('template-1');

    expect(mockGet).toHaveBeenCalledWith('/vacancy-templates/template-1');
    expect(result).toEqual(mockResponse.data);
  });

  it('throws when getTemplateById request fails', async () => {
    mockGet.mockRejectedValue(new Error('Network error'));

    await expect(
      vacancyTemplateService.getTemplateById('template-1')
    ).rejects.toThrow('Network error');
  });

  it('sends a GET request to /vacancy-templates/next-template-name', async () => {
    const mockResponse = {
      data: {
        requestId: 'req-4',
        success: true,
        message: 'Next template name generated',
        data: { templateName: 'Template 5', refNumber: 'REF-5' },
      },
    };
    mockGet.mockResolvedValue(mockResponse);

    const result = await vacancyTemplateService.getNextTemplateName();

    expect(mockGet).toHaveBeenCalledWith(
      '/vacancy-templates/next-template-name'
    );
    expect(result).toEqual(mockResponse.data);
  });

  it('throws when getNextTemplateName request fails', async () => {
    mockGet.mockRejectedValue(new Error('Network error'));

    await expect(
      vacancyTemplateService.getNextTemplateName()
    ).rejects.toThrow('Network error');
  });

  it('sends a POST request to /vacancy-templates with the create payload', async () => {
    const payload = {
      templateName: 'Template 6',
      refNumber: 'REF-6',
      data: {},
    };
    const mockResponse = {
      data: {
        requestId: 'req-5',
        success: true,
        message: 'Template created successfully',
        data: {
          vacancyTemplateId: 'template-6',
          templateName: 'Template 6',
          refNumber: 'REF-6',
        },
      },
    };
    mockPost.mockResolvedValue(mockResponse);

    const result = await vacancyTemplateService.createTemplate(payload);

    expect(mockPost).toHaveBeenCalledWith('/vacancy-templates', payload);
    expect(result).toEqual(mockResponse.data);
  });

  it('throws when createTemplate request fails', async () => {
    mockPost.mockRejectedValue(new Error('Network error'));

    await expect(
      vacancyTemplateService.createTemplate({
        templateName: 'Template 6',
        data: {},
      })
    ).rejects.toThrow('Network error');
  });

  it('sends a PUT request to /vacancy-templates/:id with the update payload', async () => {
    const payload = { templateName: 'Updated Template', data: {} };
    const mockResponse = {
      data: {
        requestId: 'req-6',
        success: true,
        message: 'Template updated successfully',
        data: {
          vacancyTemplateId: 'template-1',
          templateName: 'Updated Template',
          refNumber: 'REF-1',
        },
      },
    };
    mockPut.mockResolvedValue(mockResponse);

    const result = await vacancyTemplateService.updateTemplate(
      'template-1',
      payload
    );

    expect(mockPut).toHaveBeenCalledWith(
      '/vacancy-templates/template-1',
      payload
    );
    expect(result).toEqual(mockResponse.data);
  });

  it('throws when updateTemplate request fails', async () => {
    mockPut.mockRejectedValue(new Error('Network error'));

    await expect(
      vacancyTemplateService.updateTemplate('template-1', {
        templateName: 'Updated Template',
        data: {},
      })
    ).rejects.toThrow('Network error');
  });

  it('throws when saveVacancyAsTemplate request fails', async () => {
    mockPost.mockRejectedValue(new Error('Network error'));

    await expect(
      vacancyTemplateService.saveVacancyAsTemplate({
        vacancyId: 'vacancy-1',
        templateName: 'Template 4',
      })
    ).rejects.toThrow('Network error');
  });
});
