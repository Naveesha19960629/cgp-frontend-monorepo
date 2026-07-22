import type { StatusConfig, VacancyStatus } from '@/views/vacancies/types';

const URL_PROTOCOL_HTTP = 'http://';
const URL_PROTOCOL_HTTPS = 'https://';

const DATE_DISPLAY_FORMAT = 'do MMM yyyy';

const TABLE_PAGE_SIZE = 12;

const SEARCH_DEBOUNCE_MS = 400;

const VACANCY_STATUS_CONFIG: Record<VacancyStatus, StatusConfig> = {
  draft: {
    bg: 'bg-[#f1f5f9]',
    border: 'border-[#cbd5e1]',
    text: 'text-[#475569]',
    labelKey: 'vacancies.table.filter.statusOptions.draft',
  },
  unpublished: {
    bg: 'bg-[#fff3e0]',
    border: 'border-[#fecc7e]',
    text: 'text-[#ca9239]',
    labelKey: 'vacancies.table.filter.statusOptions.unpublished',
  },
  live: {
    bg: 'bg-[#ecfdf5]',
    border: 'border-[#a7f3d0]',
    text: 'text-[#059669]',
    labelKey: 'vacancies.table.filter.statusOptions.live',
  },
  expired: {
    bg: 'bg-[rgba(51,38,3,0.09)]',
    border: 'border-[rgba(56,35,0,0.13)]',
    text: 'text-[#492503]',
    labelKey: 'vacancies.table.filter.statusOptions.expired',
  },
  on_hold: {
    bg: 'bg-[#dbeafe]',
    border: 'border-[#bfdbfe]',
    text: 'text-[#3b82f6]',
    labelKey: 'vacancies.table.filter.statusOptions.onHold',
  },
};

const VACANCY_STATUS_FALLBACK_CONFIG: StatusConfig = {
  bg: 'bg-[#f1f5f9]',
  border: 'border-[#cbd5e1]',
  text: 'text-[#475569]',
  labelKey: '',
};

const EMPTY_STATE_ROW_WIDTHS = [
  { first: 'w-[269px]', rest: 'w-[141px]' },
  { first: 'w-[220px]', rest: 'w-[141px]' },
  { first: 'w-[269px]', rest: 'w-[141px]' },
  { first: 'w-[250px]', rest: 'w-[141px]' },
  { first: 'w-[269px]', rest: 'w-[141px]' },
  { first: 'w-[200px]', rest: 'w-[141px]' },
  { first: 'w-[269px]', rest: 'w-[141px]' },
  { first: 'w-[240px]', rest: 'w-[141px]' },
  { first: 'w-[269px]', rest: 'w-[141px]' },
  { first: 'w-[230px]', rest: 'w-[141px]' },
  { first: 'w-[269px]', rest: 'w-[141px]' },
  { first: 'w-[210px]', rest: 'w-[141px]' },
];
const TWELVE_HOUR_TIME_REGEX = /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i;
const TWENTY_FOUR_HOUR_TIME_REGEX = /^(\d{2}):(\d{2})(?::(\d{2}))?$/;

const TEMPLATE_SKELETON_COUNT = 8;

const TEMPLATES_LIST_ROUTE = '/dashboard/ats/templates';

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
  TEMPLATE_SKELETON_COUNT,
  TEMPLATES_LIST_ROUTE,
};
