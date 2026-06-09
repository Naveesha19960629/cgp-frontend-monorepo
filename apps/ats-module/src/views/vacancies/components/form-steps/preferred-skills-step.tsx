import { Plus, X } from 'lucide-react';

import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useVacancyForm } from '@/views/vacancies/context/vacancy-form-context';
import {
  useCareerPathsQuery,
  useCreateCareerPathMutation,
  useCreateSkillCareerPathMutation,
  useDisableSuccessToast,
  useSkillsQuery,
} from '@/views/vacancies/hooks';
import { careerPathService, skillService } from '@/views/vacancies/services';
import type {
  CareerPathItem,
  SkillCareerPathEntry,
  StepProps,
} from '@/views/vacancies/types';

import { CharacterCount } from '@cgp/ui-kit/components/character-count';
import { Combobox } from '@cgp/ui-kit/components/combobox';
import MultipleSelector from '@cgp/ui-kit/components/multi-select';
import type {
  MultipleSelectorRef,
  Option,
} from '@cgp/ui-kit/components/multi-select';
import { Badge } from '@cgp/ui-kit/components/ui/badge';
import { Button } from '@cgp/ui-kit/components/ui/button';
import { Checkbox } from '@cgp/ui-kit/components/ui/checkbox';
import { cn } from '@cgp/ui-kit/lib/utils';

import DisableDialog from './disable-dialog';
import StepFooter from './step-footer';
import StepHeader from './step-header';

const MAX_SKILLS = 10;
const MAX_SKILL_CHARS = 100;
const MAX_CAREER_PATH_CHARS = 100;

const multiSelectInfoAvatar = new URL(
  '../../../../assets/images/multi-select-info-avatar.svg',
  import.meta.url
).href;

export default function PreferredSkillsStep({
  onNext,
  onBack,
}: Readonly<StepProps>) {
  const { t } = useTranslation('ats');
  const showDisableToast = useDisableSuccessToast();
  const { form } = useVacancyForm();

  const [isEnabled, setIsEnabled] = useState(
    form.preferredSkills?.isEnabled ?? false
  );
  const [dataTakenFromCandidate, setDataTakenFromCandidate] = useState(
    form.preferredSkills?.dataTakenFromCandidate ?? false
  );
  const [selectedSkills, setSelectedSkills] = useState<SkillCareerPathEntry[]>(
    form.preferredSkills?.skills ?? []
  );
  const [userCreatedSkillOptions, setUserCreatedSkillOptions] = useState<
    Option[]
  >(() =>
    (form.preferredSkills?.skills ?? [])
      .filter(s => s.source === 'USER_CREATED' || s.source === 'PENDING')
      .map(s => ({
        value: s.skillId || s.skillName,
        label: s.displayValue,
        source: s.source,
      }))
  );

  // Skill search state for the query
  const [skillSearch, setSkillSearch] = useState('');
  const [hasMaxError, setHasMaxError] = useState(false);
  const skillSelectorRef = useRef<MultipleSelectorRef>(null);

  // Career path popover
  const [pendingSkillName, setPendingSkillName] = useState('');
  const [pendingSkillId, setPendingSkillId] = useState('');
  const [careerPathSearch, setCareerPathSearch] = useState('');
  const [careerPathApiSearch, setCareerPathApiSearch] = useState('');
  const [careerPathError, setCareerPathError] = useState('');
  const [isCareerPathPopoverOpen, setIsCareerPathPopoverOpen] = useState(false);
  // Accumulates user-typed career paths within the current panel session
  const [userEnteredCareerPaths, setUserEnteredCareerPaths] = useState<
    CareerPathItem[]
  >([]);

  // Queries
  const { data: skillsData, isLoading: isSkillsLoading } =
    useSkillsQuery(skillSearch);
  const { data: careerPathsData, isLoading: isCareerPathsLoading } =
    useCareerPathsQuery(careerPathApiSearch);

  const apiSkills = skillsData?.data?.items?.content ?? [];
  const skillOptions = useMemo(() => {
    const apiOptions: Option[] = apiSkills.map(s => ({
      value: s.id,
      label: s.label,
      source: 'MASTER',
    }));

    const optionsByValue = new Map<string, Option>();
    apiOptions.forEach(option => optionsByValue.set(option.value, option));
    userCreatedSkillOptions.forEach(option =>
      optionsByValue.set(option.value, option)
    );

    return Array.from(optionsByValue.values());
  }, [apiSkills, userCreatedSkillOptions]);
  const apiCareerPaths: CareerPathItem[] =
    careerPathsData?.data?.items?.content ?? [];
  const { mutateAsync: createSkillCareerPath } =
    useCreateSkillCareerPathMutation();
  const { mutateAsync: createCareerPath } = useCreateCareerPathMutation();
  // Merge user-entered (first, so they appear at top) with API results, deduped
  const careerPaths: CareerPathItem[] = [
    ...userEnteredCareerPaths,
    ...apiCareerPaths.filter(
      cp =>
        !userEnteredCareerPaths.some(
          u => u.label.toLowerCase() === cp.label.toLowerCase()
        )
    ),
  ];

  const [confirmDisableOpen, setConfirmDisableOpen] = useState(false);
  const [emptyDisableOpen, setEmptyDisableOpen] = useState(false);

  // ── Skill selection via MultipleSelector ──────────────────────────────────

  const handleSkillsChange = (options: Option[]) => {
    // Find newly added option (present in options but not in selectedSkills)
    const existingValues = new Set(
      selectedSkills.map(s => s.skillId || s.skillName)
    );
    const newOption = options.find(
      opt => !existingValues.has(opt.value) && !existingValues.has(opt.label)
    );

    if (newOption && !newOption.source) {
      // User-created skill — open career path panel instead of adding directly
      setPendingSkillId('');
      setPendingSkillName(newOption.label);
      setCareerPathSearch('');
      setCareerPathError('');
      setIsCareerPathPopoverOpen(true);
      // Don't add to selectedSkills yet; it will be added via handleAddCareerPath
      return;
    }

    // For removals or API-sourced additions, sync back to selectedSkills
    const updatedSkills: SkillCareerPathEntry[] = options.map(opt => {
      // Check if already exists in selectedSkills
      const existing = selectedSkills.find(
        s =>
          s.skillId === opt.value ||
          s.skillName === opt.value ||
          s.displayValue === opt.label
      );
      if (existing) return existing;

      // New API selection
      const sepMatch = /\s[\u2013\u2014-]\s/.exec(opt.label);
      const skillName = sepMatch
        ? opt.label.slice(0, sepMatch.index)
        : opt.label;
      const careerPathName = sepMatch
        ? opt.label.slice(sepMatch.index + sepMatch[0].length)
        : '';
      return {
        skillId:
          opt.source === 'MASTER' || opt.source === 'PENDING' ? opt.value : '',
        skillName,
        careerPathId: undefined,
        careerPathName,
        displayValue: opt.label,
        source: typeof opt.source === 'string' ? opt.source : undefined,
      };
    });
    setSelectedSkills(updatedSkills);
  };

  // ── Career path ───────────────────────────────────────────────────────────

  const handleAddCareerPath = () => {
    if (!careerPathSearch.trim()) {
      setCareerPathError(t('preferredSkills.careerPath.validation.required'));
      return;
    }

    // Match only against API career paths (not user-entered ones with fake UUIDs)
    const matchedCareerPath = apiCareerPaths.find(
      cp => cp.label.toLowerCase() === careerPathSearch.trim().toLowerCase()
    );

    const entry: SkillCareerPathEntry = {
      skillId: pendingSkillId,
      skillName: pendingSkillName,
      careerPathId: matchedCareerPath?.id,
      careerPathName: careerPathSearch.trim(),
      displayValue: `${pendingSkillName} - ${careerPathSearch.trim()}`,
      source: 'USER_CREATED',
    };

    setUserCreatedSkillOptions(prev => {
      const value = entry.skillId || entry.skillName;
      const nextOption: Option = {
        value,
        label: entry.displayValue,
        source: entry.source,
      };
      return [...prev.filter(option => option.value !== value), nextOption];
    });
    setSelectedSkills(prev => [...prev, entry]);
    setIsCareerPathPopoverOpen(false);
    setPendingSkillName('');
    setPendingSkillId('');
    setCareerPathSearch('');
    setCareerPathApiSearch('');
    setCareerPathError('');
    setUserEnteredCareerPaths([]);
  };

  const handleCancelCareerPath = () => {
    setIsCareerPathPopoverOpen(false);
    setPendingSkillName('');
    setPendingSkillId('');
    setCareerPathSearch('');
    setCareerPathApiSearch('');
    setCareerPathError('');
    setUserEnteredCareerPaths([]);
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleNext = async () => {
    if (isEnabled && selectedSkills.length === 0 && !dataTakenFromCandidate) {
      setEmptyDisableOpen(true);
      return;
    }

    const hasUserCreated = selectedSkills.some(
      s => s.source === 'USER_CREATED'
    );

    let resolvedSkills = selectedSkills;
    if (hasUserCreated) {
      resolvedSkills = await Promise.all(
        selectedSkills.map(async entry => {
          if (entry.source !== 'USER_CREATED') return entry;

          try {
            // Step 1: If career path is new (no ID), POST it first
            let resolvedCareerPathId = entry.careerPathId;
            if (!resolvedCareerPathId && entry.careerPathName) {
              try {
                const cpResult = await createCareerPath(entry.careerPathName);
                resolvedCareerPathId = cpResult.pendingId;
              } catch (cpErr) {
                const cpAxiosErr = cpErr as {
                  response?: { data?: { code?: string } };
                };
                if (cpAxiosErr.response?.data?.code === 'MST-403') {
                  const cpSearch = await careerPathService.getAllCareerPaths(
                    entry.careerPathName
                  );
                  const existingCp = cpSearch.data.items.content.find(
                    item =>
                      item.label.toLowerCase() ===
                      entry.careerPathName.toLowerCase()
                  );
                  if (existingCp) {
                    resolvedCareerPathId = existingCp.id;
                  }
                } else {
                  throw cpErr;
                }
              }
            }

            // Step 2: POST the skill-career-path combination
            const result = await createSkillCareerPath({
              skillName: entry.skillName,
              careerPathName: entry.careerPathName,
            });
            return {
              ...entry,
              skillId: result.pendingId,
              careerPathId: resolvedCareerPathId,
              displayValue: result.value || entry.displayValue,
              source: 'PENDING',
            };
          } catch (err) {
            const axiosErr = err as {
              response?: { data?: { code?: string } };
            };
            if (axiosErr.response?.data?.code === 'MST-403') {
              const searchResult = await skillService.getAllSkills(
                entry.displayValue
              );
              const existing = searchResult.data.items.content.find(
                item =>
                  item.label.toLowerCase() === entry.displayValue.toLowerCase()
              );
              if (existing) {
                return {
                  ...entry,
                  skillId: existing.id,
                  source: 'MASTER',
                };
              }
            }
            throw err;
          }
        })
      );
      setSelectedSkills(resolvedSkills);
    }

    onNext({
      preferredSkills: {
        isEnabled,
        dataTakenFromCandidate,
        skills: resolvedSkills,
      },
    });
  };

  return (
    <div>
      {/* Header — sticky within the parent scroll container */}
      <StepHeader
        title={t('preferredSkills.title')}
        isEnabled={isEnabled}
        onBack={onBack}
        onToggle={() => {
          if (isEnabled) {
            if (selectedSkills.length > 0 || dataTakenFromCandidate) {
              setConfirmDisableOpen(true);
            } else {
              setIsEnabled(false);
            }
          } else {
            setIsEnabled(true);
          }
        }}
      />

      {/* Body — no overflow-y-auto; parent scroll container handles scrolling */}
      <div className="px-8 py-6">
        <div className={cn(!isEnabled && 'pointer-events-none opacity-60')}>
          {/* Checkbox */}
          <div className="mb-6 flex items-start gap-2">
            <Checkbox
              id="data-from-candidate"
              checked={dataTakenFromCandidate}
              onCheckedChange={checked =>
                setDataTakenFromCandidate(checked === true)
              }
              className="mt-0.5"
            />
            <label
              htmlFor="data-from-candidate"
              className="cursor-pointer text-sm text-slate-600"
            >
              {t('preferredSkills.dataTakenFromCandidate')}
            </label>
          </div>

          {/* Section: Tools, Technologies, Skills and Frameworks */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span
                className={cn(
                  'text-sm font-semibold text-slate-700',
                  hasMaxError && 'text-destructive'
                )}
              >
                {t('preferredSkills.sectionLabel')}
              </span>
              <CharacterCount
                maxLength={MAX_SKILL_CHARS}
                currentLength={skillSearch.length}
              />
            </div>

            <MultipleSelector
              ref={skillSelectorRef}
              value={selectedSkills.map(s => ({
                value: s.skillId || s.skillName,
                label: s.displayValue,
                source: s.source,
              }))}
              errorMessage={t('preferredSkills.validation.maxSkills', {
                max: MAX_SKILLS,
              })}
              onErrorStateChange={setHasMaxError}
              onChange={handleSkillsChange}
              options={skillOptions}
              onSearchSync={value => {
                setSkillSearch(value);
                return skillOptions;
              }}
              keepSelectedInList
              creatable
              triggerSearchOnFocus
              hideClearAllButton
              maxSelected={MAX_SKILLS}
              disabled={!isEnabled || dataTakenFromCandidate}
              inputProps={{ maxLength: MAX_SKILL_CHARS }}
              loading={isSkillsLoading}
              placeholder={t('preferredSkills.input.placeholder')}
              loadingIndicator={
                <p className="px-3 pb-3 text-left">{t('common.loading')}</p>
              }
              emptyIndicator={
                <div className="flex h-full flex-col content-start items-center pt-3 pb-6">
                  <div className="flex flex-col items-start">
                    <img src={multiSelectInfoAvatar} alt={t('common.noData')} />
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

            {/* Pending skill chip — shown while career path popover is open */}
            {pendingSkillName && isCareerPathPopoverOpen && (
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge
                  variant="chip"
                  className="animate-fadeIn flex cursor-default items-center gap-2 pe-2 text-sm font-semibold text-slate-600 shadow-sm"
                  style={{ borderColor: '#f59e0b', borderWidth: '1px' }}
                >
                  <span className="min-w-0 break-all capitalize">
                    {pendingSkillName}
                  </span>
                </Badge>
              </div>
            )}
          </div>

          {/* Career Path Panel — inline in content flow, appears after the skill chips */}
          {isCareerPathPopoverOpen && (
            <div
              className="mt-4 max-w-128.5 overflow-hidden rounded-2xl border border-slate-200 p-4 pb-5 shadow-2xl"
              style={{
                backgroundImage:
                  'linear-gradient(90deg, rgb(254,244,238) 24.671%, rgb(248,242,236) 37.979%, rgb(233,244,240) 99.173%, rgb(238,247,245) 166.77%)',
              }}
            >
              {/* Header row: title + close */}
              <div className="mb-4 flex items-start justify-between">
                <div className="flex flex-col gap-1.5 pr-8">
                  <h4 className="text-base font-semibold text-slate-900">
                    {t('preferredSkills.careerPath.title')}
                  </h4>
                  <p className="text-sm leading-snug text-slate-600">
                    {t('preferredSkills.careerPath.description')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCancelCareerPath}
                  className="flex size-8 items-center justify-center rounded text-slate-900 hover:bg-black/5"
                >
                  <X className="size-5 rotate-0" />
                </button>
              </div>

              {/* White card with Combobox */}
              <div className="mb-3 w-full rounded-xl bg-white p-3">
                <div className="flex items-center justify-between gap-1">
                  <label className="text-sm font-semibold text-slate-700">
                    {t('preferredSkills.careerPath.label')}{' '}
                    <span className="text-rose-500">*</span>
                  </label>
                  <CharacterCount
                    currentLength={
                      careerPathApiSearch.length || careerPathSearch.length || 0
                    }
                    maxLength={MAX_CAREER_PATH_CHARS}
                  />
                </div>

                <div className="mt-1">
                  <Combobox
                    modal={false}
                    options={careerPaths.map(cp => ({
                      label: cp.label,
                      value: cp.label,
                    }))}
                    value={careerPathSearch}
                    onValueChange={(value: string) => {
                      setCareerPathSearch(value);
                      setCareerPathError('');
                    }}
                    onSearchChange={setCareerPathApiSearch}
                    loading={isCareerPathsLoading}
                    onAddNew={(value: string) => {
                      const trimmedValue = value.trim();
                      const existing = careerPaths.find(
                        cp =>
                          cp.label.toLowerCase() === trimmedValue.toLowerCase()
                      );
                      if (existing) {
                        setCareerPathSearch(existing.label);
                        setCareerPathError('');
                        return;
                      }
                      const newCareerPath = {
                        id: crypto.randomUUID(),
                        label: trimmedValue,
                      };
                      setUserEnteredCareerPaths(prev => [
                        ...prev,
                        newCareerPath,
                      ]);
                      setCareerPathSearch(trimmedValue);
                      setCareerPathError('');
                    }}
                    placeholder={t(
                      'preferredSkills.careerPath.input.placeholder'
                    )}
                    className="h-11 border-slate-200 bg-white text-sm"
                    maxLength={MAX_CAREER_PATH_CHARS}
                    isError={!!careerPathError}
                  />
                </div>

                {careerPathError && (
                  <p className="mt-1 text-xs text-red-500">{careerPathError}</p>
                )}
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleAddCareerPath}
                  className="h-auto w-37.75 gap-1 rounded-lg bg-teal-800 px-8 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-900"
                >
                  <Plus className="size-5 stroke-2" />
                  {t('preferredSkills.careerPath.addButton')}
                </Button>
              </div>
            </div>
          )}

          {/* Bottom padding so dropdowns are never clipped by the scroll container edge */}
          <div className="h-64" />
        </div>
      </div>

      <DisableDialog
        open={confirmDisableOpen}
        onOpenChange={open => {
          if (!open) setConfirmDisableOpen(false);
        }}
        title={t('preferredSkills.confirmDisableDialog.title')}
        message={t('preferredSkills.confirmDisableDialog.message')}
        cancelLabel={t('preferredSkills.confirmDisableDialog.cancel')}
        disableLabel={t('preferredSkills.confirmDisableDialog.disable')}
        onCancel={() => setConfirmDisableOpen(false)}
        onDisable={() => {
          setSelectedSkills([]);
          setDataTakenFromCandidate(false);
          setIsEnabled(false);
          setConfirmDisableOpen(false);
          showDisableToast(t('preferredSkills.title'));
        }}
      />

      <DisableDialog
        open={emptyDisableOpen}
        onOpenChange={open => {
          if (!open) setEmptyDisableOpen(false);
        }}
        title={t('preferredSkills.emptyDisableDialog.title')}
        message={t('preferredSkills.emptyDisableDialog.message')}
        cancelLabel={t('preferredSkills.emptyDisableDialog.cancel')}
        disableLabel={t('preferredSkills.emptyDisableDialog.disable')}
        onCancel={() => setEmptyDisableOpen(false)}
        onDisable={() => {
          setIsEnabled(false);
          setEmptyDisableOpen(false);
          showDisableToast(t('preferredSkills.title'));
          onNext({
            preferredSkills: {
              isEnabled: false,
              dataTakenFromCandidate: false,
              skills: [],
            },
          });
        }}
      />

      {/* Footer — sticky at bottom of the parent scroll container */}
      <StepFooter onNext={() => void handleNext()} onCancel={onBack} />
    </div>
  );
}
