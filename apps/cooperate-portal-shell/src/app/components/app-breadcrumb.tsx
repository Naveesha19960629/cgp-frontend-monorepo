import clsx from 'clsx';

import * as React from 'react';
import { Link, useLocation } from 'react-router-dom';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@cgp/ui-kit/components/ui/breadcrumb';

interface BreadcrumbItemConfig {
  label: string;
  link?: string;
}

interface BreadcrumbRoute {
  url: string;
  items: BreadcrumbItemConfig[];
}

const breadcrumbRoutes: BreadcrumbRoute[] = [
  {
    url: '/dashboard/ats/vacancies',
    items: [],
  },
  {
    url: '/dashboard/ats/vacancies/new',
    items: [{ label: 'Vacancies' }, { label: 'Create Vacancy' }],
  },
  {
    url: '/dashboard/ats/find-candidate',
    items: [{ label: 'Find Candidate' }],
  },
];

export function AppBreadcrumb() {
  const { pathname } = useLocation();

  const route = breadcrumbRoutes.find(r => r.url === pathname);
  const items = route?.items ?? [];

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <React.Fragment key={item.label}>
              {index > 0 && <BreadcrumbSeparator className="hidden md:block" />}
              <BreadcrumbItem
                className={clsx(
                  !isLast && 'hidden md:block',
                  'text-[16px] font-bold! text-slate-900'
                )}
              >
                {isLast || !item.link ? (
                  <BreadcrumbPage className="font-bold! text-slate-900">
                    {item.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild className="font-bold!">
                    <Link to={item.link}>{item.label}</Link>
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
