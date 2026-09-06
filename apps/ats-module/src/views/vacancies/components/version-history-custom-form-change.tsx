import {
  ArrowRight,
  I3Square,
  ToggleOffCircle,
  ToggleOnCircle,
} from 'iconsax-reactjs';

import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import VersionHistoryToggleSwitch from '@/views/vacancies/components/version-history-toggle-switch';
import VersionHistoryValueBoxGrid from '@/views/vacancies/components/version-history-value-box-grid';
import { QUESTION_TYPE_LABEL_KEYS } from '@/views/vacancies/components/view-vacancy/vacancy-customizable-form-section';
import type {
  CustomFormChangeSummary,
  CustomFormLinearScaleRow,
  CustomFormOptionGroup,
  CustomFormQuestionCardData,
} from '@/views/vacancies/types';
import { pluralizeFieldName } from '@/views/vacancies/utils';

import { cn } from '@cgp/ui-kit/lib/utils';

const CF = 'versionHistory.changeTypes.customForm';
const META_ICON_SIZE = 20;
const META_ICON_COLOR = '#475569';
// Same size as the arrow every other version-history diff already uses
// (VersionHistoryScalarDiff's lucide ArrowRight, size-4 = 16px) — only the
// icon library changes, and only within these Customizable Forms cards;
// VersionHistoryScalarDiff itself (used by the unrelated generic
// vacancy-field diff) is left untouched.
const ARROW_ICON_SIZE = 24;
const ARROW_ICON_COLOR = '#075056';

const ADDED_TEXT_CLASS = 'text-[#047857]';
const REMOVED_TEXT_CLASS = 'text-[#be123c]';
const ADDED_BORDER_CLASS = 'border-[#059669]';
const REMOVED_BORDER_CLASS = 'border-[#be123c]';

/** A small muted-slate bullet separating two pieces of meta text on one line
 * — the same dot VersionHistoryChangeEntry uses between a date and a time. */
function MetaDot() {
  return (
    <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-current" />
  );
}

/**
 * "Form Name - {formTitle} [│ Question - {questionText}] │ {changeLabel}" —
 * every Customizable Forms card's header except Forms Added/Removed (which
 * has no "Form Name -" prefix at all, see the `formsAdded`/`formsRemoved`
 * case below). Mirrors the divider pattern VersionHistoryChangeSummary uses
 * for the generic "Section Name - X │ ..." header.
 */
function CustomFormHeader({
  formTitle,
  questionText,
  changeLabel,
  changeLabelDetail,
  isRemoved,
}: Readonly<{
  formTitle: string;
  questionText?: string;
  changeLabel: string;
  // Set only for a "Removed {count} {noun}" label (Figma nodes 9553:305660 /
  // 4229:229937): just the "Removed" verb is red, the count+noun stays the
  // header's default slate — unlike every other (added/updated) label,
  // which is colored in full. Omitted, `changeLabel` alone is colored.
  changeLabelDetail?: string;
  isRemoved: boolean;
}>) {
  const { t } = useTranslation('ats');

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm leading-5 text-[#334155]">
      <span className="wrap-break-word">
        <span className="font-semibold">{t(`${CF}.formNameLabel`)}</span>
        <span className="font-bold">{formTitle}</span>
      </span>
      {questionText && (
        <>
          <span aria-hidden className="h-4 w-px shrink-0 bg-[#64748b]" />
          <span className="wrap-break-word">
            <span className="font-semibold">{t(`${CF}.questionLabel`)}</span>
            <span className="font-bold">{questionText}</span>
          </span>
        </>
      )}
      <span aria-hidden className="h-4 w-px shrink-0 bg-[#64748b]" />
      <span>
        <span
          className={cn(
            'font-bold',
            isRemoved ? REMOVED_TEXT_CLASS : ADDED_TEXT_CLASS
          )}
        >
          {changeLabel}
        </span>
        {changeLabelDetail && (
          <span className="font-bold">{` ${changeLabelDetail}`}</span>
        )}
      </span>
    </div>
  );
}

/** One question box for Question Added/Removed (Figma nodes 4229:229761 /
 * 9553:305660) — question text plus a "Type • {label}" / "Required • Yes|No"
 * meta row, each piece omitted when its source value is null (the API sends
 * questionType/required as null for removed questions). */
function QuestionCard({
  question,
  isRemoved,
}: Readonly<{ question: CustomFormQuestionCardData; isRemoved: boolean }>) {
  const { t } = useTranslation('ats');
  const typeLabelKey = question.questionType
    ? QUESTION_TYPE_LABEL_KEYS[
        question.questionType as keyof typeof QUESTION_TYPE_LABEL_KEYS
      ]
    : undefined;
  const hasMetaRow = Boolean(typeLabelKey) || question.required !== null;

  return (
    <div
      className={cn(
        'rounded-lg border bg-white p-7',
        isRemoved ? REMOVED_BORDER_CLASS : ADDED_BORDER_CLASS
      )}
    >
      <p
        className={cn(
          'text-base font-bold wrap-break-word',
          isRemoved ? REMOVED_TEXT_CLASS : ADDED_TEXT_CLASS
        )}
      >
        {question.text}
      </p>
      {hasMetaRow && (
        <div className="mt-1 flex flex-wrap items-center gap-3 text-sm font-medium text-[#475569]">
          {typeLabelKey && (
            <span className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <I3Square
                  variant="Bold"
                  size={META_ICON_SIZE}
                  color={META_ICON_COLOR}
                />
                {t(`${CF}.typeMetaLabel`)}
              </span>
              <span className="flex items-center gap-2">
                <MetaDot />
                {t(typeLabelKey)}
              </span>
            </span>
          )}
          {question.required !== null && (
            <span className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                {question.required ? (
                  <ToggleOnCircle
                    variant="Bold"
                    size={META_ICON_SIZE}
                    color={META_ICON_COLOR}
                  />
                ) : (
                  <ToggleOffCircle
                    variant="Bold"
                    size={META_ICON_SIZE}
                    color={META_ICON_COLOR}
                  />
                )}
                {t(`${CF}.requiredMetaLabel`)}
              </span>
              <span className="flex items-center gap-2">
                <MetaDot />
                {t(question.required ? `${CF}.yes` : `${CF}.no`)}
              </span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/** One "New Options Added" / "Removed N Options" block for a single question
 * (Figma nodes 4229:229858 / 4229:229937) — Options Added/Removed can carry
 * several such blocks when a save touches more than one question. */
function OptionGroupBlock({
  group,
  formTitle,
  isRemoved,
}: Readonly<{
  group: CustomFormOptionGroup;
  formTitle: string;
  isRemoved: boolean;
}>) {
  const { t } = useTranslation('ats');
  const optionCount = group.options.length;

  return (
    <div className="flex flex-col gap-4">
      <CustomFormHeader
        formTitle={formTitle}
        questionText={group.questionText}
        changeLabel={
          isRemoved
            ? t('versionHistory.changeTypes.verbs.removed')
            : t(`${CF}.newOptionAdded`, { count: optionCount })
        }
        changeLabelDetail={
          isRemoved
            ? t('versionHistory.changeTypes.details.removedItems', {
                count: optionCount,
                field: pluralizeFieldName(
                  t(`${CF}.optionFieldLabel`),
                  optionCount
                ),
              })
            : undefined
        }
        isRemoved={isRemoved}
      />
      <VersionHistoryValueBoxGrid
        items={group.options.map(option => ({ title: option }))}
        variant={isRemoved ? 'removed' : 'added'}
      />
    </div>
  );
}

/** One stacked before/after row inside a "Linear Scale Updated" card (Figma
 * node 4229:230027) — visually the same box-pair-plus-arrow as
 * VersionHistoryScalarDiff, but with its own "{field} - Previous"/"- Updated"
 * caption order, which doesn't match that component's "Previous {field}"
 * template, so it's kept as its own small bit rather than forced to share
 * one abstraction. */
function LinearScaleRow({ row }: Readonly<{ row: CustomFormLinearScaleRow }>) {
  const { t } = useTranslation('ats');
  const fieldLabel = t(`${CF}.linearScaleFields.${row.field}`);

  return (
    <div className="flex items-stretch gap-5">
      <div className="min-w-0 flex-1 rounded-lg border border-[#d4d4d4] bg-white p-7">
        <p className="text-base font-bold wrap-break-word text-[#0f172a]">
          {row.before}
        </p>
        <p className="mt-1 text-sm font-medium text-[#475569]">
          {t(`${CF}.linearScaleFieldPrevious`, { field: fieldLabel })}
        </p>
      </div>
      <ArrowRight
        className="self-center"
        variant="Linear"
        size={ARROW_ICON_SIZE}
        color={ARROW_ICON_COLOR}
      />
      <div className="min-w-0 flex-1 rounded-lg border border-[#059669] bg-white p-7">
        <p className="text-base font-bold wrap-break-word text-[#047857]">
          {row.after}
        </p>
        <p className="mt-1 text-sm font-medium text-[#475569]">
          {t(`${CF}.linearScaleFieldUpdated`, { field: fieldLabel })}
        </p>
      </div>
    </div>
  );
}

/**
 * Customizable-Forms-only counterpart to VersionHistoryScalarDiff — same
 * two-box-plus-arrow layout and "Previous {field}"/"Updated {field}"
 * captions, but with iconsax's ArrowRight instead of lucide's, per explicit
 * request scoped to these cards only. Kept as its own component (rather
 * than adding an icon-override prop to the shared one) so the generic,
 * already-shipped vacancy-field scalar diff is untouched.
 */
function CustomFormScalarDiff({
  field,
  before,
  after,
}: Readonly<{ field: string; before: ReactNode; after: ReactNode }>) {
  const { t } = useTranslation('ats');

  return (
    <div className="flex items-stretch gap-5">
      <div className="min-w-0 flex-1 rounded-lg border border-[#d4d4d4] bg-white p-7">
        <p className="text-base font-bold wrap-break-word text-[#0f172a]">
          {before}
        </p>
        <p className="mt-1 text-sm font-medium text-[#475569]">
          {t('versionHistory.changeTypes.previousValue', { field })}
        </p>
      </div>
      <ArrowRight
        className="self-center"
        variant="Linear"
        size={ARROW_ICON_SIZE}
        color={ARROW_ICON_COLOR}
      />
      <div className="min-w-0 flex-1 rounded-lg border border-[#059669] bg-white p-7">
        <p className="text-base font-bold wrap-break-word text-[#047857]">
          {after}
        </p>
        <p className="mt-1 text-sm font-medium text-[#475569]">
          {t('versionHistory.changeTypes.updatedValue', { field })}
        </p>
      </div>
    </div>
  );
}

/** SHORT_ANSWER etc. -> the app's own established label ("Short Answer"),
 * reusing the exact enum-to-i18n-key map the form builder itself uses
 * (QUESTION_TYPE_LABEL_KEYS) rather than a second, possibly-drifting copy —
 * falls back to the raw value for a type the map doesn't recognize. */
function useQuestionTypeLabel() {
  const { t } = useTranslation('ats');
  return (value: string): string => {
    const key =
      QUESTION_TYPE_LABEL_KEYS[value as keyof typeof QUESTION_TYPE_LABEL_KEYS];
    return key ? t(key) : value;
  };
}

/**
 * Dispatches a "Customizable Forms" version-history card by
 * `summary.kind` — built by buildCustomFormChangeSummary() in
 * version-history-helpers.ts (DQCGP-2235). Composes the existing generic
 * primitives (VersionHistoryValueBoxGrid / VersionHistoryScalarDiff /
 * VersionHistoryToggleSwitch) rather than one-off markup per case.
 */
export default function VersionHistoryCustomFormChange({
  summary,
}: Readonly<{ summary: CustomFormChangeSummary }>) {
  const { t } = useTranslation('ats');
  const questionTypeLabel = useQuestionTypeLabel();

  switch (summary.kind) {
    case 'formsAdded':
    case 'formsRemoved': {
      const isRemoved = summary.kind === 'formsRemoved';
      const count = summary.forms.length;
      const field = pluralizeFieldName(t(`${CF}.formLabel`), count);
      const verb = t(
        `versionHistory.changeTypes.verbs.${isRemoved ? 'removed' : 'added'}`
      );
      const detail = t(
        `versionHistory.changeTypes.details.${isRemoved ? 'removedItems' : 'addedItems'}`,
        { count, field }
      );
      return (
        <div className="flex flex-col gap-4">
          <p className="text-sm font-bold text-[#334155]">
            <span className={isRemoved ? REMOVED_TEXT_CLASS : ADDED_TEXT_CLASS}>
              {verb}
            </span>{' '}
            {detail}
          </p>
          <VersionHistoryValueBoxGrid
            items={summary.forms.map(form => ({
              title: form.formTitle,
              subtitle: t(`${CF}.questionCount`, {
                count: form.questionCount,
              }),
            }))}
            variant={isRemoved ? 'removed' : 'added'}
          />
        </div>
      );
    }

    case 'questionsAdded':
    case 'questionsRemoved': {
      const isRemoved = summary.kind === 'questionsRemoved';
      const removedCount = summary.questions.length;
      return (
        <div className="flex flex-col gap-4">
          <CustomFormHeader
            formTitle={summary.formTitle}
            changeLabel={
              isRemoved
                ? t('versionHistory.changeTypes.verbs.removed')
                : t(`${CF}.questionAdded`)
            }
            changeLabelDetail={
              isRemoved
                ? t('versionHistory.changeTypes.details.removedItems', {
                    count: removedCount,
                    field: pluralizeFieldName(
                      t(`${CF}.questionFieldLabel`),
                      removedCount
                    ),
                  })
                : undefined
            }
            isRemoved={isRemoved}
          />
          <div className="flex flex-col gap-3">
            {summary.questions.map((question, index) => (
              <QuestionCard
                // No stable id exists; text + position distinguishes
                // questions in practice (two identically-worded questions
                // added in the same save is not a case the API needs to
                // disambiguate further than this).
                key={`${question.text}-${index}`}
                question={question}
                isRemoved={isRemoved}
              />
            ))}
          </div>
        </div>
      );
    }

    case 'questionTextUpdated':
      return (
        <div className="flex flex-col gap-4">
          <CustomFormHeader
            formTitle={summary.formTitle}
            changeLabel={t(`${CF}.questionTextUpdated`)}
            isRemoved={false}
          />
          <CustomFormScalarDiff
            field={t(`${CF}.questionTextFieldLabel`)}
            before={summary.before}
            after={summary.after}
          />
        </div>
      );

    case 'questionTypeUpdated':
      return (
        <div className="flex flex-col gap-4">
          <CustomFormHeader
            formTitle={summary.formTitle}
            questionText={summary.questionText}
            changeLabel={t(`${CF}.questionTypeUpdated`)}
            isRemoved={false}
          />
          <CustomFormScalarDiff
            field={t(`${CF}.questionTypeFieldLabel`)}
            before={questionTypeLabel(summary.before)}
            after={questionTypeLabel(summary.after)}
          />
        </div>
      );

    case 'optionsAdded':
    case 'optionsRemoved': {
      const isRemoved = summary.kind === 'optionsRemoved';
      return (
        <div className="flex flex-col gap-6">
          {summary.groups.map((group, index) => (
            <OptionGroupBlock
              key={`${group.questionText}-${index}`}
              group={group}
              formTitle={summary.formTitle}
              isRemoved={isRemoved}
            />
          ))}
        </div>
      );
    }

    case 'optionValueUpdated':
      return (
        <div className="flex flex-col gap-6">
          {summary.groups.map((group, index) => (
            <div
              key={`${group.questionText}-${index}`}
              className="flex flex-col gap-4"
            >
              <CustomFormHeader
                formTitle={summary.formTitle}
                questionText={group.questionText}
                changeLabel={t(`${CF}.optionValueUpdated`, {
                  count: group.rows.length,
                })}
                isRemoved={false}
              />
              <div className="flex flex-col gap-4">
                {group.rows.map((row, rowIndex) => (
                  <CustomFormScalarDiff
                    key={`${row.before}-${row.after}-${rowIndex}`}
                    field={t(`${CF}.optionValueFieldLabel`)}
                    before={row.before}
                    after={row.after}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      );

    case 'requiredToggleChanged':
      return (
        <div className="flex flex-col gap-4">
          <CustomFormHeader
            formTitle={summary.formTitle}
            questionText={summary.questionText}
            changeLabel={t(`${CF}.requiredToggleChanged`)}
            isRemoved={false}
          />
          <CustomFormScalarDiff
            field={t(`${CF}.requiredStatusToggleFieldLabel`)}
            before={
              <VersionHistoryToggleSwitch isOn={summary.before} size="md" />
            }
            after={
              <VersionHistoryToggleSwitch isOn={summary.after} size="md" />
            }
          />
        </div>
      );

    case 'linearScaleUpdated':
      return (
        <div className="flex flex-col gap-4">
          <CustomFormHeader
            formTitle={summary.formTitle}
            questionText={summary.questionText}
            changeLabel={t(`${CF}.linearScaleUpdated`)}
            isRemoved={false}
          />
          <div className="flex flex-col gap-4">
            {summary.rows.map(row => (
              <LinearScaleRow key={row.field} row={row} />
            ))}
          </div>
        </div>
      );

    default:
      return null;
  }
}
