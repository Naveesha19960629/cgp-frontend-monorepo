import { Add } from 'iconsax-reactjs';

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { useUser } from '@/app/contexts/user-context';
import { useGendersQuery } from '@/views/vacancies';
import type { GenderItem } from '@/views/vacancies';

import { ErrorToast } from '@cgp/ui-kit/components/custom-toast';
import { Button } from '@cgp/ui-kit/components/ui/button';

export default function VacanciesPage() {
  const { user } = useUser();
  const { t } = useTranslation('ats');
  const navigate = useNavigate();
  const { data, isLoading, isError } = useGendersQuery();

  useEffect(() => {
    if (isError) {
      ErrorToast({
        title: t('notifications.apiError.fetch.title'),
        description: t('notifications.apiError.fetch.message'),
      });
    }
  }, [isError, t]);

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
              void navigate('vacancies/new');
            }}
          >
            <Add className="size-5 stroke-2" />
            {t('vacancies.createVacancyButton')}
          </Button>
        </div>
      </div>

      <div className="mt-4">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-lg font-bold text-slate-900">
              {t('notifications.loading.title')}
            </p>
            <p className="mt-2 max-w-md text-sm text-slate-600">
              {t('notifications.loading.message')}
            </p>
          </div>
        )}
        {user && <p>Welcome, {user.firstName}!</p>}
        {data?.data.items.content.map((gender: GenderItem) => (
          <p key={gender.id}>{gender.label}</p>
        ))}
      </div>
    </section>
  );
}
