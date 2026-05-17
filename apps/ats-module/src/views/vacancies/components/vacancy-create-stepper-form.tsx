import { Status } from 'iconsax-reactjs';

import {
  VACANCY_STEPS,
  useVacancyForm,
} from '@/views/vacancies/context/vacancy-form-context';

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
      <span className="bg-brand-primary-500 flex size-5 shrink-0 items-center justify-center rounded-full">
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
  const {
    currentStepIndex,
    setCurrentStepIndex,
    completedSteps,
    onNext,
    onBack,
    onSubmit,
  } = useVacancyForm();

  const currentStepKey = VACANCY_STEPS[currentStepIndex].key;

  return (
    <div className="mt-6 flex flex-1 overflow-hidden">
      <Tabs
        value={currentStepKey}
        onValueChange={value => {
          const index = VACANCY_STEPS.findIndex(s => s.key === value);
          if (index !== -1) setCurrentStepIndex(index);
        }}
        orientation="vertical"
        className="flex flex-1 gap-0"
      >
        {/* Left sidebar — step list */}
        <TabsList
          variant="line"
          className="w-60 shrink-0 flex-col items-start justify-start overflow-y-auto rounded-none border-r border-slate-200 bg-white py-4"
        >
          <p>hi</p>
          {VACANCY_STEPS.map((step, index) => (
            <div key={step.key} className="flex w-full flex-col">
              <TabsTrigger
                value={step.key}
                className="h-auto w-full items-center justify-start gap-3 rounded-none border-transparent px-5 py-2.5 text-sm [&::after]:hidden"
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
                <div className="ml-7.5 h-4 w-px bg-slate-200" />
              )}
            </div>
          ))}
        </TabsList>

        {/* Right — content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            {VACANCY_STEPS.map((step, index) => {
              const StepComponent = step.component;
              return (
                <TabsContent
                  key={step.key + index}
                  value={step.key}
                  className="m-0"
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
  );
}
