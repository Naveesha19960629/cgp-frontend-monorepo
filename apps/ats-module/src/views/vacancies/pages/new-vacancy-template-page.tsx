import { ChevronLeft } from 'lucide-react';

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import {
  useCreateTemplateMutation,
  useNextTemplateNameQuery,
} from '@/views/vacancies/hooks';
import {
  TEMPLATE_NAME_MAX_LENGTH,
  TEMPLATE_SECTIONS,
  type TemplateSectionConfig,
} from '@/views/vacancies/templates/vacancy-template-config';
import {
  type TemplateFormState,
  createInitialTemplateFormState,
  hasAnySelection,
} from '@/views/vacancies/templates/vacancy-template-form';

import { ErrorToast, SuccessToast } from '@cgp/ui-kit/components/custom-toast';
import { Button } from '@cgp/ui-kit/components/ui/button';
import { Checkbox } from '@cgp/ui-kit/components/ui/checkbox';
import { Switch } from '@cgp/ui-kit/components/ui/switch';
import { cn, removeEmoji } from '@cgp/ui-kit/lib/utils';

const TEMPLATES_LIST_ROUTE = '/dashboard/ats/templates';

/** A single field label + enable/disable toggle. */
function FieldToggle({
  label,
  checked,
  disabled,
  onToggle,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onToggle: (value: boolean) => void;
}) {
  return (
    <div className={cn('flex items-start gap-3', disabled && 'opacity-50')}>
      <span className="min-w-0 flex-1 pt-0.5 text-sm leading-5 font-semibold wrap-break-word text-slate-500">
        {label}
      </span>
      <Switch
        size="lg"
        checked={checked}
        disabled={disabled}
        onCheckedChange={onToggle}
      />
    </div>
  );
}

/** One section card: title, "data from candidate" checkbox, and field toggles. */
function TemplateSectionCard({
  section,
  state,
  onToggleField,
  onToggleCandidateData,
}: {
  section: TemplateSectionConfig;
  state: TemplateFormState['sections'][string];
  onToggleField: (fieldCode: string, value: boolean) => void;
  onToggleCandidateData: (value: boolean) => void;
}) {
  const { t } = useTranslation('ats');
  const checkboxId = `data-from-candidate-${section.key}`;

  return (
    <section className="rounded-xl border border-[#d4d4d4] bg-white px-5 py-5 shadow-[0px_4px_20px_0px_rgba(0,0,0,0.07)]">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-xl leading-6 font-bold tracking-[-0.1px] text-slate-900">
          {t(section.titleKey)}
        </h3>
        <label
          htmlFor={checkboxId}
          className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-500"
        >
          <Checkbox
            id={checkboxId}
            checked={state.dataTakenFromCandidate}
            onCheckedChange={value => onToggleCandidateData(value === true)}
          />
          <span>{t('createTemplate.dataFromCandidate')}</span>
        </label>
      </div>

      {/* When "data taken from candidate" is selected the fields stay visible
          but are toggled off and disabled (mirrors the create-vacancy
          behaviour). */}
      <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
        {section.fields.map(field => (
          <FieldToggle
            key={field.code}
            label={t(field.labelKey)}
            checked={
              state.dataTakenFromCandidate
                ? false
                : (state.fields[field.code] ?? false)
            }
            disabled={state.dataTakenFromCandidate}
            onToggle={value => onToggleField(field.code, value)}
          />
        ))}
      </div>
    </section>
  );
}

export default function NewVacancyTemplatePage() {
  const { t } = useTranslation('ats');
  const navigate = useNavigate();

  const [form, setForm] = useState<TemplateFormState>(() =>
    createInitialTemplateFormState()
  );
  // `null` until the recruiter edits the field — the auto-generated name is
  // used as the display value up to that point.
  const [nameOverride, setNameOverride] = useState<string | null>(null);
  const [nameError, setNameError] = useState('');

  const { data: nextNameResponse } = useNextTemplateNameQuery();
  const createTemplate = useCreateTemplateMutation();

  const autoName = nextNameResponse?.data?.templateName ?? '';
  const refNumber = nextNameResponse?.data?.refNumber ?? '';
  const templateName = nameOverride ?? autoName;

  const canCreate = useMemo(
    () =>
      templateName.trim().length > 0 &&
      templateName.length <= TEMPLATE_NAME_MAX_LENGTH &&
      hasAnySelection(form),
    [templateName, form]
  );

  // The field is not capped — the recruiter can type past the limit and an
  // inline error is shown (mirrors the Customizable Form section-title field).
  const handleNameChange = (value: string) => {
    const sanitized = removeEmoji(value);
    setNameOverride(sanitized);
    if (sanitized.length > TEMPLATE_NAME_MAX_LENGTH) {
      setNameError(
        t('createTemplate.nameMaxLength', { max: TEMPLATE_NAME_MAX_LENGTH })
      );
    } else {
      setNameError('');
    }
  };

  const handleToggleField = (
    sectionKey: string,
    fieldCode: string,
    value: boolean
  ) => {
    setForm(prev => ({
      ...prev,
      sections: {
        ...prev.sections,
        [sectionKey]: {
          ...prev.sections[sectionKey],
          fields: { ...prev.sections[sectionKey].fields, [fieldCode]: value },
        },
      },
    }));
  };

  // Selecting the checkbox turns every field toggle in the section off.
  const handleToggleCandidateData = (sectionKey: string, value: boolean) => {
    setForm(prev => {
      const section = prev.sections[sectionKey];
      const fields = value
        ? Object.fromEntries(
            Object.keys(section.fields).map(code => [code, false])
          )
        : section.fields;
      return {
        ...prev,
        sections: {
          ...prev.sections,
          [sectionKey]: { dataTakenFromCandidate: value, fields },
        },
      };
    });
  };

  const handleCancel = () => {
    void navigate(TEMPLATES_LIST_ROUTE);
  };

  const handleCreate = () => {
    const trimmed = templateName.trim();
    if (!trimmed) {
      setNameError(t('createTemplate.nameRequired'));
      return;
    }
    if (trimmed.length > TEMPLATE_NAME_MAX_LENGTH) {
      setNameError(
        t('createTemplate.nameMaxLength', { max: TEMPLATE_NAME_MAX_LENGTH })
      );
      return;
    }

    createTemplate.mutate(
      { state: form, templateName, refNumber },
      {
        onSuccess: () => {
          SuccessToast({
            title: t('createTemplate.notifications.success.title'),
            description: t('createTemplate.notifications.success.message'),
          });
          void navigate(TEMPLATES_LIST_ROUTE);
        },
        onError: () => {
          ErrorToast({
            title: t('createTemplate.notifications.error.title'),
            description: t('createTemplate.notifications.error.message'),
          });
        },
      }
    );
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Header — only the back arrow navigates; the title is plain text. */}
      <header className="flex items-center justify-between px-7 pt-6">
        <div className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900">
          <button
            type="button"
            aria-label={t('common.back')}
            onClick={handleCancel}
            className="flex cursor-pointer items-center rounded-md focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:outline-none"
          >
            <ChevronLeft className="size-6" />
          </button>
          <span>{t('createTemplate.heading')}</span>
        </div>
        {refNumber && (
          <span className="text-xs font-medium text-slate-400">
            {refNumber}
          </span>
        )}
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-7 pb-6">
        {/* Inline-editable template name, styled as the page heading. */}
        <div className="pt-10">
          <input
            id="template-name"
            type="text"
            className="w-full border-0 border-b border-slate-200 bg-transparent px-0 pb-3 text-[24px] leading-8 font-bold tracking-[-0.144px] text-slate-900 placeholder:text-slate-300 focus:border-slate-300 focus:ring-0 focus:outline-none"
            placeholder={t('createTemplate.namePlaceholder')}
            value={templateName}
            aria-label={t('createTemplate.nameLabel')}
            aria-invalid={nameError ? true : undefined}
            onChange={e => handleNameChange(e.target.value)}
          />
          {nameError && (
            <p className="mt-3 text-[13px] text-[#FF4A55]">{nameError}</p>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-6">
          {TEMPLATE_SECTIONS.map(section => (
            <TemplateSectionCard
              key={section.key}
              section={section}
              state={form.sections[section.key]}
              onToggleField={(fieldCode, value) =>
                handleToggleField(section.key, fieldCode, value)
              }
              onToggleCandidateData={value =>
                handleToggleCandidateData(section.key, value)
              }
            />
          ))}

          {/* Customizable Form — section-level toggle only, no fields. */}
          <section className="rounded-xl border border-[#d4d4d4] bg-white px-5 py-5 shadow-[0px_4px_20px_0px_rgba(0,0,0,0.07)]">
            <div className="flex items-center gap-4">
              <h3 className="text-xl leading-6 font-bold tracking-[-0.1px] text-slate-900">
                {t('createTemplate.sections.customizableForm')}
              </h3>
              <Switch
                size="lg"
                checked={form.customizableForm}
                onCheckedChange={value =>
                  setForm(prev => ({ ...prev, customizableForm: value }))
                }
              />
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="flex justify-end gap-4 border-t border-slate-200 px-7 py-4">
        <Button
          variant="secondary"
          className="h-12 w-44"
          onClick={handleCancel}
          disabled={createTemplate.isPending}
        >
          {t('createTemplate.cancel')}
        </Button>
        <Button
          className="h-12 w-44"
          onClick={handleCreate}
          disabled={!canCreate || createTemplate.isPending}
        >
          {t('createTemplate.create')}
        </Button>
      </footer>
    </section>
  );
}
