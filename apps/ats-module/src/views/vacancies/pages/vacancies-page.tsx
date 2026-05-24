import { Add } from 'iconsax-reactjs';

import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { useUser } from '@/app/contexts/user-context';
import { useGendersQuery } from '@/views/vacancies';
import type { GenderItem } from '@/views/vacancies';

import { Button } from '@cgp/ui-kit/components/ui/button';

export default function VacanciesPage() {
  const { user } = useUser();
  const { t } = useTranslation('ats');
  const navigate = useNavigate();
  const { data, isLoading, isError } = useGendersQuery();

  return (
    <section className="px-7 py-5">
      <div className="flex justify-between">
        <p className="text-2xl/8 font-bold text-slate-900">
          {t('vacancies.title')}
        </p>
        <div>
          {/* Filtering and search fields goes here */}
          <Button
            className="h-12 w-45 gap-1"
            onClick={() => {
              void navigate('/dashboard/ats/vacancies/new');
            }}
          >
            <Add className="size-5 stroke-2" />
            {t('vacancies.createVacancyButton')}
          </Button>
        </div>
      </div>

      <div className="mt-4">
        {isLoading && <p>Loading genders...</p>}
        {isError && <p>Failed to load genders.</p>}
        {user && <p>Welcome, {user.firstName}!</p>}
        {data?.data.items.content.map((gender: GenderItem) => (
          <p key={gender.id}>{gender.label}</p>
        ))}
      </div>
    </section>
  );
}
