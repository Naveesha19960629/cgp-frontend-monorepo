import { useTranslation } from 'react-i18next';

import genderIcon from '@/assets/images/genderIcon.png';
import maritalStatusIcon from '@/assets/images/martialIcon.png';
import { VacancyNoDetailsState } from '@/views/vacancies/components/view-vacancy/vacancy-no-details-state';
import { VacancyView } from '@/views/vacancies/components/view-vacancy/vacancy-view';
import type { VacancyViewModel } from '@/views/vacancies/types';
import { hasValue } from '@/views/vacancies/utils/has-value';

function VacancyProfileRequirementsSection({
  profileRequirement,
}: Readonly<{
  profileRequirement: VacancyViewModel['profileRequirement'];
}>) {
  const { t } = useTranslation('ats');

  if (!profileRequirement?.isEnabled) {
    return null;
  }

  // Drop addresses with no field data at all, so an "Addresses 0N" box
  // never renders empty.
  const addresses = profileRequirement.addresses.filter(
    address =>
      hasValue(address.city) ||
      hasValue(address.stateProvince) ||
      hasValue(address.country) ||
      hasValue(address.postalCode)
  );

  return (
    <VacancyView.Section title={t('profileRequirements.title')}>
      {profileRequirement.dataTakenFromCandidate ? (
        <VacancyNoDetailsState />
      ) : (
        <>
          {/* Top Metadata Info Rows */}
          <div className="mb-4 flex flex-col gap-2">
            <VacancyView.InfoRow
              icon={
                <img
                  src={genderIcon}
                  alt=""
                  className="size-[20px] shrink-0 object-contain"
                />
              }
              label={t('profileRequirements.gender')}
              value={profileRequirement.gender}
            />
            <VacancyView.InfoRow
              icon={
                <img
                  src={maritalStatusIcon}
                  alt=""
                  className="size-[20px] shrink-0 object-contain"
                />
              }
              label={t('profileRequirements.maritalStatus')}
              value={profileRequirement.maritalStatus}
            />
          </div>

          {/* Grid of Addresses inside shaded boxes */}
          {addresses.length > 0 && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {[...addresses].reverse().map((address, index) => {
                const displayIndex = addresses.length - index;
                const addressTitle = `${t('profileRequirements.addressesTitle')} ${String(displayIndex).padStart(2, '0')}`;

                return (
                  <div
                    key={`${address.city}-${address.stateProvince}-${address.country}-${address.postalCode}-${index}`}
                    className="flex flex-col gap-3 rounded-lg border border-[#ebedf0] bg-[#f8fafc] p-4"
                  >
                    <h3 className="text-base font-semibold text-slate-900">
                      {addressTitle}
                    </h3>
                    <div className="flex flex-wrap gap-x-9 gap-y-2">
                      {address.city && (
                        <div className="flex min-w-[80px] flex-col">
                          <span className="text-sm font-semibold text-slate-500">
                            {t('profileRequirements.city')}
                          </span>
                          <span className="text-base font-semibold text-slate-900">
                            {address.city}
                          </span>
                        </div>
                      )}
                      {address.stateProvince && (
                        <div className="flex min-w-[120px] flex-col">
                          <span className="text-sm font-semibold text-slate-500">
                            {t('profileRequirements.stateProvince')}
                          </span>
                          <span className="text-base font-semibold text-slate-900">
                            {address.stateProvince}
                          </span>
                        </div>
                      )}
                      {address.country && (
                        <div className="flex min-w-[80px] flex-col">
                          <span className="text-sm font-semibold text-slate-500">
                            {t('profileRequirements.country')}
                          </span>
                          <span className="text-base font-semibold text-slate-900">
                            {address.country}
                          </span>
                        </div>
                      )}
                      {address.postalCode && (
                        <div className="flex min-w-[80px] flex-col">
                          <span className="text-sm font-semibold text-slate-500">
                            {t('profileRequirements.postalCode')}
                          </span>
                          <span className="text-base font-semibold text-slate-900">
                            {address.postalCode}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </VacancyView.Section>
  );
}

export { VacancyProfileRequirementsSection };
