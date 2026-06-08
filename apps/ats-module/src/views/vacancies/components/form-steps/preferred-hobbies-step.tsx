import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useVacancyForm } from '@/views/vacancies/context/vacancy-form-context';
import {
  useCreateHobbyMutation,
  useDisableSuccessToast,
  useHobbiesQuery,
} from '@/views/vacancies/hooks';
import { hobbyService } from '@/views/vacancies/services';
import type { HobbyEntry, StepProps } from '@/views/vacancies/types';
import { resolveUserCreatedEntries } from '@/views/vacancies/utils';

import { CharacterCount } from '@cgp/ui-kit/components/character-count';
import MultipleSelector from '@cgp/ui-kit/components/multi-select';
import { Checkbox } from '@cgp/ui-kit/components/ui/checkbox';
import { cn } from '@cgp/ui-kit/lib/utils';

import DisableDialog from './disable-dialog';
import StepFooter from './step-footer';
import StepHeader from './step-header';

const MAX_HOBBIES = 10;
const MAX_HOBBY_CHARS = 100;

const multiSelectInfoAvatar = new URL(
  '../../../../assets/images/multi-select-info-avatar.svg',
  import.meta.url
).href;

export default function PreferredHobbiesStep({
  onNext,
  onBack,
}: Readonly<StepProps>) {
  const { t } = useTranslation('ats');
  const showDisableToast = useDisableSuccessToast();
  const { form } = useVacancyForm();

  const [isEnabled, setIsEnabled] = useState(
    form.preferredHobbies?.isEnabled ?? false
  );
  const [dataTakenFromCandidate, setDataTakenFromCandidate] = useState(
    form.preferredHobbies?.dataTakenFromCandidate ?? false
  );
  const [selectedHobbies, setSelectedHobbies] = useState<HobbyEntry[]>(
    form.preferredHobbies?.hobbies ?? []
  );

  // Hobby search state for the query
  const [hobbySearch, setHobbySearch] = useState('');
  const [hasMaxError, setHasMaxError] = useState(false);

  // Query
  const { data: hobbiesData, isLoading: isHobbiesLoading } =
    useHobbiesQuery(hobbySearch);

  const apiHobbies = hobbiesData?.data?.items?.content ?? [];

  const [confirmDisableOpen, setConfirmDisableOpen] = useState(false);
  const [emptyDisableOpen, setEmptyDisableOpen] = useState(false);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const { mutateAsync: createHobby } = useCreateHobbyMutation();

  const handleNext = async () => {
    if (isEnabled && selectedHobbies.length === 0 && !dataTakenFromCandidate) {
      setEmptyDisableOpen(true);
      return;
    }

    let resolvedHobbies: HobbyEntry[] = selectedHobbies;
    const hasUserCreated = selectedHobbies.some(
      h => h.source === 'USER_CREATED'
    );
    if (hasUserCreated) {
      resolvedHobbies = await resolveUserCreatedEntries(
        selectedHobbies,
        createHobby,
        (search: string) => hobbyService.getAllHobbies(search)
      );
      setSelectedHobbies(resolvedHobbies);
    }

    onNext({
      preferredHobbies: {
        isEnabled,
        dataTakenFromCandidate,
        hobbies: resolvedHobbies,
      },
    });
  };

  return (
    <div>
      <StepHeader
        title={t('preferredHobbies.title')}
        isEnabled={isEnabled}
        onBack={onBack}
        onToggle={() => {
          if (isEnabled) {
            if (selectedHobbies.length > 0 || dataTakenFromCandidate) {
              setConfirmDisableOpen(true);
            } else {
              setIsEnabled(false);
            }
          } else {
            setIsEnabled(true);
          }
        }}
      />

      {/* Body */}
      <div className="px-8 py-6">
        <div className={cn(!isEnabled && 'pointer-events-none opacity-60')}>
          {/* Checkbox */}
          <div className="mb-6 flex items-start gap-2">
            <Checkbox
              id="hobbies-data-from-candidate"
              checked={dataTakenFromCandidate}
              onCheckedChange={checked =>
                setDataTakenFromCandidate(checked === true)
              }
              className="mt-0.5"
            />
            <label
              htmlFor="hobbies-data-from-candidate"
              className="cursor-pointer text-sm text-slate-600"
            >
              {t('preferredHobbies.dataTakenFromCandidate')}
            </label>
          </div>

          {/* Section: Hobbies */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span
                className={cn(
                  'text-sm font-semibold text-slate-700',
                  hasMaxError && 'text-destructive'
                )}
              >
                {t('preferredHobbies.sectionLabel')}
              </span>
              <CharacterCount
                maxLength={MAX_HOBBY_CHARS}
                currentLength={hobbySearch.length}
              />
            </div>

            <MultipleSelector
              value={selectedHobbies.map(h => ({
                value: h.id,
                label: h.label,
                source: h.source,
              }))}
              errorMessage={t('preferredHobbies.validation.maxHobbies', {
                max: MAX_HOBBIES,
              })}
              onErrorStateChange={setHasMaxError}
              onChange={options => {
                const entries: HobbyEntry[] = options.map(opt => ({
                  id: opt.value,
                  label: opt.label,
                  source: (opt.source as string) ?? 'USER_CREATED',
                }));
                setSelectedHobbies(entries);
              }}
              options={apiHobbies.map(h => ({
                value: h.id,
                label: h.label,
                source: 'MASTER',
              }))}
              onSearchSync={value => {
                setHobbySearch(value);
                return apiHobbies.map(h => ({
                  value: h.id,
                  label: h.label,
                  source: 'MASTER',
                }));
              }}
              keepSelectedInList
              creatable
              triggerSearchOnFocus
              hideClearAllButton
              maxSelected={MAX_HOBBIES}
              disabled={!isEnabled || dataTakenFromCandidate}
              inputProps={{ maxLength: MAX_HOBBY_CHARS }}
              loading={isHobbiesLoading}
              placeholder={t('preferredHobbies.input.placeholder')}
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
          </div>

          {/* Bottom padding so dropdowns are never clipped */}
          <div className="h-64" />
        </div>
      </div>

      <DisableDialog
        open={confirmDisableOpen}
        onOpenChange={open => {
          if (!open) setConfirmDisableOpen(false);
        }}
        title={t('preferredHobbies.confirmDisableDialog.title')}
        message={t('preferredHobbies.confirmDisableDialog.message')}
        cancelLabel={t('preferredHobbies.confirmDisableDialog.cancel')}
        disableLabel={t('preferredHobbies.confirmDisableDialog.disable')}
        onCancel={() => setConfirmDisableOpen(false)}
        onDisable={() => {
          setSelectedHobbies([]);
          setDataTakenFromCandidate(false);
          setIsEnabled(false);
          setConfirmDisableOpen(false);
          showDisableToast(t('preferredHobbies.title'));
        }}
      />

      <DisableDialog
        open={emptyDisableOpen}
        onOpenChange={open => {
          if (!open) setEmptyDisableOpen(false);
        }}
        title={t('preferredHobbies.emptyDisableDialog.title')}
        message={t('preferredHobbies.emptyDisableDialog.message')}
        cancelLabel={t('preferredHobbies.emptyDisableDialog.cancel')}
        disableLabel={t('preferredHobbies.emptyDisableDialog.disable')}
        onCancel={() => setEmptyDisableOpen(false)}
        onDisable={() => {
          setIsEnabled(false);
          setEmptyDisableOpen(false);
          showDisableToast(t('preferredHobbies.title'));
          onNext({
            preferredHobbies: {
              isEnabled: false,
              dataTakenFromCandidate: false,
              hobbies: [],
            },
          });
        }}
      />

      <StepFooter onNext={() => void handleNext()} onCancel={onBack} />
    </div>
  );
}
