import { I3Square } from 'iconsax-reactjs';

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

export function AppSidebar() {
  return (
    <Sidebar className="w-73 bg-slate-50">
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
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className="h-10 gap-3 text-[16px]/6 font-semibold text-slate-600 hover:bg-[#E6EEEE] hover:text-slate-600"
              >
                <a href={'/dashboard/ats/vacancies'}>
                  <I3Square
                    variant="Bold"
                    className="text-brand-primary-500 size-6!"
                  />
                  <span>Vacancies</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className="h-10 gap-3 text-[16px]/6 font-semibold text-slate-600 hover:bg-[#E6EEEE] hover:text-slate-600"
              >
                <a href={'/dashboard/ats/vacancies'}>
                  <I3Square
                    variant="Bold"
                    className="text-brand-primary-500 size-6!"
                  />
                  <span>Find Candidate</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
