'use client';

import { Status } from 'iconsax-reactjs';

import { cn } from '@cgp/ui-kit/lib/utils';

interface ModernStepperProps {
  steps: Array<{ title: string }>;
  currentStep: number;
  completedSteps: Set<number>;
  onStepClick?: (step: number) => void;
  className?: string;
}

function Stepper({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
  className,
}: ModernStepperProps) {
  return (
    <div className={cn('relative', className)}>
      {/* Stepper */}
      <div className="flex justify-center">
        <div className="flex w-full items-center justify-between">
          {steps.map((step, index) => (
            <button
              key={step.title}
              type="button"
              onClick={() => onStepClick?.(index)}
              disabled={!completedSteps.has(index) && index !== currentStep}
              className="focus-visible:ring-brand-primary-500 flex w-1/4 flex-col items-start gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed sm:flex-row sm:items-center sm:justify-center"
            >
              {/* Step indicator */}
              <div className="relative size-5 shrink-0">
                {completedSteps.has(index) ? (
                  // Completed step - show tick circle
                  <div
                    className={cn(
                      'flex size-5 items-center justify-center rounded-full',
                      index === currentStep
                        ? 'bg-brand-primary-500'
                        : completedSteps.has(index)
                          ? 'bg-brand-primary-400'
                          : ''
                    )}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                    >
                      <path
                        d="M5.1665 8.00385L7.05317 9.89052L10.8332 6.11719"
                        stroke="white"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </div>
                ) : index === currentStep ? (
                  // Active step - filled circle with Status icon
                  <div className="bg-brand-primary-500 flex size-5 items-center justify-center rounded-full">
                    <Status color="#ffffff" className="size-4" size={32} />
                  </div>
                ) : (
                  // Inactive step - empty circle
                  <div className="size-5 rounded-full border border-slate-400 bg-slate-100" />
                )}
              </div>

              {/* Step label */}
              <p
                className={cn(
                  'text-base leading-6 font-bold',
                  index === currentStep
                    ? 'text-brand-primary-500'
                    : completedSteps.has(index)
                      ? 'text-brand-primary-400'
                      : 'text-slate-400'
                )}
              >
                {step.title}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Progress indicator lines */}
      <div className="absolute right-0 bottom-[-19px] left-0 h-[3px]">
        {/* Background line - full width */}
        <div className="absolute inset-0 rounded-full bg-slate-300" />

        {/* Active progress line - animated */}
        <div
          className="bg-brand-primary-500 absolute top-0 left-0 h-full rounded-full transition-all duration-500 ease-in-out"
          style={{
            width: `${(() => {
              const stepWidth = 100 / steps.length;
              const completedStepsCount = Array.from(completedSteps).filter(
                step => step < currentStep
              ).length;
              const completedWidth = completedStepsCount * stepWidth;
              const currentStepWidth = stepWidth * 0.95;
              return completedWidth + currentStepWidth;
            })()}%`,
          }}
        />
      </div>
    </div>
  );
}

export { Stepper };
