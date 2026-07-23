import { beforeEach, describe, expect, it, vi } from 'vitest';

import { publicationService } from '@/views/vacancies/services/publication.service';
import type {
  Publication,
  PublicationApiData,
  PublicationEntry,
  PublicationRequirement,
  PublicationResponse,
} from '@/views/vacancies/types';

// -- Mock @cgp/data-access --------------------------------------------------

const { mockGet, mockPost, mockPut, mockDelete } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockPut: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock('@cgp/data-access', () => ({
  httpClient: {
    get: mockGet,
    post: mockPost,
    put: mockPut,
    delete: mockDelete,
  },
}));

// -- Setup ------------------------------------------------------------------

describe('publicationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -- createPublicationRequirement -------------------------------------------

  describe('publicationService.createPublicationRequirement', () => {
    it('returns empty content when dataTakenFromCandidate is true', () => {
      const content: PublicationEntry[] = [
        {
          acceptedPublisher: 'IEEE',
          publishedDateFrom: '2020-01-01',
          publishedDateTo: '2023-12-31',
        },
      ];

      const result = publicationService.createPublicationRequirement(
        true,
        true,
        content
      );

      expect(result).toEqual({
        isEnabled: true,
        dataTakenFromCandidate: true,
        content: [], // Content should be empty
      });
    });

    it('includes content when dataTakenFromCandidate is false', () => {
      const content: PublicationEntry[] = [
        {
          acceptedPublisher: 'ACM',
          publishedDateFrom: '2020-01-01',
          publishedDateTo: '2023-12-31',
        },
      ];

      const result = publicationService.createPublicationRequirement(
        true,
        false,
        content
      );

      expect(result).toEqual({
        isEnabled: true,
        dataTakenFromCandidate: false,
        content: content, // Content should be included
      });
    });

    it('handles disabled state', () => {
      const result = publicationService.createPublicationRequirement(
        false,
        false,
        []
      );

      expect(result).toEqual({
        isEnabled: false,
        dataTakenFromCandidate: false,
        content: [],
      });
    });

    it('returns empty content when dataTakenFromCandidate is true regardless of provided content', () => {
      const content: PublicationEntry[] = [
        {
          acceptedPublisher: 'Springer',
          publishedDateFrom: '2018-06-15',
          publishedDateTo: '2021-08-20',
        },
        {
          acceptedPublisher: 'Nature',
          publishedDateFrom: '2019-03-01',
          publishedDateTo: '2022-11-30',
        },
      ];

      const result = publicationService.createPublicationRequirement(
        true,
        true,
        content
      );

      expect(result.content).toEqual([]);
      expect(result.content).toHaveLength(0);
    });
  });

  // -- validatePublicationRequirement -----------------------------------------

  describe('publicationService.validatePublicationRequirement', () => {
    it('returns valid when isEnabled is false', () => {
      const requirement: PublicationRequirement = {
        isEnabled: false,
        dataTakenFromCandidate: false,
        content: [],
      };

      const result =
        publicationService.validatePublicationRequirement(requirement);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('returns valid when dataTakenFromCandidate is true with empty content', () => {
      const requirement: PublicationRequirement = {
        isEnabled: true,
        dataTakenFromCandidate: true,
        content: [],
      };

      const result =
        publicationService.validatePublicationRequirement(requirement);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('returns invalid when dataTakenFromCandidate is false with empty content', () => {
      const requirement: PublicationRequirement = {
        isEnabled: true,
        dataTakenFromCandidate: false,
        content: [],
      };

      const result =
        publicationService.validatePublicationRequirement(requirement);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Publication content is required when not using candidate data'
      );
    });

    it('returns valid when content has all required fields', () => {
      const requirement: PublicationRequirement = {
        isEnabled: true,
        dataTakenFromCandidate: false,
        content: [
          {
            acceptedPublisher: 'IEEE',
            publishedDateFrom: '2020-01-01',
            publishedDateTo: '2023-12-31',
          },
        ],
      };

      const result =
        publicationService.validatePublicationRequirement(requirement);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('returns invalid when accepted publisher is missing', () => {
      const requirement: PublicationRequirement = {
        isEnabled: true,
        dataTakenFromCandidate: false,
        content: [
          {
            acceptedPublisher: '', // Empty
            publishedDateFrom: '2020-01-01',
            publishedDateTo: '2023-12-31',
          },
        ],
      };

      const result =
        publicationService.validatePublicationRequirement(requirement);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Publication 1: Accepted publisher is required'
      );
    });

    it('returns invalid when accepted publisher is whitespace only', () => {
      const requirement: PublicationRequirement = {
        isEnabled: true,
        dataTakenFromCandidate: false,
        content: [
          {
            acceptedPublisher: '   ', // Whitespace only
            publishedDateFrom: '2020-01-01',
            publishedDateTo: '2023-12-31',
          },
        ],
      };

      const result =
        publicationService.validatePublicationRequirement(requirement);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Publication 1: Accepted publisher is required'
      );
    });

    it('returns invalid when publishedDateFrom is missing', () => {
      const requirement: PublicationRequirement = {
        isEnabled: true,
        dataTakenFromCandidate: false,
        content: [
          {
            acceptedPublisher: 'IEEE',
            publishedDateFrom: '', // Empty
            publishedDateTo: '2023-12-31',
          },
        ],
      };

      const result =
        publicationService.validatePublicationRequirement(requirement);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Publication 1: Published date from is required'
      );
    });

    it('returns invalid when publishedDateTo is missing', () => {
      const requirement: PublicationRequirement = {
        isEnabled: true,
        dataTakenFromCandidate: false,
        content: [
          {
            acceptedPublisher: 'IEEE',
            publishedDateFrom: '2020-01-01',
            publishedDateTo: '', // Empty
          },
        ],
      };

      const result =
        publicationService.validatePublicationRequirement(requirement);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Publication 1: Published date to is required'
      );
    });

    it('returns multiple errors for multiple invalid entries', () => {
      const requirement: PublicationRequirement = {
        isEnabled: true,
        dataTakenFromCandidate: false,
        content: [
          {
            acceptedPublisher: '',
            publishedDateFrom: '',
            publishedDateTo: '',
          },
          {
            acceptedPublisher: 'IEEE',
            publishedDateFrom: '',
            publishedDateTo: '2023-12-31',
          },
        ],
      };

      const result =
        publicationService.validatePublicationRequirement(requirement);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(4);
      expect(result.errors).toContain(
        'Publication 1: Accepted publisher is required'
      );
      expect(result.errors).toContain(
        'Publication 1: Published date from is required'
      );
      expect(result.errors).toContain(
        'Publication 1: Published date to is required'
      );
      expect(result.errors).toContain(
        'Publication 2: Published date from is required'
      );
    });
  });

  // -- getPublicationsData ----------------------------------------------------

  describe('publicationService.getPublicationsData', () => {
    it('fetches publications and maps them correctly', async () => {
      const mockResponse: PublicationResponse<Publication[]> = {
        message: ['Success'],
        statusCode: 200,
        data: [
          {
            id: 'pub-1',
            title: 'Research Paper 1',
            publisher: 'IEEE',
            publicationDate: '2023-01-15',
            publicationDateLabel: 'Jan 2023',
            coAuthors: ['John Doe', 'Jane Smith'],
            publicationUrl: 'https://example.com/paper1',
            description: 'A groundbreaking study',
            skills: {
              visibleToEveryone: ['AI', 'ML'],
              hiddenFromPublic: [],
            },
          },
        ],
      };

      mockGet.mockResolvedValue({ data: mockResponse });

      const result = await publicationService.getPublicationsData('user-123');

      expect(mockGet).toHaveBeenCalledWith('/candidates/user-123/publications');
      expect(result).toEqual(mockResponse);
    });

    it('handles nested response structure', async () => {
      const mockResponse = {
        message: ['Success'],
        statusCode: 200,
        data: {
          items: {
            content: [
              {
                publicationId: 'pub-2',
                title: 'Research Paper 2',
                journalName: 'ACM',
                publicationDate: '2023-02-20',
                coAuthors: [],
                publicationUrl: '',
                description: '',
                skills: {
                  visibleToEveryone: [],
                  hiddenFromPublic: [],
                },
              },
            ],
          },
        },
      };

      mockGet.mockResolvedValue({ data: mockResponse });

      const result = await publicationService.getPublicationsData('user-456');

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({
        id: 'pub-2',
        title: 'Research Paper 2',
        publisher: 'ACM',
        publicationDate: '2023-02-20',
        coAuthors: [],
        publicationUrl: '',
        description: '',
      });
    });

    it('handles empty publications array', async () => {
      const mockResponse: PublicationResponse<Publication[]> = {
        message: ['No publications found'],
        statusCode: 200,
        data: [],
      };

      mockGet.mockResolvedValue({ data: mockResponse });

      const result = await publicationService.getPublicationsData('user-789');

      expect(result.data).toEqual([]);
    });

    it('maps journalName to publisher field', async () => {
      const mockResponse = {
        data: {
          items: {
            content: [
              {
                publicationId: 'pub-3',
                title: 'Test Paper',
                journalName: 'Nature',
                publicationDate: '2023-03-10',
                coAuthors: [],
              },
            ],
          },
        },
      };

      mockGet.mockResolvedValue({ data: mockResponse });

      const result = await publicationService.getPublicationsData('user-999');

      expect(result.data[0].publisher).toBe('Nature');
    });
  });

  // -- createPublication ------------------------------------------------------

  describe('publicationService.createPublication', () => {
    it('sends correct payload to backend', async () => {
      const publicationData: PublicationApiData = {
        title: 'New Research Paper',
        publisher: 'IEEE',
        publicationDate: '2023-06-15',
        coAuthors: ['Alice', 'Bob'],
        publicationUrl: 'https://example.com/paper',
        description: 'Important research',
      };

      const mockResponse: PublicationResponse<{ id: string; title: string }> = {
        message: ['Publication created successfully'],
        statusCode: 201,
        data: {
          id: 'pub-new',
          title: 'New Research Paper',
        },
      };

      mockPost.mockResolvedValue({ data: mockResponse });

      const result = await publicationService.createPublication(
        'user-123',
        publicationData
      );

      expect(mockPost).toHaveBeenCalledWith(
        '/candidates/user-123/publications',
        publicationData
      );
      expect(result).toEqual(mockResponse);
    });
  });

  // -- getPublicationById -----------------------------------------------------

  describe('publicationService.getPublicationById', () => {
    it('fetches a single publication by id', async () => {
      const mockResponse: PublicationResponse<PublicationApiData> = {
        message: ['Success'],
        statusCode: 200,
        data: {
          title: 'Specific Paper',
          publisher: 'Springer',
          publicationDate: '2023-04-10',
          coAuthors: ['Charlie'],
          publicationUrl: 'https://example.com/specific',
          description: 'Detailed study',
        },
      };

      mockGet.mockResolvedValue({ data: mockResponse });

      const result = await publicationService.getPublicationById(
        'user-123',
        'pub-456'
      );

      expect(mockGet).toHaveBeenCalledWith(
        '/candidates/user-123/publications/pub-456'
      );
      expect(result).toEqual(mockResponse);
    });
  });

  // -- updatePublication ------------------------------------------------------

  describe('publicationService.updatePublication', () => {
    it('sends updated data to backend', async () => {
      const updatedData: PublicationApiData = {
        title: 'Updated Paper',
        publisher: 'ACM',
        publicationDate: '2023-07-20',
        coAuthors: ['Dave', 'Eve'],
        publicationUrl: 'https://example.com/updated',
        description: 'Revised findings',
      };

      const mockResponse: PublicationResponse<{ id: string; title: string }> = {
        message: ['Publication updated successfully'],
        statusCode: 200,
        data: {
          id: 'pub-789',
          title: 'Updated Paper',
        },
      };

      mockPut.mockResolvedValue({ data: mockResponse });

      const result = await publicationService.updatePublication(
        'user-123',
        'pub-789',
        updatedData
      );

      expect(mockPut).toHaveBeenCalledWith(
        '/candidates/user-123/publications/pub-789',
        updatedData
      );
      expect(result).toEqual(mockResponse);
    });
  });

  // -- deletePublication ------------------------------------------------------

  describe('publicationService.deletePublication', () => {
    it('sends delete request to backend', async () => {
      const mockResponse: PublicationResponse<void> = {
        message: ['Publication deleted successfully'],
        statusCode: 204,
        data: undefined,
      };

      mockDelete.mockResolvedValue({ data: mockResponse });

      const result = await publicationService.deletePublication(
        'user-123',
        'pub-delete'
      );

      expect(mockDelete).toHaveBeenCalledWith(
        '/candidates/user-123/publications/pub-delete'
      );
      expect(result).toEqual(mockResponse);
    });
  });
}); // end: publicationService
