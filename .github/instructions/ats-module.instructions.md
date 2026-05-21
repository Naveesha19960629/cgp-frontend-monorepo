---
applyTo: "apps/ats-module/src/**"
---

# ATS Module — Coding Conventions

These rules apply to all code written inside `apps/ats-module/src/`.
Follow them strictly and do not deviate without an explicit comment explaining why.

---

## 1. File & Folder Structure

Every **view** lives under `src/views/<view-name>/` and must contain these sub-folders:

```
src/views/<view-name>/
  services/         ← HTTP layer (one file per resource)
  hooks/
    queries/        ← useQuery hooks (one file per query)
    mutations/      ← useMutation hooks (one file per mutation)
    index.ts        ← barrel: re-exports queries/* and mutations/*
  components/       ← UI components for this view
  pages/            ← Route-level page components
  context/          ← React context files (if needed)
  utils/            ← Pure helper functions
  types.ts          ← ALL types/interfaces for this view
  index.ts          ← Public barrel for the whole view
```

> Never add sub-folders that are not listed above without a clear reason.

---

## 2. HTTP Services

- **Location:** `src/views/<view-name>/services/<resource>.service.ts`
- **Pattern:** export a plain object with async methods. Do **not** use classes.
- **HTTP client:** always import from the workspace package — never import axios directly.

```typescript
// ✅ correct
import { httpClient } from '@cgp/data-access';

export const genderService = {
  getGenders: async (): Promise<ApiResponse<GenderItem[]>> => {
    const response = await httpClient.get<ApiResponse<GenderItem[]>>('/genders');
    return response.data;
  },

  createGender: async (payload: CreateGenderPayload): Promise<ApiResponse<GenderItem>> => {
    const response = await httpClient.post<ApiResponse<GenderItem>>('/genders', payload);
    return response.data;
  },
};

// ❌ wrong — do not import axios directly
import axios from 'axios';

// ❌ wrong — do not use a class
export class GenderService { ... }
```

- The service barrel `services/index.ts` must re-export every service object.

---

## 3. Common API Response Type

**Always** type HTTP responses with `ApiResponse<T>` from the view's `types.ts`.  
Never define an inline response shape inside a service, hook, or component.

```typescript
import type { ApiResponse, GenderItem } from '@/views/<view-name>/types';
```

`ApiResponse<T>` shape (already defined in each view's `types.ts`):

```typescript
interface ApiResponse<T> {
  requestId: string;
  success: boolean;
  message: string;
  data: {
    type: string;
    items: {
      content: T;
      // pagination fields …
    };
  };
}
```

---

## 4. React Query — Queries

- **Location:** `src/views/<view-name>/hooks/queries/use-<resource>-query.ts`
- One file per query. Export a named `const` hook.
- Define the query key as a typed `const` inside the same file.
- Only call the service function inside `queryFn` — no inline `httpClient` calls.

```typescript
// hooks/queries/use-genders-query.ts
import { useQuery } from '@tanstack/react-query';

import { genderService } from '@/views/<view-name>/services';

const GENDERS_QUERY_KEY = ['genders'] as const;

const useGendersQuery = () =>
  useQuery({
    queryKey: GENDERS_QUERY_KEY,
    queryFn: genderService.getGenders,
  });

export { useGendersQuery };
```

- Register the export in `hooks/queries/index.ts`.

---

## 5. React Query — Mutations

- **Location:** `src/views/<view-name>/hooks/mutations/use-<resource>-mutation.ts`
- One file per mutation. Export a named `const` hook.
- Handle `onSuccess` / `onError` callbacks inside the hook when they are reusable; pass them as options from the component only when they are component-specific.

```typescript
// hooks/mutations/use-create-gender-mutation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { genderService } from '@/views/<view-name>/services';
import type { CreateGenderPayload } from '@/views/<view-name>/types';

const useCreateGenderMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateGenderPayload) =>
      genderService.createGender(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['genders'] });
    },
  });
};

export { useCreateGenderMutation };
```

- Register the export in `hooks/mutations/index.ts`.

---

## 6. No Direct API Calls in UI

UI components, pages, and context files must **never** call `httpClient` or a service function directly.  
All server interactions must go through a React Query hook.

```typescript
// ✅ correct — use the query hook
const { data, isLoading, isError } = useGendersQuery();

// ❌ wrong — calling the service directly in a component
const genders = await genderService.getGenders();

// ❌ wrong — calling httpClient directly in a component
const res = await httpClient.get('/genders');
```

---

## 7. Barrel Imports

Always import from the barrel (`index.ts`) of a folder, never from the leaf file directly — unless you are writing code **inside** that same folder.

```typescript
// ✅ correct — importing from the view barrel
import { useGendersQuery } from '@/views/vacancies';

// ✅ correct — importing from the hooks barrel (inside the hooks folder)
import { genderService } from '@/views/vacancies/services';

// ❌ wrong — reaching into a leaf file from outside its folder
import { useGendersQuery } from '@/views/vacancies/hooks/queries/use-gender-query';
```

Every folder **must** have an `index.ts` that re-exports its public surface.

---

## 8. Types File

All TypeScript `interface` and `type` declarations for a view belong **exclusively** in `types.ts` at the root of that view folder.

- Do **not** define types inside components, hooks, services, pages, or context files.
- Do **not** create a separate `*.types.ts` file alongside a component.
- Export every type from `types.ts` using `export type { … }`.

```typescript
// ✅ correct
// src/views/vacancies/types.ts
export type { GenderItem, ApiResponse, VacancyForm, ... };

// ❌ wrong — inline interface inside a component
function MyComponent() {
  interface LocalType { ... }
}

// ❌ wrong — type defined next to a hook
// hooks/queries/use-gender-query.types.ts
```

---

## 9. Form Payload Helpers (Edit / Update Mutations)

When the shape of form data does not match the API payload, create a **form helper** function in `utils/` to do the conversion.  
Never transform data inline inside a component or mutation hook.

Naming convention: `to<ResourceName>Payload` or `from<ResourceName>Response`.

```typescript
// ✅ correct
// src/views/vacancies/utils/gender-form-helpers.ts
import type { GenderFormValues, CreateGenderPayload } from '@/views/vacancies/types';

export function toCreateGenderPayload(form: GenderFormValues): CreateGenderPayload {
  return {
    label: form.name.trim(),
    active: form.isActive,
  };
}
```

Then use it in the mutation call site inside the component:

```typescript
const { mutate } = useCreateGenderMutation();
mutate(toCreateGenderPayload(formValues));
```

Export helpers from `utils/index.ts`.

---

## 10. Custom Form Hooks

Every form in the ATS module must have its own custom hook.  
Do **not** call `useForm` directly inside a page or component.

- **Location:** `src/views/<view-name>/hooks/use-<form-name>-form.ts`  
  (lives in `hooks/` directly, not inside `queries/` or `mutations/`)
- Use **Zod** for schema validation and **react-hook-form** for form state.
- Export both the hook and its inferred form type from the hook file; register them in `hooks/index.ts`.

```typescript
// hooks/use-create-gender-form.ts
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const createGenderSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  isActive: z.boolean().default(true),
});

type CreateGenderFormValues = z.infer<typeof createGenderSchema>;

const useCreateGenderForm = () =>
  useForm<CreateGenderFormValues>({
    resolver: zodResolver(createGenderSchema),
    defaultValues: { name: '', isActive: true },
  });

export { useCreateGenderForm };
export type { CreateGenderFormValues };
```

---

## 11. Naming Conventions

| Artifact | Convention | Example |
|---|---|---|
| Service file | `<resource>.service.ts` | `gender.service.ts` |
| Service object | `<resource>Service` (camelCase) | `genderService` |
| Query hook file | `use-<resource>-query.ts` | `use-genders-query.ts` |
| Query hook | `use<Resource>Query` (PascalCase verb) | `useGendersQuery` |
| Mutation hook file | `use-<action>-<resource>-mutation.ts` | `use-create-gender-mutation.ts` |
| Mutation hook | `use<Action><Resource>Mutation` | `useCreateGenderMutation` |
| Form hook file | `use-<form-name>-form.ts` | `use-create-gender-form.ts` |
| Form hook | `use<FormName>Form` | `useCreateGenderForm` |
| Form helper | `to<Resource>Payload` / `from<Resource>Response` | `toCreateGenderPayload` |
| Query key constant | `<RESOURCE>_QUERY_KEY` (UPPER_SNAKE_CASE) | `GENDERS_QUERY_KEY` |
| Type / Interface | PascalCase noun | `GenderItem`, `VacancyForm` |

---

## 12. i18n

- Use `useTranslation('ats')` for all user-facing strings.
- Never hardcode English strings in JSX; always use `t('key')`.

---

## 13. Component Imports from `@cgp/ui-kit`

Import UI primitives through the ui-kit barrel, never from a direct path within the package.

```typescript
// ✅ correct
import { Button } from '@cgp/ui-kit/components/ui/button';
import { cn } from '@cgp/ui-kit/lib/utils';

// ❌ wrong
import { Button } from '../../../packages/ui-kit/src/components/...';
```
