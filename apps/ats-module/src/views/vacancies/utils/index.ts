export { resolveUserCreatedIndustries } from '@/views/vacancies/utils/patent-form-helpers';
export { resolveUserCreatedOrganizations } from '@/views/vacancies/utils/honours-form-helpers';
export { resolveUserCreatedEntries } from '@/views/vacancies/utils/resolve-user-created-entries';
export {
  toSecondaryEducationPayload,
  formatDate,
} from '@/views/vacancies/utils/secondary-education-helpers';
export { toTertiaryEducationPayload } from '@/views/vacancies/utils/tertiary-education-helpers';
export { toLicenseCertificatesPayload } from '@/views/vacancies/utils/license-certificates-helpers';
export {
  URL_PROTOCOL_HTTP,
  URL_PROTOCOL_HTTPS,
  DATE_DISPLAY_FORMAT,
  TABLE_PAGE_SIZE,
  SEARCH_DEBOUNCE_MS,
  VACANCY_STATUS_CONFIG,
  VACANCY_STATUS_FALLBACK_CONFIG,
  EMPTY_STATE_ROW_WIDTHS,
  TWELVE_HOUR_TIME_REGEX,
  TWENTY_FOUR_HOUR_TIME_REGEX,
} from '@/views/vacancies/utils/constants';
export {
  isUrlProtocolValid,
  isUrlFormatValid,
} from '@/views/vacancies/utils/url-validation';
export { resolveUserCreatedOptions } from '@/views/vacancies/utils/job-requirements-form-helpers';
export { resolveDraftUserCreatedEntries } from '@/views/vacancies/utils/resolve-draft-form';
export type { DraftFormResolverDeps } from '@/views/vacancies/utils/resolve-draft-form';
export {
  formatDisplayDateTime,
  to24HourTime,
} from '@/views/vacancies/utils/schedule-display-date-time';
export {
  formatDateRange,
  formatDisplayDate,
} from '@/views/vacancies/utils/format-date-range';
export {
  toCreateVacancyPayload,
  toUpdateVacancyPayload,
} from '@/views/vacancies/utils/vacancy-payload-helpers';
export {
  toVacancyFormFromResponse,
  normalizeCustomizableFormSection,
} from '@/views/vacancies/utils/vacancy-edit-response-helpers';
export { toVacancyFormFromTemplateUsePayload } from '@/views/vacancies/utils/vacancy-template-use-helpers';
export { toVacancyViewModel } from '@/views/vacancies/utils/vacancy-view-response-helpers';
export {
  sanitizePlainText,
  sanitizePostalCodeText,
} from '@/views/vacancies/utils/text-sanitizer';
export {
  TEMPLATE_SECTIONS,
  TEMPLATE_NAME_MAX_LENGTH,
  SECTION_KEY_TO_STEP_KEY,
  MANDATORY_TEMPLATE_STEP_KEYS,
} from '@/views/vacancies/utils/vacancy-template-config';
export {
  createInitialTemplateFormState,
  hasAnySelection,
  toCreateTemplatePayload,
} from '@/views/vacancies/utils/vacancy-template-payload-helpers';
export type { CreateVacancyPayload } from '@/views/vacancies/types';
