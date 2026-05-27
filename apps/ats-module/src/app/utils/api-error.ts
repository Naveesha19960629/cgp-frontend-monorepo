import { isAxiosError } from '@cgp/data-access';
import i18n from 'i18next';

type ApiErrorResponse = {
  message?: string;
};

export function getApiErrorMessage(
  error: unknown,
  fallback: string = i18n.t('common.error', { ns: 'ats' })
): string {
  if (isAxiosError<ApiErrorResponse>(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string') {
      return message;
    }
  }

  return fallback;
}
