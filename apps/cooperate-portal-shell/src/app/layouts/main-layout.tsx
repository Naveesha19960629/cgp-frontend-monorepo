import * as React from 'react';
import { Outlet } from 'react-router-dom';

import { AppBreadcrumb } from '@/app/components/app-breadcrumb';
import { AppSidebar } from '@/app/components/app-sidebar';

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@cgp/ui-kit/components/ui/sidebar';

export default function MainLayout() {
  return (
    <SidebarProvider
      style={{ '--sidebar-width': '18.25rem' } as React.CSSProperties}
    >
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-17 shrink-0 items-center gap-3 border-b px-7">
          <SidebarTrigger className="m-0! h-6 p-0!" />
          <AppBreadcrumb />
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
