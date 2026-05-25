import { renderHook, waitFor } from '@testing-library/react';

import { describe, expect, it, vi } from 'vitest';

import { useOrganizationForm } from '@/views/vacancies/hooks/use-organization-form';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}));

describe('useOrganizationForm', () => {
  it('should initialize form with default values', () => {
    const { result } = renderHook(() => useOrganizationForm());

    expect(result.current.form.getValues('name')).toBe('');
    expect(result.current.form.getValues('location')).toEqual({
      id: '',
      label: '',
    });
    expect(result.current.form.getValues('organizationWebSite')).toBe('');
  });

  it('should validate required organization name', async () => {
    const { result } = renderHook(() => useOrganizationForm());

    const triggerResult = await result.current.form.trigger('name');
    expect(triggerResult).toBe(false);
  });

  it('should validate name max length', async () => {
    const { result } = renderHook(() => useOrganizationForm());

    result.current.form.setValue('name', 'a'.repeat(201));
    const triggerResult = await result.current.form.trigger('name');
    expect(triggerResult).toBe(false);
  });

  it('should validate required location', async () => {
    const { result } = renderHook(() => useOrganizationForm());

    const triggerResult = await result.current.form.trigger('location');
    expect(triggerResult).toBe(false);
  });

  it('should accept valid organization data', async () => {
    const { result } = renderHook(() => useOrganizationForm());

    result.current.form.setValue('name', 'Test Organization');
    result.current.form.setValue('location', {
      id: '1',
      label: 'United States',
    });
    result.current.form.setValue('organizationWebSite', 'https://example.com');

    const triggerResult = await result.current.form.trigger();
    expect(triggerResult).toBe(true);
  });

  it('should validate URL format', async () => {
    const { result } = renderHook(() => useOrganizationForm());

    result.current.form.setValue('organizationWebSite', 'invalid-url');
    const triggerResult = await result.current.form.trigger(
      'organizationWebSite'
    );
    expect(triggerResult).toBe(false);
  });

  it('should accept valid URLs', async () => {
    const { result } = renderHook(() => useOrganizationForm());

    const validUrls = [
      'https://example.com',
      'http://example.com',
      'https://sub.example.com/path',
    ];

    for (const url of validUrls) {
      result.current.form.setValue('organizationWebSite', url);
      const triggerResult = await result.current.form.trigger(
        'organizationWebSite'
      );
      expect(triggerResult).toBe(true);
    }
  });

  it('should allow optional website URL', async () => {
    const { result } = renderHook(() => useOrganizationForm());

    result.current.form.setValue('name', 'Test Org');
    result.current.form.setValue('location', { id: '1', label: 'US' });
    result.current.form.setValue('organizationWebSite', '');

    const triggerResult = await result.current.form.trigger();
    expect(triggerResult).toBe(true);
  });

  it('should call onSuccess callback with form data', async () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useOrganizationForm(onSuccess));

    result.current.form.setValue('name', 'Test Organization');
    result.current.form.setValue('location', {
      id: '1',
      label: 'United States',
    });
    result.current.form.setValue('organizationWebSite', 'https://example.com');

    const event = new Event('submit', { bubbles: true });
    await result.current.onSubmit(event as any);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith({
        name: 'Test Organization',
        location: { id: '1', label: 'United States' },
        organizationWebSite: 'https://example.com',
      });
    });
  });

  it('should reset form after successful submission', async () => {
    const { result } = renderHook(() => useOrganizationForm());

    result.current.form.setValue('name', 'Test Organization');
    result.current.form.setValue('location', {
      id: '1',
      label: 'United States',
    });
    result.current.form.setValue('organizationWebSite', 'https://example.com');

    const event = new Event('submit', { bubbles: true });
    await result.current.onSubmit(event as any);

    expect(result.current.form.getValues('name')).toBe('');
    expect(result.current.form.getValues('location')).toEqual({
      id: '',
      label: '',
    });
    expect(result.current.form.getValues('organizationWebSite')).toBe('');
  });
});
