import { Loader2 } from 'lucide-react';

import { ArrowLeft2 } from 'iconsax-reactjs';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getApiErrorMessage } from '@/app/utils/api-error';
import MessageBox from '@/components/message-box';
import { useVacancyForm } from '@/views/vacancies/context/vacancy-form-context';
import {
  useAddCareerPathMutation,
  useAddDisciplineMutation,
  useAddJobTitleMutation,
  useAddRoleMutation,
  useCareerPathsQuery,
  useDisciplinesQuery,
  useEmploymentTypesQuery,
  useEngagementModelsQuery,
  useJobLevelsQuery,
  useJobTitlesQuery,
  useRolesQuery,
  useWorkSchedulesQuery,
} from '@/views/vacancies/hooks';
import { useJobRequirementsForm } from '@/views/vacancies/hooks/use-job-requirements-form';
import type {
  JobRequirementFormOption,
  StepProps,
} from '@/views/vacancies/types';
import { resolveUserCreatedOptions } from '@/views/vacancies/utils';

import { CharacterCount } from '@cgp/ui-kit/components/character-count';
import { Combobox } from '@cgp/ui-kit/components/combobox';
import { ErrorToast } from '@cgp/ui-kit/components/custom-toast';
import MultipleSelector from '@cgp/ui-kit/components/multi-select';
import type { Option } from '@cgp/ui-kit/components/multi-select';
import { Button } from '@cgp/ui-kit/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@cgp/ui-kit/components/ui/form';
import { Textarea } from '@cgp/ui-kit/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@cgp/ui-kit/components/ui/tooltip';

const MAX_CHAR = 100;
const MAX_DESCRIPTION = 2000;
const MAX_SELECTIONS = 10;
const dependencyTooltipClassName =
  'relative rounded-lg bg-slate-700 px-4 py-3 text-sm font-semibold text-white shadow-md [&>span:has([data-slot=tooltip-arrow])]:hidden after:absolute after:-bottom-1.5 after:left-8 after:size-3 after:rotate-45 after:bg-slate-700';

const multiSelectInfoAvatar = new URL(
  '../../../../assets/images/multi-select-info-avatar.svg',
  import.meta.url
).href;

export default function JobRequirementsStep({
  onNext,
  onBack,
}: Readonly<StepProps>) {
  const { t } = useTranslation('ats');
  const { onCancel } = useVacancyForm();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [disciplineSearch, setDisciplineSearch] = useState('');
  const [careerPathSearch, setCareerPathSearch] = useState('');
  const [roleSearch, setRoleSearch] = useState('');
  const [jobTitleSearch, setJobTitleSearch] = useState('');
  const [employmentTypeSearch, setEmploymentTypeSearch] = useState('');
  const [workScheduleSearch, setWorkScheduleSearch] = useState('');
  const [engagementModelSearch, setEngagementModelSearch] = useState('');

  const form = useJobRequirementsForm();

  const selectedDisciplines = form.watch('discipline');
  const selectedCareerPaths = form.watch('careerPath');
  const selectedLevels = form.watch('level');
  const description = form.watch('description') ?? '';

  const selectedDiscipline = selectedDisciplines[0];
  const selectedCareerPath = selectedCareerPaths[0];

  const isCareerPathDisabled = selectedDisciplines.length === 0;
  const isRoleDisabled =
    selectedCareerPaths.length === 0 || selectedLevels.length === 0;

  const roleDisabledMessage =
    selectedCareerPaths.length === 0 && selectedLevels.length === 0
      ? t('jobRequirements.dependencyHints.roleNeedCareerPathAndLevel')
      : selectedCareerPaths.length === 0
        ? t('jobRequirements.dependencyHints.roleNeedCareerPath')
        : t('jobRequirements.dependencyHints.roleNeedLevel');

  const maxSelectionError = t('jobRequirements.errors.maxSelections', {
    max: MAX_SELECTIONS,
  });

  const { data: disciplinesData, isLoading: isDisciplinesLoading } =
    useDisciplinesQuery(disciplineSearch);
  const disciplines = disciplinesData?.data?.items?.content ?? [];

  const { data: careerPathsData, isLoading: isCareerPathsLoading } =
    useCareerPathsQuery(
      careerPathSearch,
      selectedDiscipline?.value,
      !isCareerPathDisabled
    );
  const careerPaths = careerPathsData?.data?.items?.content ?? [];

  const { data: jobLevelsData, isLoading: isJobLevelsLoading } =
    useJobLevelsQuery();
  const jobLevels = jobLevelsData?.data ?? [];

  const selectedLevel = selectedLevels[0];

  const { data: rolesData, isLoading: isRolesLoading } = useRolesQuery(
    roleSearch,
    selectedCareerPath?.value,
    selectedLevel?.value,
    !isRoleDisabled
  );
  const roles = rolesData?.data?.items?.content ?? [];

  const { data: jobTitlesData, isLoading: isJobTitlesLoading } =
    useJobTitlesQuery(jobTitleSearch);
  const jobTitles = jobTitlesData?.data?.items?.content ?? [];

  const { data: employmentTypesData, isLoading: isEmploymentTypesLoading } =
    useEmploymentTypesQuery(employmentTypeSearch);
  const employmentTypes = employmentTypesData?.data?.items?.content ?? [];

  const { data: workSchedulesData, isLoading: isWorkSchedulesLoading } =
    useWorkSchedulesQuery(workScheduleSearch);
  const workSchedules = workSchedulesData?.data?.items?.content ?? [];

  const { data: engagementModelsData, isLoading: isEngagementModelsLoading } =
    useEngagementModelsQuery(engagementModelSearch);
  const engagementModels = engagementModelsData?.data?.items?.content ?? [];

  const addDisciplineMutation = useAddDisciplineMutation();
  const addCareerPathMutation = useAddCareerPathMutation();
  const addRoleMutation = useAddRoleMutation();
  const addJobTitleMutation = useAddJobTitleMutation();

  const toOption = (item: {
    id: string;
    label: string;
    source?: string;
  }): Option => ({
    value: item.id,
    label: item.label,
    source: item.source ?? 'MASTER',
  });

  const toFormOption = (opt: Option): JobRequirementFormOption => ({
    value: opt.value,
    label: opt.label,
    source: (opt.source as string) ?? 'USER_CREATED',
  });

  const toPayloadOptions = (options: JobRequirementFormOption[]) =>
    options.map(option => ({
      source: option.source,
      id: option.value,
      label: option.label,
    }));

  const handleCancel = () => {
    onCancel();
  };

  const handleSubmit = async () => {
    const data = form.getValues();

    const submitJobRequirements = (
      discipline: JobRequirementFormOption[],
      careerPath: JobRequirementFormOption[],
      role: JobRequirementFormOption[],
      jobTitle: JobRequirementFormOption[]
    ) => {
      onNext({
        jobRequirements: [
          {
            isEnabled: true,
            dataTakenFromCandidate: false,
            discipline: toPayloadOptions(discipline),
            careerPath: toPayloadOptions(careerPath),
            level: toPayloadOptions(data.level),
            role: toPayloadOptions(role),
            jobTitle: toPayloadOptions(jobTitle),
            employmentType: toPayloadOptions(data.employmentType),
            workSchedule: toPayloadOptions(data.workSchedule),
            engagementModel: toPayloadOptions(data.engagementModel),
            description: data.description,
          },
        ],
      });
    };

    const hasUserCreated = [
      ...data.discipline,
      ...data.careerPath,
      ...data.role,
      ...data.jobTitle,
    ].some(item => item.source === 'USER_CREATED');

    if (!hasUserCreated) {
      submitJobRequirements(
        data.discipline,
        data.careerPath,
        data.role,
        data.jobTitle
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const resolvedDiscipline = await resolveUserCreatedOptions(
        data.discipline,
        label => addDisciplineMutation.mutateAsync(label)
      );

      const resolvedCareerPath = await resolveUserCreatedOptions(
        data.careerPath,
        label =>
          addCareerPathMutation.mutateAsync({
            displayValue: label,
            discipline: resolvedDiscipline[0]
              ? {
                  id: resolvedDiscipline[0].value,
                  source: resolvedDiscipline[0].source,
                }
              : undefined,
          })
      );

      const resolvedRole = await resolveUserCreatedOptions(data.role, label =>
        addRoleMutation.mutateAsync({
          displayValue: label,
          careerPath: resolvedCareerPath[0]
            ? {
                id: resolvedCareerPath[0].value,
                source: resolvedCareerPath[0].source,
              }
            : undefined,
          level: data.level[0]
            ? {
                id: data.level[0].value,
                source: data.level[0].source,
              }
            : undefined,
        })
      );

      const resolvedJobTitle = await resolveUserCreatedOptions(
        data.jobTitle,
        label => addJobTitleMutation.mutateAsync(label)
      );

      form.setValue('discipline', resolvedDiscipline);
      form.setValue('careerPath', resolvedCareerPath);
      form.setValue('role', resolvedRole);
      form.setValue('jobTitle', resolvedJobTitle);

      submitJobRequirements(
        resolvedDiscipline,
        resolvedCareerPath,
        resolvedRole,
        resolvedJobTitle
      );
    } catch (err) {
      ErrorToast({
        title: t('common.errorTitle'),
        description: getApiErrorMessage(err),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
        div[data-radix-popper-content-wrapper] img[alt="common.noData"],
        div[data-radix-popper-content-wrapper] img[alt="No results found"] {
          content: url("${multiSelectInfoAvatar}") !important;
        }
      `}</style>
      <Form {...form}>
        <form
          onSubmit={e => {
            void form.handleSubmit(handleSubmit)(e);
          }}
          className="flex flex-col"
        >
          <MessageBox
            fields={[
              t('jobRequirements.alwaysCollectedFields.organization'),
              t('jobRequirements.alwaysCollectedFields.discipline'),
              t('jobRequirements.alwaysCollectedFields.careerPath'),
              t('jobRequirements.alwaysCollectedFields.role'),
              t('jobRequirements.alwaysCollectedFields.jobTitle'),
              t('jobRequirements.alwaysCollectedFields.employmentType'),
              t('jobRequirements.alwaysCollectedFields.workSchedule'),
              t('jobRequirements.alwaysCollectedFields.engagementModel'),
              t('jobRequirements.alwaysCollectedFields.startDate'),
              t('jobRequirements.alwaysCollectedFields.endDate'),
            ]}
          />

          <div className="flex items-center justify-between px-7 py-8">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onBack}
                className="text-slate-700 transition-colors hover:text-slate-900"
                aria-label={t('common.back')}
              >
                <ArrowLeft2 size={24} />
              </button>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                {t('jobRequirements.sectionTitle')}
              </h2>
            </div>
          </div>

          <div className="flex flex-col gap-5 px-7 pb-6">
            <div className="grid grid-cols-3 gap-x-5">
              <FormField
                control={form.control}
                name="discipline"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-1 space-y-0">
                    <FormLabel className="flex justify-between">
                      <span>
                        {t('jobRequirements.discipline')}
                        <span className="text-destructive ml-0.5">*</span>
                      </span>
                      <CharacterCount
                        maxLength={MAX_CHAR}
                        currentLength={disciplineSearch.length}
                      />
                    </FormLabel>
                    <FormControl>
                      <Combobox
                        value={field.value[0]?.value}
                        options={[
                          ...disciplines.map(item => ({
                            value: item.id,
                            label: item.label,
                          })),
                          ...field.value
                            .filter(
                              item =>
                                !disciplines.some(
                                  master => master.id === item.value
                                )
                            )
                            .map(item => ({
                              value: item.value,
                              label: item.label,
                            })),
                        ]}
                        onValueChange={value => {
                          const master = disciplines.find(
                            item => item.id === value
                          );
                          const existing = field.value[0];
                          const label =
                            master?.label ??
                            (existing?.value === value
                              ? existing.label
                              : value);

                          field.onChange([
                            {
                              value,
                              label,
                              source:
                                master?.source ??
                                (existing?.value === value
                                  ? existing.source
                                  : 'MASTER'),
                            },
                          ]);

                          form.setValue('careerPath', []);
                          form.setValue('role', []);
                        }}
                        onAddNew={label => {
                          field.onChange([
                            {
                              value: label,
                              label,
                              source: 'USER_CREATED',
                            },
                          ]);
                          form.setValue('careerPath', []);
                          form.setValue('role', []);
                        }}
                        onSearchChange={value => setDisciplineSearch(value)}
                        loading={isDisciplinesLoading}
                        maxLength={MAX_CHAR}
                        placeholder={t('jobRequirements.disciplinePlaceholder')}
                        emptyMessage={t('jobRequirements.noData')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="careerPath"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-1 space-y-0">
                    {isCareerPathDisabled ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex flex-col gap-1">
                            <FormLabel className="flex justify-between">
                              <span>
                                {t('jobRequirements.careerPath')}
                                <span className="text-destructive ml-0.5">
                                  *
                                </span>
                              </span>
                              <CharacterCount
                                maxLength={MAX_CHAR}
                                currentLength={careerPathSearch.length}
                              />
                            </FormLabel>
                            <FormControl>
                              <Combobox
                                value={field.value[0]?.value}
                                options={[
                                  ...careerPaths.map(item => ({
                                    value: item.id,
                                    label: item.label,
                                  })),
                                  ...field.value
                                    .filter(
                                      item =>
                                        !careerPaths.some(
                                          master => master.id === item.value
                                        )
                                    )
                                    .map(item => ({
                                      value: item.value,
                                      label: item.label,
                                    })),
                                ]}
                                onValueChange={value => {
                                  const master = careerPaths.find(
                                    item => item.id === value
                                  );
                                  const existing = field.value[0];
                                  const label =
                                    master?.label ??
                                    (existing?.value === value
                                      ? existing.label
                                      : value);

                                  field.onChange([
                                    {
                                      value,
                                      label,
                                      source:
                                        master?.source ??
                                        (existing?.value === value
                                          ? existing.source
                                          : 'MASTER'),
                                    },
                                  ]);
                                  form.setValue('role', []);
                                }}
                                onAddNew={label => {
                                  field.onChange([
                                    {
                                      value: label,
                                      label,
                                      source: 'USER_CREATED',
                                    },
                                  ]);
                                  form.setValue('role', []);
                                }}
                                onSearchChange={value =>
                                  setCareerPathSearch(value)
                                }
                                disabled
                                loading={isCareerPathsLoading}
                                maxLength={MAX_CHAR}
                                placeholder={t(
                                  'jobRequirements.careerPathPlaceholder'
                                )}
                                emptyMessage={t('jobRequirements.noData')}
                              />
                            </FormControl>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          align="start"
                          sideOffset={10}
                          className={dependencyTooltipClassName}
                        >
                          {t(
                            'jobRequirements.dependencyHints.careerPathNeedDiscipline'
                          )}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <>
                        <FormLabel className="flex justify-between">
                          <span>
                            {t('jobRequirements.careerPath')}
                            <span className="text-destructive ml-0.5">*</span>
                          </span>
                          <CharacterCount
                            maxLength={MAX_CHAR}
                            currentLength={careerPathSearch.length}
                          />
                        </FormLabel>
                        <FormControl>
                          <Combobox
                            value={field.value[0]?.value}
                            options={[
                              ...careerPaths.map(item => ({
                                value: item.id,
                                label: item.label,
                              })),
                              ...field.value
                                .filter(
                                  item =>
                                    !careerPaths.some(
                                      master => master.id === item.value
                                    )
                                )
                                .map(item => ({
                                  value: item.value,
                                  label: item.label,
                                })),
                            ]}
                            onValueChange={value => {
                              const master = careerPaths.find(
                                item => item.id === value
                              );
                              const existing = field.value[0];
                              const label =
                                master?.label ??
                                (existing?.value === value
                                  ? existing.label
                                  : value);

                              field.onChange([
                                {
                                  value,
                                  label,
                                  source:
                                    master?.source ??
                                    (existing?.value === value
                                      ? existing.source
                                      : 'MASTER'),
                                },
                              ]);
                              form.setValue('role', []);
                            }}
                            onAddNew={label => {
                              field.onChange([
                                {
                                  value: label,
                                  label,
                                  source: 'USER_CREATED',
                                },
                              ]);
                              form.setValue('role', []);
                            }}
                            onSearchChange={value => setCareerPathSearch(value)}
                            loading={isCareerPathsLoading}
                            maxLength={MAX_CHAR}
                            placeholder={t(
                              'jobRequirements.careerPathPlaceholder'
                            )}
                            emptyMessage={
                              careerPaths.length === 0
                                ? t('jobRequirements.noAssociatedCareerPaths')
                                : t('jobRequirements.noData')
                            }
                          />
                        </FormControl>
                      </>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-1 space-y-0">
                    <FormLabel className="text-sm font-semibold text-slate-900">
                      {t('jobRequirements.level')}
                      <span className="text-destructive ml-0.5">*</span>
                    </FormLabel>
                    <FormControl>
                      <Combobox
                        value={field.value[0]?.value}
                        options={jobLevels.map(level => ({
                          value: level.id,
                          label: level.name,
                        }))}
                        onValueChange={value => {
                          const selected = jobLevels.find(
                            level => level.id === value
                          );
                          field.onChange(
                            selected
                              ? [
                                  {
                                    value: selected.id,
                                    label: selected.name,
                                    source: 'MASTER',
                                  },
                                ]
                              : []
                          );
                          form.setValue('role', []);
                        }}
                        onSearchChange={() => undefined}
                        addable={false}
                        hideAddNew
                        loading={isJobLevelsLoading}
                        placeholder={t('jobRequirements.levelPlaceholder')}
                        emptyMessage={t('jobRequirements.noData')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-x-5">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-1 space-y-0">
                    {isRoleDisabled ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex flex-col gap-1">
                            <FormLabel className="flex justify-between">
                              <span>
                                {t('jobRequirements.role')}
                                <span className="text-destructive ml-0.5">
                                  *
                                </span>
                              </span>
                              <CharacterCount
                                maxLength={MAX_CHAR}
                                currentLength={roleSearch.length}
                              />
                            </FormLabel>
                            <FormControl>
                              <MultipleSelector
                                value={field.value.map(role => ({
                                  value: role.value,
                                  label: role.label,
                                  source: role.source,
                                }))}
                                onChange={opts =>
                                  field.onChange(opts.map(toFormOption))
                                }
                                options={roles.map(toOption)}
                                onSearchSync={value => {
                                  setRoleSearch(value);
                                  return roles.map(toOption);
                                }}
                                errorMessage={maxSelectionError}
                                maxSelected={MAX_SELECTIONS}
                                keepSelectedInList
                                creatable
                                triggerSearchOnFocus
                                hideClearAllButton
                                disabled
                                loading={isRolesLoading}
                                inputProps={{ maxLength: MAX_CHAR }}
                                placeholder={t(
                                  'jobRequirements.rolePlaceholder'
                                )}
                                loadingIndicator={
                                  <p className="px-3 pb-3 text-left text-sm text-slate-500">
                                    {t('jobRequirements.loading')}
                                  </p>
                                }
                                emptyIndicator={
                                  <div className="flex h-full flex-col content-start items-center pt-3 pb-6">
                                    <div className="flex flex-col items-start">
                                      <img
                                        src={multiSelectInfoAvatar}
                                        alt={t('common.noData')}
                                      />
                                      <div className="mt-3 w-61 text-left">
                                        <p className="font-bold text-slate-900">
                                          {t('common.noDataTitle')}
                                        </p>
                                        <p className="text-sm font-semibold text-slate-700">
                                          {roles.length === 0
                                            ? t(
                                                'jobRequirements.noAssociatedRoles'
                                              )
                                            : t('common.noDataDescription')}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                }
                              />
                            </FormControl>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          align="start"
                          sideOffset={10}
                          className={dependencyTooltipClassName}
                        >
                          {roleDisabledMessage}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <>
                        <FormLabel className="flex justify-between">
                          <span>
                            {t('jobRequirements.role')}
                            <span className="text-destructive ml-0.5">*</span>
                          </span>
                          <CharacterCount
                            maxLength={MAX_CHAR}
                            currentLength={roleSearch.length}
                          />
                        </FormLabel>
                        <FormControl>
                          <MultipleSelector
                            value={field.value.map(role => ({
                              value: role.value,
                              label: role.label,
                              source: role.source,
                            }))}
                            onChange={opts =>
                              field.onChange(opts.map(toFormOption))
                            }
                            options={roles.map(toOption)}
                            onSearchSync={value => {
                              setRoleSearch(value);
                              return roles.map(toOption);
                            }}
                            errorMessage={maxSelectionError}
                            maxSelected={MAX_SELECTIONS}
                            keepSelectedInList
                            creatable
                            triggerSearchOnFocus
                            hideClearAllButton
                            loading={isRolesLoading}
                            inputProps={{ maxLength: MAX_CHAR }}
                            placeholder={t('jobRequirements.rolePlaceholder')}
                            loadingIndicator={
                              <p className="px-3 pb-3 text-left text-sm text-slate-500">
                                {t('jobRequirements.loading')}
                              </p>
                            }
                            emptyIndicator={
                              <div className="flex h-full flex-col content-start items-center pt-3 pb-6">
                                <div className="flex flex-col items-start">
                                  <img
                                    src={multiSelectInfoAvatar}
                                    alt={t('common.noData')}
                                  />
                                  <div className="mt-3 w-61 text-left">
                                    <p className="font-bold text-slate-900">
                                      {t('common.noDataTitle')}
                                    </p>
                                    <p className="text-sm font-semibold text-slate-700">
                                      {roles.length === 0
                                        ? t('jobRequirements.noAssociatedRoles')
                                        : t('common.noDataDescription')}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            }
                          />
                        </FormControl>
                      </>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="jobTitle"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-1 space-y-0">
                    <FormLabel className="flex justify-between">
                      <span>
                        {t('jobRequirements.jobTitle')}
                        <span className="text-destructive ml-0.5">*</span>
                      </span>
                      <CharacterCount
                        maxLength={MAX_CHAR}
                        currentLength={jobTitleSearch.length}
                      />
                    </FormLabel>
                    <FormControl>
                      <MultipleSelector
                        value={field.value.map(jobTitle => ({
                          value: jobTitle.value,
                          label: jobTitle.label,
                          source: jobTitle.source,
                        }))}
                        onChange={opts =>
                          field.onChange(opts.map(toFormOption))
                        }
                        options={jobTitles.map(toOption)}
                        onSearchSync={value => {
                          setJobTitleSearch(value);
                          return jobTitles.map(toOption);
                        }}
                        errorMessage={maxSelectionError}
                        maxSelected={MAX_SELECTIONS}
                        keepSelectedInList
                        creatable
                        triggerSearchOnFocus
                        hideClearAllButton
                        loading={isJobTitlesLoading}
                        inputProps={{ maxLength: MAX_CHAR }}
                        placeholder={t('jobRequirements.jobTitlePlaceholder')}
                        loadingIndicator={
                          <p className="px-3 pb-3 text-left text-sm text-slate-500">
                            {t('jobRequirements.loading')}
                          </p>
                        }
                        emptyIndicator={
                          <div className="flex h-full flex-col content-start items-center pt-3 pb-6">
                            <div className="flex flex-col items-start">
                              <img
                                src={multiSelectInfoAvatar}
                                alt={t('common.noData')}
                              />
                              <div className="mt-3 w-61 text-left">
                                <p className="font-bold text-slate-900">
                                  {t('common.noDataTitle')}
                                </p>
                                <p className="text-sm font-semibold text-slate-700">
                                  {t('common.noDataDescription')}
                                </p>
                              </div>
                            </div>
                          </div>
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-x-5">
              <FormField
                control={form.control}
                name="employmentType"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-1 space-y-0">
                    <FormLabel className="text-sm font-semibold text-slate-900">
                      {t('jobRequirements.employmentType')}
                    </FormLabel>
                    <FormControl>
                      <MultipleSelector
                        value={field.value.map(employmentType => ({
                          value: employmentType.value,
                          label: employmentType.label,
                          source: employmentType.source,
                        }))}
                        onChange={opts =>
                          field.onChange(opts.map(toFormOption))
                        }
                        options={employmentTypes.map(toOption)}
                        onSearchSync={value => {
                          setEmploymentTypeSearch(value);
                          return employmentTypes.map(toOption);
                        }}
                        errorMessage={maxSelectionError}
                        maxSelected={MAX_SELECTIONS}
                        keepSelectedInList
                        triggerSearchOnFocus
                        hideClearAllButton
                        loading={isEmploymentTypesLoading}
                        placeholder={t(
                          'jobRequirements.employmentTypePlaceholder'
                        )}
                        loadingIndicator={
                          <p className="px-3 pb-3 text-left text-sm text-slate-500">
                            {t('jobRequirements.loading')}
                          </p>
                        }
                        emptyIndicator={
                          <div className="flex h-full flex-col content-start items-center pt-3 pb-6">
                            <div className="flex flex-col items-start">
                              <img
                                src={multiSelectInfoAvatar}
                                alt={t('common.noData')}
                              />
                              <div className="mt-3 w-61 text-left">
                                <p className="font-bold text-slate-900">
                                  {t('common.noDataTitle')}
                                </p>
                                <p className="text-sm font-semibold text-slate-700">
                                  {t('common.noDataDescription')}
                                </p>
                              </div>
                            </div>
                          </div>
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="workSchedule"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-1 space-y-0">
                    <FormLabel className="text-sm font-semibold text-slate-900">
                      {t('jobRequirements.workSchedule')}
                    </FormLabel>
                    <FormControl>
                      <MultipleSelector
                        value={field.value.map(workSchedule => ({
                          value: workSchedule.value,
                          label: workSchedule.label,
                          source: workSchedule.source,
                        }))}
                        onChange={opts =>
                          field.onChange(opts.map(toFormOption))
                        }
                        options={workSchedules.map(toOption)}
                        onSearchSync={value => {
                          setWorkScheduleSearch(value);
                          return workSchedules.map(toOption);
                        }}
                        errorMessage={maxSelectionError}
                        maxSelected={MAX_SELECTIONS}
                        keepSelectedInList
                        triggerSearchOnFocus
                        hideClearAllButton
                        loading={isWorkSchedulesLoading}
                        placeholder={t(
                          'jobRequirements.workSchedulePlaceholder'
                        )}
                        loadingIndicator={
                          <p className="px-3 pb-3 text-left text-sm text-slate-500">
                            {t('jobRequirements.loading')}
                          </p>
                        }
                        emptyIndicator={
                          <div className="flex h-full flex-col content-start items-center pt-3 pb-6">
                            <div className="flex flex-col items-start">
                              <img
                                src={multiSelectInfoAvatar}
                                alt={t('common.noData')}
                              />
                              <div className="mt-3 w-61 text-left">
                                <p className="font-bold text-slate-900">
                                  {t('common.noDataTitle')}
                                </p>
                                <p className="text-sm font-semibold text-slate-700">
                                  {t('common.noDataDescription')}
                                </p>
                              </div>
                            </div>
                          </div>
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 items-start gap-x-5">
              <FormField
                control={form.control}
                name="engagementModel"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-1 space-y-0">
                    <FormLabel className="text-sm font-semibold text-slate-900">
                      {t('jobRequirements.engagementModel')}
                    </FormLabel>
                    <FormControl>
                      <MultipleSelector
                        value={field.value.map(engagementModel => ({
                          value: engagementModel.value,
                          label: engagementModel.label,
                          source: engagementModel.source,
                        }))}
                        onChange={opts =>
                          field.onChange(opts.map(toFormOption))
                        }
                        options={engagementModels.map(toOption)}
                        onSearchSync={value => {
                          setEngagementModelSearch(value);
                          return engagementModels.map(toOption);
                        }}
                        errorMessage={maxSelectionError}
                        maxSelected={MAX_SELECTIONS}
                        keepSelectedInList
                        triggerSearchOnFocus
                        hideClearAllButton
                        loading={isEngagementModelsLoading}
                        placeholder={t(
                          'jobRequirements.engagementModelPlaceholder'
                        )}
                        loadingIndicator={
                          <p className="px-3 pb-3 text-left text-sm text-slate-500">
                            {t('jobRequirements.loading')}
                          </p>
                        }
                        emptyIndicator={
                          <div className="flex h-full flex-col content-start items-center pt-3 pb-6">
                            <div className="flex flex-col items-start">
                              <img
                                src={multiSelectInfoAvatar}
                                alt={t('common.noData')}
                              />
                              <div className="mt-3 w-61 text-left">
                                <p className="font-bold text-slate-900">
                                  {t('common.noDataTitle')}
                                </p>
                                <p className="text-sm font-semibold text-slate-700">
                                  {t('common.noDataDescription')}
                                </p>
                              </div>
                            </div>
                          </div>
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-1 space-y-0">
                    <FormLabel className="flex justify-between">
                      <span>{t('jobRequirements.description')}</span>
                      <CharacterCount
                        maxLength={MAX_DESCRIPTION}
                        currentLength={description.length}
                      />
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={t(
                          'jobRequirements.descriptionPlaceholder'
                        )}
                        maxLength={MAX_DESCRIPTION}
                        className="min-h-32 resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="sticky bottom-0 flex items-center justify-end gap-4 bg-white px-6 py-7 shadow-[0px_-8px_6.8px_0px_rgba(0,0,0,0.04)]">
            <Button
              type="button"
              variant="secondary"
              className="h-12 w-48"
              onClick={handleCancel}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" className="h-12 w-48" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                t('common.next')
              )}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
