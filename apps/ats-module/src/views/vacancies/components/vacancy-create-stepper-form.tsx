import { Status } from 'iconsax-reactjs';

import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { VacancyCancelDialog } from '@/views/vacancies/components';
import {
  VACANCY_STEPS,
  useVacancyForm,
} from '@/views/vacancies/context/vacancy-form-context';

import { ScrollArea } from '@cgp/ui-kit/components/ui/scroll-area';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@cgp/ui-kit/components/ui/tabs';
import { cn } from '@cgp/ui-kit/lib/utils';

function StepIndicator({
  index,
  currentStepIndex,
  completedSteps,
}: {
  index: number;
  currentStepIndex: number;
  completedSteps: Set<number>;
}) {
  const isActive = index === currentStepIndex;
  const isCompleted = completedSteps.has(index);

  if (isCompleted) {
    return (
      <span className="bg-brand-primary-400 flex size-5 shrink-0 items-center justify-center rounded-full">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <path
            d="M5.1665 8.00385L7.05317 9.89052L10.8332 6.11719"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }

  if (isActive) {
    return (
      <span className="bg-brand-primary-500 flex size-5 shrink-0 items-center justify-center rounded-full">
        <Status color="#ffffff" size={14} />
      </span>
    );
  }

  return (
    <span className="size-5 shrink-0 rounded-full border border-slate-300 bg-white" />
  );
}

export default function VacancyCreateStepperForm() {
  const { t } = useTranslation('ats');
  const navigate = useNavigate();
  const {
    currentStepIndex,
    setCurrentStepIndex,
    completedSteps,
    onNext,
    onBack,
    onSubmit,
    showCancelDialog,
    setShowCancelDialog,
    OnSaveAsDraft,
  } = useVacancyForm();

  const currentStepKey = VACANCY_STEPS[currentStepIndex].key;

  return (
    <>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Tabs
          value={currentStepKey}
          onValueChange={value => {
            const index = VACANCY_STEPS.findIndex(s => s.key === value);
            if (index !== -1) setCurrentStepIndex(index);
          }}
          orientation="vertical"
          className="flex min-h-0 flex-1 gap-0"
        >
          {/* Left sidebar — step list */}
          <div className="flex min-h-0 w-76.75 shrink-0 flex-col border-r border-slate-200 bg-white">
            <div className="px-4 pt-7">
              <p className="mb-9 text-2xl/8 font-bold text-slate-900">
                {t('vacancies.createVacancyButton')}
              </p>
            </div>

            <ScrollArea className="min-h-0 flex-1 px-4 pb-7">
              <TabsList
                variant="line"
                className="flex w-full flex-col items-start justify-start rounded-none border-none bg-transparent p-0"
              >
                {VACANCY_STEPS.map((step, index) => (
                  <div key={step.key} className="flex w-full flex-col">
                    <TabsTrigger
                      value={step.key}
                      className="h-auto w-full cursor-pointer items-center justify-start gap-3 rounded-none border-none border-transparent p-0 text-[16px]/6 font-bold [&::after]:hidden"
                    >
                      <StepIndicator
                        index={index}
                        currentStepIndex={currentStepIndex}
                        completedSteps={completedSteps}
                      />
                      <span
                        className={cn(
                          'text-slate-700',
                          index === currentStepIndex &&
                            'text-brand-primary-500 font-bold'
                        )}
                      >
                        {step.label}
                      </span>
                    </TabsTrigger>
                    {index < VACANCY_STEPS.length - 1 && (
                      <div
                        className={cn(
                          'my-2 ml-2.5 h-4 w-px',
                          completedSteps.has(index)
                            ? 'bg-brand-primary-400'
                            : 'bg-slate-400'
                        )}
                      />
                    )}
                  </div>
                ))}
              </TabsList>
            </ScrollArea>
          </div>

          {/* Right — content */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
              {VACANCY_STEPS.map((step, index) => {
                const StepComponent = step.component;
                return (
                  <TabsContent
                    key={step.key + index}
                    value={step.key}
                    className="m-0 flex min-h-full flex-col"
                  >
                    <StepComponent
                      onNext={onNext}
                      onBack={onBack}
                      onSubmit={onSubmit}
                    />
                  </TabsContent>
                );
              })}
            </div>
          </div>
        </Tabs>
      </div>

      <VacancyCancelDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        onDiscard={() => {
          setShowCancelDialog(false);
          void navigate('/dashboard/ats/vacancies');
        }}
        onSaveAsDraft={OnSaveAsDraft}
      />
    </>
  );
}
