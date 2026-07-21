import { ArrowDown2, Notification } from 'iconsax-reactjs';

import { useUser } from '@/app/contexts/user-context';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@cgp/ui-kit/components/ui/avatar';
import { Button } from '@cgp/ui-kit/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@cgp/ui-kit/components/ui/dropdown-menu';
import { useKeycloak } from '@react-keycloak/web';

export default function HeaderControls() {
  const { user } = useUser();
  const { keycloak } = useKeycloak();

  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : 'CN';

  function handleLogout() {
    void keycloak.logout({
      redirectUri: `${window.location.origin}/auth/login`,
    });
  }

  return (
    <div className="flex items-center gap-4">
      <Button
        variant="outline"
        size="icon"
        className="size-11 rounded-lg border-slate-300"
      >
        <Notification className="size-5! text-slate-500" />
      </Button>
      <div className="flex items-center gap-1">
        <Avatar className="size-11">
          <AvatarImage
            src={user?.picture ?? undefined}
            alt={user?.name ?? 'User avatar'}
          />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="p-0!"
              data-testid="profile-expand-button"
            >
              <ArrowDown2 size="16" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-32" align="end">
            <DropdownMenuGroup>
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem variant="destructive" onSelect={handleLogout}>
                Log out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
