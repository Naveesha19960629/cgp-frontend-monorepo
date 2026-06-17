import { ArrowDown2, I3Square, SearchNormal1 } from 'iconsax-reactjs';

import type { ElementType } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@cgp/ui-kit/components/ui/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@cgp/ui-kit/components/ui/sidebar';
import { cn } from '@cgp/ui-kit/lib/utils';

type LinkItem = {
  type: 'link';
  labelKey: string;
  icon: ElementType;
  href: string;
};

type GroupItem = {
  type: 'group';
  labelKey: string;
  icon: ElementType;
  children: { labelKey: string; href: string }[];
};

type MenuEntry = LinkItem | GroupItem;

const menuItems: MenuEntry[] = [
  {
    type: 'group',
    labelKey: 'sidebar.vacancies',
    icon: I3Square,
    children: [
      { labelKey: 'sidebar.viewVacancies', href: '/dashboard/ats/vacancies' },
      { labelKey: 'sidebar.templates', href: '/dashboard/ats/templates' },
    ],
  },
  {
    type: 'link',
    labelKey: 'sidebar.findCandidates',
    icon: SearchNormal1,
    href: '/dashboard/ats/find-candidate',
  },
];

function isPathActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

const topLevelButtonClass = cn(
  'h-10 gap-3 text-[16px]/6 font-semibold text-slate-600',
  'hover:bg-[#E6EEEE]! hover:text-slate-600!',
  'data-[active=true]:bg-[#E6EEEE]! data-[active=true]:font-semibold data-[active=true]:text-slate-600!'
);

const groupButtonClass = cn(
  'h-10 gap-3 text-[16px]/6 font-semibold text-slate-600',
  'hover:bg-[#E6EEEE]! hover:text-slate-600!'
);

const subButtonClass = cn(
  'h-10 text-[16px]/6 font-semibold text-slate-600',
  'hover:bg-[#E6EEEE]! hover:text-slate-600!',
  'data-[active=true]:bg-[#E6EEEE]! data-[active=true]:text-[#075056]!'
);

export function AppSidebar() {
  const { pathname } = useLocation();
  const { t } = useTranslation();

  return (
    <Sidebar className="bg-slate-50">
      <SidebarHeader className="mt-7 ml-6 items-start p-0">
        <img
          src={import.meta.env.VITE_PORTAL_LOGO || '/oxo_careers_logo.svg'}
          alt="Company Logo"
          className="h-5.5 w-auto"
        />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="mt-12 px-6 pt-0">
          <SidebarMenu>
            {menuItems.map(item => {
              const Icon = item.icon;

              if (item.type === 'link') {
                const isActive = isPathActive(pathname, item.href);

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={topLevelButtonClass}
                    >
                      <Link to={item.href} className="active:font-semibold!">
                        <Icon
                          variant={isActive ? 'Bold' : 'Linear'}
                          className={cn(
                            'size-6!',
                            isActive
                              ? 'text-brand-primary-500'
                              : 'text-slate-600'
                          )}
                        />
                        <span>{t(item.labelKey)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              }

              return (
                <Collapsible
                  key={item.labelKey}
                  defaultOpen
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className={groupButtonClass}>
                        <Icon
                          variant="Linear"
                          className="size-6! text-slate-600"
                        />
                        <span>{t(item.labelKey)}</span>
                        <ArrowDown2 className="ml-auto size-6! text-slate-600 transition-transform duration-200 group-data-[state=closed]/collapsible:-rotate-180" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                  </SidebarMenuItem>
                  <CollapsibleContent>
                    <SidebarMenuSub className="mr-0 pr-0">
                      {item.children.map(child => {
                        const isActive = isPathActive(pathname, child.href);

                        return (
                          <SidebarMenuSubItem key={child.href}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={isActive}
                              className={subButtonClass}
                            >
                              <Link to={child.href}>
                                <span>{t(child.labelKey)}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
