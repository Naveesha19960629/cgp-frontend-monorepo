import type {
  CreatePendingApiResponse,
  JobRequirementFormOption,
} from '@/views/vacancies/types';

async function resolveUserCreatedOptions(
  options: JobRequirementFormOption[],
  createFn: (label: string) => Promise<CreatePendingApiResponse>
): Promise<JobRequirementFormOption[]> {
  const userCreated = options.filter(
    option => option.source === 'USER_CREATED'
  );

  if (userCreated.length === 0) {
    return options;
  }

  const createdResponses = await Promise.all(
    userCreated.map(option => createFn(option.label))
  );

  const responseMap = new Map(
    userCreated.map((option, index) => [option.label, createdResponses[index]])
  );

  return options.map(option => {
    if (option.source !== 'USER_CREATED') {
      return option;
    }

    const response = responseMap.get(option.label);
    if (!response) {
      return option;
    }

    return {
      value: response.data.pendingId,
      label: option.label,
      source: 'PENDING',
    };
  });
}

export { resolveUserCreatedOptions };
