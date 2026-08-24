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
  PDF_STATUS_PILL_COLORS,
  PDF_STATUS_PILL_FALLBACK_COLORS,
  PDF_PAGE_SIZE,
  PDF_PAGE_MARGIN,
  PDF_FONT_REGULAR,
  PDF_FONT_MEDIUM,
  PDF_FONT_SEMIBOLD,
  PDF_FONT_BOLD,
  PDF_COLORS,
  PX_TO_PT,
  PDF_SIDEBAR_WIDTH_RATIO,
  PDF_SIDEBAR_ROW_PADDING_X,
  PDF_SIDEBAR_ROW_PADDING_Y,
  PDF_SIDEBAR_VERSION_FONT_SIZE,
  PDF_SIDEBAR_META_FONT_SIZE,
  PDF_SIDEBAR_AVATAR_DIAMETER,
  PDF_SIDEBAR_DATE_FORMAT,
  PDF_ENTRY_GAP,
  PDF_CARD_PADDING,
  PDF_CARD_RADIUS,
  PDF_BOX_COLUMNS,
  PDF_BOX_GAP,
  PDF_CONTENT_PANEL_PADDING,
  PDF_SYSTEM_LABEL,
  TIME_DISPLAY_FORMAT,
  PDF_DATE_TIME_DISPLAY_FORMAT,
  PDF_STATUS_DISPLAY_LABELS,
  EMPTY_STATE_ROW_WIDTHS,
  TWELVE_HOUR_TIME_REGEX,
  TWENTY_FOUR_HOUR_TIME_REGEX,
  TEMPLATE_SKELETON_COUNT,
  TEMPLATES_LIST_ROUTE,
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
  isDateTimeInPast,
  isDateTimeBeyondMaxBoundary,
} from '@/views/vacancies/utils/schedule-display-date-time';
export {
  formatDateRange,
  formatDisplayDate,
  formatIsoDateTimeForDisplay,
  formatIsoDateForDisplay,
  formatIsoTimeForDisplay,
  formatVersionListDate,
  formatChangeValue,
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
export {
  getSectionTitleKey,
  getFieldLabelKey,
} from '@/views/vacancies/utils/job-description-field-labels';
export { buildVersionHistoryPdfBlob } from '@/views/vacancies/utils/version-history-pdf';
export {
  normalizeStatusKey,
  parseBooleanFlag,
  isDataTakenFromCandidateChange,
  getSingleScalar,
  isObjectArray,
  shouldRenderAsGrid,
  toGridItem,
  toGridItems,
  toChipItems,
  pluralizeFieldName,
  resolveScalarChangeLabelKey,
  resolveChangeVariant,
  isSystemActor,
  resolveVersionActor,
  resolveVersionEntries,
  buildVacancyCreationSummary,
  SYSTEM_ACTOR,
} from '@/views/vacancies/utils/version-history-helpers';
export { detectApplicationFormChanges } from '@/views/vacancies/utils/detect-application-form-changes';
export {
  hasScheduleChanged,
  hasPublishDateChanged,
} from '@/views/vacancies/utils/vacancy-schedule-comparison';
export type { ScheduleFormValues } from '@/views/vacancies/utils/vacancy-schedule-comparison';
export {
  getApplicationFieldChanges,
  shouldNotifyApplicants,
} from '@/views/vacancies/utils/get-application-field-changes';
export type { CreateVacancyPayload } from '@/views/vacancies/types';
