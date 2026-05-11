import { Outlet } from 'react-router-dom';

import { AppSidebar } from '@/app/components/app-sidebar';

import {
  SidebarProvider,
  SidebarTrigger,
} from '@cgp/ui-kit/components/ui/sidebar';

export default function MainLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main>
        <SidebarTrigger />
        <Outlet />
      </main>
    </SidebarProvider>
  );
}
