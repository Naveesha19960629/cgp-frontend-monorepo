import { Plus, X } from 'lucide-react';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useVacancyForm } from '@/views/vacancies/context/vacancy-form-context';
import {
  useCareerPathsQuery,
  useDisableSuccessToast,
  useSkillsQuery,
} from '@/views/vacancies/hooks';
import type {
  CareerPathItem,
  SkillCareerPathEntry,
  SkillItem,
  StepProps,
} from '@/views/vacancies/types';

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

export default function PreferredSkillsStep({
  onNext,
  onBack,
}: Readonly<StepProps>) {
  const { t } = useTranslation('ats');
  const showDisableToast = useDisableSuccessToast();
  const { form } = useVacancyForm();

  const [isEnabled, setIsEnabled] = useState(
    form.preferredSkills?.isEnabled ?? true
  );
  const [dataTakenFromCandidate, setDataTakenFromCandidate] = useState(
    form.preferredSkills?.dataTakenFromCandidate ?? false
  );
  const [selectedSkills, setSelectedSkills] = useState<SkillCareerPathEntry[]>(
    form.preferredSkills?.skills ?? []
  );

  // Skill search / dropdown
  const [skillSearch, setSkillSearch] = useState('');
  const [isSkillDropdownOpen, setIsSkillDropdownOpen] = useState(false);

  // Career path popover
  const [pendingSkillName, setPendingSkillName] = useState('');
  const [pendingSkillId, setPendingSkillId] = useState('');
  const [careerPathSearch, setCareerPathSearch] = useState('');
  const [careerPathError, setCareerPathError] = useState('');
  const [isCareerPathPopoverOpen, setIsCareerPathPopoverOpen] = useState(false);
  const [isCareerPathDropdownOpen, setIsCareerPathDropdownOpen] =
    useState(false);
  // Accumulates user-typed career paths within the current panel session
  const [userEnteredCareerPaths, setUserEnteredCareerPaths] = useState<
    CareerPathItem[]
  >([]);

  // Queries
  const { data: skillsData } = useSkillsQuery(skillSearch);
  const { data: careerPathsData, isLoading: isCareerPathsLoading } =
    useCareerPathsQuery(careerPathSearch);

  const skills: SkillItem[] = skillsData?.data?.items?.content ?? [];
  const apiCareerPaths: CareerPathItem[] =
    careerPathsData?.data?.items?.content ?? [];
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

  const atMax = selectedSkills.length >= MAX_SKILLS;
  const [showMaxError, setShowMaxError] = useState(false);
  const [confirmDisableOpen, setConfirmDisableOpen] = useState(false);
  const [emptyDisableOpen, setEmptyDisableOpen] = useState(false);

  // ── Skill selection ───────────────────────────────────────────────────────

  const handleSelectSkill = (id: string, name: string) => {
    setSkillSearch('');
    if (id) {
      // Toggle: if already selected, remove it; otherwise add it.
      const alreadyAdded = selectedSkills.some(s => s.skillId === id);
      if (alreadyAdded) {
        setSelectedSkills(prev => prev.filter(s => s.skillId !== id));
        setShowMaxError(false);
        return;
      }

      if (atMax) {
        setShowMaxError(true);
        return;
      }

      const sepMatch = /\s[\u2013\u2014-]\s/.exec(name);
      const skillName = sepMatch ? name.slice(0, sepMatch.index) : name;
      const careerPathName = sepMatch
        ? name.slice(sepMatch.index + sepMatch[0].length)
        : '';
      setSelectedSkills(prev => [
        ...prev,
        {
          skillId: id,
          skillName,
          careerPathId: undefined,
          careerPathName,
          displayValue: name,
        },
      ]);
      // Dropdown stays open so the user can select more skills
    } else {
      // Custom typed skill — prevent duplicate by skill name (case-insensitive)
      const alreadyAdded = selectedSkills.some(
        s => s.skillName.toLowerCase() === name.toLowerCase()
      );
      if (alreadyAdded) return;
      if (atMax) {
        setShowMaxError(true);
        return;
      }

      // Close the skill dropdown and open career path panel
      setIsSkillDropdownOpen(false);
      setPendingSkillId('');
      setPendingSkillName(name);
      setCareerPathSearch('');
      setCareerPathError('');
      setIsCareerPathPopoverOpen(true);
    }
  };

  const handleSkillInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Escape') {
      setIsSkillDropdownOpen(false);
    }
  };

  // ── Career path ───────────────────────────────────────────────────────────

  const handleAddCareerPath = () => {
    if (!careerPathSearch.trim()) {
      setCareerPathError(t('preferredSkills.careerPath.validation.required'));
      return;
    }

    const matchedCareerPath = careerPaths.find(
      cp => cp.label.toLowerCase() === careerPathSearch.trim().toLowerCase()
    );

    const entry: SkillCareerPathEntry = {
      skillId: pendingSkillId,
      skillName: pendingSkillName,
      careerPathId: matchedCareerPath?.id,
      careerPathName: careerPathSearch.trim(),
      displayValue: `${pendingSkillName} - ${careerPathSearch.trim()}`,
    };

    setSelectedSkills(prev => [...prev, entry]);
    setIsCareerPathPopoverOpen(false);
    setIsCareerPathDropdownOpen(false);
    setPendingSkillName('');
    setPendingSkillId('');
    setCareerPathSearch('');
    setCareerPathError('');
    setUserEnteredCareerPaths([]);
  };

  const handleCancelCareerPath = () => {
    setIsCareerPathPopoverOpen(false);
    setIsCareerPathDropdownOpen(false);
    setPendingSkillName('');
    setPendingSkillId('');
    setCareerPathSearch('');
    setCareerPathError('');
    setUserEnteredCareerPaths([]);
  };

  // ── Chip removal ──────────────────────────────────────────────────────────

  const handleRemoveSkill = (index: number) => {
    setSelectedSkills(prev => prev.filter((_, i) => i !== index));
    setShowMaxError(false);
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleNext = () => {
    if (isEnabled && selectedSkills.length === 0 && !dataTakenFromCandidate) {
      setEmptyDisableOpen(true);
      return;
    }
    onNext({
      preferredSkills: {
        isEnabled,
        dataTakenFromCandidate,
        skills: selectedSkills,
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
            setConfirmDisableOpen(true);
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
              <span className="text-sm font-semibold text-slate-700">
                {t('preferredSkills.sectionLabel')}
              </span>
              <span className="text-sm font-semibold">
                <span className="text-slate-900">{skillSearch.length}</span>
                <span className="text-slate-400">/{MAX_SKILL_CHARS}</span>
              </span>
            </div>

            {/* Skill search input */}
            <div className="relative">
              <input
                type="text"
                value={skillSearch}
                onChange={e => {
                  if (e.target.value.length <= MAX_SKILL_CHARS) {
                    setSkillSearch(e.target.value);
                    setIsSkillDropdownOpen(true);
                  }
                }}
                onFocus={() => setIsSkillDropdownOpen(true)}
                onClick={() => setIsSkillDropdownOpen(true)}
                onKeyDown={handleSkillInputKeyDown}
                onBlur={() =>
                  setTimeout(() => setIsSkillDropdownOpen(false), 150)
                }
                disabled={dataTakenFromCandidate}
                placeholder={t('preferredSkills.input.placeholder')}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-teal-600 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              />

              {/* Dropdown */}
              {isSkillDropdownOpen && !dataTakenFromCandidate && (
                <div className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-slate-200 bg-white shadow-md">
                  {skillSearch.trim() && (
                    <button
                      type="button"
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => handleSelectSkill('', skillSearch.trim())}
                      className="m-3 flex w-[calc(100%-24px)] cursor-pointer items-center gap-1 overflow-hidden rounded bg-neutral-200 px-2 py-2.5 text-left text-sm font-medium text-slate-900 hover:bg-neutral-300"
                    >
                      <Plus className="size-4 shrink-0" />
                      {t('preferredSkills.input.addNew', {
                        value: skillSearch.trim(),
                      })}
                    </button>
                  )}
                  {skills.map(skill => {
                    const isChecked = selectedSkills.some(
                      s => s.skillId === skill.id
                    );
                    return (
                      <button
                        key={skill.id}
                        type="button"
                        aria-pressed={isChecked}
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => handleSelectSkill(skill.id, skill.label)}
                        className={cn(
                          'flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50',
                          isChecked && 'bg-slate-50'
                        )}
                      >
                        <Checkbox
                          checked={isChecked}
                          className="pointer-events-none"
                        />
                        {skill.label}
                      </button>
                    );
                  })}
                  {skills.length === 0 && !skillSearch.trim() && (
                    <p className="px-3 py-2 text-sm text-slate-400">
                      {t('preferredSkills.input.typeToSearch')}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Exceeded max error */}
            {showMaxError && (
              <p className="mt-1.5 text-xs text-red-500">
                {t('preferredSkills.validation.maxSkills', {
                  max: MAX_SKILLS,
                })}
              </p>
            )}

            {/* Selected skill chips */}
            {(selectedSkills.length > 0 || isCareerPathPopoverOpen) && (
              <div className="mt-3 flex flex-wrap gap-3">
                {/* Pending chip — visible while the career path panel is open */}
                {isCareerPathPopoverOpen && pendingSkillName && (
                  <Badge
                    key="pending-skill"
                    variant="chip"
                    className="animate-fadeIn flex cursor-default items-center justify-between gap-2 pe-2 shadow-sm"
                    style={{ borderColor: '#f59e0b', borderWidth: '1px' }}
                  >
                    <span className="capitalize">{pendingSkillName}</span>
                  </Badge>
                )}
                {selectedSkills.map((entry, index) => (
                  <Badge
                    key={`${entry.skillId || entry.skillName}-${entry.careerPathName}-${index}`}
                    variant="chip"
                    className="animate-fadeIn flex max-w-full cursor-default items-center gap-2"
                  >
                    <span className="min-w-0 wrap-break-word">
                      {entry.careerPathName ? (
                        <>
                          <span className="font-semibold text-slate-600">
                            {entry.skillName} -
                          </span>{' '}
                          <span
                            className="font-bold"
                            style={{ color: '#075056' }}
                          >
                            {entry.careerPathName}
                          </span>
                        </>
                      ) : (
                        <span className="font-semibold text-slate-600">
                          {entry.skillName}
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(index)}
                      className="flex size-4 shrink-0 items-center justify-center text-slate-400 hover:text-slate-600"
                      aria-label={t('preferredSkills.chip.remove', {
                        name: entry.displayValue,
                      })}
                    >
                      <X size={16} aria-hidden="true" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Career Path Panel — inline in content flow, appears after the skill chips */}
          {isCareerPathPopoverOpen && (
            <div
              className="mt-4 max-w-128.5 rounded-lg border border-slate-300 p-4 shadow-xl"
              style={{
                backgroundImage:
                  'linear-gradient(90deg, rgb(254,244,238) 24.671%, rgb(248,242,236) 37.979%, rgb(233,244,240) 99.173%, rgb(238,247,245) 166.77%)',
              }}
            >
              {/* Header row: title + close */}
              <div className="mb-3 flex items-start justify-between">
                <div className="flex-1 pr-6">
                  <p className="text-base font-bold text-slate-900">
                    {t('preferredSkills.careerPath.title')}
                  </p>
                  <p className="mt-1 text-sm leading-snug font-semibold text-slate-700">
                    {t('preferredSkills.careerPath.description')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCancelCareerPath}
                  className="flex size-6 items-center justify-center rounded text-slate-900 hover:bg-black/5"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* White card with input */}
              <div className="mb-4 rounded-lg bg-white p-3 shadow-md">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-900">
                    {t('preferredSkills.careerPath.label')}
                  </label>
                  <span className="text-sm font-semibold">
                    <span className="text-slate-900">
                      {careerPathSearch.length}
                    </span>
                    <span className="text-slate-500">
                      /{MAX_CAREER_PATH_CHARS}
                    </span>
                  </span>
                </div>

                <div className="relative mt-1">
                  <input
                    type="text"
                    value={careerPathSearch}
                    onChange={e => {
                      if (e.target.value.length <= MAX_CAREER_PATH_CHARS) {
                        setCareerPathSearch(e.target.value);
                        setCareerPathError('');
                        setIsCareerPathDropdownOpen(true);
                      }
                    }}
                    onFocus={() => setIsCareerPathDropdownOpen(true)}
                    onBlur={() =>
                      setTimeout(() => setIsCareerPathDropdownOpen(false), 150)
                    }
                    placeholder={t(
                      'preferredSkills.careerPath.input.placeholder'
                    )}
                    className={cn(
                      'w-full rounded-lg border bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-500 focus:ring-1 focus:outline-none',
                      careerPathError
                        ? 'border-red-400 focus:border-red-400 focus:ring-red-400'
                        : 'border-slate-300 focus:border-teal-600 focus:ring-teal-600'
                    )}
                  />

                  {/* Career path dropdown */}
                  {isCareerPathDropdownOpen && (
                    <div className="absolute z-30 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-slate-200 bg-white shadow-md">
                      {isCareerPathsLoading ? (
                        <p className="px-3 py-2 text-sm text-slate-400">
                          {t('preferredSkills.input.typeToSearch')}
                        </p>
                      ) : (
                        <>
                          {careerPathSearch.trim() && (
                            <button
                              type="button"
                              onMouseDown={e => e.preventDefault()}
                              onClick={() => {
                                const trimmed = careerPathSearch.trim();
                                const alreadyExists = careerPaths.some(
                                  cp =>
                                    cp.label.toLowerCase() ===
                                    trimmed.toLowerCase()
                                );
                                if (!alreadyExists) {
                                  setUserEnteredCareerPaths(prev => [
                                    { id: crypto.randomUUID(), label: trimmed },
                                    ...prev,
                                  ]);
                                }
                                setCareerPathSearch(trimmed);
                                setIsCareerPathDropdownOpen(false);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-teal-700 hover:bg-slate-50"
                            >
                              <Plus className="size-4" />
                              {t('preferredSkills.input.addNew', {
                                value: careerPathSearch.trim(),
                              })}
                            </button>
                          )}
                          {careerPaths.map(cp => (
                            <button
                              key={cp.id}
                              type="button"
                              onMouseDown={e => e.preventDefault()}
                              onClick={() => {
                                setCareerPathSearch(cp.label);
                                setIsCareerPathDropdownOpen(false);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                            >
                              {cp.label}
                            </button>
                          ))}
                          {careerPaths.length === 0 &&
                            !careerPathSearch.trim() && (
                              <p className="px-3 py-2 text-sm text-slate-400">
                                {t('preferredSkills.input.typeToSearch')}
                              </p>
                            )}
                        </>
                      )}
                    </div>
                  )}
                </div>

                {careerPathError && (
                  <p className="mt-1 text-xs text-red-500">{careerPathError}</p>
                )}
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleAddCareerPath}
                  className="h-9 gap-1.5 bg-[#075056] px-8 text-sm font-bold hover:bg-teal-800"
                >
                  <Plus className="size-5" />
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
      <StepFooter onNext={handleNext} onCancel={onBack} />
    </div>
  );
}
