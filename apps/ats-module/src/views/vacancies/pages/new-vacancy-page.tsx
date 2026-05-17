import { VacancyCreateStepperForm } from '@/views/vacancies';
import {
  VacancyFormProvider,
  useVacancyForm,
} from '@/views/vacancies/context/vacancy-form-context';

import { CharacterCount } from '@cgp/ui-kit/components/character-count';
import { Button } from '@cgp/ui-kit/components/ui/button';
import { Input } from '@cgp/ui-kit/components/ui/input';
import { Label } from '@cgp/ui-kit/components/ui/label';

function VacancyTitleStep() {
  const { form, setForm, onNext, onCancel } = useVacancyForm();

  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <div className="w-99.5">
        <p className="mb-4 text-xl font-bold text-slate-900">
          Lets Begin with the Vacancy Title
        </p>
        <div className="mb-1 flex items-center justify-between">
          <Label htmlFor="vacancy-title">Title</Label>
          <CharacterCount maxLength={250} currentLength={form.title.length} />
        </div>
        <Input
          id="vacancy-title"
          className="w-full"
          maxLength={250}
          placeholder="Enter title"
          value={form.title}
          onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
        />
        <div className="mt-4 flex gap-4">
          <Button
            variant="secondary"
            className="h-12 flex-1"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button className="h-12 flex-1" onClick={() => onNext()}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

function NewVacancyContent() {
  const { isInitialStep } = useVacancyForm();
  return isInitialStep ? <VacancyTitleStep /> : <VacancyCreateStepperForm />;
}

export default function NewVacancyPage() {
  return (
    <VacancyFormProvider>
      <section className="flex min-h-screen flex-col p-7">
        <NewVacancyContent />
      </section>
    </VacancyFormProvider>
  );
}
