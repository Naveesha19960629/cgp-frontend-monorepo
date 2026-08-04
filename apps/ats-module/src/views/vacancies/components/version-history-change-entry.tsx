import { ArrowRight, Monitor } from 'lucide-react';

import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import VersionHistoryChangeSummary from '@/views/vacancies/components/version-history-change-summary';
import VersionHistoryChipList from '@/views/vacancies/components/version-history-chip-list';
import VersionHistoryScalarDiff from '@/views/vacancies/components/version-history-scalar-diff';
import VersionHistoryStatusPill from '@/views/vacancies/components/version-history-status-pill';
import VersionHistoryValueBoxGrid from '@/views/vacancies/components/version-history-value-box-grid';
import type {
  VacancyVersionHistoryChange,
  VersionHistoryChangeEntryProps,
  VersionHistoryValueBoxGridProps,
} from '@/views/vacancies/types';
import {
  formatChangeValue,
  formatIsoDateForDisplay,
  formatIsoTimeForDisplay,
  getSingleScalar,
  isObjectArray,
  pluralizeFieldName,
  resolveChangeVariant,
  resolveScalarChangeLabelKey,
  shouldRenderAsGrid,
  toChipItems,
  toGridItems,
} from '@/views/vacancies/utils';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@cgp/ui-kit/components/ui/avatar';
import { cn } from '@cgp/ui-kit/lib/utils';

type ChangeVariant = VersionHistoryValueBoxGridProps['variant'];

/** Verb + multi-value detail keys per variant. The verb is coloured, the
 * detail is not — see VersionHistoryChangeSummary. */
const SUMMARY_KEYS: Record<ChangeVariant, { verb: string; many: string }> = {
  added: { verb: 'added', many: 'addedItems' },
  removed: { verb: 'removed', many: 'removedItems' },
  updated: { verb: 'updated', many: 'updatedItems' },
};

/**
 * A single-line "label   old → new" row — Figma renders status, title and
 * schedule-date changes this way (BFyxZ6AzbRZgVvjLzRFwv3, nodes 4229:229249 /
 * 4229:229270 / 4229:229398): the muted label, the values, and the arrow all
 * sit on one baseline rather than the label stacking above the values.
 */
function InlineDiffRow({
  label,
  before,
  after,
  strikeBefore = true,
}: Readonly<{
  label?: string;
  before: ReactNode;
  after: ReactNode;
  strikeBefore?: boolean;
}>) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {label && (
        <span className="text-sm font-semibold text-[#334155]">{label}</span>
      )}
      <span
        className={cn(
          'text-base font-semibold text-[#0f172a]',
          strikeBefore && 'line-through'
        )}
      >
        {before}
      </span>
      <ArrowRight className="size-4 shrink-0 text-[#475569]" />
      <span className="text-base font-semibold text-[#0f172a]">{after}</span>
    </div>
  );
}

/** A multi-value change: the section header, then the values as bordered
 * boxes (object-shaped) or chips (plain multi-selects). */
function MultiValueChange({
  change,
  variant,
  values,
}: Readonly<{
  change: VacancyVersionHistoryChange;
  variant: ChangeVariant;
  values: unknown[];
}>) {
  const { t } = useTranslation('ats');
  const count = values.length;

  return (
    <div className="flex flex-col gap-4">
      <VersionHistoryChangeSummary
        sectionName={change.sectionName}
        verb={t(
          `versionHistory.changeTypes.verbs.${SUMMARY_KEYS[variant].verb}`
        )}
        detail={t(
          `versionHistory.changeTypes.details.${SUMMARY_KEYS[variant].many}`,
          { count, field: pluralizeFieldName(change.fieldName, count) }
        )}
        variant={variant}
      />
      {isObjectArray(values) ? (
        <VersionHistoryValueBoxGrid
          items={toGridItems(values)}
          variant={variant}
        />
      ) : (
        <VersionHistoryChipList items={toChipItems(values)} />
      )}
    </div>
  );
}

/** A single-value change: the section header, then either an old → new diff
 * or the lone value in the variant's accent. */
function ScalarChange({
  change,
  variant,
  before,
  after,
  value,
}: Readonly<{
  change: VacancyVersionHistoryChange;
  variant: ChangeVariant;
  before: string | null;
  after: string | null;
  value: string | null;
}>) {
  const { t } = useTranslation('ats');
  const isDiff = before !== null && after !== null;

  return (
    <div className="flex flex-col gap-3">
      <VersionHistoryChangeSummary
        sectionName={change.sectionName}
        verb={t(
          `versionHistory.changeTypes.verbs.${SUMMARY_KEYS[variant].verb}`
        )}
        detail={t('versionHistory.changeTypes.details.field', {
          field: change.fieldName,
        })}
        variant={variant}
      />
      {isDiff ? (
        <VersionHistoryScalarDiff
          field={change.fieldName}
          before={before}
          after={after}
        />
      ) : (
        <p
          className={cn(
            'text-base font-semibold wrap-break-word',
            variant === 'removed' ? 'text-[#be123c]' : 'text-[#047857]'
          )}
        >
          {value ?? '—'}
        </p>
      )}
    </div>
  );
}

/** The initial version's entries: the field that was set at creation. */
function CreatedChange({
  change,
}: Readonly<{ change: VacancyVersionHistoryChange }>) {
  const { t } = useTranslation('ats');
  const value = getSingleScalar(change.newValue) ?? '';

  return (
    <div className="flex flex-col gap-3">
      <VersionHistoryChangeSummary
        sectionName={change.sectionName}
        verb={t('versionHistory.changeTypes.verbs.created')}
        detail={t('versionHistory.changeTypes.details.field', {
          field: change.fieldName,
        })}
        variant="added"
      />
      {change.fieldName.toLowerCase() === 'status' ? (
        // self-start: a flex-col container defaults to `align-items:
        // stretch`, which was forcing this pill (an inline-sized badge) to
        // stretch to the card's full width instead of hugging its own text —
        // the bug reported from a live "Created Status" entry. Scoped to
        // just the pill (not the container) so the plain-text branch below
        // keeps its full-width wrapping behavior for long values.
        <VersionHistoryStatusPill status={value} className="self-start" />
      ) : (
        <p className="text-base font-semibold wrap-break-word text-[#0f172a]">
          {formatChangeValue(value)}
        </p>
      )}
    </div>
  );
}

function ChangeBody({
  change,
}: Readonly<{ change: VacancyVersionHistoryChange }>) {
  const { t } = useTranslation('ats');
  const variant = resolveChangeVariant(change.changeType);

  if (change.changeType === 'STATUS_CHANGED') {
    return (
      <InlineDiffRow
        label={t('versionHistory.changeTypes.statusUpdated')}
        strikeBefore={false}
        before={
          <VersionHistoryStatusPill
            status={getSingleScalar(change.oldValue) ?? ''}
          />
        }
        after={
          <VersionHistoryStatusPill
            status={getSingleScalar(change.newValue) ?? ''}
          />
        }
      />
    );
  }

  if (change.changeType === 'VACANCY_CREATED') {
    return <CreatedChange change={change} />;
  }

  // A removal describes what went away, so its values live on oldValue;
  // additions and updates describe the resulting state on newValue.
  const values = variant === 'removed' ? change.oldValue : change.newValue;
  if (shouldRenderAsGrid(values)) {
    return (
      <MultiValueChange change={change} variant={variant} values={values} />
    );
  }

  const rawBefore = getSingleScalar(change.oldValue);
  const rawAfter = getSingleScalar(change.newValue);
  const before = rawBefore === null ? null : formatChangeValue(rawBefore);
  const after = rawAfter === null ? null : formatChangeValue(rawAfter);

  // Vacancy-level scalar edits (title, schedule/expiration dates) get their
  // own sentence in Figma instead of the generic section header.
  const labelKey = resolveScalarChangeLabelKey(change);
  if (labelKey && before !== null && after !== null) {
    return (
      <InlineDiffRow
        label={t(`versionHistory.changeTypes.${labelKey}`)}
        // Figma strikes the superseded schedule date but leaves the old
        // vacancy title un-struck (node 4229:229271).
        strikeBefore={labelKey !== 'titleChanged'}
        before={before}
        after={after}
      />
    );
  }

  const rawValue = getSingleScalar(values);
  return (
    <ScalarChange
      change={change}
      variant={variant}
      before={before}
      after={after}
      value={rawValue === null ? null : formatChangeValue(rawValue)}
    />
  );
}

/**
 * One Activity Log entry: a 52px avatar plus the actor's name and a
 * dot-separated date/time, then the change itself on a light card. Mirrors
 * renderChange/renderEntry in utils/version-history-pdf.ts so the on-screen
 * view and the downloaded PDF read as the same design in two mediums.
 */
export default function VersionHistoryChangeEntry({
  entry,
}: Readonly<VersionHistoryChangeEntryProps>) {
  const { t } = useTranslation('ats');
  const { change, attribution, isSystem, updatedAt, profilePicture } = entry;
  const displayName = isSystem ? t('versionHistory.systemLabel') : attribution;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Avatar
          className={cn(
            'size-13 shrink-0',
            isSystem ? 'bg-[#f1f5f9]' : 'bg-[#0f172a]'
          )}
        >
          {!isSystem && profilePicture && (
            <AvatarImage src={profilePicture} alt="" />
          )}
          <AvatarFallback className="bg-transparent text-base font-bold text-white">
            {isSystem ? (
              <Monitor className="size-6 text-[#475569]" strokeWidth={1.75} />
            ) : (
              displayName.slice(0, 1).toUpperCase()
            )}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col">
          <p className="truncate text-base font-bold text-[#1e293b]">
            {displayName}
          </p>
          <div className="flex items-center gap-2 text-sm font-semibold text-[#475569]">
            <span>{formatIsoDateForDisplay(updatedAt)}</span>
            {/* Figma separates the date and time with a 6px vector dot, not a
                bullet character (node 4229:229245). */}
            <span aria-hidden className="size-1.5 rounded-full bg-current" />
            <span>{formatIsoTimeForDisplay(updatedAt)}</span>
          </div>
        </div>
      </div>
      {/* Figma insets card content by 28px (node 4229:229311). */}
      <div className="rounded-lg border border-[#e5e5e5] bg-[#f8fafc] p-7">
        <ChangeBody change={change} />
      </div>
    </div>
  );
}
