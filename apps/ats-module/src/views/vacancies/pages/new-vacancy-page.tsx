import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { VacancyCreateStepperForm } from '@/views/vacancies';
import {
  VacancyFormProvider,
  useVacancyForm,
} from '@/views/vacancies/context/vacancy-form-context';

import { CharacterCount } from '@cgp/ui-kit/components/character-count';
import { Button } from '@cgp/ui-kit/components/ui/button';
import { Input } from '@cgp/ui-kit/components/ui/input';
import { Label } from '@cgp/ui-kit/components/ui/label';
import { removeEmoji } from '@cgp/ui-kit/lib/utils';

function VacancyTitleStep() {
  const navigate = useNavigate();
  const { form, setForm, onNext } = useVacancyForm();
  const [titleError, setTitleError] = useState('');
  const { t } = useTranslation('ats');

  const handleTitleChange = (value: string) => {
    const sanitizedTitle = removeEmoji(value);

    setForm(prev => ({ ...prev, title: sanitizedTitle, status: 'new' }));

    if (sanitizedTitle.trim()) {
      setTitleError('');
    }
  };

  const handleNext = () => {
    if (!form.title.trim()) {
      setTitleError(t('vacancies.createVacancy.titleRequired'));
      return;
    }

    setTitleError('');
    onNext();
  };

  const handleCancel = () => {
    void navigate('/dashboard/ats/vacancies');
  };

  return (
    <div className="flex flex-1 flex-col">
      <header className="pt-7 pl-7">
        <p className="text-2xl/8 font-bold text-slate-900">
          {t('vacancies.createVacancy.heading')}
        </p>
      </header>
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="w-99.5">
          <p className="mb-4 text-xl font-bold text-slate-900">
            {t('vacancies.createVacancy.formTitle')}
          </p>
          <div className="mb-1 flex items-center justify-between">
            <Label
              htmlFor="vacancy-title"
              className="text-sm font-semibold text-slate-900"
            >
              {t('vacancies.createVacancy.fieldTitle')}
            </Label>
            <CharacterCount
              maxLength={50}
              currentLength={form.title.length}
              className={'font-["Plus_Jakarta_Sans",sans-serif]'}
            />
          </div>
          <Input
            id="vacancy-title"
            className="h-11 w-full"
            maxLength={50}
            placeholder={t('vacancies.createVacancy.titlePlaceholder')}
            required
            value={form.title}
            onChange={e => handleTitleChange(e.target.value)}
          />
          {titleError && (
            <p className="mt-1 text-xs font-medium text-rose-500">
              {titleError}
            </p>
          )}
          <div className="mt-4 flex gap-4">
            <Button
              variant="secondary"
              className="h-12 flex-1"
              onClick={handleCancel}
            >
              {t('vacancies.createVacancy.cancelButton')}
            </Button>
            <Button className="h-12 flex-1" onClick={handleNext}>
              {t('vacancies.createVacancy.nextButton')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NewVacancyContent() {
  const { isInitialStep } = useVacancyForm();
  return (
    <div className="flex min-h-0 flex-1">
      {isInitialStep ? (
        <VacancyTitleStep />
      ) : (
        <VacancyCreateStepperForm mode="create" />
      )}
    </div>
  );
}

export default function NewVacancyPage() {
  return (
    <VacancyFormProvider>
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <NewVacancyContent />
      </section>
    </VacancyFormProvider>
  );
}
