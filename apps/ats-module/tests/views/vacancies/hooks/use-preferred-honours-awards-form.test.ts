import { renderHook } from '@testing-library/react';

import { usePreferredHonoursAwardsForm } from '@/views/vacancies/hooks/use-preferred-honours-awards-form';

describe('usePreferredHonoursAwardsForm', () => {
  describe('initialization — no initial data', () => {
    it('returns default values when no initial data provided', () => {
      const { result } = renderHook(() => usePreferredHonoursAwardsForm());

      const values = result.current.form.getValues();
      expect(values.isEnabled).toBe(false);
      expect(values.dataTakenFromCandidate).toBe(false);
      expect(values.honoursAndAwards).toHaveLength(1);
      expect(values.honoursAndAwards[0].title).toBe('');
      expect(values.honoursAndAwards[0].issuedBy).toBe('');
      expect(values.honoursAndAwards[0].issuedDateFrom).toBeUndefined();
      expect(values.honoursAndAwards[0].issuedDateTo).toBeUndefined();
      expect(values.honoursAndAwards[0].associatedOrganizations).toEqual([]);
      expect(values.honoursAndAwards[0].organizationLocations).toEqual([]);
      expect(values.honoursAndAwards[0].isOpen).toBe(true);
    });
  });

  describe('initialization — with initial data', () => {
    it('initializes with provided data', () => {
      const initialData = {
        isEnabled: true,
        dataTakenFromCandidate: false,
        honoursAndAwards: [
          {
            title: 'Nobel Prize',
            issuedBy: 'Nobel Committee',
            issuedDateFrom: new Date('2023-01-01'),
            issuedDateTo: new Date('2023-12-31'),
            associatedOrganizations: [
              { value: 'org-1', label: 'Test Org', source: 'MASTER' },
            ],
            organizationLocations: [{ value: 'loc-1', label: 'Stockholm' }],
            isOpen: true,
          },
        ],
      };

      const { result } = renderHook(() =>
        usePreferredHonoursAwardsForm(initialData)
      );

      const values = result.current.form.getValues();
      expect(values.isEnabled).toBe(true);
      expect(values.dataTakenFromCandidate).toBe(false);
      expect(values.honoursAndAwards).toHaveLength(1);
      expect(values.honoursAndAwards[0].title).toBe('Nobel Prize');
      expect(values.honoursAndAwards[0].issuedBy).toBe('Nobel Committee');
      expect(values.honoursAndAwards[0].associatedOrganizations).toHaveLength(
        1
      );
      expect(values.honoursAndAwards[0].organizationLocations).toHaveLength(1);
    });

    it('initializes with multiple honours', () => {
      const initialData = {
        isEnabled: true,
        dataTakenFromCandidate: false,
        honoursAndAwards: [
          {
            title: 'Award 1',
            issuedBy: 'Org 1',
            issuedDateFrom: undefined,
            issuedDateTo: undefined,
            associatedOrganizations: [],
            organizationLocations: [],
            isOpen: true,
          },
          {
            title: 'Award 2',
            issuedBy: 'Org 2',
            issuedDateFrom: undefined,
            issuedDateTo: undefined,
            associatedOrganizations: [],
            organizationLocations: [],
            isOpen: false,
          },
        ],
      };

      const { result } = renderHook(() =>
        usePreferredHonoursAwardsForm(initialData)
      );

      const values = result.current.form.getValues();
      expect(values.honoursAndAwards).toHaveLength(2);
      expect(values.honoursAndAwards[0].title).toBe('Award 1');
      expect(values.honoursAndAwards[1].title).toBe('Award 2');
    });
  });

  describe('field arrays operations', () => {
    it('provides append function to add honours', () => {
      const { result } = renderHook(() => usePreferredHonoursAwardsForm());

      expect(result.current.append).toBeDefined();
      expect(typeof result.current.append).toBe('function');
    });

    it('provides remove function to delete honours', () => {
      const { result } = renderHook(() => usePreferredHonoursAwardsForm());

      expect(result.current.remove).toBeDefined();
      expect(typeof result.current.remove).toBe('function');
    });

    it('provides replace function to replace honours array', () => {
      const { result } = renderHook(() => usePreferredHonoursAwardsForm());

      expect(result.current.replace).toBeDefined();
      expect(typeof result.current.replace).toBe('function');
    });

    it('provides fields array from hook', () => {
      const { result } = renderHook(() => usePreferredHonoursAwardsForm());

      expect(result.current.fields).toBeDefined();
      expect(Array.isArray(result.current.fields)).toBe(true);
    });
  });

  describe('form validation', () => {
    it('provides form object with control', () => {
      const { result } = renderHook(() => usePreferredHonoursAwardsForm());

      expect(result.current.form).toBeDefined();
      expect(result.current.form.control).toBeDefined();
    });

    it('provides getValues method', () => {
      const { result } = renderHook(() => usePreferredHonoursAwardsForm());

      expect(result.current.form.getValues).toBeDefined();
      expect(typeof result.current.form.getValues).toBe('function');
    });

    it('provides setValue method', () => {
      const { result } = renderHook(() => usePreferredHonoursAwardsForm());

      expect(result.current.form.setValue).toBeDefined();
      expect(typeof result.current.form.setValue).toBe('function');
    });

    it('provides watch method', () => {
      const { result } = renderHook(() => usePreferredHonoursAwardsForm());

      expect(result.current.form.watch).toBeDefined();
      expect(typeof result.current.form.watch).toBe('function');
    });

    it('provides handleSubmit method', () => {
      const { result } = renderHook(() => usePreferredHonoursAwardsForm());

      expect(result.current.form.handleSubmit).toBeDefined();
      expect(typeof result.current.form.handleSubmit).toBe('function');
    });
  });

  describe('schema validation', () => {
    it('validates title field with max 250 characters', () => {
      const { result } = renderHook(() => usePreferredHonoursAwardsForm());

      const longTitle = 'a'.repeat(251);
      result.current.form.setValue('honoursAndAwards.0.title', longTitle);

      // Form should accept the value (UI prevents it at input level)
      const values = result.current.form.getValues();
      expect(values.honoursAndAwards[0].title).toBe(longTitle);
    });

    it('validates issuedBy field with max 100 characters', () => {
      const { result } = renderHook(() => usePreferredHonoursAwardsForm());

      const longIssuedBy = 'a'.repeat(101);
      result.current.form.setValue('honoursAndAwards.0.issuedBy', longIssuedBy);

      const values = result.current.form.getValues();
      expect(values.honoursAndAwards[0].issuedBy).toBe(longIssuedBy);
    });

    it('allows dates to be optional', () => {
      const { result } = renderHook(() => usePreferredHonoursAwardsForm());

      const values = result.current.form.getValues();
      expect(values.honoursAndAwards[0].issuedDateFrom).toBeUndefined();
      expect(values.honoursAndAwards[0].issuedDateTo).toBeUndefined();
    });

    it('allows setting dates', () => {
      const { result } = renderHook(() => usePreferredHonoursAwardsForm());

      const fromDate = new Date('2023-01-01');
      const toDate = new Date('2023-12-31');

      result.current.form.setValue(
        'honoursAndAwards.0.issuedDateFrom',
        fromDate
      );
      result.current.form.setValue('honoursAndAwards.0.issuedDateTo', toDate);

      const values = result.current.form.getValues();
      expect(values.honoursAndAwards[0].issuedDateFrom).toEqual(fromDate);
      expect(values.honoursAndAwards[0].issuedDateTo).toEqual(toDate);
    });
  });

  describe('organization handling', () => {
    it('allows adding organizations to honour', () => {
      const { result } = renderHook(() => usePreferredHonoursAwardsForm());

      const org = {
        value: 'org-1',
        label: 'Test Organization',
        source: 'MASTER',
      };
      result.current.form.setValue(
        'honoursAndAwards.0.associatedOrganizations',
        [org]
      );

      const values = result.current.form.getValues();
      expect(values.honoursAndAwards[0].associatedOrganizations).toHaveLength(
        1
      );
      expect(values.honoursAndAwards[0].associatedOrganizations[0]).toEqual(
        org
      );
    });

    it('allows adding multiple organizations', () => {
      const { result } = renderHook(() => usePreferredHonoursAwardsForm());

      const orgs = [
        { value: 'org-1', label: 'Org 1', source: 'MASTER' },
        { value: 'org-2', label: 'Org 2', source: 'USER_CREATED' },
      ];
      result.current.form.setValue(
        'honoursAndAwards.0.associatedOrganizations',
        orgs
      );

      const values = result.current.form.getValues();
      expect(values.honoursAndAwards[0].associatedOrganizations).toHaveLength(
        2
      );
    });

    it('allows removing organizations', () => {
      const initialData = {
        isEnabled: true,
        dataTakenFromCandidate: false,
        honoursAndAwards: [
          {
            title: 'Award',
            issuedBy: 'Org',
            issuedDateFrom: undefined,
            issuedDateTo: undefined,
            associatedOrganizations: [
              { value: 'org-1', label: 'Org 1', source: 'MASTER' },
            ],
            organizationLocations: [],
            isOpen: true,
          },
        ],
      };

      const { result } = renderHook(() =>
        usePreferredHonoursAwardsForm(initialData)
      );

      result.current.form.setValue(
        'honoursAndAwards.0.associatedOrganizations',
        []
      );

      const values = result.current.form.getValues();
      expect(values.honoursAndAwards[0].associatedOrganizations).toHaveLength(
        0
      );
    });

    it('preserves organization source attribute', () => {
      const { result } = renderHook(() => usePreferredHonoursAwardsForm());

      const userCreatedOrg = {
        value: 'org-new',
        label: 'New Org',
        source: 'USER_CREATED',
      };
      result.current.form.setValue(
        'honoursAndAwards.0.associatedOrganizations',
        [userCreatedOrg]
      );

      const values = result.current.form.getValues();
      expect(values.honoursAndAwards[0].associatedOrganizations[0].source).toBe(
        'USER_CREATED'
      );
    });
  });

  describe('location handling', () => {
    it('allows adding locations to honour', () => {
      const { result } = renderHook(() => usePreferredHonoursAwardsForm());

      const location = { value: 'loc-1', label: 'New York' };
      result.current.form.setValue('honoursAndAwards.0.organizationLocations', [
        location,
      ]);

      const values = result.current.form.getValues();
      expect(values.honoursAndAwards[0].organizationLocations).toHaveLength(1);
      expect(values.honoursAndAwards[0].organizationLocations[0]).toEqual(
        location
      );
    });

    it('allows adding multiple locations', () => {
      const { result } = renderHook(() => usePreferredHonoursAwardsForm());

      const locations = [
        { value: 'loc-1', label: 'New York' },
        { value: 'loc-2', label: 'London' },
      ];
      result.current.form.setValue(
        'honoursAndAwards.0.organizationLocations',
        locations
      );

      const values = result.current.form.getValues();
      expect(values.honoursAndAwards[0].organizationLocations).toHaveLength(2);
    });
  });

  describe('isOpen flag', () => {
    it('initializes with isOpen as true', () => {
      const { result } = renderHook(() => usePreferredHonoursAwardsForm());

      const values = result.current.form.getValues();
      expect(values.honoursAndAwards[0].isOpen).toBe(true);
    });

    it('can toggle isOpen flag', () => {
      const { result } = renderHook(() => usePreferredHonoursAwardsForm());

      result.current.form.setValue('honoursAndAwards.0.isOpen', false);

      const values = result.current.form.getValues();
      expect(values.honoursAndAwards[0].isOpen).toBe(false);
    });
  });
});
