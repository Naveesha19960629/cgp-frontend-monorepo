import { describe, expect, it } from 'vitest';

import { toVacancyViewModel } from '@/views/vacancies/utils/vacancy-view-response-helpers';

describe('toVacancyViewModel', () => {
  it('maps API response fields needed by the vacancy view page', () => {
    const model = toVacancyViewModel({
      title: 'Senior Software Engineer',
      status: 'Live',
      applicantCount: 5,
      data: {
        jobRequirement: {
          discipline: { id: 'd1', label: 'IT', source: 'MASTER' },
          careerPath: {
            id: 'c1',
            label: 'Software Engineering',
            source: 'MASTER',
          },
          level: { id: 'l1', label: 'Senior', source: 'MASTER' },
          roles: [
            { id: 'r1', label: 'Software Engineer', source: 'MASTER' },
            { id: 'r2', label: 'Tech Lead', source: 'MASTER' },
          ],
          jobTitles: [
            { id: 'j1', label: 'Senior Software Engineer', source: 'MASTER' },
          ],
          employmentTypes: [{ id: 'e1', label: 'Full Time', source: 'MASTER' }],
          workSchedules: [{ id: 'w1', label: 'Hybrid', source: 'MASTER' }],
          engagementModels: [{ id: 'g1', label: 'On Site', source: 'MASTER' }],
          description: 'Build scalable web applications.',
        },
      },
    });

    expect(model.title).toBe('Senior Software Engineer');
    expect(model.status).toBe('Live');
    expect(model.applicantCount).toBe(5);
    expect(model.jobRequirement.discipline).toEqual(['IT']);
    expect(model.jobRequirement.careerPath).toEqual(['Software Engineering']);
    expect(model.jobRequirement.level).toEqual(['Senior']);
    expect(model.jobRequirement.role).toEqual([
      'Software Engineer',
      'Tech Lead',
    ]);
    expect(model.jobRequirement.jobTitle).toEqual(['Senior Software Engineer']);
    expect(model.jobRequirement.employmentType).toEqual(['Full Time']);
    expect(model.jobRequirement.workSchedule).toEqual(['Hybrid']);
    expect(model.jobRequirement.engagementModel).toEqual(['On Site']);
    expect(model.jobRequirement.description).toBe(
      'Build scalable web applications.'
    );
  });

  it('supports form-style jobRequirements array shape', () => {
    const model = toVacancyViewModel({
      title: 'Backend Engineer',
      data: {
        jobRequirements: [
          {
            role: [{ id: 'r1', label: 'Backend Engineer', source: 'MASTER' }],
            jobTitle: [
              { id: 'j1', label: 'Senior Backend Engineer', source: 'MASTER' },
            ],
          },
        ],
      },
    });

    expect(model.jobRequirement.role).toEqual(['Backend Engineer']);
    expect(model.jobRequirement.jobTitle).toEqual(['Senior Backend Engineer']);
  });

  it('maps scheduled vacancy fields from nested schedule payload', () => {
    const model = toVacancyViewModel({
      title: 'Scheduled Vacancy',
      data: {
        schedule: {
          schedulePublishAt: '2023-02-12T21:00:00',
          expirationAt: '2023-02-13T21:00:00',
          vacancyLink: 'example.com/job-posting',
        },
      },
    });

    expect(model.scheduledVacancy).toEqual({
      schedulePublishAt: '2023-02-12T21:00:00',
      expirationAt: '2023-02-13T21:00:00',
      vacancyLink: 'example.com/job-posting',
    });
  });

  it('falls back to root-level scheduled fields and link aliases', () => {
    const model = toVacancyViewModel({
      title: 'Scheduled Vacancy',
      schedulePublishAt: '2024-01-02T09:30:00',
      expirationAt: '2024-01-03T09:30:00',
      vacancyUrl: 'https://example.org/jobs/123',
    });

    expect(model.scheduledVacancy).toEqual({
      schedulePublishAt: '2024-01-02T09:30:00',
      expirationAt: '2024-01-03T09:30:00',
      vacancyLink: 'https://example.org/jobs/123',
    });
  });

  it('maps scheduled fields from scheduleRequirement payload shape', () => {
    const model = toVacancyViewModel({
      title: 'Scheduled Vacancy',
      scheduleRequirement: {
        schedulePublishAt: '2026-06-24T02:33:33',
        expirationAt: '2026-06-26T07:07:09',
      },
    });

    expect(model.scheduledVacancy).toEqual({
      schedulePublishAt: '2026-06-24T02:33:33',
      expirationAt: '2026-06-26T07:07:09',
      vacancyLink: '',
    });
  });

  it('maps preferred projects from projectsRequirements shape', () => {
    const model = toVacancyViewModel({
      title: 'Preferred Projects Vacancy',
      data: {
        projectsRequirements: {
          isEnabled: true,
          dataTakenFromCandidate: false,
          projects: [
            {
              startDate: '2022-01-12',
              endDate: '2023-02-13',
              relatedIndustry: [
                { id: 'i1', label: 'IT', source: 'MASTER' },
                { id: 'i2', label: 'Finance', source: 'MASTER' },
              ],
              organizationLocations: [
                {
                  id: 'l1',
                  label: 'Kandy, Central Province, Sri Lanka',
                  source: 'MASTER',
                },
              ],
              organizations: [
                {
                  id: 'o1',
                  label:
                    'University of Kelaniya, Kelaniya, Western Province, Sri Lanka',
                  source: 'MASTER',
                },
              ],
            },
          ],
        },
      },
    });

    expect(model.preferredProjects).toEqual({
      isEnabled: true,
      dataTakenFromCandidate: false,
      content: [
        {
          startDate: '2022-01-12',
          endDate: '2023-02-13',
          relatedIndustry: ['IT', 'Finance'],
          organizationLocations: ['Kandy, Central Province, Sri Lanka'],
          organization: [
            'University of Kelaniya, Kelaniya, Western Province, Sri Lanka',
          ],
        },
      ],
    });
  });
});
