import { NuqsAdapter } from 'nuqs/adapters/react-router/v7';

import { useTranslation } from 'react-i18next';
import { RouterProvider } from 'react-router-dom';

import { UserProvider } from '@/app/contexts/user-context';
import { QueryProvider } from '@/app/providers/query-provider';
import { ThemeProvider } from '@/app/providers/theme-provider';
import router from '@/app/router';
import KeycloakInstance, { keycloakInitOptions } from '@/app/services/keycloak';

import { SuccessToast } from '@cgp/ui-kit/components/custom-toast';
import { LandscapeBlocker } from '@cgp/ui-kit/components/landscape-blocker';
import { Toaster } from '@cgp/ui-kit/components/ui/sonner';
import { TooltipProvider } from '@cgp/ui-kit/components/ui/tooltip';
import { ReactKeycloakProvider } from '@react-keycloak/web';

export default function App() {
  const { t } = useTranslation();

  return (
    <ReactKeycloakProvider
      authClient={KeycloakInstance}
      initOptions={keycloakInitOptions}
      onEvent={event => {
        if (
          event === 'onAuthSuccess' &&
          sessionStorage.getItem('cgp_login_pending')
        ) {
          sessionStorage.removeItem('cgp_login_pending');
          SuccessToast({
            title: t('auth.loginSuccess'),
            description: t('auth.welcomeBack'),
          });
        }
      }}
    >
      <UserProvider>
        <NuqsAdapter>
          <QueryProvider>
            <ThemeProvider defaultTheme="light" storageKey="ui-theme">
              <LandscapeBlocker />
              <TooltipProvider>
                <RouterProvider router={router} />
              </TooltipProvider>
            </ThemeProvider>
            <Toaster position="bottom-right" />
          </QueryProvider>
        </NuqsAdapter>
      </UserProvider>
    </ReactKeycloakProvider>
  );
}
