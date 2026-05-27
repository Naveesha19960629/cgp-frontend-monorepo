import type {
  Publication,
  PublicationApiData,
  PublicationEntry,
  PublicationRequirement,
  PublicationResponse,
} from '@/views/vacancies/types';

import { httpClient } from '@cgp/data-access';

export const publicationService = {
  // For vacancy form - create/update publication requirements
  createPublicationRequirement: (
    isEnabled: boolean,
    dataTakenFromCandidate: boolean,
    content: PublicationEntry[]
  ): PublicationRequirement => {
    // If dataTakenFromCandidate is true, content should be empty
    // because data will be pulled from candidate's profile
    return {
      isEnabled,
      dataTakenFromCandidate,
      content: dataTakenFromCandidate ? [] : content,
    };
  },

  // Validate publication requirement before submission
  validatePublicationRequirement: (
    requirement: PublicationRequirement
  ): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!requirement.isEnabled) {
      return { isValid: true, errors: [] };
    }

    // If data is not taken from candidate, content must have entries
    if (
      !requirement.dataTakenFromCandidate &&
      requirement.content.length === 0
    ) {
      errors.push(
        'Publication content is required when not using candidate data'
      );
    }

    // Validate each publication entry
    requirement.content.forEach((entry, index) => {
      if (!entry.acceptedPublisher.trim()) {
        errors.push(`Publication ${index + 1}: Accepted publisher is required`);
      }
      if (!entry.publishedDateFrom) {
        errors.push(
          `Publication ${index + 1}: Published date from is required`
        );
      }
      if (!entry.publishedDateTo) {
        errors.push(`Publication ${index + 1}: Published date to is required`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  getPublicationsData: async (
    userId: string
  ): Promise<PublicationResponse<Publication[]>> => {
    const response = await httpClient.get<
      | PublicationResponse<Publication[]>
      | {
          data?: {
            items?: {
              content?: Array<
                Publication & {
                  publicationId?: string;
                  journalName?: string;
                  publicationDateLabel?: string;
                }
              >;
            };
          };
          message?: string[];
          statusCode?: number;
        }
    >(`/candidates/${userId}/publications`);

    const raw = response.data;

    const backendItemsSource =
      (raw as PublicationResponse<Publication[]>)?.data ??
      (raw as { data?: { items?: { content?: Publication[] } } })?.data;

    const backendItems = Array.isArray(backendItemsSource)
      ? backendItemsSource
      : ((
          backendItemsSource as {
            items?: { content?: Publication[] };
          }
        )?.items?.content ?? []);

    const mapped: Publication[] = Array.isArray(backendItems)
      ? backendItems.map(item => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unnecessary-type-assertion
          const anyItem = item as any;
          return {
            id: anyItem.publicationId ?? anyItem.id,
            title: anyItem.title ?? '',
            publisher: anyItem.publisher ?? anyItem.journalName ?? '',
            publicationDate: anyItem.publicationDate ?? '',
            publicationDateLabel:
              anyItem.publicationDateLabel ??
              (anyItem.publicationDate ? anyItem.publicationDate : ''),
            coAuthors: Array.isArray(anyItem.coAuthors)
              ? anyItem.coAuthors
              : [],
            publicationUrl: anyItem.publicationUrl ?? '',
            description: anyItem.description ?? '',
            skills: {
              visibleToEveryone: Array.isArray(
                anyItem.skills?.visibleToEveryone
              )
                ? anyItem.skills.visibleToEveryone
                : [],
              hiddenFromPublic: Array.isArray(anyItem.skills?.hiddenFromPublic)
                ? anyItem.skills.hiddenFromPublic
                : [],
            },
          };
        })
      : [];

    return {
      message: (raw as PublicationResponse<Publication[]>)?.message ?? [],
      statusCode:
        (raw as PublicationResponse<Publication[]>)?.statusCode ?? 200,
      data: mapped,
    };
  },

  createPublication: async (
    userId: string,
    data: PublicationApiData
  ): Promise<PublicationResponse<{ id: string; title: string }>> => {
    const response = await httpClient.post<
      PublicationResponse<{ id: string; title: string }>
    >(`/candidates/${userId}/publications`, data);
    return response.data;
  },

  getPublicationById: async (
    userId: string,
    publicationId: string
  ): Promise<PublicationResponse<PublicationApiData>> => {
    const response = await httpClient.get<
      PublicationResponse<PublicationApiData>
    >(`/candidates/${userId}/publications/${publicationId}`);
    return response.data;
  },

  updatePublication: async (
    userId: string,
    publicationId: string,
    data: PublicationApiData
  ): Promise<PublicationResponse<{ id: string; title: string }>> => {
    const response = await httpClient.put<
      PublicationResponse<{ id: string; title: string }>
    >(`/candidates/${userId}/publications/${publicationId}`, data);
    return response.data;
  },

  deletePublication: async (
    userId: string,
    publicationId: string
  ): Promise<PublicationResponse<void>> => {
    const response = await httpClient.delete<PublicationResponse<void>>(
      `/candidates/${userId}/publications/${publicationId}`
    );
    return response.data;
  },
};
