// Example usage of projectService for Vacancy Form Project Requirements
import { projectService } from '@/views/vacancies/services';
import type { ProjectEntry, ProjectRequirement } from '@/views/vacancies/types';

// ─── Example 1: Use Candidate's Existing Project Data ────────────────────────

/**
 * When dataTakenFromCandidate = true:
 * - The vacancy will use projects from the candidate's profile
 * - content array will be empty []
 */
export function createProjectFromCandidateData() {
  const requirement = projectService.createProjectRequirement(
    true, // isEnabled: feature is active
    true, // dataTakenFromCandidate: use candidate's existing data
    [] // content: will be ignored and set to []
  );

  console.log('Requirement:', requirement);
  // Output: { isEnabled: true, dataTakenFromCandidate: true, content: [] }

  return requirement;
}

// ─── Example 2: Define Custom Project Requirements ───────────────────────────

/**
 * When dataTakenFromCandidate = false:
 * - The vacancy defines specific project requirements
 * - content array contains the required project criteria
 */
export function createProjectWithCustomRequirements() {
  const projectEntries: ProjectEntry[] = [
    {
      relatedIndustry: [
        {
          source: 'PENDING',
          id: '27474711-4c85-4fe6-8979-664c46642df1',
        },
      ],
      organization: [
        {
          source: 'MASTER',
          id: 'b1b2c3d4-1111-1111-1111-000000000001',
        },
        {
          source: 'PENDING',
          id: '32c01de5-95a5-4edb-bf33-ed204a361edb',
        },
      ],
      organizationLocations: [
        {
          source: 'MASTER',
          id: 'aaaaaaaa-bbbb-cccc-dddd-000000000160',
        },
      ],
      startDate: '2020-03-01',
      endDate: '2023-08-31',
    },
    // Can add multiple project entries
    {
      relatedIndustry: [
        {
          source: 'MASTER',
          id: 'aec111e9-b8a8-43f8-97ba-b689d8dbfe2c',
        },
      ],
      organization: [
        {
          source: 'MASTER',
          id: 'c1c2c3d4-2222-2222-2222-000000000002',
        },
      ],
      organizationLocations: [
        {
          source: 'MASTER',
          id: 'aaaaaaaa-bbbb-cccc-dddd-000000000200',
        },
      ],
      startDate: '2018-01-01',
      endDate: '2020-02-28',
    },
  ];

  const requirement = projectService.createProjectRequirement(
    true, // isEnabled: feature is active
    false, // dataTakenFromCandidate: use custom requirements
    projectEntries // content: will contain these entries
  );

  console.log('Requirement with custom data:', requirement);
  return requirement;
}

// ─── Example 3: Disable Project Requirements ──────────────────────────────────

/**
 * When isEnabled = false:
 * - Project requirements are disabled for this vacancy
 */
export function createDisabledProjectRequirement() {
  const requirement = projectService.createProjectRequirement(
    false, // isEnabled: feature is disabled
    false,
    []
  );

  console.log('Disabled requirement:', requirement);
  // Output: { isEnabled: false, dataTakenFromCandidate: false, content: [] }

  return requirement;
}

// ─── Example 4: Validate Project Requirements ────────────────────────────────

/**
 * Validate project requirements before submission
 */
export function validateBeforeSubmit() {
  // Valid: Using candidate data
  const validRequirement1 = projectService.createProjectRequirement(
    true,
    true,
    []
  );
  const validation1 =
    projectService.validateProjectRequirement(validRequirement1);
  console.log('Validation 1 (using candidate data):', validation1.isValid); // true

  // Invalid: Not using candidate data but no content provided
  const invalidRequirement = projectService.createProjectRequirement(
    true,
    false,
    []
  );
  const validation2 =
    projectService.validateProjectRequirement(invalidRequirement);
  console.log('Validation 2 (no content):', validation2);
  // { isValid: false, errors: ['Project content is required when not using candidate data'] }

  // Valid: Custom content with all required fields
  const validRequirement3 = projectService.createProjectRequirement(
    true,
    false,
    [
      {
        relatedIndustry: [{ source: 'MASTER', id: 'ind-1' }],
        organization: [{ source: 'MASTER', id: 'org-1' }],
        organizationLocations: [{ source: 'MASTER', id: 'loc-1' }],
        startDate: '2020-01-01',
        endDate: '2023-12-31',
      },
    ]
  );
  const validation3 =
    projectService.validateProjectRequirement(validRequirement3);
  console.log('Validation 3 (valid custom content):', validation3.isValid); // true
}

// ─── Example 5: Toggle Data Source ───────────────────────────────────────────

/**
 * Switch between candidate data and custom requirements
 */
export function toggleDataSource(useExistingData: boolean): ProjectRequirement {
  const customContent: ProjectEntry[] = [
    {
      relatedIndustry: [{ source: 'MASTER', id: 'industry-1' }],
      organization: [{ source: 'MASTER', id: 'org-1' }],
      organizationLocations: [{ source: 'MASTER', id: 'loc-1' }],
      startDate: '2020-01-01',
      endDate: '2023-12-31',
    },
  ];

  const requirement = projectService.createProjectRequirement(
    true,
    useExistingData,
    customContent
  );

  if (useExistingData) {
    console.log(
      'Using candidate data - content is empty:',
      requirement.content.length === 0
    );
  } else {
    console.log(
      'Using custom data - content has entries:',
      requirement.content.length > 0
    );
  }

  return requirement;
}

// ─── Example 6: Complete Vacancy Form Payload ────────────────────────────────

/**
 * Example of how project requirements fit into the complete vacancy payload
 */
export function createCompleteVacancyPayload() {
  const projectRequirement = projectService.createProjectRequirement(
    true,
    false,
    [
      {
        relatedIndustry: [
          {
            source: 'PENDING',
            id: '27474711-4c85-4fe6-8979-664c46642df1',
          },
        ],
        organization: [
          {
            source: 'MASTER',
            id: 'b1b2c3d4-1111-1111-1111-000000000001',
          },
        ],
        organizationLocations: [
          {
            source: 'MASTER',
            id: 'aaaaaaaa-bbbb-cccc-dddd-000000000160',
          },
        ],
        startDate: '2020-03-01',
        endDate: '2023-08-31',
      },
    ]
  );

  const vacancyPayload = {
    title: 'Senior Software Engineer',
    status: 'UNPUBLISHED',
    data: {
      // ... other requirements
      projects: [projectRequirement],
    },
  };

  console.log(
    'Complete vacancy payload:',
    JSON.stringify(vacancyPayload, null, 2)
  );
  return vacancyPayload;
}
