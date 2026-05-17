import { Add } from 'iconsax-reactjs';

import { Button } from '@cgp/ui-kit/components/ui/button';

export default function VacanciesPage() {
  return (
    <section className="px-7 py-5">
      <div className="flex justify-between">
        <p className="text-2xl/8 font-bold text-slate-900">Vacancies</p>
        <div>
          {/* Filtering and search fields goes here */}
          <Button className="h-12 w-45 gap-1">
            <Add className="size-5" />
            Create Vacancy
          </Button>
        </div>
      </div>
    </section>
  );
}
