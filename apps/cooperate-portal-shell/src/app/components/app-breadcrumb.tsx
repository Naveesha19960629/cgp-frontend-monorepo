import clsx from 'clsx';

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, matchPath, useLocation } from 'react-router-dom';

import { useQuery } from '@tanstack/react-query';

import type { BreadcrumbRoute } from '@/app/types';

import { httpClient } from '@cgp/data-access';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@cgp/ui-kit/components/ui/breadcrumb';

const breadcrumbRoutes: BreadcrumbRoute[] = [
  {
    url: '/dashboard/ats/vacancies',
    items: [],
  },
  {
    url: '/dashboard/ats/vacancies/new',
    items: [
      { labelKey: 'breadcrumb.vacancies', link: '/dashboard/ats/vacancies' },
      { labelKey: 'breadcrumb.addVacancy' },
    ],
  },
  {
    url: '/dashboard/ats/vacancies/:id/edit',
    items: [
      { labelKey: 'breadcrumb.vacancies', link: '/dashboard/ats/vacancies' },
      { labelKey: 'breadcrumb.editVacancy' },
    ],
  },
  {
    url: '/dashboard/ats/vacancies/:id/view',
    items: [
      { labelKey: 'breadcrumb.vacancies', link: '/dashboard/ats/vacancies' },
      { labelKey: 'breadcrumb.viewVacancy' },
    ],
  },
  {
    url: '/dashboard/ats/find-candidate',
    items: [{ labelKey: 'breadcrumb.findCandidates' }],
  },
  {
    url: '/dashboard/ats/templates',
    items: [
      { labelKey: 'breadcrumb.vacancies', link: '/dashboard/ats/vacancies' },
      { labelKey: 'breadcrumb.templates' },
    ],
  },
  {
    url: '/dashboard/ats/templates/new',
    items: [
      { labelKey: 'breadcrumb.vacancies', link: '/dashboard/ats/vacancies' },
      { labelKey: 'breadcrumb.createTemplate' },
    ],
  },
];

export function AppBreadcrumb() {
  const { pathname } = useLocation();
  const { t } = useTranslation();

  const route = breadcrumbRoutes.find(r => matchPath(r.url, pathname));

  const viewMatch = matchPath('/dashboard/ats/vacancies/:id/view', pathname);
  const vacancyId = viewMatch?.params.id;

  const { data: vacancyData } = useQuery({
    queryKey: ['vacancy', vacancyId],
    queryFn: async () => {
      if (!vacancyId) return null;
      const response = await httpClient.get<{
        data?: Record<string, unknown> & {
          vacancy?: Record<string, unknown>;
        };
      }>(`/vacancies/${vacancyId}`);
      return response.data;
    },
    enabled: !!vacancyId,
  });

  const items = React.useMemo(() => {
    if (!route) return [];
    if (viewMatch && vacancyId) {
      const rawVacancy = vacancyData?.data?.vacancy || vacancyData?.data || {};
      const rawTitle =
        rawVacancy?.title || rawVacancy?.vacancyTitle || rawVacancy?.name;
      const title = typeof rawTitle === 'string' ? rawTitle : '';

      return route.items.map(item => {
        if (item.labelKey === 'breadcrumb.viewVacancy') {
          return {
            ...item,
            labelKey: title || 'breadcrumb.viewVacancy',
            isDynamicValue: !!title,
          };
        }
        return item;
      });
    }
    return route.items;
  }, [route, viewMatch, vacancyId, vacancyData]);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <React.Fragment key={item.labelKey}>
              {index > 0 && <BreadcrumbSeparator className="hidden md:block" />}
              <BreadcrumbItem
                className={clsx(
                  !isLast && 'hidden md:block',
                  isLast
                    ? 'text-[16px]/6 font-semibold! text-slate-600!'
                    : 'text-[16px]/6 font-bold! text-slate-900'
                )}
              >
                {isLast || !item.link ? (
                  <BreadcrumbPage className="font-semibold! text-slate-600!">
                    {item.isDynamicValue ? item.labelKey : t(item.labelKey)}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild className="font-bold!">
                    <Link to={item.link}>{t(item.labelKey)}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
