import { organizationService } from '@/views/vacancies/services';
import type { CreatePendingItemResponse } from '@/views/vacancies/types';

function isAlreadyExistsError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false;
  const axiosErr = err as { response?: { data?: { code?: unknown } } };
  return axiosErr.response?.data?.code === 'MST-403';
}

function getOrganizationLabel(entry: {
  name?: string;
  label?: string;
}): string {
  return entry.name ?? entry.label ?? '';
}

async function resolveUserCreatedOrganizations<
  T extends {
    associatedOrganizations: Array<{
      value: string;
      label: string;
      source: string;
    }>;
  },
>(
  honoursAndAwards: T[],
  createOrganization: (label: string) => Promise<CreatePendingItemResponse>
): Promise<T[]> {
  const allUserCreatedOrganizations = honoursAndAwards
    .flatMap(entry => entry.associatedOrganizations)
    .filter(organization => organization.source === 'USER_CREATED');

  if (allUserCreatedOrganizations.length === 0) {
    return honoursAndAwards;
  }

  const resolvedMap = new Map<
    string,
    { value: string; label: string; source: string }
  >();

  await Promise.all(
    allUserCreatedOrganizations.map(async organization => {
      try {
        const created = await createOrganization(organization.label);
        resolvedMap.set(organization.label, {
          value: created.pendingId,
          label: created.value,
          source: created.status,
        });
      } catch (err) {
        if (isAlreadyExistsError(err)) {
          const existingOrganizations =
            await organizationService.getAllOrganizations(organization.label);
          const existing = existingOrganizations.find(entry => {
            const entryLabel = getOrganizationLabel(entry);
            return (
              entryLabel.toLowerCase() === organization.label.toLowerCase()
            );
          });

          if (existing) {
            const resolvedLabel = getOrganizationLabel(existing);
            resolvedMap.set(organization.label, {
              value: existing.id,
              label:
                resolvedLabel.length > 0 ? resolvedLabel : organization.label,
              source: existing.source ?? 'MASTER',
            });
            return;
          }
        }

        throw err;
      }
    })
  );

  return honoursAndAwards.map(entry => ({
    ...entry,
    associatedOrganizations: entry.associatedOrganizations.map(organization => {
      if (organization.source === 'USER_CREATED') {
        return resolvedMap.get(organization.label) ?? organization;
      }
      return organization;
    }),
  }));
}

export { resolveUserCreatedOrganizations };
