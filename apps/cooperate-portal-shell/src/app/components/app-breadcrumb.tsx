import clsx from 'clsx';

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, matchPath, useLocation } from 'react-router-dom';

import type { BreadcrumbRoute } from '@/app/types';

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
    url: '/dashboard/ats/find-candidate',
    items: [{ labelKey: 'breadcrumb.findCandidates' }],
  },
  {
    url: '/dashboard/ats/templates',
    items: [{ labelKey: 'breadcrumb.templates' }],
  },
];

export function AppBreadcrumb() {
  const { pathname } = useLocation();
  const { t } = useTranslation();

  const route = breadcrumbRoutes.find(r => matchPath(r.url, pathname));
  const items = route?.items ?? [];

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <React.Fragment key={item.labelKey as string}>
              {index > 0 && <BreadcrumbSeparator className="hidden md:block" />}
              <BreadcrumbItem
                className={clsx(
                  !isLast && 'hidden md:block',
                  'text-[16px] font-bold! text-slate-900'
                )}
              >
                {isLast || !item.link ? (
                  <BreadcrumbPage className="font-bold! text-slate-900">
                    {t(item.labelKey as string)}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild className="font-bold!">
                    <Link to={item.link}>{t(item.labelKey as string)}</Link>
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
