import { I3Square, SearchNormal1 } from 'iconsax-reactjs';

import type { ElementType } from 'react';
import { Link, useLocation } from 'react-router-dom';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@cgp/ui-kit/components/ui/sidebar';
import { cn } from '@cgp/ui-kit/lib/utils';

const menuItems: { label: string; icon: ElementType; href: string }[] = [
  {
    label: 'Vacancies',
    icon: I3Square,
    href: '/dashboard/ats/vacancies',
  },
  {
    label: 'Find Candidate',
    icon: SearchNormal1,
    href: '/dashboard/ats/find-candidate',
  },
];

export function AppSidebar() {
  const { pathname } = useLocation();

  return (
    <Sidebar className="bg-slate-50">
      <SidebarHeader className="mt-7 ml-6 items-start p-0">
        <img
          src={import.meta.env.VITE_PORTAL_LOGO as string}
          alt="Company Logo"
          className="h-5.5 w-auto"
        />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="mt-12 px-6">
          <SidebarMenu>
            {menuItems.map(item => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    className={cn(
                      'h-10 gap-3 text-[16px]/6 font-semibold text-slate-600',
                      'hover:bg-[#E6EEEE] hover:text-slate-600',
                      'data-[active=true]:bg-[#E6EEEE] data-[active=true]:text-slate-600'
                    )}
                  >
                    <Link to={item.href}>
                      <Icon
                        variant={isActive ? 'Bold' : ''}
                        className={cn(
                          'size-6!',
                          isActive ? 'text-brand-primary-500' : 'text-slate-600'
                        )}
                      />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
