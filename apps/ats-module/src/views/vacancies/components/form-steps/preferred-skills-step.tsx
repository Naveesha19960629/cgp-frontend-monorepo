import { Plus, X } from 'lucide-react';

import { ArrowLeft2 } from 'iconsax-reactjs';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { StepDisableDialog } from '@/views/vacancies';
import VacancyStatusBadge from '@/views/vacancies/components/vacancy-status-badge';
import {
  useTemplateFieldVisible,
  useVacancyForm,
} from '@/views/vacancies/context/vacancy-form-context';
import {
  useCareerPathsQuery,
  useCreateCareerPathMutation,
  useCreateSkillCareerPathMutation,
  useDisableSuccessToast,
  useJobLevelsQuery,
  useSkillsQuery,
  useStepGuard,
} from '@/views/vacancies/hooks';
import { careerPathService, skillService } from '@/views/vacancies/services';
import type {
  CareerPathItem,
  JobLevelItem,
  SkillCareerPathEntry,
  StepProps,
} from '@/views/vacancies/types';

import { CharacterCount } from '@cgp/ui-kit/components/character-count';
import { Combobox } from '@cgp/ui-kit/components/combobox';
import { ErrorToast } from '@cgp/ui-kit/components/custom-toast';
import { Button } from '@cgp/ui-kit/components/ui/button';
import { Checkbox } from '@cgp/ui-kit/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@cgp/ui-kit/components/ui/select';
import { Switch } from '@cgp/ui-kit/components/ui/switch';
import { cn } from '@cgp/ui-kit/lib/utils';

const MAX_SKILLS = 10;
const MAX_SKILL_CHARS = 100;
const MAX_CAREER_PATH_CHARS = 100;

// Separator (en-dash / em-dash / hyphen) used in skill-career-path labels
// e.g. "Java - Software Engineering".
const SKILL_CAREER_PATH_SEPARATOR = /\s[–—-]\s/;

/** Per-row validation flags surfaced as inline errors. */
interface RowError {
  careerPath?: boolean;
  level?: boolean;
}

const createEmptyRow = (): SkillCareerPathEntry => ({
  skillId: '',
  skillName: '',
  careerPathId: undefined,
  careerPathName: '',
  displayValue: '',
  source: undefined,
  levelId: undefined,
  levelName: undefined,
});

const normalize = (value: string) => value.trim().toLowerCase();

/**
 * Levels already taken by *other* rows that share the same skill + career path
 * as the row at `index`. Those levels are frozen in this row's Level dropdown so
 * the same skill/career-path/level combination cannot be added twice.
 */
const usedLevelIdsFor = (
  rows: SkillCareerPathEntry[],
  index: number
): Set<string> => {
  const target = rows[index];
  const used = new Set<string>();
  if (!target?.skillName.trim()) return used;
  rows.forEach((r, i) => {
    if (i === index || !r.levelId) return;
    if (
      normalize(r.skillName) === normalize(target.skillName) &&
      normalize(r.careerPathName) === normalize(target.careerPathName)
    ) {
      used.add(r.levelId);
    }
  });
  return used;
};

// ── Single skill row ─────────────────────────────────────────────────────────

interface PreferredSkillRowProps {
  entry: SkillCareerPathEntry;
  index: number;
  isRemovable: boolean;
  disabled: boolean;
  error?: RowError;
  jobLevels: JobLevelItem[];
  isJobLevelsLoading: boolean;
  /** Level ids frozen for this row because they duplicate another row. */
  disabledLevelIds: Set<string>;
  onChange: (index: number, entry: SkillCareerPathEntry) => void;
  onRemove: (index: number) => void;
}

function PreferredSkillRow({
  entry,
  index,
  isRemovable,
  disabled,
  error,
  jobLevels,
  isJobLevelsLoading,
  disabledLevelIds,
  onChange,
  onRemove,
}: Readonly<PreferredSkillRowProps>) {
  const { t } = useTranslation('ats');

  const [skillSearch, setSkillSearch] = useState('');
  const [careerPathApiSearch, setCareerPathApiSearch] = useState('');
  // Career paths the user typed in this session (not yet persisted to the API).
  const [userEnteredCareerPaths, setUserEnteredCareerPaths] = useState<
    CareerPathItem[]
  >([]);

  const { data: skillsData, isLoading: isSkillsLoading } =
    useSkillsQuery(skillSearch);
  const { data: careerPathsData, isLoading: isCareerPathsLoading } =
    useCareerPathsQuery(careerPathApiSearch);

  const apiSkills = useMemo(
    () => skillsData?.data?.items?.content ?? [],
    [skillsData]
  );
  const apiCareerPaths: CareerPathItem[] =
    careerPathsData?.data?.items?.content ?? [];

  const skillValue = entry.skillId || entry.skillName;
  const skillOptions = useMemo(() => {
    // The dropdown lists the full "Skill - Career Path" labels; once a skill is
    // selected, only the skill name is shown in the closed field (via
    // `selectedLabel`), while the career path is surfaced in its own field.
    const opts = apiSkills.map(s => ({ value: s.id, label: s.label }));
    // Keep the currently-selected entry visible even if it isn't in the
    // latest search slice (e.g. user-created skills, or after re-search).
    if (skillValue && !opts.some(o => o.value === skillValue)) {
      opts.unshift({
        value: skillValue,
        label: entry.displayValue || entry.skillName,
      });
    }
    // Dedupe by label so a user-created combination that also already exists in
    // the master data isn't listed twice. The selected/synthetic option is
    // unshifted first, so it wins and keeps the check mark.
    const seen = new Set<string>();
    return opts.filter(o => {
      const key = normalize(o.label);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [apiSkills, skillValue, entry.displayValue, entry.skillName]);

  // If a user-created skill + career path turns out to already exist in the
  // master data (surfaced by the search), adopt the existing record so it is
  // reused — selecting it instead of POSTing a duplicate (rejected with 400).
  useEffect(() => {
    if (
      entry.skillId ||
      entry.source !== 'USER_CREATED' ||
      !entry.displayValue
    ) {
      return;
    }
    const match = apiSkills.find(
      s => normalize(s.label) === normalize(entry.displayValue)
    );
    if (match) {
      onChange(index, {
        ...entry,
        skillId: match.id,
        source: match.source ?? 'MASTER',
      });
    }
  }, [apiSkills, entry, index, onChange]);

  const careerPaths: CareerPathItem[] = [
    ...userEnteredCareerPaths,
    ...apiCareerPaths.filter(
      cp =>
        !userEnteredCareerPaths.some(
          u => u.label.toLowerCase() === cp.label.toLowerCase()
        )
    ),
  ];
  const careerPathOptions = careerPaths.map(cp => ({
    label: cp.label,
    value: cp.label,
  }));
  if (
    entry.careerPathName &&
    !careerPathOptions.some(
      o => o.value.toLowerCase() === entry.careerPathName.toLowerCase()
    )
  ) {
    careerPathOptions.unshift({
      label: entry.careerPathName,
      value: entry.careerPathName,
    });
  }

  // ── Field handlers ──────────────────────────────────────────────────────
  const handleSkillSelect = (value: string) => {
    const picked = apiSkills.find(s => s.id === value);
    if (!picked) return;
    const label = picked.label;
    const sep = SKILL_CAREER_PATH_SEPARATOR.exec(label);
    const skillName = sep ? label.slice(0, sep.index) : label;
    const careerPathName = sep ? label.slice(sep.index + sep[0].length) : '';
    onChange(index, {
      ...entry,
      skillId: picked.id,
      skillName,
      careerPathId: undefined,
      careerPathName,
      displayValue: label,
      source: picked.source ?? 'MASTER',
    });
  };

  const handleSkillAddNew = (text: string) => {
    onChange(index, {
      ...entry,
      skillId: '',
      skillName: text,
      careerPathId: undefined,
      careerPathName: '',
      displayValue: text,
      source: 'USER_CREATED',
    });
  };

  // Apply a career-path change. If the career path actually changes, the
  // skill/career-path pairing is no longer a known combination, so the row is
  // re-classified as user-created — the pairing is checked (and created if it
  // does not already exist) on Next.
  const applyCareerPath = (rawValue: string) => {
    const value = rawValue.trim();
    const matched = apiCareerPaths.find(
      cp => cp.label.toLowerCase() === value.toLowerCase()
    );
    const unchanged =
      !!entry.skillId && normalize(value) === normalize(entry.careerPathName);
    onChange(index, {
      ...entry,
      // Re-classify unless the existing combination is untouched.
      skillId: unchanged ? entry.skillId : '',
      source: unchanged ? entry.source : 'USER_CREATED',
      careerPathName: value,
      careerPathId: matched?.id,
      displayValue: `${entry.skillName} - ${value}`,
    });
  };

  const handleCareerPathSelect = (value: string) => applyCareerPath(value);

  const handleCareerPathAddNew = (text: string) => {
    const trimmed = text.trim();
    const existing = careerPaths.find(
      cp => cp.label.toLowerCase() === trimmed.toLowerCase()
    );
    if (!existing) {
      setUserEnteredCareerPaths(prev => [
        ...prev,
        { id: crypto.randomUUID(), label: trimmed },
      ]);
    }
    applyCareerPath(trimmed);
  };

  const handleLevelChange = (value: string) => {
    const lvl = jobLevels.find(l => l.id === value);
    onChange(index, {
      ...entry,
      levelId: lvl?.id,
      levelName: lvl?.label ?? lvl?.name ?? '',
    });
  };

  return (
    <div className="relative pt-4" data-testid="preferred-skill-row">
      {/* Delete row — top-right, above the row (hidden for the first, non-removable row) */}
      {isRemovable && (
        <button
          type="button"
          aria-label={t('common.delete')}
          className={cn(
            'absolute top-0 right-0 text-slate-900 transition-colors hover:text-slate-500',
            disabled && 'pointer-events-none opacity-50'
          )}
          onClick={() => onRemove(index)}
          disabled={disabled}
        >
          <X className="size-5" />
        </button>
      )}
      <div className="duo-skills:grid-cols-2 duo-skills:gap-x-5 tri-skills:grid-cols-3 grid grid-cols-1 items-start gap-5">
        {/* Skill */}
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-900">
              {t('preferredSkills.sectionLabel')}
            </span>
            <CharacterCount
              maxLength={MAX_SKILL_CHARS}
              currentLength={entry.skillName.length}
            />
          </div>
          <Combobox
            modal={false}
            options={skillOptions}
            value={skillValue}
            selectedLabel={entry.skillName || undefined}
            onValueChange={handleSkillSelect}
            onAddNew={handleSkillAddNew}
            onSearchChange={setSkillSearch}
            loading={isSkillsLoading}
            disabled={disabled}
            maxLength={MAX_SKILL_CHARS}
            placeholder={t('preferredSkills.input.placeholder')}
            className="h-11 border-slate-200 bg-white text-sm"
          />
        </div>

        {/* Career Path */}
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-900">
              {t('preferredSkills.careerPath.label')}
              <span className="text-rose-500"> *</span>
            </span>
            <CharacterCount
              maxLength={MAX_CAREER_PATH_CHARS}
              currentLength={entry.careerPathName.length}
            />
          </div>
          <Combobox
            modal={false}
            options={careerPathOptions}
            value={entry.careerPathName}
            onValueChange={handleCareerPathSelect}
            onAddNew={handleCareerPathAddNew}
            onSearchChange={setCareerPathApiSearch}
            loading={isCareerPathsLoading}
            disabled={disabled}
            maxLength={MAX_CAREER_PATH_CHARS}
            isError={!!error?.careerPath}
            placeholder={t('preferredSkills.careerPath.input.placeholder')}
            className="h-11 border-slate-200 bg-white text-sm"
          />
          {error?.careerPath && (
            <p className="mt-1 text-xs text-red-500">
              {t('preferredSkills.validation.careerPathRequired')}
            </p>
          )}
        </div>

        {/* Level */}
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-sm font-semibold text-slate-900">
            {t('preferredSkills.level.label')}
            <span className="text-rose-500"> *</span>
          </span>
          <Select
            value={entry.levelId ?? ''}
            onValueChange={handleLevelChange}
            disabled={disabled || isJobLevelsLoading}
          >
            <SelectTrigger
              className={cn(
                '!h-11 w-full bg-white shadow-none',
                error?.level && 'border-destructive'
              )}
            >
              <SelectValue
                placeholder={t('preferredSkills.level.placeholder')}
              />
            </SelectTrigger>
            <SelectContent>
              {jobLevels.map(level => (
                <SelectItem
                  key={level.id}
                  value={level.id}
                  disabled={disabledLevelIds.has(level.id)}
                >
                  {level.label ?? level.name ?? ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error?.level && (
            <p className="mt-1 text-xs text-red-500">
              {t('preferredSkills.validation.levelRequired')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Step ─────────────────────────────────────────────────────────────────────

export default function PreferredSkillsStep({
  onNext,
  onBack,
  mode = 'create',
}: Readonly<StepProps>) {
  const { t } = useTranslation('ats');
  const showDisableToast = useDisableSuccessToast();
  const isFieldVisible = useTemplateFieldVisible('skills');
  const {
    form,
    setForm,
    onCancel,
    stepPersistRef,
    stepDisableRef,
    currentStepIndex,
    removeCompletedStep,
  } = useVacancyForm();
  const vacancyStatus = form.status;

  const [isEnabled, setIsEnabled] = useState(
    form.preferredSkills?.isEnabled ?? false
  );
  const [dataTakenFromCandidate, setDataTakenFromCandidate] = useState(
    form.preferredSkills?.dataTakenFromCandidate ?? false
  );
  const [rows, setRows] = useState<SkillCareerPathEntry[]>(() => {
    const existing = form.preferredSkills?.skills ?? [];
    return existing.length > 0 ? existing : [createEmptyRow()];
  });
  const [rowErrors, setRowErrors] = useState<Record<number, RowError>>({});

  const { data: jobLevelsData, isLoading: isJobLevelsLoading } =
    useJobLevelsQuery();
  const jobLevels = jobLevelsData?.data ?? [];

  const { mutateAsync: createSkillCareerPath } =
    useCreateSkillCareerPathMutation();
  const { mutateAsync: createCareerPath } = useCreateCareerPathMutation();

  const populatedRows = useMemo(
    () => rows.filter(r => r.skillName.trim()),
    [rows]
  );

  useStepGuard(
    isEnabled && !dataTakenFromCandidate && populatedRows.length === 0
  );

  // Persist populated rows into the shared form context.
  const _skillsRef = useRef<() => void>(() => {});
  useEffect(() => {
    _skillsRef.current = () => {
      setForm(prev => ({
        ...prev,
        preferredSkills: {
          isEnabled,
          dataTakenFromCandidate,
          skills: rows.filter(r => r.skillName.trim()),
        },
      }));
    };
  }, [isEnabled, dataTakenFromCandidate, rows, setForm]);
  useEffect(() => {
    stepPersistRef.current = () => _skillsRef.current();
    return () => {
      stepPersistRef.current = null;
    };
  }, [stepPersistRef]);
  useEffect(() => {
    stepDisableRef.current = () => {
      setForm(prev => ({
        ...prev,
        preferredSkills: {
          isEnabled: false,
          dataTakenFromCandidate: false,
          skills: [],
        },
      }));
    };
    return () => {
      stepDisableRef.current = null;
    };
  }, [setForm, stepDisableRef]);

  const [confirmDisableOpen, setConfirmDisableOpen] = useState(false);
  const [emptyDisableOpen, setEmptyDisableOpen] = useState(false);

  // ── Row mutations ─────────────────────────────────────────────────────────
  const handleRowChange = (index: number, entry: SkillCareerPathEntry) => {
    setRows(prev => {
      const next = prev.map((r, i) => (i === index ? entry : r));
      // If a skill/career-path change makes this row's level collide with
      // another row (same skill + career path + level), reset the level so the
      // recruiter re-picks a still-available one.
      if (entry.levelId && usedLevelIdsFor(next, index).has(entry.levelId)) {
        next[index] = { ...entry, levelId: undefined, levelName: undefined };
      }
      return next;
    });
    setRowErrors(prev => {
      if (!prev[index]) return prev;
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  const handleRemoveRow = (index: number) => {
    setRows(prev => prev.filter((_, i) => i !== index));
    setRowErrors({});
  };

  const handleAddRow = () => {
    if (rows.length >= MAX_SKILLS) {
      ErrorToast({
        title: 'Error',
        description: t('preferredSkills.validation.maxSkills', {
          max: MAX_SKILLS,
        }),
      });
      return;
    }
    setRows(prev => [...prev, createEmptyRow()]);
  };

  // ── Validation ──────────────────────────────────────────────────────────
  // Duplicate combinations are prevented up-front by freezing already-used
  // levels per skill + career path, so only mandatory fields are checked here.
  const validate = (): boolean => {
    const nextErrors: Record<number, RowError> = {};

    rows.forEach((r, idx) => {
      if (!r.skillName.trim()) return;
      const err: RowError = {};
      if (!r.careerPathName.trim()) err.careerPath = true;
      if (!r.levelId) err.level = true;
      if (err.careerPath || err.level) {
        nextErrors[idx] = err;
      }
    });

    setRowErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleNext = async () => {
    if (isEnabled && populatedRows.length === 0 && !dataTakenFromCandidate) {
      setEmptyDisableOpen(true);
      return;
    }

    if (isEnabled && !dataTakenFromCandidate && !validate()) {
      return;
    }

    let resolvedSkills = rows.filter(r => r.skillName.trim());

    if (isEnabled && !dataTakenFromCandidate) {
      // Multiple rows may share the same skill + career path (with different
      // levels). Resolve each unique skill/career-path combination exactly once
      // so it is POSTed a single time, then apply the resulting id to every row
      // that shares it. Career paths are likewise deduped by name.
      const isAlreadyExists = (e: unknown) =>
        (e as { response?: { data?: { code?: string } } }).response?.data
          ?.code === 'MST-403';

      const careerPathCache = new Map<string, Promise<string | undefined>>();
      const comboCache = new Map<
        string,
        Promise<
          Pick<
            SkillCareerPathEntry,
            'skillId' | 'careerPathId' | 'displayValue' | 'source'
          >
        >
      >();

      const resolveCareerPathId = async (name: string) => {
        try {
          const cpResult = await createCareerPath(name);
          return cpResult.pendingId;
        } catch (cpErr) {
          if (!isAlreadyExists(cpErr)) throw cpErr;
          const cpSearch = await careerPathService.getAllCareerPaths(name);
          return cpSearch.data?.items?.content?.find(
            item => item.label.toLowerCase() === name.toLowerCase()
          )?.id;
        }
      };

      const findExistingSkill = async (displayValue: string) => {
        const res = await skillService.getAllSkills(displayValue);
        return res?.data?.items?.content?.find(
          item => item.label.toLowerCase() === displayValue.toLowerCase()
        );
      };

      const resolveCombo = async (entry: SkillCareerPathEntry) => {
        // Reuse the skill + career path if it already exists in the master data.
        // Creating a duplicate is rejected by the BE (400), so we must select
        // the existing record instead of POSTing again.
        const existing = await findExistingSkill(entry.displayValue);
        if (existing) {
          return {
            skillId: existing.id,
            careerPathId: entry.careerPathId,
            displayValue: entry.displayValue,
            source: existing.source ?? ('MASTER' as const),
          };
        }

        // Step 1: create the career path first if it is new (no ID).
        let resolvedCareerPathId = entry.careerPathId;
        if (!resolvedCareerPathId && entry.careerPathName) {
          const cpKey = normalize(entry.careerPathName);
          if (!careerPathCache.has(cpKey)) {
            careerPathCache.set(
              cpKey,
              resolveCareerPathId(entry.careerPathName)
            );
          }
          resolvedCareerPathId = await careerPathCache.get(cpKey);
        }

        // Step 2: create the new skill-career-path combination.
        try {
          const result = await createSkillCareerPath({
            skillName: entry.skillName,
            careerPathName: entry.careerPathName,
          });
          return {
            skillId: result.pendingId,
            careerPathId: resolvedCareerPathId,
            displayValue: result.value || entry.displayValue,
            source: 'PENDING' as const,
          };
        } catch (err) {
          // Fallback: if it was created concurrently, reuse the existing record.
          if (!isAlreadyExists(err)) throw err;
          const fallback = await findExistingSkill(entry.displayValue);
          if (!fallback) throw err;
          return {
            skillId: fallback.id,
            careerPathId: resolvedCareerPathId,
            displayValue: entry.displayValue,
            source: fallback.source ?? ('MASTER' as const),
          };
        }
      };

      resolvedSkills = await Promise.all(
        resolvedSkills.map(async entry => {
          if (entry.source !== 'USER_CREATED') return entry;
          const key = `${normalize(entry.skillName)}|${normalize(
            entry.careerPathName
          )}`;
          if (!comboCache.has(key)) {
            comboCache.set(key, resolveCombo(entry));
          }
          const resolved = await comboCache.get(key);
          return { ...entry, ...resolved };
        })
      );
      setRows(resolvedSkills.length > 0 ? resolvedSkills : [createEmptyRow()]);
    }

    onNext({
      preferredSkills: {
        isEnabled,
        dataTakenFromCandidate,
        skills: resolvedSkills,
      },
    });
  };

  const isStepActionDisabled =
    isEnabled && !dataTakenFromCandidate && populatedRows.length === 0;

  const handleBack = () => {
    stepPersistRef.current?.();
    onBack();
  };

  const isSectionDisabled = !isEnabled || dataTakenFromCandidate;
  // Levels frozen per row (already used by another row with the same
  // skill + career path) so a duplicate combination cannot be selected.
  const disabledLevelsPerRow = rows.map((_, i) => usedLevelIdsFor(rows, i));

  return (
    <div className="flex min-h-full flex-1 flex-col" data-testid="preferredSkills-section-form">
      {/* ── Section Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-7 py-8">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={t('common.back')}
            className={cn(
              'cursor-pointer text-slate-700 transition-colors hover:text-slate-900',
              isStepActionDisabled && 'cursor-not-allowed opacity-50'
            )}
            onClick={handleBack}
            disabled={isStepActionDisabled}
          >
            <ArrowLeft2 size={24} />
          </button>
          <h2
            data-testid="preferredSkills-header-label"
            className="text-xl font-bold tracking-tight text-slate-900"
          >
            {t('preferredSkills.title')}
          </h2>
          {mode === 'edit' && vacancyStatus ? (
            <VacancyStatusBadge status={vacancyStatus} />
          ) : null}
        </div>
        <Switch
          checked={isEnabled}
          data-testid="toggle-on-off-switch"
          onCheckedChange={newValue => {
            if (!newValue) {
              if (populatedRows.length > 0 || dataTakenFromCandidate) {
                setConfirmDisableOpen(true);
              } else {
                setIsEnabled(false);
              }
            } else {
              setIsEnabled(true);
            }
          }}
          size="lg"
        />
      </div>

      {/* Body */}
      <div className="flex flex-col gap-4 px-6">
        <div className={cn(!isEnabled && 'pointer-events-none opacity-60')}>
          {/* Checkbox */}
          <div className="mb-6 flex items-start gap-2">
            <Checkbox
              id="data-from-candidate"
              checked={dataTakenFromCandidate}
              onCheckedChange={checked => {
                if (checked) {
                  setRows([createEmptyRow()]);
                  setRowErrors({});
                  setDataTakenFromCandidate(true);
                } else {
                  setDataTakenFromCandidate(false);
                }
              }}
              className="mt-0.5"
            />
            <label
              htmlFor="data-from-candidate"
              data-testid="preferredSkills-dataTakenFromCandidate-label"
              className="cursor-pointer text-sm text-slate-600"
            >
              {t('preferredSkills.dataTakenFromCandidate')}
            </label>
          </div>

          {/* Section: Tools, Technologies, Skills and Frameworks */}
          {isFieldVisible('skillCareerPath') && (
            <>
              <div className="flex flex-col gap-7">
                {rows.map((row, index) => (
                  <PreferredSkillRow
                    key={index}
                    entry={row}
                    index={index}
                    isRemovable={index > 0}
                    disabled={isSectionDisabled}
                    error={rowErrors[index]}
                    jobLevels={jobLevels}
                    isJobLevelsLoading={isJobLevelsLoading}
                    disabledLevelIds={disabledLevelsPerRow[index]}
                    onChange={handleRowChange}
                    onRemove={handleRemoveRow}
                  />
                ))}
              </div>

              {/* Add row — always enabled; shows a toast if the max is exceeded */}
              <div className="mt-6 flex justify-end pr-8">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  aria-label={t('preferredSkills.addRow')}
                  className="size-12 rounded-lg"
                  onClick={handleAddRow}
                  disabled={isSectionDisabled}
                >
                  <Plus className="size-6" />
                </Button>
              </div>
            </>
          )}

          {/* Bottom padding so dropdowns are never clipped by the scroll container edge */}
          <div className="h-64" />
        </div>
      </div>

      <StepDisableDialog
        open={confirmDisableOpen}
        onOpenChange={open => {
          if (!open) setConfirmDisableOpen(false);
        }}
        onConfirm={() => {
          setRows([createEmptyRow()]);
          setRowErrors({});
          setDataTakenFromCandidate(false);
          setIsEnabled(false);
          removeCompletedStep(currentStepIndex);
          setConfirmDisableOpen(false);
          showDisableToast(t('preferredSkills.title'));
        }}
        title={t('preferredSkills.confirmDisableDialog.title')}
        description={t('preferredSkills.confirmDisableDialog.message')}
        cancelLabel={t('preferredSkills.confirmDisableDialog.cancel')}
        confirmLabel={t('preferredSkills.confirmDisableDialog.disable')}
      />

      <StepDisableDialog
        open={emptyDisableOpen}
        onOpenChange={open => {
          if (!open) setEmptyDisableOpen(false);
        }}
        onConfirm={() => {
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
        title={t('preferredSkills.emptyDisableDialog.title')}
        description={t('preferredSkills.emptyDisableDialog.message')}
        cancelLabel={t('preferredSkills.emptyDisableDialog.cancel')}
        confirmLabel={t('preferredSkills.emptyDisableDialog.disable')}
      />

      {/* Footer — sticky at bottom of the parent scroll container */}
      <div className="sticky bottom-0 mt-auto flex items-center justify-end gap-4 bg-white px-6 py-7 shadow-[0px_-8px_6.8px_0px_rgba(0,0,0,0.04)]">
        <Button variant="secondary" className="h-12 w-48" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button
          className="h-12 w-48"
          onClick={() => void handleNext()}
          disabled={isStepActionDisabled}
        >
          {t('common.next')}
        </Button>
      </div>
    </div>
  );
}
