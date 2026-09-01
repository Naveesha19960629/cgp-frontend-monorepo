import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { InfoToast } from '@cgp/ui-kit/components/custom-toast';
import { useKeycloak } from '@react-keycloak/web';

interface VacancyApplicantWsMessage {
  baseVacancyId?: string;
  applicantCount?: number;
}

interface UseVacancyApplicantWsOptions {
  vacancyId: string | undefined;
  enabled: boolean;
}

// Auth token + vacancyId must be sent as the first message per the
// notification service's handshake contract.
function useVacancyApplicantWs({
  vacancyId,
  enabled,
}: Readonly<UseVacancyApplicantWsOptions>) {
  const { keycloak } = useKeycloak();
  const { t } = useTranslation('ats');
  const keycloakRef = useRef(keycloak);

  useEffect(() => {
    keycloakRef.current = keycloak;
  }, [keycloak]);

  useEffect(() => {
    if (!enabled || !vacancyId) return undefined;

    let socket: WebSocket | undefined;
    let cancelled = false;
    let lastNotifiedCount = 0;

    const connect = async () => {
      try {
        await keycloakRef.current.updateToken(30);
      } catch {
        return;
      }

      const token = keycloakRef.current.token;
      if (cancelled || !token) return;

      socket = new WebSocket(
        `${import.meta.env.VITE_WS_URL}/vacancy-applicant-ws`
      );

      socket.onopen = () => {
        socket?.send(
          JSON.stringify({ authorization: 'Bearer', token, vacancyId })
        );
      };

      socket.onmessage = event => {
        let payload: unknown;
        try {
          payload = JSON.parse(event.data as string);
        } catch {
          return;
        }

        const message = payload as VacancyApplicantWsMessage;
        const applicantCount =
          typeof message?.applicantCount === 'number'
            ? message.applicantCount
            : 0;
        if (applicantCount >= 1 && applicantCount > lastNotifiedCount) {
          lastNotifiedCount = applicantCount;
          InfoToast({
            title: t('vacancies.edit.applicantNotification.title'),
            description: t('vacancies.edit.applicantNotification.message'),
          });
        }
      };
    };

    void connect();

    return () => {
      cancelled = true;
      socket?.close();
    };
  }, [enabled, vacancyId, t]);
}

export { useVacancyApplicantWs };
